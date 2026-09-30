import { body, query } from "express-validator";

import { ERole, EVehicleType } from "@generated/prisma/enums";
import { withValidation } from "@utils/validators/widthValidation";

//
export const userRoleValidator = () =>
  withValidation([
    query("role")
      .optional()
      .toUpperCase()
      .isIn([ERole.OWNER, ERole.COURIER])
      .withMessage("Role must be required"),
  ]);

// DELETE
export const deleteUserRoleValidator = () =>
  withValidation([
    query("role")
      .toUpperCase()
      .isIn([ERole.OWNER, ERole.COURIER])
      .withMessage("Role must be required"),
  ]);

// ADD
export const addRoleValidator = () =>
  withValidation([
    body("role")
      .toUpperCase()
      .isIn([ERole.OWNER, ERole.COURIER])
      .withMessage("Role must be required"),

    body("companyName")
      .if(body("role").equals(ERole.OWNER))
      .trim()
      .notEmpty()
      .withMessage("companyName is required"),

    body("taxId")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("taxId must not be empty"),

    // Required only for COURIER: must be a non-empty array
    body("vehicleType")
      .if(body("role").equals(ERole.COURIER))
      .isArray({ min: 1 })
      .withMessage("vehicleType must be a non-empty array"),

    // Every array element must be a valid EVehicleType value
    body("vehicleType.*")
      .isIn(Object.values(EVehicleType))
      .withMessage("vehicleType is invalid"),

    body("licenseNumber")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("licenseNumber must not be empty"),

    body("phone").trim().notEmpty().withMessage("Phone is required"),
  ]);

// UPDATE
export const updateUserValidator = () =>
  withValidation([
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("name must not be empty"),
  ]);

export const updateOwnerValidator = () =>
  withValidation([
    body("companyName")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("companyName must not be empty"),

    body("phone")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("phone must not be empty"),

    body("taxId")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("taxId must not be empty"),
  ]);

export const updateCourierValidator = () =>
  withValidation([
    body("vehicleType")
      .optional()
      .isArray({ min: 1 })
      .withMessage("vehicleType must be a non-empty array"),

    body("vehicleType.*")
      .isIn(Object.values(EVehicleType))
      .withMessage("vehicleType is invalid"),

    body("phone")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("phone must not be empty"),

    body("licenseNumber")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("licenseNumber must not be empty"),
  ]);
