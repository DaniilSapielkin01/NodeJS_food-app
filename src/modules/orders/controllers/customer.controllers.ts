import { Request, Response } from "express";

import { BadRequestError, NotFoundError } from "@errors";
import { EOrderStatus, Prisma } from "@generated/prisma/client";
import { storesRepository } from "@modules/stores/stores.repository";
import { HTTP_STATUS } from "@utils/constants/statuses";

import { ordersRepository } from "../orders.repository";

// CUSTOMER
export const createOrderController = async (req: Request, res: Response) => {
  const { storeId, deliveryAddress, items } = req.body as {
    storeId: string;
    deliveryAddress: string;
    items: { productId: string; quantity: number }[];
  };

  const store = await storesRepository.getById(storeId);

  if (!store) {
    throw new NotFoundError("Store not found");
  }

  const ids = items.map((i) => i.productId);
  const products = await ordersRepository.findProducts(ids, storeId);

  // fast lookup of the product by id
  const productById = new Map(products.map((p) => [p.id, p]));

  const missing = ids.filter((id) => !productById.has(id));

  if (missing.length) {
    throw new BadRequestError(
      `Products not found in this store: ${missing.join(", ")}`,
    );
  }

  // safe only after the missing check: every product exists here
  const unavailable = items.filter((i) => {
    const product = productById.get(i.productId)!;
    return !product.inStock || product.count < i.quantity;
  });

  if (unavailable.length) {
    throw new BadRequestError(
      `Products out of stock: ${unavailable.map((i) => i.productId).join(", ")}`,
    );
  }

  const orderItems = items.map((i) => ({
    ...i,
    price: productById.get(i.productId)!.price,
  }));

  const totalAmount = orderItems.reduce(
    (sum, i) => sum.add(new Prisma.Decimal(i.price).mul(i.quantity)),
    new Prisma.Decimal(0),
  );

  const order = await ordersRepository.create(
    {
      storeId,
      deliveryAddress,
      customerId: req.user!.userId,
      totalAmount,
      status: EOrderStatus.PENDING_OWNER,
    },
    orderItems,
  );

  return res.status(HTTP_STATUS.CREATED_201).json(order);
};

export const getMyOrdersController = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const orders = await ordersRepository.findByCustomerId(userId);

  return res.status(HTTP_STATUS.OK_200).json(orders);
};

export const getOrderByIdController = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const orderId = req.params.id as string;

  const order = await ordersRepository.findCustomerOrderById(userId, orderId);

  return res.status(HTTP_STATUS.OK_200).json(order);
};

export const cancelOrderController = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const orderId = req.params.id as string;

  // TODO - ownership and status are checked in the repository where clause
  const order = await ordersRepository.cancel(userId, orderId);

  return res
    .status(HTTP_STATUS.OK_200)
    .json({ message: `Order ${order.id} was canceled` });
};
