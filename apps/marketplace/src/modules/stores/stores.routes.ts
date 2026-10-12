import { Router } from "express";

import { requireRoleMiddleware } from "@packages/auth";
import { authGuard } from "@middlewares/authGuard.middleware";
import { paramsIDValidator } from "@packages/validation";

import { ERole } from "@generated/prisma/enums";

import {
  createStoresController,
  deleteStoresByIdController,
  getStoresByIdController,
  getStoresController,
  getStoresMyController,
  updateStoresController,
} from "./stores.controller";
import { createStoreValidator, updateStoreValidator } from "./stores.validator";

export const storesRouter: Router = Router();

storesRouter.get("/", getStoresController);
storesRouter.get(
  "/my",
  authGuard,
  requireRoleMiddleware(ERole.OWNER),
  getStoresMyController,
);
storesRouter.get("/:id", getStoresByIdController);

// AUTH
storesRouter.use(authGuard);
//
storesRouter.post(
  "/",
  requireRoleMiddleware(ERole.OWNER),
  createStoreValidator(),
  createStoresController,
);
storesRouter.patch(
  "/:id",
  paramsIDValidator("id"),
  updateStoreValidator(),
  requireRoleMiddleware(ERole.OWNER),
  updateStoresController,
);

storesRouter.delete(
  "/:id",
  paramsIDValidator("id"),
  requireRoleMiddleware(ERole.OWNER),
  deleteStoresByIdController,
);
