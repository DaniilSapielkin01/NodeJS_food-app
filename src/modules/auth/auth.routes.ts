import { Router } from "express";

import { authMiddleware } from "@middlewares/auth.middlewares";

import {
  deleteController,
  loginController,
  logoutController,
  logoutFromAllController,
  refreshController,
  signupController,
} from "./auth.controller";
import {
  validateAuthParams,
  validateLogoutParams,
  validateRefreshParams,
  validateSignUpParams,
} from "./auth.validator";

export const authRouter = Router();

authRouter.post("/login", validateAuthParams(), loginController);
authRouter.post("/signup", validateSignUpParams(), signupController);
authRouter.post("/refresh", validateRefreshParams(), refreshController);

authRouter.post("/logout", validateLogoutParams(), logoutController);

authRouter.use(authMiddleware);
authRouter.post("/logout-all", logoutFromAllController);
authRouter.post("/delete", deleteController);
