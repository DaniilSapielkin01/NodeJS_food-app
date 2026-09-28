import { randomUUID } from "node:crypto";

import jwt from "jsonwebtoken";

import { ERole } from "@generated/prisma/enums";

export const generateAccessToken = (userId: string, role: ERole) =>
  jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: "15m",
  });

export const generateRefreshToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: "7d",
    jwtid: randomUUID(),
  });
