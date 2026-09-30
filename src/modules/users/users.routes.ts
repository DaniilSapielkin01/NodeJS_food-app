import { Router } from "express";

import { ERole } from "@generated/prisma/enums";
import {
  authMiddleware,
  requireRoleMiddleware,
} from "@middlewares/auth.middlewares";

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

userRouter.use(authMiddleware);

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
