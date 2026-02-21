import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '@/lib/errors';
import { ZodError, z } from 'zod';

export const setupErrorHandler = (app: FastifyInstance) => {
  app.setErrorHandler(async (error: Error, request: FastifyRequest, reply: FastifyReply) => {
    const logger = request.log;

    if (error instanceof ZodError) {
      logger.warn('Validation error caught');
      logger.info({
        errors: z.treeifyError(error),
        path: request.url,
      });

      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid payload',
          context: process.env.NODE_ENV === 'development' ? z.treeifyError(error) : undefined,
        },
      });
    }

    if (error instanceof AppError) {
      logger.warn('Application error caught');
      logger.info({
        code: error.code,
        statusCode: error.statusCode,
        message: error.message,
        path: request.url,
      });

      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          context: process.env.NODE_ENV === 'development' ? error.context : undefined,
        },
      });
    }

    logger.error('Unexpected error');
    logger.info({
      message: error.message,
      stack: error.stack,
      path: request.url,
    });

    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  });
};
