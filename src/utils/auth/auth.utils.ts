import { randomUUID } from "node:crypto";

import jwt from "jsonwebtoken";

import { ERole } from "@generated/prisma/enums";
import { authRepository } from "@modules/auth/auth.repository";

export const generateAccessToken = (userId: string, roles: ERole[]) =>
  jwt.sign({ userId, roles }, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: "15m",
  });

export const generateRefreshToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: "7d",
    jwtid: randomUUID(),
  });

export const issueTokens = async (userId: string, roles: ERole[]) => {
  const accessToken = generateAccessToken(userId, roles);
  const refreshToken = generateRefreshToken(userId);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await authRepository.saveRefreshToken({
    userId,
    token: refreshToken,
    expiresAt,
  });

  return { accessToken, refreshToken };
};
