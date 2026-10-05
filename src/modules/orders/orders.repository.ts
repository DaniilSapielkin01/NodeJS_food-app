import { prisma } from "@database";
import { EOrderStatus } from "@generated/prisma/enums";
import { OrderCreateWithoutItemsInput } from "@generated/prisma/models";

export const ordersRepository = {
  async create(data: OrderCreateWithoutItemsInput) {},
};
