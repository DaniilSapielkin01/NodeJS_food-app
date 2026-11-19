import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

import { UnauthorizedError } from "@packages/errors";

import { config } from "../config";

export const serviceAuth: RequestHandler = (req, _res, next) => {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) throw new UnauthorizedError("Unauthorized");

  try {
    const payload = jwt.verify(token, config.serviceJwt.publicKey, {
      algorithms: ["ES256"],
      issuer: config.serviceJwt.issuer,
      audience: config.serviceJwt.audience,
      maxAge: "2m",
      clockTolerance: 5,
    });
    if (typeof payload === "string") throw new Error("bad payload");
  } catch {
    throw new UnauthorizedError("Unauthorized");
  }

  next();
};
