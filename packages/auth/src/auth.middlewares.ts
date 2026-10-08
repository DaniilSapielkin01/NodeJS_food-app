import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { ForbiddenError, UnauthorizedError } from "@packages/errors";

export type AuthUser = { userId: string; roles: string[] };
export type LoadUser = (userId: string) => Promise<AuthUser | null>;

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const createAuthMiddleware =
  (loadUser: LoadUser) =>
  async (req: Request, _res: Response, next: NextFunction) => {
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

    const user = await loadUser(payload.userId);

    if (!user) {
      throw new UnauthorizedError("User no longer exists");
    }

    req.user = user;
    next();
  };

export const requireRoleMiddleware =
  (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const hasRole = roles.some((role) => req.user!.roles.includes(role));

    if (!hasRole) {
      throw new ForbiddenError("Access denied");
    }

    next();
  };
