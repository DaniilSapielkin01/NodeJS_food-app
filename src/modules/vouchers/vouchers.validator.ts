import { body } from "express-validator";

import { EVoucherCategory } from "@generated/prisma/enums";
import { withValidation } from "@utils/validators/widthValidation";

export const createVoucherValidator = () =>
  withValidation([
    body("name").trim().notEmpty().withMessage("name is required"),
    body("category").toUpperCase().isIn(Object.values(EVoucherCategory)),

    body("image").optional().trim().notEmpty().withMessage("image is required"),
    body("name").trim().notEmpty().withMessage("Name is required"),
  ]);

export const updateVoucherValidator = () =>
  withValidation([
    body("name").optional().trim().notEmpty(),
    body("category")
      .optional()
      .toUpperCase()
      .isIn(Object.values(EVoucherCategory)),

    body("image").optional().trim(),

    body("description").optional().trim(),
  ]);
