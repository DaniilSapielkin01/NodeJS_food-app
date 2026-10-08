import { Router } from "express";

import { authMiddleware } from "@middlewares/auth.middlewares";

import {
  loginController,
  logoutController,
  logoutFromAllController,
  refreshController,
  signupController,
} from "./auth.controller";
import {
  validateAuthParams,
  validateRefreshTokenParams,
  validateSignUpParams,
} from "./auth.validator";

export const authRouter: Router = Router();

authRouter.post("/login", validateAuthParams(), loginController);
authRouter.post("/signup", validateSignUpParams(), signupController);
authRouter.post("/refresh", validateRefreshTokenParams(), refreshController);

authRouter.post("/logout", validateRefreshTokenParams(), logoutController);

authRouter.use(authMiddleware);
authRouter.post("/logout-all", logoutFromAllController);
