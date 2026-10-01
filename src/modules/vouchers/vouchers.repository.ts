import { UUID } from "crypto";

import { prisma } from "@database";
import {
  VoucherUncheckedCreateInput,
  VoucherUpdateInput,
} from "@generated/prisma/models";

export const vouchersRepository = {
  async findById(id: string) {
    return await prisma.voucher.findUnique({ where: { id } });
  },

  async getList() {
    return prisma.voucher.findMany();
  },

  async create(data: VoucherUncheckedCreateInput) {
    return await prisma.voucher.create({ data });
  },

  update(ownerId: string, voucherId: string, data: VoucherUpdateInput) {
    return prisma.voucher.update({
      where: {
        id: voucherId,
        ownerId,
      },
      data,
    });
  },

  delete(ownerId: string, id: string) {
    return prisma.voucher.delete({
      where: {
        id,
        ownerId,
      },
    });
  },
};
