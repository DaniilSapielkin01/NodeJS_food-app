import { authMiddleware } from "@packages/auth";

import { prisma } from "@database";

export const authGuard = authMiddleware(async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, roles: true },
  });

  return user ? { userId: user.id, roles: user.roles } : null;
});
