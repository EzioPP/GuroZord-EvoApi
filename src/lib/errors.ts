/* eslint-disable @typescript-eslint/no-explicit-any */
export enum ErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface AppErrorContext {
  code: ErrorCode;
  message: string;
  statusCode: number;
  context?: Record<string, any>;
}

export class AppError extends Error implements AppErrorContext {
  code: ErrorCode;
  statusCode: number;
  context?: Record<string, any>;

  constructor(config: AppErrorContext) {
    super(config.message);
    this.name = 'AppError';
    this.code = config.code;
    this.statusCode = config.statusCode;
    this.context = config.context;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super({
      code: ErrorCode.NOT_FOUND,
      message,
      statusCode: 404,
      context,
    });
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super({
      code: ErrorCode.VALIDATION_ERROR,
      message,
      statusCode: 400,
      context,
    });
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super({
      code: ErrorCode.DATABASE_ERROR,
      message,
      statusCode: 500,
      context,
    });
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class UnknownError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super({
      code: ErrorCode.INTERNAL_ERROR,
      message,
      statusCode: 500,
      context,
    });
    this.name = 'UnknownError';
    Object.setPrototypeOf(this, UnknownError.prototype);
  }
}
