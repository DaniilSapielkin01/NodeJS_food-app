import { Request, Response, Router } from "express";

import { HTTP_STATUS } from "@utils/constants/statuses";
import { validateParamsID } from "@utils/validators/validateParams";

import { getVoucherById } from "./vouchers.controller";
import { validateVoucherBody } from "./vouchers.validator";

export const vouchersRouter: Router = Router();

vouchersRouter.get("/", (req: Request, res: Response) => {
  // get vouchers list
  res.status(HTTP_STATUS.OK_200).json({ message: "get vouchers list" });
});

vouchersRouter.get("/:id", validateParamsID("id"), getVoucherById);

vouchersRouter.post("/", validateVoucherBody, (req: Request, res: Response) => {
  // post a new vouchers after get special key for a new vouchers
});

vouchersRouter.put("/:id", (req: Request, res: Response) => {
  // put voucher information item by ID
});

vouchersRouter.delete("/:id", (req: Request, res: Response) => {
  // delete vouchers item by ID
});
