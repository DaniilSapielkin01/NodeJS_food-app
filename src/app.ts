import express, { Express } from "express";

import { corsMiddleware } from "@middlewares/cors";
import { vouchersRouter } from "@modules/vouchers/vouchers.routes";
import { HTTP_STATUS } from "@utils/constants/statuses";

export const app: Express = express();

app.use(corsMiddleware);
app.use(express.json());

app.use("/vouchers", vouchersRouter);
app.use("/products", () => {});

app.use("/", (req, res) => {
  res.status(HTTP_STATUS.OK_200).json({ message: "Main page" });
});
