import { prisma } from "@database";
import {
  RefreshTokenUncheckedCreateInput,
  UserUncheckedCreateInput,
} from "@generated/prisma/models";

export const authRepository = {
  async login(data: Pick<UserUncheckedCreateInput, "email">) {
    return await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });
  },

  async signup(data: UserUncheckedCreateInput) {
    return await prisma.user.create({ data });
  },

  async logout(token: string) {
    return await prisma.refreshToken.deleteMany({ where: { token } });
  },

  async logoutAll(userId: string) {
    return await prisma.refreshToken.deleteMany({ where: { userId } });
  },

  async saveRefreshToken(data: RefreshTokenUncheckedCreateInput) {
    return await prisma.refreshToken.create({ data });
  },

  async findRefreshToken(token: string) {
    return await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, roles: true } } },
    });
  },

  async consumeRefreshToken(token: string) {
    const { count } = await prisma.refreshToken.deleteMany({
      where: { token, expiresAt: { gt: new Date() } },
    });
    return count === 1;
  },

  async deleteRefreshToken(token: string) {
    return await prisma.refreshToken.delete({ where: { token } });
  },
};
