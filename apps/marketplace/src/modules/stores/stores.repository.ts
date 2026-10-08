import { prisma } from "@database";
import {
  StoreUncheckedCreateInput,
  StoreUpdateInput,
} from "@generated/prisma/models";

export const storesRepository = {
  // GET,
  getList() {
    return prisma.store.findMany();
  },

  getById(id: string) {
    return prisma.store.findFirstOrThrow({ where: { id } });
  },

  getMy(userId: string) {
    return prisma.store.findMany({
      where: {
        voucher: { owner: { userId } },
      },
    });
  },

  getMyById(userId: string, storeId: string) {
    return prisma.store.findFirstOrThrow({
      where: { id: storeId, voucher: { owner: { userId } } },
    });
  },

  // CREATE
  create(userId: string, data: StoreUncheckedCreateInput) {
    return prisma.$transaction(async (tx) => {
      await tx.voucher.findFirstOrThrow({
        where: {
          id: data.voucherId,
          owner: { userId },
        },
      });

      return tx.store.create({
        data: {
          ...data,
          voucherId: data.voucherId,
        },
      });
    });
  },

  //UPDATE
  update(userId: string, storeId: string, data: StoreUpdateInput) {
    return prisma.store.update({
      where: {
        id: storeId,
        voucher: { owner: { userId } },
      },
      data,
    });
  },

  // DELETE
  async delete(userId: string, storeId: string) {
    return prisma.store.delete({
      where: {
        id: storeId,
        voucher: { owner: { userId } },
      },
    });
  },
};
