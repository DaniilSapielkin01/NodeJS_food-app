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

// Заказы магазина. Проверить: магазин принадлежит этому овнеру
// (store -> voucher -> ownerId === ownerProfile.id), иначе 403
ownerRouter.get(
  "/store/:storeId",
  paramsIDValidator("storeId"),
  getStoreOrdersController,
);
// Принять заказ. Проверить: заказ из магазина овнера, статус PENDING -> ACCEPTED
ownerRouter.patch(
  "/:id/accept",
  paramsIDValidator("id"),
  acceptOrderController,
);
// Отклонить заказ. Проверить: владение, статус PENDING -> REJECTED. Потом release
ownerRouter.patch(
  "/:id/reject",
  paramsIDValidator("id"),
  rejectOrderController,
);
// Заказ собран. Проверить: владение, статус ACCEPTED -> READY
ownerRouter.patch(
  "/:id/ready",
  paramsIDValidator("id"),
  markOrderReadyController,
);

// COURIER
const courierRouter: Router = Router();
courierRouter.use(requireRoleMiddleware(ERole.COURIER));

// Свободные заказы: статус READY и courierId === null
courierRouter.get("/available", getAvailableOrdersController);
// Все заказы этого курьера (courierId из его CourierProfile), история
courierRouter.get("/", getCourierOrdersController);
// Взять заказ. Проверить: статус READY и courierId === null, затем записать
// courierId, статус READY -> TAKEN. Метод PATCH, не GET
courierRouter.patch("/:id/take", paramsIDValidator("id"), takeOrderController);
// Забрал у магазина. Проверить: заказ его, статус TAKEN -> PICKED_UP
courierRouter.patch(
  "/:id/pickup",
  paramsIDValidator("id"),
  pickupOrderController,
);
// Доставил. Проверить: заказ его, статус PICKED_UP -> DELIVERED. Потом capture
courierRouter.patch(
  "/:id/deliver",
  paramsIDValidator("id"),
  deliverOrderController,
);

// CUSTOMER
const customerRouter: Router = Router();
customerRouter.use(requireRoleMiddleware(ERole.CUSTOMER));

// Создать заказ. Валидатор: storeId, список позиций (productId, quantity).
// Контроллер: проверить товары, посчитать сумму на сервере, создать заказ
// со статусом PENDING, вызвать hold
customerRouter.post("/", createOrderValidator(), createOrderController);
// Мои заказы: where customerId === req.user.userId
customerRouter.get("/", getMyOrdersController);
// Один заказ. Проверить: заказ принадлежит этому юзеру, иначе 403/404
customerRouter.get("/:id", paramsIDValidator("id"), getOrderByIdController);
// Отмена. Проверить: заказ его, отменять можно только PENDING. Потом release
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
