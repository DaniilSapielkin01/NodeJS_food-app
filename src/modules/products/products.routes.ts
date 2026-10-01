import { Router } from "express";

import { ERole } from "@generated/prisma/enums";
import {
  authMiddleware,
  requireRoleMiddleware,
} from "@middlewares/auth.middlewares";
import { validateParamsID } from "@utils/validators/validateParams";

import {
  createProductsController,
  getProductsByIdController,
  getProductsListController,
  updateProductsController,
} from "./products.controller";
import {
  createProductValidator,
  getProductsValidator,
  updateProductValidator,
} from "./products.validator";

export const productsRouter: Router = Router();

// GET
productsRouter.get("/", getProductsValidator(), getProductsListController);
productsRouter.get("/:id", validateParamsID("id"), getProductsByIdController);

// MIDDLEWARE
productsRouter.use(authMiddleware);

// CREATE
productsRouter.post(
  "/:id",
  validateParamsID("id"),
  requireRoleMiddleware(ERole.OWNER),
  createProductValidator(),
  createProductsController,
);

// UPDATE
productsRouter.patch(
  "/:id",
  validateParamsID("id"),
  requireRoleMiddleware(ERole.OWNER),
  updateProductValidator(),
  updateProductsController,
);

// DELETE
