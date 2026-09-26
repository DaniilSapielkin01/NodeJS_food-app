import { body } from "express-validator";

import { withValidation } from "@utils/validators/widthValidation";

export const validateVoucherBody = withValidation([
  body("name")
    .trim()
    .isString()
    .withMessage("Name must be a string")
    .isLength({ min: 1 })
    .withMessage("Name must be at least 1 character"),

  body("productsCount")
    .isInt({ min: 0 })
    .withMessage("ProductsCount must be a non-negative integer"),
]);
