import { Router } from "express";

import { authMiddleware } from "@middlewares/auth.middlewares";

import {
  addRoleController,
  deleteUserController,
  getUserController,
} from "./users.controller";
import { addRoleValidator, userRoleValidator } from "./users.validator";

export const userRouter: Router = Router();

userRouter.use(authMiddleware);

userRouter.get("/me", userRoleValidator(), getUserController);
userRouter.post("/roles/:role", addRoleValidator(), addRoleController);

userRouter.delete("/me", deleteUserController);
