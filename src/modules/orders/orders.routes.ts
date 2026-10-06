import { Router } from "express";

import { ERole } from "@generated/prisma/enums";
import {
  authMiddleware,
  requireRoleMiddleware,
} from "@middlewares/auth.middlewares";
import { paramsIDValidator } from "@utils/validators/validateParams";

import {
  acceptOrderController,
  cancelOrderController,
  createOrderController,
  deliverOrderController,
  getAvailableOrdersController,
  getCourierOrdersController,
  getMyOrdersController,
  getOrderByIdController,
  getStoreOrdersController,
  markOrderReadyController,
  pickupOrderController,
  rejectOrderController,
  takeOrderController,
} from "./orders.controller";
import { createOrderValidator } from "./orders.validator";

// OWNER
const ownerRouter: Router = Router();
ownerRouter.use(requireRoleMiddleware(ERole.OWNER));

ownerRouter.get(
  "/store/:storeId",
  paramsIDValidator("storeId"),
  getStoreOrdersController,
);
ownerRouter.patch(
  "/:id/accept",
  paramsIDValidator("id"),
  acceptOrderController,
);
ownerRouter.patch(
  "/:id/reject",
  paramsIDValidator("id"),
  rejectOrderController,
);
ownerRouter.patch(
  "/:id/ready",
  paramsIDValidator("id"),
  markOrderReadyController,
);

// COURIER
const courierRouter: Router = Router();
courierRouter.use(requireRoleMiddleware(ERole.COURIER));

courierRouter.get("/available", getAvailableOrdersController);
courierRouter.get("/", getCourierOrdersController);
courierRouter.patch("/:id/take", paramsIDValidator("id"), takeOrderController);
courierRouter.patch(
  "/:id/pickup",
  paramsIDValidator("id"),
  pickupOrderController,
);
courierRouter.patch(
  "/:id/deliver",
  paramsIDValidator("id"),
  deliverOrderController,
);

// CUSTOMER
const customerRouter: Router = Router();
customerRouter.use(requireRoleMiddleware(ERole.CUSTOMER));

customerRouter.post("/", createOrderValidator(), createOrderController);
customerRouter.get("/", getMyOrdersController);
customerRouter.get("/:id", paramsIDValidator("id"), getOrderByIdController);
customerRouter.patch(
  "/:id/cancel",
  paramsIDValidator("id"),
  cancelOrderController,
);

// MAIN
export const ordersRouter: Router = Router();

ordersRouter.use(authMiddleware);
ordersRouter.use("/customer", customerRouter);
ordersRouter.use("/owner", ownerRouter);
ordersRouter.use("/courier", courierRouter);
