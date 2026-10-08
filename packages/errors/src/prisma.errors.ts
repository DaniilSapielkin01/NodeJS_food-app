import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
} from "./index";

interface PrismaLikeError {
  name: string;
  code?: string;
  meta?: { target?: unknown };
}

const isPrismaError = (
  error: unknown,
  name: string,
): error is PrismaLikeError =>
  typeof error === "object" &&
  error !== null &&
  (error as { name?: unknown }).name === name;

export const handlePrismaError = (
  error: unknown,
  entityName: string,
): never => {
  if (isPrismaError(error, "PrismaClientKnownRequestError")) {
    switch (error.code) {
      case "P2002": {
        const target = error.meta?.target;
        const field = Array.isArray(target) ? (target[0] ?? "field") : "field";
        throw new ConflictError(
          `${entityName} with this ${field} already exists`,
        );
      }
      case "P2025":
        throw new NotFoundError(`${entityName} not found`);
      case "P2003":
        throw new BadRequestError(`Related ${entityName} does not exist`);
      case "P2014":
        throw new BadRequestError(
          `This change violates a required relation on ${entityName}`,
        );
      case "P2000":
        throw new BadRequestError(
          `Provided value is too long for ${entityName}`,
        );
      case "P2001":
        throw new NotFoundError(`${entityName} does not exist`);
      case "P2011":
        throw new BadRequestError(`Required field is missing on ${entityName}`);
      case "P2015":
        throw new NotFoundError(`Related record for ${entityName} not found`);
      case "P2016":
        throw new BadRequestError(
          `Query interpretation error on ${entityName}`,
        );
      case "P2021":
        throw new ServiceUnavailableError(
          `Table for ${entityName} does not exist, run migrations`,
        );
      case "P2022":
        throw new ServiceUnavailableError(
          `Column does not exist on ${entityName}, run migrations`,
        );
      case "P2023":
        throw new BadRequestError(`Inconsistent column data on ${entityName}`);
      case "P2024":
        throw new ServiceUnavailableError("Connection pool timeout");
      case "P2028":
        throw new ServiceUnavailableError("Transaction API error");
      case "P2034":
        throw new ConflictError(
          `Write conflict on ${entityName}, please retry`,
        );
      default:
        throw new BadRequestError(
          `Unhandled Prisma error on ${entityName}: ${error.code}`,
        );
    }
  }

  if (isPrismaError(error, "PrismaClientInitializationError")) {
    throw new ServiceUnavailableError("Database connection failed");
  }

  throw error;
};
