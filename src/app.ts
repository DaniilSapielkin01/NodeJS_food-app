import express, { Express } from "express";

import { NotFoundError } from "@errors";
import { corsMiddleware } from "@middlewares/cors.middlewares";
import { errorHandler } from "@middlewares/errorHandler.middlewares";
import { httpLoggerMiddleware } from "@middlewares/httpLogger.middlewares";
import { authRouter } from "@modules/auth/auth.routes";
import { ordersRouter } from "@modules/orders/orders.routes";
import { productsRouter } from "@modules/products/products.routes";
import { storesRouter } from "@modules/stores/stores.routes";
import { userRouter } from "@modules/users/users.routes";
import { vouchersRouter } from "@modules/vouchers/vouchers.routes";

export const app: Express = express();

app.use(corsMiddleware);
app.use(express.json());
app.use(httpLoggerMiddleware);

app.use("/auth", authRouter);
app.use("/users", userRouter);

app.use("/vouchers", vouchersRouter);
app.use("/stores", storesRouter);
app.use("/products", productsRouter);
app.use("/orders", ordersRouter);

app.use((req, res, next) =>
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`)),
);
app.use(errorHandler);
