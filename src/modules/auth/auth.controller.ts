import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { BadRequestError, UnauthorizedError } from "@errors";
import { issueTokens } from "@utils/auth/auth.utils";
import { HTTP_STATUS } from "@utils/constants/statuses";

import { authRepository } from "./auth.repository";

export const loginController = async (req: Request, res: Response) => {
  const body = req.body;
  const user = await authRepository.login(body);

  if (!user) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(body.password, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const tokens = await issueTokens(user.id);

  return res.status(HTTP_STATUS.OK_200).json(tokens);
};

export const signupController = async (req: Request, res: Response) => {
  const body = req.body;

  const hashPassword = await bcrypt.hash(body.password, 10);

  const newUser = await authRepository.signup({
    ...body,
    password: hashPassword,
  });

  const tokens = await issueTokens(newUser.id);

  return res.status(HTTP_STATUS.CREATED_201).json({
    ...tokens,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    },
  });
};

export const refreshController = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken: string };

  let payload: { userId: string };
  try {
    payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string,
    ) as { userId: string };
  } catch {
    throw new UnauthorizedError("Invalid refresh token");
  }

  const consumed = await authRepository.consumeRefreshToken(refreshToken);

  if (!consumed) {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const tokens = await issueTokens(payload.userId);

  return res.status(HTTP_STATUS.OK_200).json(tokens);
};

export const logoutController = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken: string };

  if (!refreshToken) {
    throw new UnauthorizedError("Refresh token is missing");
  }

  await authRepository.logout(refreshToken);

  return res.sendStatus(HTTP_STATUS.NO_CONTENT_204);
};

export const logoutFromAllController = async (req: Request, res: Response) => {
  await authRepository.logoutAll(req.user!.userId);

  return res.sendStatus(HTTP_STATUS.NO_CONTENT_204);
};
