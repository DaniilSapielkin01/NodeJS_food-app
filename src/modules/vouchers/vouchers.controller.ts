import { Request, Response } from "express";

import { NotFoundError } from "@errors";
import { HTTP_STATUS } from "@utils/constants/statuses";

export const getVoucherById = async (req: Request, res: Response) => {
  const voucher = null;
  // await vouchersRepository.findById(req.params.id);

  if (!voucher) {
    throw new NotFoundError("Voucher not found");
  }

  res.status(HTTP_STATUS.OK_200).json(voucher);
};
