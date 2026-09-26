import { ValidationChain } from "express-validator";

import { handleValidationErrors } from "./handleValidationErrors";

export const withValidation = (rules: ValidationChain[]) => [
  ...rules,
  handleValidationErrors,
];
