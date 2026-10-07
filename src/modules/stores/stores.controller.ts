import { Request, Response } from "express";

import { HTTP_STATUS } from "@utils/constants/statuses";

import { storesRepository } from "./stores.repository";

// GET
export const getStoresController = async (req: Request, res: Response) => {
  const products = storesRepository.getList();

  return res.status(HTTP_STATUS.OK_200).json(products);
};

export const getStoresByIdController = async (req: Request, res: Response) => {
  const product = await storesRepository.getById(req.params!.id as string);

  return res.status(HTTP_STATUS.OK_200).json(product);
};

export const getStoresMyController = async (req: Request, res: Response) => {
  const product = storesRepository.getMy(req.user!.userId as string);

  return res.status(HTTP_STATUS.OK_200).json(product);
};

// CREATE
export const createStoresController = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const product = storesRepository.create(userId, req.body);

  return res.status(HTTP_STATUS.CREATED_201).json(product);
};

// UPDATE
export const updateStoresController = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const storeId = req.params.id as string;

  const product = storesRepository.update(userId, storeId, req.body);

  return res.status(HTTP_STATUS.OK_200).json(product);
};

// DELETE

export const deleteStoresByIdController = async (
  req: Request,
  res: Response,
) => {
  const userId = req.user!.userId;
  const storeId = req.params.id as string;

  await storesRepository.delete(userId, storeId);

  return res.sendStatus(HTTP_STATUS.NO_CONTENT_204);
};
