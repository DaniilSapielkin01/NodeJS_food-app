import { body } from "express-validator";

import { withValidation } from "@utils/validators/widthValidation";

export const createStoreValidator = () =>
  withValidation([
    body("voucherId").isUUID().withMessage("voucherId must be a valid UUID"),

    body("name").isString().trim().notEmpty().withMessage("name is required"),

    body("address")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("address is required"),

    body("description").optional().isString().trim().notEmpty(),

    body("image")
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage("image is required"),
  ]);

export const updateStoreValidator = () =>
  withValidation([
    body("name")
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage("name must not be empty"),

    body("image")
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage("image must not be empty"),

    body("description").optional().isString().trim().notEmpty(),

    body("address")
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage("address is required"),
  ]);
