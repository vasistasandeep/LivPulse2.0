import Joi from 'joi';

// Form data validation schemas
const kpiMetricSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  category: Joi.string().max(50).required(),
  value: Joi.number().required(),
  unit: Joi.string().max(20).optional(),
  target: Joi.number().optional(),
  period: Joi.string().max(50).required(),
  dateRange: Joi.object({
    start: Joi.string().isoDate().required(),
    end: Joi.string().isoDate().required(),
  }).required(),
  metadata: Joi.object().optional(),
});

const contentPerformanceSchema = Joi.object({
  contentId: Joi.string().max(100).required(),
  contentTitle: Joi.string().max(200).required(),
  contentType: Joi.string().valid('movie', 'series', 'episode').required(),
  platform: Joi.string().valid('web', 'mobile', 'tv').required(),
  views: Joi.number().integer().min(0).default(0),
  watchTime: Joi.number().min(0).default(0),
  engagement: Joi.number().min(0).max(100).default(0),
  revenue: Joi.number().min(0).default(0),
  region: Joi.string().max(50).optional(),
  dateRange: Joi.object({
    start: Joi.string().isoDate().required(),
    end: Joi.string().isoDate().required(),
  }).required(),
  metadata: Joi.object().optional(),
});

const riskSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().max(1000).optional(),
  category: Joi.string().valid('Technical', 'Business', 'Legal', 'Operational').required(),
  severity: Joi.string().valid('Low', 'Medium', 'High', 'Critical').required(),
  probability: Joi.string().valid('Low', 'Medium', 'High').required(),
  impact: Joi.string().valid('Low', 'Medium', 'High').required(),
  status: Joi.string().valid('Open', 'Mitigated', 'Closed').default('Open'),
  owner: Joi.string().max(100).optional(),
  mitigation: Joi.string().max(1000).optional(),
  dueDate: Joi.string().isoDate().optional(),
  metadata: Joi.object().optional(),
});

const bugSprintSchema = Joi.object({
  type: Joi.string().valid('bug', 'sprint').required(),
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().max(1000).optional(),
  priority: Joi.string().valid('Low', 'Medium', 'High', 'Urgent').required(),
  status: Joi.string().valid('Open', 'In Progress', 'Testing', 'Closed').default('Open'),
  assignee: Joi.string().max(100).optional(),
  reporter: Joi.string().max(100).optional(),
  sprintName: Joi.string().max(100).when('type', {
    is: 'sprint',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  storyPoints: Joi.number().integer().min(1).when('type', {
    is: 'sprint',
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  labels: Joi.array().items(Joi.string().max(50)).default([]),
  dueDate: Joi.string().isoDate().optional(),
  resolvedAt: Joi.string().isoDate().optional(),
  metadata: Joi.object().optional(),
});

const infraMetricSchema = Joi.object({
  service: Joi.string().max(100).required(),
  metric: Joi.string().max(100).required(),
  value: Joi.number().required(),
  unit: Joi.string().max(20).required(),
  threshold: Joi.number().optional(),
  region: Joi.string().max(50).optional(),
  environment: Joi.string().valid('production', 'staging', 'development').required(),
  timestamp: Joi.string().isoDate().required(),
  metadata: Joi.object().optional(),
});

const formDataSchema = Joi.object({
  dataType: Joi.string()
    .valid('kpi_metrics', 'content_performance', 'risks', 'bugs_sprints', 'infra_metrics')
    .required(),
  data: Joi.when('dataType', {
    switch: [
      { is: 'kpi_metrics', then: kpiMetricSchema },
      { is: 'content_performance', then: contentPerformanceSchema },
      { is: 'risks', then: riskSchema },
      { is: 'bugs_sprints', then: bugSprintSchema },
      { is: 'infra_metrics', then: infraMetricSchema },
    ],
  }),
});

const csvCommitSchema = Joi.object({
  uploadId: Joi.number().integer().positive().required(),
});

// Validation functions
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  data?: any;
}

export const validateFormData = (data: any): ValidationResult => {
  const { error, value } = formDataSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map((detail: any) => detail.message),
    };
  }

  return {
    isValid: true,
    data: value,
  };
};

export const validateCsvCommit = (data: any): ValidationResult => {
  const { error, value } = csvCommitSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map((detail: any) => detail.message),
    };
  }

  return {
    isValid: true,
    data: value,
  };
};

// CSV row validation
export const validateCsvRow = (row: any, targetTable: string): ValidationResult => {
  let schema;

  switch (targetTable) {
    case 'kpi_metrics':
      schema = kpiMetricSchema;
      break;
    case 'content_performance':
      schema = contentPerformanceSchema;
      break;
    case 'risks':
      schema = riskSchema;
      break;
    case 'bugs_sprints':
      schema = bugSprintSchema;
      break;
    case 'infra_metrics':
      schema = infraMetricSchema;
      break;
    default:
      return {
        isValid: false,
        errors: ['Invalid target table'],
      };
  }

  const { error, value } = schema.validate(row, { 
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map((detail: any) => detail.message),
    };
  }

  return {
    isValid: true,
    data: value,
  };
};

// Query parameter validation
export const validateDataQuery = (query: any): ValidationResult => {
  const querySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().trim().max(100).optional(),
    category: Joi.string().max(50).optional(),
    status: Joi.string().max(50).optional(),
    dateFrom: Joi.string().isoDate().optional(),
    dateTo: Joi.string().isoDate().optional(),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'value').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  });

  const { error, value } = querySchema.validate(query, { 
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map((detail: any) => detail.message),
    };
  }

  return {
    isValid: true,
    data: value,
  };
};