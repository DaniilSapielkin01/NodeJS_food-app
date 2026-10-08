import { randomUUID } from "node:crypto";

import request from "supertest";

import { prisma } from "@database";
import { ERole, EVoucherCategory } from "@generated/prisma/enums";
import { issueTokens } from "@utils/auth/auth.utils";

import { app } from "../src/app";

// TEST DATA
const category = Object.values(EVoucherCategory)[0];

export const voucherData = {
  name: `Test voucher ${randomUUID()}`,
  category,
  image: "https://example.com/product.png",
  description: "Test desc voucher",
};

export const storeData = {
  name: `Test store ${randomUUID()}`,
  address: "Test street 1",
  image: "https://example.com/product.png",
};

export const productData = {
  name: `Test product ${randomUUID()}`,
  image: "https://example.com/product.png",
  description: "Test description",
  price: 10.5,
  discount: "0",
  count: 5,
};

// REQUEST HELPERS
export const authHelper = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

// DB CLEANUP
export const cleanDb = async () => {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.user.deleteMany();
};

// USERS
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
      create: {
        companyName: `Test company ${randomUUID()}`,
        phone: "+380000000000",
      },
    },
  });

export const createCourier = () =>
  createUser([ERole.COURIER], {
    courierProfile: { create: { phone: "+380000000001" } },
  });

// ENTITIES (created through the API)
export const createVoucher = async (token: string) => {
  const res = await request(app)
    .post("/vouchers")
    .set(authHelper(token))
    .send({ ...voucherData, name: `Test voucher ${randomUUID()}` });
  if (res.status !== 201) {
    throw new Error(`createVoucher failed: ${res.status} ${res.text}`);
  }
  return res.body as { id: string; name: string };
};

export const createStore = async (token: string, voucherId: string) => {
  const res = await request(app)
    .post("/stores")
    .set(authHelper(token))
    .send({ ...storeData, voucherId });
  if (res.status !== 201) {
    throw new Error(`createStore failed: ${res.status} ${res.text}`);
  }
  return res.body as { id: string };
};

// COMPOSITE SETUP
// owner + own voucher + own store
export const setupOwnerVoucherStore = async () => {
  const owner = await createOwner();
  const voucher = await createVoucher(owner.accessToken);
  const store = await createStore(owner.accessToken, voucher.id);
  return { owner, voucher, store };
};
