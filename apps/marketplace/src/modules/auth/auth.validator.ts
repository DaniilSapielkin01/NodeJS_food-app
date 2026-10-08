import { body } from "express-validator";

import { withValidation } from "@utils/validators/widthValidation";

export const validateAuthParams = () =>
  withValidation([
    body("email")
      .trim()
      .toLowerCase()
      .isEmail()
      .withMessage(`Email must be valid email`),

    body("password").isString().notEmpty().withMessage("Password is required"),
  ]);

export const validateSignUpParams = () =>
  withValidation([
    body("email")
      .trim()
      .toLowerCase()
      .isEmail()
      .withMessage("Email must be valid email"),

    body("password")
      .trim()
      .isLength({ min: 6, max: 64 })
      .withMessage("Password must be between 6 and 64 characters"),

    body("name").trim().notEmpty().withMessage("Name is required"),
  ]);

export const validateRefreshTokenParams = () =>
  withValidation([
    body("refreshToken")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("refreshToken is required"),
  ]);
