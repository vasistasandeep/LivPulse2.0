import Joi from 'joi';

// Dashboard validation schemas
const dashboardCreateSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Dashboard name must be at least 2 characters long',
      'string.max': 'Dashboard name cannot exceed 100 characters',
      'any.required': 'Dashboard name is required',
    }),
  
  description: Joi.string()
    .max(500)
    .trim()
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
  
  layout: Joi.object()
    .optional()
    .default({})
    .messages({
      'object.base': 'Layout must be a valid object',
    }),
  
  permissions: Joi.object({
    roles: Joi.array()
      .items(Joi.string().valid('Admin', 'Executive', 'PM', 'TPM', 'EM', 'SRE'))
      .default([])
      .messages({
        'array.base': 'Roles must be an array',
        'any.only': 'Invalid role specified',
      }),
    users: Joi.array()
      .items(Joi.number().integer().positive())
      .default([])
      .optional()
      .messages({
        'array.base': 'Users must be an array',
        'number.base': 'User IDs must be numbers',
        'number.positive': 'User IDs must be positive',
      }),
  })
    .default({ roles: [], users: [] })
    .optional(),
  
  isPublic: Joi.boolean()
    .default(false)
    .optional()
    .messages({
      'boolean.base': 'isPublic must be a boolean value',
    }),
});

const dashboardUpdateSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .optional()
    .messages({
      'string.min': 'Dashboard name must be at least 2 characters long',
      'string.max': 'Dashboard name cannot exceed 100 characters',
    }),
  
  description: Joi.string()
    .max(500)
    .trim()
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
  
  layout: Joi.object()
    .optional()
    .messages({
      'object.base': 'Layout must be a valid object',
    }),
  
  permissions: Joi.object({
    roles: Joi.array()
      .items(Joi.string().valid('Admin', 'Executive', 'PM', 'TPM', 'EM', 'SRE'))
      .optional()
      .messages({
        'array.base': 'Roles must be an array',
        'any.only': 'Invalid role specified',
      }),
    users: Joi.array()
      .items(Joi.number().integer().positive())
      .optional()
      .messages({
        'array.base': 'Users must be an array',
        'number.base': 'User IDs must be numbers',
        'number.positive': 'User IDs must be positive',
      }),
  })
    .optional(),
  
  isPublic: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isPublic must be a boolean value',
    }),
})
.min(1)
.messages({
  'object.min': 'At least one field must be provided for update',
});

// Widget validation schema
const widgetSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string()
    .valid('chart', 'metric', 'table', 'gauge', 'trend')
    .required(),
  title: Joi.string().max(100).required(),
  position: Joi.object({
    x: Joi.number().integer().min(0).required(),
    y: Joi.number().integer().min(0).required(),
    width: Joi.number().integer().min(1).required(),
    height: Joi.number().integer().min(1).required(),
  }).required(),
  config: Joi.object().optional(),
  dataSource: Joi.object({
    type: Joi.string().required(),
    query: Joi.object().required(),
  }).optional(),
});

const layoutSchema = Joi.object({
  widgets: Joi.array().items(widgetSchema).default([]),
  theme: Joi.string().valid('light', 'dark').default('light'),
  refreshInterval: Joi.number().integer().min(5).max(300).default(30),
});

// Validation functions
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  data?: any;
}

export const validateDashboardInput = (data: any): ValidationResult => {
  const { error, value } = dashboardCreateSchema.validate(data, { 
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

export const validateDashboardUpdate = (data: any): ValidationResult => {
  const { error, value } = dashboardUpdateSchema.validate(data, { 
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

export const validateDashboardLayout = (data: any): ValidationResult => {
  const { error, value } = layoutSchema.validate(data, { 
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

// Query parameter validation
export const validateDashboardQuery = (query: any): ValidationResult => {
  const querySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().max(100).optional(),
    isPublic: Joi.string().valid('true', 'false').optional(),
    sortBy: Joi.string().valid('name', 'createdAt', 'updatedAt').default('updatedAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    timeRange: Joi.string().valid('1h', '6h', '1d', '7d', '30d', '90d').default('7d'),
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