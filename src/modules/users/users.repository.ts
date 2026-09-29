import { prisma } from "@database";
import { CourierProfile, OwnerProfile, Prisma } from "@generated/prisma/client";
import { ERole } from "@generated/prisma/enums";

export const userRepository = {
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

  update() {},

  async createOwnerProfile(
    id: string,
    data: Prisma.OwnerProfileCreateWithoutUserInput,
  ) {
    return await prisma.user.update({
      where: { id },
      data: {
        roles: { push: ERole.OWNER },
        ownerProfile: { create: data },
      },
    });
  },

  async createCourierProfile(
    id: string,
    data: Prisma.CourierProfileCreateWithoutUserInput,
  ) {
    return await prisma.user.update({
      where: { id },
      data: {
        roles: { push: ERole.COURIER },
        courierProfile: { create: data },
      },
    });
  },

  async delete(id: string) {
    return await prisma.user.delete({ where: { id } });
  },
};
