import { UUID } from "crypto";
import { Request, Response } from "express";

import { NotFoundError } from "@errors";
import { HTTP_STATUS } from "@utils/constants/statuses";

import { vouchersRepository } from "./vouchers.repository";

export const getVoucherById = async (req: Request, res: Response) => {
  const voucher = await vouchersRepository.findById(req.params.id as UUID);

  if (!voucher) {
    throw new NotFoundError("Voucher not found");
  }

  return res.status(HTTP_STATUS.OK_200).json(voucher);
};
