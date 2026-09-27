import express, { Express } from "express";

import { NotFoundError } from "@errors";
import { corsMiddleware } from "@middlewares/cors";
import { errorHandler } from "@middlewares/errorHandler";
import { vouchersRouter } from "@modules/vouchers/vouchers.routes";

export const app: Express = express();

app.use(corsMiddleware);
app.use(express.json());

app.use("/vouchers", vouchersRouter);
app.use("/products", () => {});

app.use((req, res, next) =>
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`)),
);
app.use(errorHandler);
