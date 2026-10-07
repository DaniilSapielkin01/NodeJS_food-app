import { randomUUID } from "node:crypto";

import { prisma } from "@database";
import { ERole } from "@generated/prisma/enums";
import { issueTokens } from "@utils/auth/auth.utils";

const createUser = async (roles: ERole[], profile: object = {}) => {
  const user = await prisma.user.create({
    data: {
      email: `${randomUUID()}@example.com`,
      password: "not-used-in-tests",
      name: "Test",
      roles,
      ...profile,
    },
  });

  const tokens = await issueTokens(user.id);

  return { user, ...tokens };
};

export const createCustomer = () => createUser([ERole.CUSTOMER]);

export const createOwner = () =>
  createUser([ERole.OWNER], {
    ownerProfile: {
      create: { companyName: "Test company", phone: "+380000000000" },
    },
  });

export const createCourier = () =>
  createUser([ERole.COURIER], {
    courierProfile: { create: { phone: "+380000000001" } },
  });
