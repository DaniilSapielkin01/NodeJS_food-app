import { Router } from "express";

import { requireRoleMiddleware } from "@packages/auth";
import { authGuard } from "@middlewares/authGuard.middleware";
import { paramsIDValidator, queryEnumValidator } from "@packages/validation";

import { ERole, EVoucherCategory } from "@generated/prisma/enums";

import {
  createProductsController,
  deleteProductsAllController,
  deleteProductsController,
  getMyProductsController,
  getProductsByIdController,
  getProductsListController,
  updateProductsController,
} from "./products.controller";
import {
  createProductValidator,
  updateProductValidator,
  validateDeleteList,
} from "./products.validator";

export const productsRouter: Router = Router();

// GET
productsRouter.get(
  "/",
  queryEnumValidator("category", EVoucherCategory),
  getProductsListController,
);
productsRouter.get(
  "/my",
  authGuard,
  requireRoleMiddleware(ERole.OWNER),
  getMyProductsController,
);
productsRouter.get("/:id", paramsIDValidator("id"), getProductsByIdController);

// MIDDLEWARE
productsRouter.use(authGuard);

// CREATE
productsRouter.post(
  "/",
  requireRoleMiddleware(ERole.OWNER),
  createProductValidator(),
  createProductsController,
);

// UPDATE
productsRouter.patch(
  "/:id",
  paramsIDValidator("id"),
  requireRoleMiddleware(ERole.OWNER),
  updateProductValidator(),
  updateProductsController,
);

// DELETE
productsRouter.delete(
  "/:id",
  paramsIDValidator("id"),
  requireRoleMiddleware(ERole.OWNER),
  deleteProductsController,
);

// DELETE FROM ALL
productsRouter.delete(
  "/",
  validateDeleteList(),
  requireRoleMiddleware(ERole.OWNER),
  deleteProductsAllController,
);
