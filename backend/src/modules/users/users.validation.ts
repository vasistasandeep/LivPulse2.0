import Joi from 'joi';

// Validation schemas
const userCreateSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required',
    }),
  
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .allow('')
    .optional()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
    }),
  
  role: Joi.string()
    .valid('Admin', 'Executive', 'PM', 'TPM', 'EM', 'SRE')
    .required()
    .messages({
      'any.only': 'Role must be one of: Admin, Executive, PM, TPM, EM, SRE',
      'any.required': 'Role is required',
    }),
});

const userUpdateSchema = Joi.object({
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address',
    }),
  
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .optional()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),
  
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .allow('')
    .optional()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
    }),
  
  role: Joi.string()
    .valid('Admin', 'Executive', 'PM', 'TPM', 'EM', 'SRE')
    .optional()
    .messages({
      'any.only': 'Role must be one of: Admin, Executive, PM, TPM, EM, SRE',
    }),
  
  status: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Status must be a boolean value',
    }),
})
.min(1)
.messages({
  'object.min': 'At least one field must be provided for update',
});

// Validation functions
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  data?: any;
}

export const validateUserInput = (data: any): ValidationResult => {
  const { error, value } = userCreateSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message),
    };
  }

  return {
    isValid: true,
    data: value,
  };
};

export const validateUserUpdate = (data: any): ValidationResult => {
  const { error, value } = userUpdateSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message),
    };
  }

  return {
    isValid: true,
    data: value,
  };
};

// Query parameter validation
export const validateUserQuery = (query: any): ValidationResult => {
  const querySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().max(100).optional(),
    role: Joi.string().valid('Admin', 'Executive', 'PM', 'TPM', 'EM', 'SRE').optional(),
    status: Joi.string().valid('true', 'false').optional(),
    sortBy: Joi.string().valid('email', 'name', 'role', 'createdAt', 'lastLogin').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  });

  const { error, value } = querySchema.validate(query, { 
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message),
    };
  }

  return {
    isValid: true,
    data: value,
  };
};