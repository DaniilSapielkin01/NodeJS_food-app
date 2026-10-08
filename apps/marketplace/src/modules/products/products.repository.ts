import { prisma } from "@database";
import { EVoucherCategory } from "@generated/prisma/enums";
import {
  ProductUncheckedCreateInput,
  ProductUpdateInput,
} from "@generated/prisma/models";

type ProductCreateData = Omit<ProductUncheckedCreateInput, "stores"> & {
  storeIds: string[];
};

type ProductUpdateData = ProductUpdateInput & { storeIds?: string[] };

export const productsRepository = {
  // GET
  getList(category?: EVoucherCategory) {
    return prisma.product.findMany({
      where: category ? { voucher: { category } } : {},
    });
  },

  getById(id: string) {
    return prisma.product.findFirstOrThrow({ where: { id } });
  },

  getProductsByUserId(userId: string) {
    return prisma.product.findMany({
      where: {
        voucher: { owner: { userId } },
      },
    });
  },

  // CREATE
  create(userId: string, { voucherId, storeIds, ...data }: ProductCreateData) {
    return prisma.$transaction(async (tx) => {
      await tx.voucher.findFirstOrThrow({
        where: { id: voucherId, owner: { userId } },
      });

      return tx.product.create({
        data: {
          ...data,
          voucherId,
          stores: { connect: storeIds.map((id) => ({ id, voucherId })) },
        },
      });
    });
  },

  // UPDATE
  update(
    userId: string,
    productId: string,
    { storeIds, ...data }: ProductUpdateData,
  ) {
    return prisma.$transaction(async (tx) => {
      const { voucherId } = await tx.product.findFirstOrThrow({
        where: { id: productId, voucher: { owner: { userId } } },
        select: { voucherId: true },
      });

      return tx.product.update({
        where: { id: productId },
        data: {
          ...data,
          ...(storeIds && {
            stores: { set: storeIds.map((id) => ({ id, voucherId })) },
          }),
        },
        include: { stores: true },
      });
    });
  },

  // DELETE
  delete(userId: string, productId: string) {
    return prisma.product.delete({
      where: {
        id: productId,
        voucher: { owner: { userId } },
      },
    });
  },

  deleteAll(userId: string, productsIds: string[]) {
    return prisma.product.deleteMany({
      where: {
        id: { in: productsIds },
        voucher: { owner: { userId } },
      },
    });
  },
};
