import { HTTP_STATUS } from "@packages/constants";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => err.msg);
    return res.status(HTTP_STATUS.BAD_REQUEST_400).json({ errors: messages });
  }

  next();
};
