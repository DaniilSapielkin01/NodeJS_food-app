import { prisma } from "@database";
import {
  IBodyLogin,
  IBodySignup,
  ISaveRefreshToken,
} from "@src/types/auth.types";

export const authRepository = {
  async login(data: IBodyLogin) {
    return await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });
  },

  async signup(data: IBodySignup) {
    return await prisma.user.create({ data });
  },

  async logout(token: string) {
    return await prisma.refreshToken.deleteMany({ where: { token } });
  },

  async logoutAll(userId: string) {
    return await prisma.refreshToken.deleteMany({ where: { userId } });
  },

  update() {},

  async delete(userId: string) {
    return await prisma.user.delete({ where: { id: userId } });
  },

  async saveRefreshToken(data: ISaveRefreshToken) {
    return await prisma.refreshToken.create({ data });
  },

  async findRefreshToken(token: string) {
    return await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, role: true } } },
    });
  },

  async deleteRefreshToken(token: string) {
    return await prisma.refreshToken.delete({ where: { token } });
  },
};
