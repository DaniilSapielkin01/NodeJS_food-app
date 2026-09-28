import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { BadRequestError, UnauthorizedError } from "@errors";
import { ERole } from "@generated/prisma/enums";
import { IBodyLogin, IBodySignup } from "@src/types/auth.types";
import { generateAccessToken, generateRefreshToken } from "@utils/auth.utils";
import { HTTP_STATUS } from "@utils/constants/statuses";

import { authRepository } from "./auth.repository";

const issueTokens = async (userId: string, role: ERole) => {
  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken(userId);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await authRepository.saveRefreshToken({
    userId,
    token: refreshToken,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

export const loginController = async (req: Request, res: Response) => {
  const body = req.body as IBodyLogin;
  const user = await authRepository.login(body);

  if (!user) {
    throw new BadRequestError("User not found");
  }

  const isPasswordValid = await bcrypt.compare(body.password, user.password);

  if (!isPasswordValid) {
    throw new BadRequestError("Invalid password");
  }

  const tokens = await issueTokens(user.id, user.role);

  return res.status(HTTP_STATUS.OK_200).json({ tokens });
};

export const signupController = async (req: Request, res: Response) => {
  const body = req.body as IBodySignup;

  const hashPassword = await bcrypt.hash(body.password, 10);

  const newUser = await authRepository.signup({
    ...body,
    password: hashPassword,
  });

  const tokens = await issueTokens(newUser.id, newUser.role);

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

  const stored = await authRepository.findRefreshToken(refreshToken);

  if (!stored) {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  await authRepository.deleteRefreshToken(refreshToken);
  const tokens = await issueTokens(stored.user.id, stored.user.role);

  return res.status(HTTP_STATUS.OK_200).json({ tokens });
};

export const deleteController = async (req: Request, res: Response) => {
  await authRepository.delete(req.user!.userId);
  return res.sendStatus(HTTP_STATUS.OK_200);
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
