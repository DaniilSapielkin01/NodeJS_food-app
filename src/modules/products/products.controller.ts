import { Request, Response } from "express";

import { EVoucherCategory } from "@generated/prisma/enums";
import { HTTP_STATUS } from "@utils/constants/statuses";

import { productsRepository } from "./products.repository";

// GET
export const getProductsListController = async (
  req: Request,
  res: Response,
) => {
  const category = req.query.category as EVoucherCategory | undefined;
  const products = await productsRepository.getList(category);

  return res.status(HTTP_STATUS.OK_200).json(products);
};

export const getProductsByIdController = async (
  req: Request,
  res: Response,
) => {
  const id = req.params.id as string;
  const products = await productsRepository.getById(id);

  return res.status(HTTP_STATUS.OK_200).json(products);
};

export const getMyProductsController = async (req: Request, res: Response) => {
  const products = await productsRepository.getProductsByUserId(
    req.user!.userId,
  );

  return res.status(HTTP_STATUS.OK_200).json(products);
};

// CREATE
export const createProductsController = async (req: Request, res: Response) => {
  const product = await productsRepository.create(req.user!.userId, req.body);

  return res.status(HTTP_STATUS.CREATED_201).json(product);
};

// UPDATE
export const updateProductsController = async (req: Request, res: Response) => {
  const productId = req.params.id as string;

  const product = await productsRepository.update(
    req.user!.userId,
    productId,
    req.body,
  );

  return res.status(HTTP_STATUS.OK_200).json(product);
};

// DELETE
export const deleteProductsController = async (req: Request, res: Response) => {
  const productId = req.params.id as string;

  await productsRepository.delete(req.user!.userId, productId);

  return res.sendStatus(HTTP_STATUS.NO_CONTENT_204);
};

export const deleteProductsAllController = async (
  req: Request,
  res: Response,
) => {
  const { count } = await productsRepository.deleteAll(
    req.user!.userId,
    req.body.productsIds,
  );

  return res.sendStatus(HTTP_STATUS.OK_200).json({ deleted: count });
};
