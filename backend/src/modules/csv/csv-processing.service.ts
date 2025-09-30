import { PrismaClient } from '@prisma/client';
import { parse as csvParse } from 'csv-parse';
import { webSocketService } from '../websocket/websocket.service';
import { logger } from '../common/utils/logger';
import { redisClient } from '../common/utils/redis';

const prisma = new PrismaClient();

export interface CsvProcessingResult {
  uploadId: string;
  filename: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: CsvValidationError[];
  status: 'processing' | 'validated' | 'committed' | 'failed';
  previewData: any[];
}

export interface CsvValidationError {
  row: number;
  column: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface CsvUploadProgress {
  stage: 'uploading' | 'parsing' | 'validating' | 'committing' | 'completed' | 'failed';
  percentage: number;
  message: string;
  rowsProcessed?: number;
  totalRows?: number;
  errors?: CsvValidationError[];
}

// Data type validation schemas
const DATA_TYPE_SCHEMAS = {
  kpi_metrics: {
    required: ['metric_name', 'value', 'period'],
    optional: ['target', 'category', 'description'],
    validators: {
      metric_name: (value: any) => typeof value === 'string' && value.length > 0,
      value: (value: any) => !isNaN(parseFloat(value)),
      target: (value: any) => value === '' || !isNaN(parseFloat(value)),
      period: (value: any) => /^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{4}-\d{2}$/.test(value),
    }
  },
  content_performance: {
    required: ['content_title', 'views', 'platform'],
    optional: ['engagement_rate', 'revenue', 'duration'],
    validators: {
      content_title: (value: any) => typeof value === 'string' && value.length > 0,
      views: (value: any) => !isNaN(parseInt(value)) && parseInt(value) >= 0,
      engagement_rate: (value: any) => value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0 && parseFloat(value) <= 100),
      revenue: (value: any) => value === '' || !isNaN(parseFloat(value)),
      platform: (value: any) => ['web', 'mobile', 'tv', 'ott'].includes(value.toLowerCase()),
    }
  },
  risks: {
    required: ['title', 'severity', 'likelihood'],
    optional: ['description', 'category', 'mitigation'],
    validators: {
      title: (value: any) => typeof value === 'string' && value.length > 0,
      severity: (value: any) => ['low', 'medium', 'high', 'critical'].includes(value.toLowerCase()),
      likelihood: (value: any) => ['very_low', 'low', 'medium', 'high', 'very_high'].includes(value.toLowerCase()),
      category: (value: any) => value === '' || ['technical', 'business', 'operational', 'security'].includes(value.toLowerCase()),
    }
  },
  bugs_sprints: {
    required: ['title', 'severity', 'status'],
    optional: ['description', 'sprint_name', 'assignee', 'priority'],
    validators: {
      title: (value: any) => typeof value === 'string' && value.length > 0,
      severity: (value: any) => ['low', 'medium', 'high', 'critical'].includes(value.toLowerCase()),
      status: (value: any) => ['open', 'in_progress', 'resolved', 'closed'].includes(value.toLowerCase()),
      priority: (value: any) => value === '' || ['low', 'medium', 'high', 'urgent'].includes(value.toLowerCase()),
    }
  },
  infra_metrics: {
    required: ['metric_name', 'value', 'timestamp'],
    optional: ['threshold', 'service', 'environment'],
    validators: {
      metric_name: (value: any) => typeof value === 'string' && value.length > 0,
      value: (value: any) => !isNaN(parseFloat(value)),
      timestamp: (value: any) => !isNaN(Date.parse(value)),
      threshold: (value: any) => value === '' || !isNaN(parseFloat(value)),
      service: (value: any) => value === '' || typeof value === 'string',
      environment: (value: any) => value === '' || ['dev', 'staging', 'prod'].includes(value.toLowerCase()),
    }
  }
};

export class CsvProcessingService {
  
  async processUpload(
    uploadId: string,
    filename: string,
    fileBuffer: Buffer,
    dataType: string,
    userId: number
  ): Promise<CsvProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Update progress
      await this.updateProgress(uploadId, userId, {
        stage: 'parsing',
        percentage: 10,
        message: 'Parsing CSV file...'
      });

      // Parse CSV
      const parsedData = await this.parseCSV(fileBuffer);
      
      if (parsedData.length === 0) {
        throw new Error('CSV file is empty or invalid');
      }

      // Update progress
      await this.updateProgress(uploadId, userId, {
        stage: 'validating',
        percentage: 30,
        message: 'Validating data...',
        totalRows: parsedData.length - 1 // Exclude header
      });

      // Validate data
      const validationResult = await this.validateData(parsedData, dataType, uploadId, userId);

      // Create preview data (first 10 rows)
      const previewData = parsedData.slice(1, 11).map((row, index) => {
        const rowData: any = { _rowNumber: index + 2 };
        const headers = parsedData[0];
        headers.forEach((header: string, i: number) => {
          rowData[header] = row[i] || '';
        });
        return rowData;
      });

      // Store processing result in Redis for later commit
      const result: CsvProcessingResult = {
        uploadId,
        filename,
        totalRows: parsedData.length - 1,
        validRows: validationResult.validRows,
        invalidRows: validationResult.invalidRows,
        errors: validationResult.errors,
        status: 'validated',
        previewData
      };

      await this.storeProcessingResult(uploadId, result, parsedData);

      // Update final progress
      await this.updateProgress(uploadId, userId, {
        stage: 'completed',
        percentage: 100,
        message: 'Validation completed',
        rowsProcessed: parsedData.length - 1,
        totalRows: parsedData.length - 1,
        errors: validationResult.errors.slice(0, 10) // Limit errors in progress
      });

      const processingTime = Date.now() - startTime;
      logger.info(`CSV processing completed: ${uploadId} in ${processingTime}ms`);

      return result;

    } catch (error) {
      await this.updateProgress(uploadId, userId, {
        stage: 'failed',
        percentage: 0,
        message: `Processing failed: ${error.message}`
      });

      logger.error(`CSV processing failed: ${uploadId}`, error);
      throw error;
    }
  }

  async commitData(uploadId: string, userId: number): Promise<void> {
    try {
      // Get stored processing result
      const storedData = await this.getStoredProcessingResult(uploadId);
      if (!storedData) {
        throw new Error('No processing result found for upload');
      }

      const { result, parsedData } = storedData;

      await this.updateProgress(uploadId, userId, {
        stage: 'committing',
        percentage: 10,
        message: 'Committing data to database...'
      });

      // Get data type from the result or retrieve from storage
      const dataType = await this.getDataType(uploadId);
      if (!dataType) {
        throw new Error('Data type not found for upload');
      }

      // Filter valid rows and commit to database
      const validRowsData = await this.filterValidRows(parsedData, result.errors);
      await this.commitToDatabase(validRowsData, dataType, userId, uploadId);

      // Update progress
      await this.updateProgress(uploadId, userId, {
        stage: 'completed',
        percentage: 100,
        message: `Successfully committed ${result.validRows} rows`,
        rowsProcessed: result.validRows,
        totalRows: result.totalRows
      });

      // Update result status
      result.status = 'committed';
      await this.storeProcessingResult(uploadId, result, null);

      // Create CSV upload record
      await prisma.csvUpload.create({
        data: {
          filename: result.filename,
          dataType,
          totalRows: result.totalRows,
          validRows: result.validRows,
          invalidRows: result.invalidRows,
          status: 'completed',
          uploadedBy: userId,
        }
      });

      logger.info(`CSV data committed: ${uploadId}, ${result.validRows} rows`);

    } catch (error) {
      await this.updateProgress(uploadId, userId, {
        stage: 'failed',
        percentage: 0,
        message: `Commit failed: ${error.message}`
      });

      logger.error(`CSV commit failed: ${uploadId}`, error);
      throw error;
    }
  }

  private async parseCSV(fileBuffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      
      csvParse(fileBuffer, {
        trim: true,
        skip_empty_lines: true,
        relax_column_count: true,
      })
      .on('data', (row) => {
        results.push(row);
      })
      .on('error', (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      })
      .on('end', () => {
        resolve(results);
      });
    });
  }

  private async validateData(
    parsedData: any[],
    dataType: string,
    uploadId: string,
    userId: number
  ): Promise<{ validRows: number; invalidRows: number; errors: CsvValidationError[] }> {
    const schema = DATA_TYPE_SCHEMAS[dataType as keyof typeof DATA_TYPE_SCHEMAS];
    if (!schema) {
      throw new Error(`Unknown data type: ${dataType}`);
    }

    const headers = parsedData[0];
    const dataRows = parsedData.slice(1);
    const errors: CsvValidationError[] = [];
    let validRows = 0;
    let invalidRows = 0;

    // Check required headers
    for (const requiredField of schema.required) {
      if (!headers.includes(requiredField)) {
        errors.push({
          row: 1,
          column: requiredField,
          value: 'missing',
          message: `Required column '${requiredField}' is missing`,
          severity: 'error'
        });
      }
    }

    // Validate each row
    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
      const row = dataRows[rowIndex];
      const rowNumber = rowIndex + 2; // +2 because we start from row 2 (after header)
      let rowHasErrors = false;

      // Update progress periodically
      if (rowIndex % 100 === 0) {
        const percentage = 30 + Math.floor((rowIndex / dataRows.length) * 60);
        await this.updateProgress(uploadId, userId, {
          stage: 'validating',
          percentage,
          message: `Validating row ${rowIndex + 1} of ${dataRows.length}...`,
          rowsProcessed: rowIndex,
          totalRows: dataRows.length
        });
      }

      // Check required fields
      for (const requiredField of schema.required) {
        const columnIndex = headers.indexOf(requiredField);
        if (columnIndex === -1) continue;

        const value = row[columnIndex];
        if (!value || value.trim() === '') {
          errors.push({
            row: rowNumber,
            column: requiredField,
            value: value,
            message: `Required field '${requiredField}' is empty`,
            severity: 'error'
          });
          rowHasErrors = true;
        }
      }

      // Validate field values
      for (const [fieldName, validator] of Object.entries(schema.validators)) {
        const columnIndex = headers.indexOf(fieldName);
        if (columnIndex === -1) continue;

        const value = row[columnIndex];
        if (value && value.trim() !== '' && !validator(value)) {
          errors.push({
            row: rowNumber,
            column: fieldName,
            value: value,
            message: `Invalid value for '${fieldName}': ${value}`,
            severity: 'error'
          });
          rowHasErrors = true;
        }
      }

      // Check for extra unknown columns (warning)
      const allKnownFields = [...schema.required, ...schema.optional];
      for (let colIndex = 0; colIndex < headers.length; colIndex++) {
        const header = headers[colIndex];
        if (!allKnownFields.includes(header)) {
          errors.push({
            row: 1,
            column: header,
            value: header,
            message: `Unknown column '${header}' will be ignored`,
            severity: 'warning'
          });
        }
      }

      if (rowHasErrors) {
        invalidRows++;
      } else {
        validRows++;
      }
    }

    return { validRows, invalidRows, errors };
  }

  private async filterValidRows(parsedData: any[], errors: CsvValidationError[]): Promise<any[]> {
    const headers = parsedData[0];
    const dataRows = parsedData.slice(1);
    const errorRows = new Set(errors.filter(e => e.severity === 'error').map(e => e.row));

    return dataRows
      .map((row, index) => ({ row, rowNumber: index + 2 }))
      .filter(({ rowNumber }) => !errorRows.has(rowNumber))
      .map(({ row }) => {
        const rowData: any = {};
        headers.forEach((header: string, i: number) => {
          rowData[header] = row[i] || '';
        });
        return rowData;
      });
  }

  private async commitToDatabase(validRows: any[], dataType: string, userId: number, uploadId: string): Promise<void> {
    const batchSize = 100;
    const batches = [];

    for (let i = 0; i < validRows.length; i += batchSize) {
      batches.push(validRows.slice(i, i + batchSize));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      // Update progress
      const percentage = 10 + Math.floor((batchIndex / batches.length) * 80);
      await this.updateProgress(uploadId, userId, {
        stage: 'committing',
        percentage,
        message: `Committing batch ${batchIndex + 1} of ${batches.length}...`,
        rowsProcessed: batchIndex * batchSize,
        totalRows: validRows.length
      });

      try {
        await this.commitBatch(batch, dataType, userId);
      } catch (error) {
        logger.error(`Failed to commit batch ${batchIndex + 1}:`, error);
        throw new Error(`Database commit failed at batch ${batchIndex + 1}: ${error.message}`);
      }
    }
  }

  private async commitBatch(batch: any[], dataType: string, userId: number): Promise<void> {
    const data = batch.map(row => ({
      ...this.transformRowForDatabase(row, dataType),
      uploadedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    switch (dataType) {
      case 'kpi_metrics':
        await prisma.kpiMetric.createMany({ data });
        break;
      case 'content_performance':
        await prisma.contentPerformance.createMany({ data });
        break;
      case 'risks':
        await prisma.risk.createMany({ data });
        break;
      case 'bugs_sprints':
        await prisma.bugSprint.createMany({ data });
        break;
      case 'infra_metrics':
        await prisma.infraMetric.createMany({ data });
        break;
      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }
  }

  private transformRowForDatabase(row: any, dataType: string): any {
    switch (dataType) {
      case 'kpi_metrics':
        return {
          metricName: row.metric_name,
          value: parseFloat(row.value),
          target: row.target ? parseFloat(row.target) : null,
          period: row.period,
          category: row.category || null,
          description: row.description || null,
        };
      
      case 'content_performance':
        return {
          contentTitle: row.content_title,
          views: parseInt(row.views),
          engagementRate: row.engagement_rate ? parseFloat(row.engagement_rate) : null,
          revenue: row.revenue ? parseFloat(row.revenue) : null,
          platform: row.platform,
          duration: row.duration ? parseInt(row.duration) : null,
        };
      
      case 'risks':
        return {
          title: row.title,
          description: row.description || null,
          severity: row.severity,
          likelihood: row.likelihood,
          category: row.category || null,
          mitigation: row.mitigation || null,
        };
      
      case 'bugs_sprints':
        return {
          title: row.title,
          description: row.description || null,
          severity: row.severity,
          status: row.status,
          sprintName: row.sprint_name || null,
          assignee: row.assignee || null,
          priority: row.priority || null,
        };
      
      case 'infra_metrics':
        return {
          metricName: row.metric_name,
          value: parseFloat(row.value),
          threshold: row.threshold ? parseFloat(row.threshold) : null,
          timestamp: new Date(row.timestamp),
          service: row.service || null,
          environment: row.environment || null,
        };
      
      default:
        return row;
    }
  }

  private async updateProgress(uploadId: string, userId: number, progress: CsvUploadProgress): Promise<void> {
    // Store in Redis for quick access
    await redisClient.setex(`csv:progress:${uploadId}`, 3600, JSON.stringify(progress));
    
    // Notify user via WebSocket
    if (webSocketService) {
      await webSocketService.updateCsvProgress(userId, uploadId, progress);
    }
  }

  private async storeProcessingResult(uploadId: string, result: CsvProcessingResult, parsedData: any[] | null): Promise<void> {
    const dataToStore = {
      result,
      parsedData: parsedData || undefined,
      timestamp: new Date().toISOString()
    };
    
    // Store for 24 hours
    await redisClient.setex(`csv:result:${uploadId}`, 86400, JSON.stringify(dataToStore));
  }

  private async getStoredProcessingResult(uploadId: string): Promise<{ result: CsvProcessingResult; parsedData: any[] } | null> {
    const stored = await redisClient.get(`csv:result:${uploadId}`);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    return {
      result: parsed.result,
      parsedData: parsed.parsedData
    };
  }

  private async getDataType(uploadId: string): Promise<string | null> {
    const stored = await redisClient.get(`csv:datatype:${uploadId}`);
    return stored;
  }

  async storeDataType(uploadId: string, dataType: string): Promise<void> {
    await redisClient.setex(`csv:datatype:${uploadId}`, 86400, dataType);
  }

  async getProgress(uploadId: string): Promise<CsvUploadProgress | null> {
    const progress = await redisClient.get(`csv:progress:${uploadId}`);
    return progress ? JSON.parse(progress) : null;
  }

  async deleteUpload(uploadId: string): Promise<void> {
    await redisClient.del(`csv:progress:${uploadId}`);
    await redisClient.del(`csv:result:${uploadId}`);
    await redisClient.del(`csv:datatype:${uploadId}`);
  }
}

export const csvProcessingService = new CsvProcessingService();