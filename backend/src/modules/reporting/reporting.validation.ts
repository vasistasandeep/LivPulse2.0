import Joi from 'joi';

export interface ReportExportQuery {
  format: 'excel' | 'pdf' | 'csv';
  type: 'dashboard' | 'data';
  dashboardId?: string;
  dataType?: 'kpi_metrics' | 'content_performance' | 'risks' | 'bugs_sprints' | 'infra_metrics';
  dateFrom?: string;
  dateTo?: string;
}

export interface ReportSchedule {
  name: string;
  type: 'dashboard' | 'data';
  query: Record<string, any>;
  schedule: string;
  recipients: string[];
}

// Validation schema for report export
const reportExportSchema = Joi.object({
  format: Joi.string().valid('excel', 'pdf', 'csv').required()
    .messages({
      'any.required': 'Export format is required',
      'any.only': 'Format must be one of: excel, pdf, csv'
    }),
  
  type: Joi.string().valid('dashboard', 'data').required()
    .messages({
      'any.required': 'Report type is required',
      'any.only': 'Type must be one of: dashboard, data'
    }),
  
  dashboardId: Joi.when('type', {
    is: 'dashboard',
    then: Joi.string().required()
      .messages({
        'any.required': 'Dashboard ID is required for dashboard exports'
      }),
    otherwise: Joi.string().optional()
  }),
  
  dataType: Joi.when('type', {
    is: 'data',
    then: Joi.string().valid('kpi_metrics', 'content_performance', 'risks', 'bugs_sprints', 'infra_metrics').required()
      .messages({
        'any.required': 'Data type is required for data exports',
        'any.only': 'Data type must be one of: kpi_metrics, content_performance, risks, bugs_sprints, infra_metrics'
      }),
    otherwise: Joi.string().optional()
  }),
  
  dateFrom: Joi.date().iso().optional()
    .messages({
      'date.format': 'Date from must be in ISO format (YYYY-MM-DD)'
    }),
  
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional()
    .messages({
      'date.format': 'Date to must be in ISO format (YYYY-MM-DD)',
      'date.min': 'Date to must be after date from'
    })
});

// Validation schema for report scheduling
const reportScheduleSchema = Joi.object({
  name: Joi.string().min(1).max(100).required()
    .messages({
      'any.required': 'Report name is required',
      'string.min': 'Report name cannot be empty',
      'string.max': 'Report name must be less than 100 characters'
    }),
  
  type: Joi.string().valid('dashboard', 'data').required()
    .messages({
      'any.required': 'Report type is required',
      'any.only': 'Type must be one of: dashboard, data'
    }),
  
  query: Joi.object().required()
    .messages({
      'any.required': 'Query configuration is required'
    }),
  
  schedule: Joi.string().required()
    .messages({
      'any.required': 'Schedule configuration is required'
    }),
  
  recipients: Joi.array()
    .items(Joi.string().email())
    .min(1)
    .required()
    .messages({
      'any.required': 'Recipients list is required',
      'array.min': 'At least one recipient is required',
      'string.email': 'All recipients must be valid email addresses'
    })
});

// Validation functions
export function validateReportExport(data: any): { isValid: boolean; errors?: any } {
  const { error } = reportExportSchema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    };
  }
  
  return { isValid: true };
}

export function validateReportSchedule(data: any): { isValid: boolean; errors?: any } {
  const { error } = reportScheduleSchema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    };
  }
  
  return { isValid: true };
}

// Helper validation schemas for reuse
export const dateRangeSchema = Joi.object({
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional()
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

export const statusSchema = Joi.object({
  status: Joi.string().valid('active', 'paused', 'completed', 'failed').optional()
});