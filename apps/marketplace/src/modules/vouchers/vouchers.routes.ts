import { Router } from "express";

import { requireRoleMiddleware } from "@packages/auth";
import { authGuard } from "@middlewares/authGuard.middleware";
import { paramsIDValidator } from "@packages/validation";

import { ERole } from "@generated/prisma/enums";

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
vouchersRouter.get("/:id", paramsIDValidator("id"), getByIdController);

// Middleware
vouchersRouter.use(authGuard);

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
  paramsIDValidator("id"),
  requireRoleMiddleware(ERole.OWNER),
  updateVoucherValidator(),
  updateVoucherController,
);

// DELETE
vouchersRouter.delete(
  "/:id",
  requireRoleMiddleware(ERole.OWNER),
  paramsIDValidator("id"),
  deleteVoucherController,
);
