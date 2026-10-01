import { Request, Response } from "express";

import { BadRequestError, ForbiddenError, NotFoundError } from "@errors";
import { EVoucherCategory } from "@generated/prisma/enums";
import { userRepository } from "@modules/users/users.repository";
import { HTTP_STATUS } from "@utils/constants/statuses";

import { productsRepository } from "./products.repository";

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

export const createProductsController = async (req: Request, res: Response) => {
  const owner = await userRepository.findOwnerByUserId(req.user!.userId);

  if (!owner) {
    throw new ForbiddenError("Owner profile not found");
  }

  const product = await productsRepository.create(owner.id, req.body);

  return res.status(HTTP_STATUS.CREATED_201).json(product);
};

export const updateProductsController = async (req: Request, res: Response) => {
  const productId = req.params.id as string;
  const owner = await userRepository.findOwnerByUserId(req.user!.userId);

  if (!owner) {
    throw new ForbiddenError("Owner profile not found");
  }

  const product = await productsRepository.update(
    owner.id,
    productId,
    req.body,
  );

  return res.status(HTTP_STATUS.OK_200).json(product);
};
