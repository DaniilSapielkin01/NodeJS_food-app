import { NextFunction, Request, Response } from "express";
import { matchedData, ValidationChain } from "express-validator";

import { handleValidationErrors } from "./handleValidationErrors";

const keepOnlyValidated = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  req.body = matchedData(req, { locations: ["body"] });
  next();
};

export const withValidation = (rules: ValidationChain[]) => [
  ...rules,
  handleValidationErrors,
  keepOnlyValidated,
];
