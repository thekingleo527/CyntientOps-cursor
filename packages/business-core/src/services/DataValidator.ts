/**
 * 🔍 Data Validator Service
 * Purpose: Comprehensive data validation throughout the application
 */

import { ErrorHandler, ErrorCategory, ErrorSeverity } from './ErrorHandler';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'phone' | 'date' | 'url' | 'uuid';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[];
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export class DataValidator {
  private static instance: DataValidator;
  private errorHandler: ErrorHandler;

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  public static getInstance(): DataValidator {
    if (!DataValidator.instance) {
      DataValidator.instance = new DataValidator();
    }
    return DataValidator.instance;
  }

  public validate(data: any, rules: ValidationRule[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const rule of rules) {
      const value = this.getNestedValue(data, rule.field);
      const result = this.validateField(value, rule, data);
      
      if (result.error) {
        errors.push(result.error);
      }
      
      if (result.warning) {
        warnings.push(result.warning);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private getNestedValue(data: any, field: string): any {
    if (!field.includes('.')) {
      return data[field];
    }

    const parts = field.split('.');
    let value = data;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private validateField(value: any, rule: ValidationRule, fullData: any): {
    error?: ValidationError;
    warning?: ValidationWarning;
  } {
    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      return {
        error: {
          field: rule.field,
          message: `Field '${rule.field}' is required`,
          code: 'REQUIRED',
          value
        }
      };
    }

    // Skip validation if value is empty and not required
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return {};
    }

    // Type validation
    if (rule.type) {
      const typeResult = this.validateType(value, rule.type, rule.field);
      if (typeResult.error) {
        return { error: typeResult.error };
      }
    }

    // String validations
    if (typeof value === 'string') {
      // Length validations
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        return {
          error: {
            field: rule.field,
            message: `Field '${rule.field}' must be at least ${rule.minLength} characters long`,
            code: 'MIN_LENGTH',
            value
          }
        };
      }

      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        return {
          error: {
            field: rule.field,
            message: `Field '${rule.field}' must be no more than ${rule.maxLength} characters long`,
            code: 'MAX_LENGTH',
            value
          }
        };
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        return {
          error: {
            field: rule.field,
            message: `Field '${rule.field}' does not match required pattern`,
            code: 'PATTERN',
            value
          }
        };
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return {
          error: {
            field: rule.field,
            message: `Field '${rule.field}' must be at least ${rule.min}`,
            code: 'MIN_VALUE',
            value
          }
        };
      }

      if (rule.max !== undefined && value > rule.max) {
        return {
          error: {
            field: rule.field,
            message: `Field '${rule.field}' must be no more than ${rule.max}`,
            code: 'MAX_VALUE',
            value
          }
        };
      }
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      return {
        error: {
          field: rule.field,
          message: `Field '${rule.field}' must be one of: ${rule.enum.join(', ')}`,
          code: 'ENUM',
          value
        }
      };
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (customResult !== true) {
        return {
          error: {
            field: rule.field,
            message: typeof customResult === 'string' ? customResult : `Field '${rule.field}' failed custom validation`,
            code: 'CUSTOM',
            value
          }
        };
      }
    }

    return {};
  }

  private validateType(value: any, type: string, field: string): { error?: ValidationError } {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return {
            error: {
              field,
              message: `Field '${field}' must be a string`,
              code: 'TYPE_STRING',
              value
            }
          };
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return {
            error: {
              field,
              message: `Field '${field}' must be a number`,
              code: 'TYPE_NUMBER',
              value
            }
          };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return {
            error: {
              field,
              message: `Field '${field}' must be a boolean`,
              code: 'TYPE_BOOLEAN',
              value
            }
          };
        }
        break;

      case 'email':
        if (typeof value !== 'string' || !this.isValidEmail(value)) {
          return {
            error: {
              field,
              message: `Field '${field}' must be a valid email address`,
              code: 'TYPE_EMAIL',
              value
            }
          };
        }
        break;

      case 'phone':
        if (typeof value !== 'string' || !this.isValidPhone(value)) {
          return {
            error: {
              field,
              message: `Field '${field}' must be a valid phone number`,
              code: 'TYPE_PHONE',
              value
            }
          };
        }
        break;

      case 'date':
        if (!this.isValidDate(value)) {
          return {
            error: {
              field,
              message: `Field '${field}' must be a valid date`,
              code: 'TYPE_DATE',
              value
            }
          };
        }
        break;

      case 'url':
        if (typeof value !== 'string' || !this.isValidUrl(value)) {
          return {
            error: {
              field,
              message: `Field '${field}' must be a valid URL`,
              code: 'TYPE_URL',
              value
            }
          };
        }
        break;

      case 'uuid':
        if (typeof value !== 'string' || !this.isValidUUID(value)) {
          return {
            error: {
              field,
              message: `Field '${field}' must be a valid UUID`,
              code: 'TYPE_UUID',
              value
            }
          };
        }
        break;
    }

    return {};
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
  }

  private isValidDate(date: any): boolean {
    if (date instanceof Date) {
      return !isNaN(date.getTime());
    }
    
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }
    
    return false;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // Predefined validation rules for common entities
  public getWorkerValidationRules(): ValidationRule[] {
    return [
      { field: 'id', required: true, type: 'string', minLength: 1 },
      { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 100 },
      { field: 'email', required: true, type: 'email' },
      { field: 'phone', required: false, type: 'phone' },
      { field: 'role', required: true, enum: ['admin', 'worker', 'manager', 'supervisor'] },
      { field: 'status', required: false, enum: ['Available', 'Busy', 'Off', 'On Break'] },
      { field: 'hourly_rate', required: false, type: 'number', min: 0 },
      { field: 'is_active', required: false, type: 'boolean' }
    ];
  }

  public getBuildingValidationRules(): ValidationRule[] {
    return [
      { field: 'id', required: true, type: 'string', minLength: 1 },
      { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 200 },
      { field: 'address', required: true, type: 'string', minLength: 5, maxLength: 500 },
      { field: 'latitude', required: true, type: 'number', min: -90, max: 90 },
      { field: 'longitude', required: true, type: 'number', min: -180, max: 180 },
      { field: 'borough', required: false, enum: ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'] },
      { field: 'compliance_score', required: false, type: 'number', min: 0, max: 100 },
      { field: 'is_active', required: false, type: 'boolean' }
    ];
  }

  public getTaskValidationRules(): ValidationRule[] {
    return [
      { field: 'id', required: true, type: 'string', minLength: 1 },
      { field: 'name', required: true, type: 'string', minLength: 3, maxLength: 200 },
      { field: 'description', required: false, type: 'string', maxLength: 1000 },
      { field: 'category', required: true, enum: ['Maintenance', 'Cleaning', 'Sanitation', 'Operations', 'Inspection', 'Emergency'] },
      { field: 'priority', required: false, enum: ['low', 'normal', 'high', 'urgent', 'critical', 'emergency'] },
      { field: 'status', required: false, enum: ['Pending', 'In Progress', 'Completed', 'Cancelled', 'On Hold'] },
      { field: 'assigned_building_id', required: false, type: 'string' },
      { field: 'assigned_worker_id', required: false, type: 'string' },
      { field: 'estimated_duration', required: false, type: 'number', min: 1 },
      { field: 'actual_duration', required: false, type: 'number', min: 0 },
      { field: 'requires_photo', required: false, type: 'boolean' }
    ];
  }

  public getClockInValidationRules(): ValidationRule[] {
    return [
      { field: 'worker_id', required: true, type: 'string', minLength: 1 },
      { field: 'building_id', required: true, type: 'string', minLength: 1 },
      { field: 'clock_in_time', required: true, type: 'date' },
      { field: 'latitude', required: false, type: 'number', min: -90, max: 90 },
      { field: 'longitude', required: false, type: 'number', min: -180, max: 180 },
      { field: 'accuracy', required: false, type: 'number', min: 0 }
    ];
  }

  // Sanitization methods
  public sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      .trim()
      .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  public sanitizeEmail(email: string): string {
    return this.sanitizeString(email).toLowerCase();
  }

  public sanitizePhone(phone: string): string {
    return phone.replace(/[^\d+\-()\s]/g, '');
  }

  public sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.toString();
    } catch {
      return '';
    }
  }

  // Validation with error handling
  public validateWithErrorHandling(data: any, rules: ValidationRule[], context?: any): ValidationResult {
    const result = this.validate(data, rules);
    
    if (!result.isValid) {
      // Log validation errors
      for (const error of result.errors) {
        this.errorHandler.handleValidationError(
          error.field,
          error.value,
          error.message
        );
      }
    }
    
    return result;
  }

  // Quick validation methods
  public isValidWorker(worker: any): boolean {
    const result = this.validate(worker, this.getWorkerValidationRules());
    return result.isValid;
  }

  public isValidBuilding(building: any): boolean {
    const result = this.validate(building, this.getBuildingValidationRules());
    return result.isValid;
  }

  public isValidTask(task: any): boolean {
    const result = this.validate(task, this.getTaskValidationRules());
    return result.isValid;
  }

  public isValidClockIn(clockIn: any): boolean {
    const result = this.validate(clockIn, this.getClockInValidationRules());
    return result.isValid;
  }
}
