import { body, query } from "express-validator";

import { EVoucherCategory } from "@generated/prisma/enums";
import { withValidation } from "@utils/validators/widthValidation";

export const getProductsValidator = () =>
  withValidation([
    query("category")
      .optional()
      .toUpperCase()
      .isIn(Object.values(EVoucherCategory)),
  ]);

// CREATE
export const createProductValidator = () =>
  withValidation([
    body("voucherId").isUUID().withMessage("voucherId must be a valid UUID"),
    body("name").trim().notEmpty().withMessage("name is required"),

    body("image").optional().trim().notEmpty().withMessage("image is required"),

    body("description").isString().trim(),

    body("price")
      .trim()
      .isFloat({ min: 0 })
      .withMessage("price must be a number >= 0"),

    body("discount")
      .optional()
      .trim()
      .isFloat({ min: 0 })
      .withMessage("discount must be a number >= 0"),

    body("inStock")
      .optional()
      .isBoolean()
      .withMessage("inStock must be boolean")
      .toBoolean(),

    body("count")
      .isInt({ min: 0 })
      .withMessage("count must be an integer >= 0")
      .toInt(),
  ]);

// UPDATE
export const updateProductValidator = () =>
  withValidation([
    body("voucherId").isUUID().withMessage("voucherId must be a valid UUID"),

    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("name must not be empty"),

    body("image")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("image must not be empty"),

    body("description").optional().isString().trim(),

    body("price")
      .optional()
      .trim()
      .isFloat({ min: 0 })
      .withMessage("price must be a number >= 0"),

    body("discount")
      .optional()
      .trim()
      .isFloat({ min: 0 })
      .withMessage("discount must be a number >= 0"),

    body("inStock")
      .optional()
      .isBoolean()
      .withMessage("inStock must be boolean")
      .toBoolean(),

    body("count")
      .optional()
      .isInt({ min: 0 })
      .withMessage("count must be an integer >= 0")
      .toInt(),
  ]);
