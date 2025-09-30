import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, AuthRequest } from '../common/middleware/auth.middleware';
import { validateCsvUpload, validateDataCommit } from './data-input.validation';
import { csvProcessingService } from '../csv/csv-processing.service';
import { logger } from '../common/utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// POST /api/data-input/csv/upload - Upload and process CSV file
router.post('/csv/upload', authenticateToken, upload.single('csvFile'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file provided' });
    }

    const validation = validateCsvUpload(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const { dataType } = req.body;
    const currentUser = req.user!;
    const uploadId = uuidv4();

    // Store data type for later use
    await csvProcessingService.storeDataType(uploadId, dataType);

    // Start async processing
    csvProcessingService.processUpload(
      uploadId,
      req.file.originalname,
      req.file.buffer,
      dataType,
      currentUser.id
    ).catch(error => {
      logger.error(`CSV processing failed for upload ${uploadId}:`, error);
    });

    res.status(202).json({
      message: 'CSV upload started',
      uploadId,
      filename: req.file.originalname,
      dataType,
      status: 'processing'
    });

  } catch (error) {
    logger.error('CSV upload error:', error);
    res.status(500).json({ error: 'Failed to upload CSV file' });
  }
});

export default router;

      case 'content_performance':
        result = await prisma.contentPerformance.create({
          data: {
            ...data,
            createdBy: currentUser.id,
          },
        });
        break;

      case 'risks':
        result = await prisma.risk.create({
          data: {
            ...data,
            createdBy: currentUser.id,
          },
        });
        break;

      case 'bugs_sprints':
        result = await prisma.bugSprint.create({
          data: {
            ...data,
            createdBy: currentUser.id,
          },
        });
        break;

      case 'infra_metrics':
        result = await prisma.infraMetric.create({
          data: {
            ...data,
            createdBy: currentUser.id,
          },
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid data type specified' });
    }

    logger.info(`Form data submitted: ${dataType} by ${currentUser.email}`);

    res.status(201).json({
      message: 'Data submitted successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error submitting form data:', error);
    res.status(500).json({ error: 'Failed to submit data' });
  }
});

// POST /api/data/csv - Upload and preview CSV
router.post('/csv', authenticateToken, requireDataAccess, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { targetTable } = req.body;
    if (!targetTable) {
      return res.status(400).json({ error: 'Target table must be specified' });
    }

    const validTables = ['kpi_metrics', 'content_performance', 'risks', 'bugs_sprints', 'infra_metrics'];
    if (!validTables.includes(targetTable)) {
      return res.status(400).json({ error: 'Invalid target table' });
    }

    const currentUser = req.user!;
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Parse CSV and validate first few rows
    const csvData: any[] = [];
    const errors: string[] = [];
    let rowCount = 0;

    const parsePromise = new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          rowCount++;
          
          // Store first 10 rows for preview
          if (csvData.length < 10) {
            csvData.push(data);
          }

          // Basic validation (you can extend this)
          if (targetTable === 'kpi_metrics') {
            if (!data.name || !data.value) {
              errors.push(`Row ${rowCount}: Missing required fields (name, value)`);
            }
          }
          // Add validation for other table types...
        })
        .on('end', () => {
          resolve(csvData);
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    await parsePromise;

    // Create CSV upload record
    const csvUpload = await prisma.csvUpload.create({
      data: {
        filename: `${Date.now()}_${fileName}`,
        originalName: fileName,
        size: req.file.size,
        mimeType: req.file.mimetype,
        targetTable,
        status: errors.length > 0 ? 'Failed' : 'Preview',
        preview: csvData,
        errors: errors.length > 0 ? errors : null,
        rowCount,
        createdBy: currentUser.id,
      },
    });

    logger.info(`CSV uploaded for preview: ${fileName} (${rowCount} rows) by ${currentUser.email}`);

    res.json({
      message: 'CSV uploaded and validated successfully',
      upload: {
        id: csvUpload.id,
        filename: csvUpload.originalName,
        rowCount,
        status: csvUpload.status,
        preview: csvData,
        errors: errors.length > 0 ? errors.slice(0, 10) : null, // Limit error preview
        targetTable,
      },
    });
  } catch (error) {
    logger.error('Error processing CSV upload:', error);
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
});

// POST /api/data/csv/commit - Commit CSV data after preview
router.post('/csv/commit', authenticateToken, requireDataAccess, async (req: AuthRequest, res: Response) => {
  try {
    const validation = validateCsvCommit(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const { uploadId } = req.body;
    const currentUser = req.user!;

    // Get the CSV upload record
    const csvUpload = await prisma.csvUpload.findUnique({
      where: { id: uploadId },
    });

    if (!csvUpload) {
      return res.status(404).json({ error: 'CSV upload not found' });
    }

    if (csvUpload.createdBy !== currentUser.id && !['Admin', 'TPM'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (csvUpload.status !== 'Preview') {
      return res.status(400).json({ error: 'CSV upload is not in preview status' });
    }

    // Re-parse the CSV file and insert data
    const filePath = `uploads/${csvUpload.filename}`;
    const insertedRecords: any[] = [];

    const processPromise = new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(csv())
        .on('data', async (data) => {
          try {
            let result;

            switch (csvUpload.targetTable) {
              case 'kpi_metrics':
                result = await prisma.kpiMetric.create({
                  data: {
                    name: data.name,
                    category: data.category,
                    value: parseFloat(data.value),
                    unit: data.unit,
                    target: data.target ? parseFloat(data.target) : null,
                    period: data.period,
                    dateRange: data.dateRange ? JSON.parse(data.dateRange) : {},
                    metadata: data.metadata ? JSON.parse(data.metadata) : null,
                    createdBy: currentUser.id,
                  },
                });
                break;

              case 'content_performance':
                result = await prisma.contentPerformance.create({
                  data: {
                    contentId: data.contentId,
                    contentTitle: data.contentTitle,
                    contentType: data.contentType,
                    platform: data.platform,
                    views: BigInt(data.views || 0),
                    watchTime: parseFloat(data.watchTime || 0),
                    engagement: parseFloat(data.engagement || 0),
                    revenue: parseFloat(data.revenue || 0),
                    region: data.region,
                    dateRange: data.dateRange ? JSON.parse(data.dateRange) : {},
                    metadata: data.metadata ? JSON.parse(data.metadata) : null,
                    createdBy: currentUser.id,
                  },
                });
                break;

              // Add cases for other table types...
              default:
                throw new Error(`Unsupported target table: ${csvUpload.targetTable}`);
            }

            insertedRecords.push(result);
          } catch (error) {
            logger.error('Error inserting CSV row:', error);
          }
        })
        .on('end', () => {
          resolve(insertedRecords);
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    await processPromise;

    // Update CSV upload status
    await prisma.csvUpload.update({
      where: { id: uploadId },
      data: {
        status: 'Completed',
        processedAt: new Date(),
      },
    });

    logger.info(`CSV data committed: ${insertedRecords.length} records from ${csvUpload.originalName} by ${currentUser.email}`);

    res.json({
      message: 'CSV data committed successfully',
      insertedRecords: insertedRecords.length,
      uploadId,
    });
  } catch (error) {
    logger.error('Error committing CSV data:', error);
    res.status(500).json({ error: 'Failed to commit CSV data' });
  }
});

// GET /api/data/:type - Get data by type
router.get('/:type', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.params;
    const { page = '1', limit = '20', ...filters } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let data;
    let total;

    switch (type) {
      case 'kpi-metrics':
        [data, total] = await Promise.all([
          prisma.kpiMetric.findMany({
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: limitNum,
            skip: offset,
          }),
          prisma.kpiMetric.count(),
        ]);
        break;

      case 'content-performance':
        [data, total] = await Promise.all([
          prisma.contentPerformance.findMany({
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: limitNum,
            skip: offset,
          }),
          prisma.contentPerformance.count(),
        ]);
        break;

      case 'risks':
        [data, total] = await Promise.all([
          prisma.risk.findMany({
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: limitNum,
            skip: offset,
          }),
          prisma.risk.count(),
        ]);
        break;

      case 'bugs-sprints':
        [data, total] = await Promise.all([
          prisma.bugSprint.findMany({
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: limitNum,
            skip: offset,
          }),
          prisma.bugSprint.count(),
        ]);
        break;

      case 'infra-metrics':
        [data, total] = await Promise.all([
          prisma.infraMetric.findMany({
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { timestamp: 'desc' },
            take: limitNum,
            skip: offset,
          }),
          prisma.infraMetric.count(),
        ]);
        break;

      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalRecords: total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    logger.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// GET /api/data/uploads - Get CSV upload history
router.get('/uploads/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user!;
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Admin and TPM can see all uploads, others only their own
    const where = ['Admin', 'TPM'].includes(currentUser.role) 
      ? {} 
      : { createdBy: currentUser.id };

    const [uploads, total] = await Promise.all([
      prisma.csvUpload.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip: offset,
      }),
      prisma.csvUpload.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      uploads,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalUploads: total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    logger.error('Error fetching upload history:', error);
    res.status(500).json({ error: 'Failed to fetch upload history' });
  }
});

export default router;