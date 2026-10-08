import { createAuthMiddleware } from "@packages/auth";

import { prisma } from "@database";

export { requireRoleMiddleware } from "@packages/auth";

export const authMiddleware = createAuthMiddleware(async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, roles: true },
  });

  return user ? { userId: user.id, roles: user.roles } : null;
});
