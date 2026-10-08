import { prisma } from "@database";
import { EOrderStatus } from "@generated/prisma/enums";
import {
  OrderItemUncheckedCreateWithoutOrderInput,
  OrderUncheckedCreateInput,
} from "@generated/prisma/models";

export const ordersRepository = {
  // CREATE
  create(
    dataOrder: OrderUncheckedCreateInput,
    orderItems: OrderItemUncheckedCreateWithoutOrderInput[],
  ) {
    return prisma.order.create({
      data: {
        ...dataOrder,
        items: { create: orderItems },
      },
      include: { items: true },
    });
  },

  // FIND: common
  findProducts(ids: string[], storeId: string) {
    return prisma.product.findMany({
      where: {
        id: { in: ids },
        stores: { some: { id: storeId } },
      },
    });
  },

  // FIND: owner
  findOrdersByOwner(userId: string, storeId: string) {
    return prisma.order.findMany({
      where: {
        storeId,
        store: { voucher: { owner: { userId } } },
        status: { not: EOrderStatus.PENDING_PAYMENT },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  // FIND: customer
  findByCustomerId(customerId: string) {
    return prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
    });
  },

  findCustomerOrderById(customerId: string, id: string) {
    return prisma.order.findFirstOrThrow({
      where: { id, customerId },
    });
  },

  // FIND: courier
  // Available orders: status READY and no courier assigned yet
  findAvailable() {
    return prisma.order.findMany({
      where: {
        status: EOrderStatus.READY,
        courierId: null,
      },
      orderBy: { createdAt: "asc" },
    });
  },

  // Orders of the current courier, linked via CourierProfile.userId
  findByCourierUserId(userId: string) {
    return prisma.order.findMany({
      where: { courier: { userId } },
      orderBy: { createdAt: "desc" },
    });
  },

  // Ownership check: the order belongs to this courier (join through CourierProfile)
  findOrderByCourierUserId(userId: string, orderId: string) {
    return prisma.order.findFirst({
      where: { id: orderId, courier: { userId } },
    });
  },

  // UPDATE: common
  updateStatus(id: string, status: EOrderStatus) {
    return prisma.order.update({ where: { id }, data: { status } });
  },

  // UPDATE: customer
  // Cancel is allowed only before the owner accepts, otherwise P2025 -> 404
  cancel(customerId: string, id: string) {
    return prisma.order.update({
      where: {
        id,
        customerId,
        status: {
          in: [EOrderStatus.PENDING_PAYMENT, EOrderStatus.PENDING_OWNER],
        },
      },
      data: { status: EOrderStatus.CANCELLED },
    });
  },

  // UPDATE: courier (in lifecycle order)
  // The where conditions prevent a race: only the first courier can take the order
  takeOrder(courierId: string, orderId: string) {
    return prisma.order.update({
      where: {
        id: orderId,
        status: EOrderStatus.READY,
        courierId: null,
      },
      data: {
        courierId,
        status: EOrderStatus.TAKEN,
      },
    });
  },

  deliverOrder(orderId: string) {
    return prisma.order.update({
      where: { id: orderId, status: EOrderStatus.PICKED_UP },
      data: { status: EOrderStatus.DELIVERED },
    });
  },

  pickupOrder(orderId: string) {
    return prisma.order.update({
      where: { id: orderId, status: EOrderStatus.TAKEN },
      data: { status: EOrderStatus.PICKED_UP },
    });
  },

  // OWNER
  // Ownership and status are checked in where, otherwise P2025 -> 404
  acceptOrder(userId: string, orderId: string) {
    return prisma.order.update({
      where: {
        id: orderId,
        status: EOrderStatus.PENDING_OWNER,
        store: { voucher: { owner: { userId } } },
      },
      data: { status: EOrderStatus.ACCEPTED },
    });
  },

  rejectOrder(userId: string, orderId: string) {
    return prisma.order.update({
      where: {
        id: orderId,
        status: { in: [EOrderStatus.PENDING_OWNER, EOrderStatus.ACCEPTED] },
        store: { voucher: { owner: { userId } } },
      },
      data: { status: EOrderStatus.REJECTED },
    });
  },

  orderReady(userId: string, orderId: string) {
    return prisma.order.update({
      where: {
        id: orderId,
        status: EOrderStatus.ACCEPTED,
        store: { voucher: { owner: { userId } } },
      },
      data: { status: EOrderStatus.READY },
    });
  },
};
