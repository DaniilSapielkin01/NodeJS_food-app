import { UUID } from "crypto";

import { prisma } from "@database";

export const vouchersRepository = {
  async findById(id: UUID) {
    return await prisma.voucher.findUnique({ where: { id } });
  },

  async findAll() {
    return prisma.voucher;
  },

  create() {

  },

  update() {},

  delete() {},
};
