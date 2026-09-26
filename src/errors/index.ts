import { HTTP_STATUS } from "@utils/constants/statuses";

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad request") {
    super(message, HTTP_STATUS.BAD_REQUEST_400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Not authenticated") {
    super(message, HTTP_STATUS.NO_AUTH_401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access denied") {
    super(message, HTTP_STATUS.FORBIDDEN_403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, HTTP_STATUS.NOT_FOUND_404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Conflict") {
    super(message, HTTP_STATUS.CONFLICT_409);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Something went wrong") {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR_500);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message: string = "Unprocessable entity") {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY_422);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = "Too many requests") {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS_429);
  }
}

export class NotImplementedError extends AppError {
  constructor(message: string = "Not implemented") {
    super(message, HTTP_STATUS.NOT_IMPLEMENTED_501);
  }
}

export class BadGatewayError extends AppError {
  constructor(message: string = "Bad gateway") {
    super(message, HTTP_STATUS.BAD_GATEWAY_502);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = "Service unavailable") {
    super(message, HTTP_STATUS.SERVICE_UNAVAILABLE_503);
  }
}

export class GatewayTimeoutError extends AppError {
  constructor(message: string = "Gateway timeout") {
    super(message, HTTP_STATUS.GATEWAY_TIMEOUT_504);
  }
}

/**
 -- Example --
 
 if (!voucher) {
  throw new NotFoundError("Voucher not found");
} 
 
 */
