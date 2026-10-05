import { Request, Response } from "express";

import { HTTP_STATUS } from "@utils/constants/statuses";

import { ordersRepository } from "./orders.repository";

// OWNER
export const getStoreOrdersController = async (
  req: Request,
  res: Response,
) => {};
export const acceptOrderController = async (req: Request, res: Response) => {};
export const rejectOrderController = async (req: Request, res: Response) => {};
export const markOrderReadyController = async (
  req: Request,
  res: Response,
) => {};

// COURIER
export const getCourierOrdersController = async (
  req: Request,
  res: Response,
) => {};

export const getAvailableOrdersController = async (
  req: Request,
  res: Response,
) => {};

export const pickupOrderController = async (req: Request, res: Response) => {};
export const deliverOrderController = async (req: Request, res: Response) => {};
export const takeOrderController = async (req: Request, res: Response) => {};

// CUSTOMER
export const createOrderController = async (req: Request, res: Response) => {
  const order = await ordersRepository.create(req.user!.userId, req.body);

  return res.status(HTTP_STATUS.CREATED_201).json(order);
};

export const getMyOrdersController = async (req: Request, res: Response) => {};

export const getOrderByIdController = async (req: Request, res: Response) => {};

export const cancelOrderController = async (req: Request, res: Response) => {};
