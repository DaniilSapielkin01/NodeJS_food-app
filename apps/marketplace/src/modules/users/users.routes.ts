import { Router } from "express";

import { requireRoleMiddleware } from "@packages/auth";
import { authGuard } from "@middlewares/authGuard.middleware";

import { ERole } from "@generated/prisma/enums";

import {
  addRoleController,
  deleteRoleController,
  deleteUserController,
  getUserController,
  updateCourierController,
  updateOwnerController,
  updateUserController,
} from "./users.controller";
import {
  addRoleValidator,
  deleteUserRoleValidator,
  updateCourierValidator,
  updateOwnerValidator,
  updateUserValidator,
  userRoleValidator,
} from "./users.validator";

export const userRouter: Router = Router();

userRouter.use(authGuard);

userRouter.get("/me", userRoleValidator(), getUserController);

userRouter.patch("/me", updateUserValidator(), updateUserController);
userRouter.patch(
  "/owner",
  requireRoleMiddleware(ERole.OWNER),
  updateOwnerValidator(),
  updateOwnerController,
);
userRouter.patch(
  "/courier",
  requireRoleMiddleware(ERole.COURIER),
  updateCourierValidator(),
  updateCourierController,
);

// userRouter.patch("/me/email", updateEmailValidator(), updateEmailController);
// userRouter.patch("/me/password", updatePasswordValidator(), updatePasswordController);

userRouter.post("/roles", addRoleValidator(), addRoleController);
userRouter.delete("/roles", deleteUserRoleValidator(), deleteRoleController);

userRouter.delete("/me", deleteUserController);
