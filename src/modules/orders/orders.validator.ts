import { body } from "express-validator";

import { withValidation } from "@utils/validators/widthValidation";

// OWNER

// COURIER

// CUSTOMET
export const createOrderValidator = () =>
  withValidation([
    body("storeId").isUUID().withMessage("storeId must be a valid UUID"),

    body("deliveryAddress")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("deliveryAddress is required"),

    body("items")
      .isArray({ min: 1 })
      .withMessage("items must be a non-empty array"),

    body("items.*.productId")
      .isUUID()
      .withMessage("productId must be a valid UUID"),

    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("quantity must be an integer, min 1"),
  ]);
