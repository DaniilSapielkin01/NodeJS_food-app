import { param, query } from "express-validator";

import { withValidation } from "./widthValidation";

export const paramsIDValidator = (paramName: string = "id") =>
  withValidation([
    param(paramName)
      .trim()
      .isUUID()
      .withMessage(`${paramName} must be a valid UUID`)
      .isLength({ min: 1 })
      .withMessage(`${paramName} must be at least 1 character`),
  ]);

export const queryEnumValidator = (
  field: string,
  enumObject: Record<string, string>,
) =>
  withValidation([
    query(field)
      .optional()
      .toUpperCase()
      .isIn(Object.values(enumObject))
      .withMessage(
        `${field} must be one of: ${Object.values(enumObject).join(", ")}`,
      ),
  ]);
