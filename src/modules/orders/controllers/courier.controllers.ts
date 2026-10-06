import { Request, Response } from "express";

import { BadRequestError, NotFoundError } from "@errors";
import { EOrderStatus, ERole, Prisma } from "@generated/prisma/client";
import { userRepository } from "@modules/users/users.repository";
import { HTTP_STATUS } from "@utils/constants/statuses";

import { ordersRepository } from "../orders.repository";

// COURIER
export const getCourierOrdersController = async (
  req: Request,
  res: Response,
) => {
  const userId = req.user!.userId;
  const orders = await ordersRepository.findByCourierUserId(userId);
  return res.status(HTTP_STATUS.OK_200).json(orders);
};

export const getAvailableOrdersController = async (
  req: Request,
  res: Response,
) => {
  const orders = await ordersRepository.findAvailable();

  return res.status(HTTP_STATUS.OK_200).json(orders);
};

export const takeOrderController = async (req: Request, res: Response) => {
  const user = await userRepository.findById(req.user!.userId, ERole.COURIER);
  const courier = user?.courierProfile;

  if (!courier) {
    throw new NotFoundError("Courier profile not found");
  }

  if (!courier.isVerified || !courier.isOnline) {
    throw new BadRequestError("Courier is not verified or offline");
  }

  const order = await ordersRepository.takeOrder(
    courier.id,
    req.params.id as string,
  );

  return res.status(HTTP_STATUS.OK_200).json(order);
};

export const pickupOrderController = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const orderId = req.params.id as string;

  const order = await ordersRepository.findOrderByCourierUserId(
    userId,
    orderId,
  );

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  if (order.status !== EOrderStatus.TAKEN) {
    throw new BadRequestError("Order is not in TAKEN status");
  }

  const updated = await ordersRepository.pickupOrder(order.id);

  return res.status(HTTP_STATUS.OK_200).json(updated);
};

export const deliverOrderController = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const orderId = req.params.id as string;

  const order = await ordersRepository.findOrderByCourierUserId(
    userId,
    orderId,
  );

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  if (order.status !== EOrderStatus.PICKED_UP) {
    throw new BadRequestError("Order is not in PICKED_UP status");
  }

  // TODO - need add capture/payments
  await ordersRepository.deliverOrder(order.id);

  return res.status(HTTP_STATUS.OK_200).json({ message: "Delivered order" });
};
