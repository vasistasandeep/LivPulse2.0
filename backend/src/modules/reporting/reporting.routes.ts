import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import puppeteer from 'puppeteer';
import { authenticateToken, AuthRequest } from '../common/middleware/auth.middleware';
import { validateReportExport, validateReportSchedule } from './reporting.validation';
import { logger } from '../common/utils/logger';

const router = Router();
const prisma = new PrismaClient();

// GET /api/reports/export - Export reports
router.get('/export', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const validation = validateReportExport(req.query);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const { format, type, dashboardId, dataType, dateFrom, dateTo } = req.query;
    const currentUser = req.user!;

    let data: any;
    let filename: string;

    // Get data based on report type
    if (type === 'dashboard' && dashboardId) {
      // Dashboard export
      const dashboard = await prisma.dashboard.findUnique({
        where: { id: parseInt(dashboardId as string) },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      });

      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }

      data = dashboard;
      filename = `dashboard_${dashboard.name}_${new Date().toISOString().split('T')[0]}`;
    } else if (type === 'data' && dataType) {
      // Data export
      const whereClause: any = {};
      
      if (dateFrom && dateTo) {
        whereClause.createdAt = {
          gte: new Date(dateFrom as string),
          lte: new Date(dateTo as string),
        };
      }

      switch (dataType) {
        case 'kpi_metrics':
          data = await prisma.kpiMetric.findMany({
            where: whereClause,
            include: {
              user: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
          });
          break;
        case 'content_performance':
          data = await prisma.contentPerformance.findMany({
            where: whereClause,
            include: {
              user: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
          });
          break;
        case 'risks':
          data = await prisma.risk.findMany({
            where: whereClause,
            include: {
              user: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
          });
          break;
        case 'bugs_sprints':
          data = await prisma.bugSprint.findMany({
            where: whereClause,
            include: {
              user: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
          });
          break;
        case 'infra_metrics':
          data = await prisma.infraMetric.findMany({
            where: whereClause,
            include: {
              user: { select: { name: true, email: true } },
            },
            orderBy: { timestamp: 'desc' },
          });
          break;
        default:
          return res.status(400).json({ error: 'Invalid data type' });
      }

      filename = `${dataType}_export_${new Date().toISOString().split('T')[0]}`;
    } else {
      return res.status(400).json({ error: 'Invalid export parameters' });
    }

    // Generate export based on format
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data');

      if (type === 'dashboard') {
        // Dashboard summary
        worksheet.addRow(['Dashboard Name', data.name]);
        worksheet.addRow(['Description', data.description || '']);
        worksheet.addRow(['Created By', data.user.name || data.user.email]);
        worksheet.addRow(['Created At', data.createdAt]);
        worksheet.addRow(['Last Updated', data.updatedAt]);
        worksheet.addRow(['Public', data.isPublic ? 'Yes' : 'No']);
      } else {
        // Data export
        if (data.length > 0) {
          const headers = Object.keys(data[0]).filter(key => key !== 'user');
          worksheet.addRow([...headers, 'Created By']);

          data.forEach((row: any) => {
            const values = headers.map(header => {
              const value = row[header];
              if (typeof value === 'object' && value !== null) {
                return JSON.stringify(value);
              }
              return value;
            });
            values.push(row.user?.name || row.user?.email || '');
            worksheet.addRow(values);
          });
        }
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);

      await workbook.xlsx.write(res);
    } else if (format === 'pdf') {
      // Generate PDF using Puppeteer
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      let htmlContent: string;
      
      if (type === 'dashboard') {
        htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                .info-table { width: 100%; border-collapse: collapse; }
                .info-table td { padding: 8px; border: 1px solid #ddd; }
                .info-table td:first-child { background-color: #f5f5f5; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Dashboard Report: ${data.name}</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
              </div>
              <table class="info-table">
                <tr><td>Dashboard Name</td><td>${data.name}</td></tr>
                <tr><td>Description</td><td>${data.description || 'N/A'}</td></tr>
                <tr><td>Created By</td><td>${data.user.name || data.user.email}</td></tr>
                <tr><td>Created At</td><td>${new Date(data.createdAt).toLocaleString()}</td></tr>
                <tr><td>Last Updated</td><td>${new Date(data.updatedAt).toLocaleString()}</td></tr>
                <tr><td>Public</td><td>${data.isPublic ? 'Yes' : 'No'}</td></tr>
              </table>
            </body>
          </html>
        `;
      } else {
        const tableRows = data.map((row: any) => {
          const cells = Object.keys(row)
            .filter(key => key !== 'user')
            .map(key => `<td>${row[key]}</td>`)
            .join('');
          return `<tr>${cells}<td>${row.user?.name || row.user?.email || ''}</td></tr>`;
        }).join('');

        htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { padding: 6px; border: 1px solid #ddd; text-align: left; }
                th { background-color: #f5f5f5; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Data Export: ${dataType}</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <p>Records: ${data.length}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    ${Object.keys(data[0] || {}).filter(key => key !== 'user').map(key => `<th>${key}</th>`).join('')}
                    <th>Created By</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </body>
          </html>
        `;
      }

      await page.setContent(htmlContent);
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      });

      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      res.send(pdfBuffer);
    } else if (format === 'csv') {
      let csvContent: string;

      if (type === 'dashboard') {
        csvContent = `Dashboard Name,Description,Created By,Created At,Last Updated,Public\n`;
        csvContent += `"${data.name}","${data.description || ''}","${data.user.name || data.user.email}","${data.createdAt}","${data.updatedAt}","${data.isPublic}"`;
      } else {
        if (data.length > 0) {
          const headers = Object.keys(data[0]).filter(key => key !== 'user');
          csvContent = `${headers.join(',')},Created By\n`;
          
          data.forEach((row: any) => {
            const values = headers.map(header => {
              const value = row[header];
              if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
              }
              return value;
            });
            values.push(row.user?.name || row.user?.email || '');
            csvContent += `${values.join(',')}\n`;
          });
        } else {
          csvContent = 'No data available\n';
        }
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csvContent);
    }

    logger.info(`Report exported: ${format} format, ${type} type by ${currentUser.email}`);

  } catch (error) {
    logger.error('Error exporting report:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

// POST /api/reports/schedule - Schedule reports
router.post('/schedule', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const validation = validateReportSchedule(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const { name, type, query, schedule, recipients } = req.body;
    const currentUser = req.user!;

    // Parse cron expression and calculate next run
    const nextRun = calculateNextRun(schedule);

    const scheduledReport = await prisma.report.create({
      data: {
        name,
        type,
        query,
        schedule,
        recipients,
        nextRun,
        status: 'active',
        createdBy: currentUser.id,
      },
    });

    logger.info(`Report scheduled: ${name} by ${currentUser.email}`);

    res.status(201).json({
      message: 'Report scheduled successfully',
      report: scheduledReport,
    });
  } catch (error) {
    logger.error('Error scheduling report:', error);
    res.status(500).json({ error: 'Failed to schedule report' });
  }
});

// GET /api/reports - List scheduled reports
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user!;
    const { page = '1', limit = '10', status } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    // Non-admin users can only see their own reports
    if (!['Admin', 'TPM'].includes(currentUser.role)) {
      where.createdBy = currentUser.id;
    }

    if (status) {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
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
      prisma.report.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      reports,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalReports: total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    logger.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// PUT /api/reports/:id - Update scheduled report
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const reportId = parseInt(req.params.id);
    const currentUser = req.user!;

    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check permissions
    if (report.createdBy !== currentUser.id && !['Admin', 'TPM'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData: any = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.schedule) {
      updateData.schedule = req.body.schedule;
      updateData.nextRun = calculateNextRun(req.body.schedule);
    }
    if (req.body.recipients) updateData.recipients = req.body.recipients;
    if (req.body.status) updateData.status = req.body.status;

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    logger.info(`Report updated: ${updatedReport.name} by ${currentUser.email}`);

    res.json({
      message: 'Report updated successfully',
      report: updatedReport,
    });
  } catch (error) {
    logger.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// DELETE /api/reports/:id - Delete scheduled report
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const reportId = parseInt(req.params.id);
    const currentUser = req.user!;

    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, name: true, createdBy: true },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check permissions
    if (report.createdBy !== currentUser.id && !['Admin', 'TPM'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.report.delete({
      where: { id: reportId },
    });

    logger.info(`Report deleted: ${report.name} by ${currentUser.email}`);

    res.json({
      message: 'Report deleted successfully',
      deletedReport: {
        id: report.id,
        name: report.name,
      },
    });
  } catch (error) {
    logger.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Helper function to calculate next run time from cron expression
function calculateNextRun(cronExpression: string): Date {
  // Simple implementation - in production, use a proper cron parser like 'node-cron'
  const now = new Date();
  
  // For demo purposes, assume daily at specified hour
  if (cronExpression.includes('daily')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9 AM
    return tomorrow;
  }
  
  // Default to 1 hour from now
  const nextHour = new Date(now);
  nextHour.setHours(nextHour.getHours() + 1);
  return nextHour;
}

export default router;