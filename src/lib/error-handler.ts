import { Logger } from "winston";
import { Prisma } from "@@/generated/prisma/client";
import { AppError, DatabaseError, ErrorCode, NotFoundError } from "@/lib/errors";
import type { RepositoryContext } from "@/types/repository.types";

export class ErrorHandler {
  static handle(error: unknown, logger: Logger, context: RepositoryContext = {}): never {
    if (error instanceof AppError) {
      logger.warn("Application error", {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        ...context,
        ...error.context,
      });
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error("Database error", {
        code: error.code,
        message: error.message,
        ...context,
      });

      if (error.code === "P2025") {
        throw new NotFoundError("Record not found", context);
      }

      throw new DatabaseError("Database operation failed", {
        prismaCode: error.code,
        ...context,
      });
    }

    logger.error("Unexpected error", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    });

    throw new AppError({
      code: ErrorCode.INTERNAL_ERROR,
      message: error instanceof Error ? error.message : "Internal server error",
      statusCode: 500,
      context,
    });
  }
}