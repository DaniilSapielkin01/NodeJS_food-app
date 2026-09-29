import { body, query } from "express-validator";

import { ERole, EVehicleType } from "@generated/prisma/enums";
import { withValidation } from "@utils/validators/widthValidation";

export const userRoleValidator = () =>
  withValidation([
    query("role")
      .optional()
      .isIn([Object.values(ERole)]),
  ]);

export const addRoleValidator = () =>
  withValidation([
    body("role")
      .isIn([ERole.OWNER, ERole.COURIER])
      .withMessage("Role must be OWNER or COURIER"),

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
