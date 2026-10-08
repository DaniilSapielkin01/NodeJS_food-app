import { Request, Response } from "express";

import { ForbiddenError, NotFoundError } from "@packages/errors";

import { userRepository } from "@modules/users/users.repository";
import { HTTP_STATUS } from "@utils/constants/statuses";

import { vouchersRepository } from "./vouchers.repository";

// GET
export const getByIdController = async (req: Request, res: Response) => {
  const voucher = await vouchersRepository.findById(req.params.id as string);

  if (!voucher) {
    throw new NotFoundError("Voucher not found");
  }

  return res.status(HTTP_STATUS.OK_200).json(voucher);
};

export const getListController = async (req: Request, res: Response) => {
  const vouchers = await vouchersRepository.getList();

  return res.status(HTTP_STATUS.OK_200).json(vouchers);
};

// CREATE
export const createVoucherController = async (req: Request, res: Response) => {
  const findOwner = await userRepository.findOwnerByUserId(req.user!.userId);

  if (!findOwner) {
    throw new ForbiddenError("Owner profile not found");
  }

  const voucher = await vouchersRepository.create({
    ...req.body,
    ownerId: findOwner.id,
  });

  return res.status(HTTP_STATUS.CREATED_201).json(voucher);
};

// UPDATE
export const updateVoucherController = async (req: Request, res: Response) => {
  const voucherId = req.params.id as string;
  const owner = await userRepository.findOwnerByUserId(req.user!.userId);

  if (!owner) {
    throw new ForbiddenError("Owner profile not found");
  }

  const updated = await vouchersRepository.update(
    owner.id,
    voucherId,
    req.body,
  );

  return res.status(HTTP_STATUS.OK_200).json(updated);
};

// DELETE
export const deleteVoucherController = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const owner = await userRepository.findOwnerByUserId(req.user!.userId);

  if (!owner) {
    throw new ForbiddenError("Owner profile not found");
  }

  await vouchersRepository.delete(owner.id, id);

  return res.sendStatus(HTTP_STATUS.NO_CONTENT_204);
};
