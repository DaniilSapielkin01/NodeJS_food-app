import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "@database";
import { ForbiddenError, UnauthorizedError } from "@errors";
import { ERole } from "@generated/prisma/enums";

export const authMiddleware = async (
  req: Request,
  _res: Response,
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

  let payload: { userId: string };

  try {
    payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as {
      userId: string;
    };
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }

  // !!! Check role in DB before next steps
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, roles: true },
  });

  if (!user) {
    throw new UnauthorizedError("User no longer exists");
  }

  req.user = { userId: user.id, roles: user.roles };
  next();
};

export const requireRoleMiddleware =
  (...roles: ERole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const hasRole = roles.some((role) => req.user!.roles.includes(role));

    if (!hasRole) {
      throw new ForbiddenError("Access denied");
    }

    next();
  };
