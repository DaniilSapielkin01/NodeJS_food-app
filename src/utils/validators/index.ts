import { param } from "express-validator";

import { withValidation } from "./widthValidation";

export const validateParamsID = (paramName: string = "id") =>
  withValidation([
    param(paramName)
      .trim()
      .isString()
      .withMessage(`${paramName} must be a string`)
      .isLength({ min: 1 })
      .withMessage(`${paramName} must be at least 1 character`),
  ]);
