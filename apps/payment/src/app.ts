import express, { Express } from "express";

import { NotFoundError } from "@packages/errors";
import {
  corsMiddleware,
  errorHandler,
  httpLoggerMiddleware,
} from "@packages/middlewares";

import { healthRouter } from "@modules/health/health.router";

export const app: Express = express();

app.use(corsMiddleware);
app.use(express.json());
app.use(httpLoggerMiddleware);

app.use("/health", healthRouter);

app.use((req, _res, next) =>
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`)),
);
app.use(errorHandler);
