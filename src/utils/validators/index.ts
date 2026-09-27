import { param } from "express-validator";

import { withValidation } from "./widthValidation";

export const validateParamsID = (paramName: string = "id") =>
  withValidation([
    param(paramName)
      .trim()
      .isUUID()
      .withMessage(`${paramName} must be a valid UUID`)
      .isLength({ min: 1 })
      .withMessage(`${paramName} must be at least 1 character`),
  ]);
