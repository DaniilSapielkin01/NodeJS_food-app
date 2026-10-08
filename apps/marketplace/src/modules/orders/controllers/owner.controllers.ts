import { Request, Response } from "express";

import { HTTP_STATUS } from "@utils/constants/statuses";

import { ordersRepository } from "../orders.repository";

// OWNER
export const getStoreOrdersController = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const storeId = req.params.storeId as string;
  const orders = await ordersRepository.findOrdersByOwner(userId, storeId);

  return res.status(HTTP_STATUS.OK_200).json(orders);
};

export const acceptOrderController = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const orderId = req.params.id as string;

  const order = await ordersRepository.acceptOrder(userId, orderId);

  return res.status(HTTP_STATUS.OK_200).json(order);
};

export const rejectOrderController = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const orderId = req.params.id as string;

  const order = await ordersRepository.rejectOrder(userId, orderId);

  // TODO - need return money paypament on deposite customer
  return res.status(HTTP_STATUS.OK_200).json(order);
};

export const markOrderReadyController = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const orderId = req.params.id as string;

  const order = await ordersRepository.orderReady(userId, orderId);

  return res.status(HTTP_STATUS.OK_200).json(order);
};
