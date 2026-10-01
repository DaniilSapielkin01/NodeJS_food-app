import { Request, Response, Router } from "express";

import { ERole } from "@generated/prisma/enums";
import {
  authMiddleware,
  requireRoleMiddleware,
} from "@middlewares/auth.middlewares";
import { validateParamsID } from "@utils/validators/validateParams";

import {
  createVoucherController,
  deleteVoucherController,
  getByIdController,
  getListController,
  updateVoucherController,
} from "./vouchers.controller";
import {
  createVoucherValidator,
  updateVoucherValidator,
} from "./vouchers.validator";

export const vouchersRouter: Router = Router();

// GET
vouchersRouter.get("/list", getListController);
vouchersRouter.get("/:id", validateParamsID("id"), getByIdController);

// Middleware
vouchersRouter.use(authMiddleware);

// CREATE
vouchersRouter.post(
  "/",
  requireRoleMiddleware(ERole.OWNER),
  createVoucherValidator(),
  createVoucherController,
);

// UPDATE
vouchersRouter.patch(
  "/:id",
  validateParamsID("id"),
  requireRoleMiddleware(ERole.OWNER),
  updateVoucherValidator(),
  updateVoucherController,
);

// DELETE
vouchersRouter.delete(
  "/:id",
  requireRoleMiddleware(ERole.OWNER),
  validateParamsID("id"),
  deleteVoucherController,
);
