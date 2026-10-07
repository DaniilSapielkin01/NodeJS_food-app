import { prisma } from "@database";
import { CourierProfile, OwnerProfile, Prisma } from "@generated/prisma/client";
import { ERole } from "@generated/prisma/enums";

export const userRepository = {
  // FIND
  async findById(id: string, role?: ERole) {
    return await prisma.user.findUnique({
      where: { id },
      omit: { password: true }, // исключает пароль методом omit
      // select - выбирает только то что нужно выдать
      // include - аналог JOIN в SQL включает в ответ допольнительную ифнормацию
      include: {
        ownerProfile: role === ERole.OWNER,
        courierProfile: role === ERole.COURIER,
      },
    });
  },

  async findOwnerByUserId(userId: string) {
    return prisma.ownerProfile.findUnique({ where: { userId } });
  },

  // UPDATE
  async update(id: string, data: Prisma.UserUpdateInput) {
    return await prisma.user.update({
      where: { id },
      data,
      omit: { password: true },
    });
  },

  async updateOwner(userId: string, data: Prisma.OwnerProfileUpdateInput) {
    return await prisma.ownerProfile.update({ where: { userId }, data });
  },

  async updateCourier(userId: string, data: Prisma.CourierProfileUpdateInput) {
    return await prisma.courierProfile.update({ where: { userId }, data });
  },

  // CREATE
  async createOwner(
    id: string,
    data: Prisma.OwnerProfileCreateWithoutUserInput,
  ) {
    return await prisma.user.update({
      where: { id },
      data: {
        roles: { push: ERole.OWNER },
        ownerProfile: { create: data },
      },
      omit: { password: true },
    });
  },

  async createCourier(
    id: string,
    data: Prisma.CourierProfileCreateWithoutUserInput,
  ) {
    return await prisma.user.update({
      where: { id },
      data: {
        roles: { push: ERole.COURIER },
        courierProfile: { create: data },
      },
      omit: { password: true },
    });
  },

  // DELETE
  async deleteOwner(id: string, roles: ERole[]) {
    return await prisma.user.update({
      where: { id },
      data: {
        roles: { set: roles },
        ownerProfile: { delete: true },
      },
    });
  },

  async deleteCourier(id: string, roles: ERole[]) {
    return await prisma.user.update({
      where: { id },
      data: {
        roles: { set: roles },
        courierProfile: { delete: true },
      },
    });
  },
  async delete(id: string) {
    return await prisma.user.delete({ where: { id } });
  },
};
