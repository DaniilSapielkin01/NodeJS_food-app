import { Router } from "express";

import { ERole } from "@generated/prisma/enums";
import {
  authMiddleware,
  requireRoleMiddleware,
} from "@middlewares/auth.middlewares";
import { paramsIDValidator } from "@utils/validators/validateParams";

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
  authMiddleware,
  requireRoleMiddleware(ERole.OWNER),
  getStoresMyController,
);
storesRouter.get("/:id", getStoresByIdController);

// AUTH
storesRouter.use(authMiddleware);
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
