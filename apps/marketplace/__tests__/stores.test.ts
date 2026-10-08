import { randomUUID } from "node:crypto";

import request from "supertest";

import { prisma } from "@database";

import { app } from "../src/app";
import {
  authHelper,
  cleanDb,
  createCustomer,
  createOwner,
  createVoucher,
  setupOwnerVoucherStore,
  storeData,
} from "./helpers";

beforeEach(cleanDb);

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /stores", () => {
  it("returns the list without authorization", async () => {
    await setupOwnerVoucherStore();

    const res = await request(app).get("/stores");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe("GET /stores/my", () => {
  it("returns 401 without an access token", async () => {
    const res = await request(app).get("/stores/my");
    expect(res.status).toBe(401);
  });

  it("returns 403 for a customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .get("/stores/my")
      .set(authHelper(customer.accessToken));
    expect(res.status).toBe(403);
  });

  it("returns only own stores", async () => {
    const { owner, store } = await setupOwnerVoucherStore();
    await setupOwnerVoucherStore(); // another owner with their own store

    const res = await request(app)
      .get("/stores/my")
      .set(authHelper(owner.accessToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(store.id);
  });
});

describe("GET /stores/:id", () => {
  it("returns a store without authorization", async () => {
    const { store } = await setupOwnerVoucherStore();

    const res = await request(app).get(`/stores/${store.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(store.id);
  });

  it("returns 404 for a non-existent store", async () => {
    const res = await request(app).get(`/stores/${randomUUID()}`);
    expect(res.status).toBe(404);
  });
});

describe("POST /stores", () => {
  it("returns 401 without an access token", async () => {
    const res = await request(app)
      .post("/stores")
      .send({ ...storeData, voucherId: randomUUID() });
    expect(res.status).toBe(401);
  });

  it("returns 403 for a customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post("/stores")
      .set(authHelper(customer.accessToken))
      .send({ ...storeData, voucherId: randomUUID() });
    expect(res.status).toBe(403);
  });

  it("creates a store for own voucher", async () => {
    const owner = await createOwner();
    const voucher = await createVoucher(owner.accessToken);

    const res = await request(app)
      .post("/stores")
      .set(authHelper(owner.accessToken))
      .send({ ...storeData, voucherId: voucher.id });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe(storeData.name);
    expect(res.body.voucherId).toBe(voucher.id);
  });

  it("returns 404 for another owner's voucher", async () => {
    const owner = await createOwner();
    const other = await createOwner();
    const voucher = await createVoucher(other.accessToken);

    const res = await request(app)
      .post("/stores")
      .set(authHelper(owner.accessToken))
      .send({ ...storeData, voucherId: voucher.id });

    expect(res.status).toBe(404);
    expect(await prisma.store.count()).toBe(0);
  });

  it("returns 400 for an invalid voucherId", async () => {
    const owner = await createOwner();
    const res = await request(app)
      .post("/stores")
      .set(authHelper(owner.accessToken))
      .send({ ...storeData, voucherId: "not-a-uuid" });
    expect(res.status).toBe(400);
  });

  it("returns 400 without name", async () => {
    const owner = await createOwner();
    const voucher = await createVoucher(owner.accessToken);
    const res = await request(app)
      .post("/stores")
      .set(authHelper(owner.accessToken))
      .send({ address: storeData.address, voucherId: voucher.id });
    expect(res.status).toBe(400);
  });

  it("returns 400 without address", async () => {
    const owner = await createOwner();
    const voucher = await createVoucher(owner.accessToken);
    const res = await request(app)
      .post("/stores")
      .set(authHelper(owner.accessToken))
      .send({ name: storeData.name, voucherId: voucher.id });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /stores/:id", () => {
  it("returns 401 without an access token", async () => {
    const { store } = await setupOwnerVoucherStore();
    const res = await request(app)
      .patch(`/stores/${store.id}`)
      .send({ name: "New" });
    expect(res.status).toBe(401);
  });

  it("returns 403 for a customer", async () => {
    const { store } = await setupOwnerVoucherStore();
    const customer = await createCustomer();

    const res = await request(app)
      .patch(`/stores/${store.id}`)
      .set(authHelper(customer.accessToken))
      .send({ name: "New" });
    expect(res.status).toBe(403);
  });

  it("updates own store", async () => {
    const { owner, store } = await setupOwnerVoucherStore();

    const res = await request(app)
      .patch(`/stores/${store.id}`)
      .set(authHelper(owner.accessToken))
      .send({ name: "New name", address: "New street 2" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New name");
    expect(res.body.address).toBe("New street 2");
  });

  it("returns 404 when updating another owner's store", async () => {
    const { store } = await setupOwnerVoucherStore();
    const other = await createOwner();

    const res = await request(app)
      .patch(`/stores/${store.id}`)
      .set(authHelper(other.accessToken))
      .send({ name: "Hacked" });

    expect(res.status).toBe(404);
    const check = await request(app).get(`/stores/${store.id}`);
    expect(check.body.name).toBe(storeData.name);
  });

  it("returns 404 for a non-existent store", async () => {
    const owner = await createOwner();
    const res = await request(app)
      .patch(`/stores/${randomUUID()}`)
      .set(authHelper(owner.accessToken))
      .send({ name: "New" });
    expect(res.status).toBe(404);
  });

  it("returns 400 for an empty name", async () => {
    const { owner, store } = await setupOwnerVoucherStore();
    const res = await request(app)
      .patch(`/stores/${store.id}`)
      .set(authHelper(owner.accessToken))
      .send({ name: "   " });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /stores/:id", () => {
  it("returns 401 without an access token", async () => {
    const { store } = await setupOwnerVoucherStore();
    const res = await request(app).delete(`/stores/${store.id}`);
    expect(res.status).toBe(401);
  });

  it("returns 403 for a customer", async () => {
    const { store } = await setupOwnerVoucherStore();
    const customer = await createCustomer();

    const res = await request(app)
      .delete(`/stores/${store.id}`)
      .set(authHelper(customer.accessToken));
    expect(res.status).toBe(403);
  });

  it("deletes own store", async () => {
    const { owner, store } = await setupOwnerVoucherStore();

    const res = await request(app)
      .delete(`/stores/${store.id}`)
      .set(authHelper(owner.accessToken));
    expect(res.status).toBe(204);

    const check = await request(app).get(`/stores/${store.id}`);
    expect(check.status).toBe(404);
  });

  it("returns 404 when deleting another owner's store", async () => {
    const { store } = await setupOwnerVoucherStore();
    const other = await createOwner();

    const res = await request(app)
      .delete(`/stores/${store.id}`)
      .set(authHelper(other.accessToken));

    expect(res.status).toBe(404);
    const check = await request(app).get(`/stores/${store.id}`);
    expect(check.status).toBe(200);
  });
});
