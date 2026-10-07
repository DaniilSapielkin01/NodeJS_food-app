import { NextFunction, Request, Response } from "express";

import { AppError } from "@errors";
import { HTTP_STATUS } from "@utils/constants/statuses";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  req.log.error({ err }, "Unhandled error");

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR_500).json({
    error: "Something went wrong",
  });
};
