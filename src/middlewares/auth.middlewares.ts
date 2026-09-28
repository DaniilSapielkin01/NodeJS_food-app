import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { UnauthorizedError } from "@errors";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Authorization token is missing");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new UnauthorizedError("Authorization token is missing");
  }

  let userId: string;

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string,
    ) as {
      userId: string;
    };
    userId = payload.userId;
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }

  req.user = { userId };
  next();
};
