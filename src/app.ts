import express, { Express } from "express";

import { NotFoundError } from "@errors";
import { corsMiddleware } from "@middlewares/cors.middlewares";
import { errorHandler } from "@middlewares/errorHandler.middlewares";
import { authRouter } from "@modules/auth/auth.routes";
import { vouchersRouter } from "@modules/vouchers/vouchers.routes";

export const app: Express = express();

app.use(corsMiddleware);
app.use(express.json());

app.use("/auth", authRouter);
app.use("/vouchers", vouchersRouter);

app.use((req, res, next) =>
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`)),
);
app.use(errorHandler);
