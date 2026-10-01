import { create } from "node:domain";

import { prisma } from "@database";
import { EVoucherCategory } from "@generated/prisma/enums";
import {
  ProductCreateInput,
  ProductUncheckedCreateInput,
  ProductUpdateInput,
} from "@generated/prisma/models";

export const productsRepository = {
  getList(category?: EVoucherCategory) {
    return prisma.product.findMany({
      where: category ? { voucher: { category } } : {},
    });
  },

  getById(id: string) {
    return prisma.product.findUnique({ where: { id } });
  },

  async create(ownerId: string, data: ProductUncheckedCreateInput) {
    return prisma.$transaction(async (tx) => {
      await tx.voucher.findFirstOrThrow({
        where: { id: data.voucherId, ownerId },
      });
      return tx.product.create({ data });
    });
  },

  async update(ownerId: string, productId: string, data: ProductUpdateInput) {
    return prisma.product.update({
      where: { id: productId, voucher: { ownerId } },
      data,
    });
  },
};
