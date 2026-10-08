import { randomUUID } from "node:crypto";

import request from "supertest";

import { prisma } from "@database";
import { EVoucherCategory } from "@generated/prisma/enums";

import { app } from "../src/app";
import {
  authHelper,
  cleanDb,
  createCustomer,
  createOwner,
  createVoucher,
  voucherData,
} from "./helpers";

const category = Object.values(EVoucherCategory)[0];

beforeEach(cleanDb);

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /vouchers/list", () => {
  it("returns the list without authorization", async () => {
    const owner = await createOwner();
    await createVoucher(owner.accessToken);

    const res = await request(app).get("/vouchers/list");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe("GET /vouchers/:id", () => {
  it("returns a voucher without authorization", async () => {
    const owner = await createOwner();
    const voucher = await createVoucher(owner.accessToken);

    const res = await request(app).get(`/vouchers/${voucher.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(voucher.id);
  });

  it("returns 404 for a non-existent voucher", async () => {
    const res = await request(app).get(`/vouchers/${randomUUID()}`);
    expect(res.status).toBe(404);
  });
});

describe("POST /vouchers", () => {
  it("returns 401 without an access token", async () => {
    const res = await request(app).post("/vouchers").send(voucherData);
    expect(res.status).toBe(401);
  });

  it("returns 403 for a customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post("/vouchers")
      .set(authHelper(customer.accessToken))
      .send(voucherData);
    expect(res.status).toBe(403);
  });

  it("creates a voucher for an owner", async () => {
    const owner = await createOwner();
    const res = await request(app)
      .post("/vouchers")
      .set(authHelper(owner.accessToken))
      .send(voucherData);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe(voucherData.name);
  });

  it("returns 400 without name", async () => {
    const owner = await createOwner();
    const res = await request(app)
      .post("/vouchers")
      .set(authHelper(owner.accessToken))
      .send({ category });
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid category", async () => {
    const owner = await createOwner();
    const res = await request(app)
      .post("/vouchers")
      .set(authHelper(owner.accessToken))
      .send({
        name: "Test voucher",
        category: "NOPE",
        image: "https://example.com/product.png",
        description: "Test desc voucher",
      });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /vouchers/:id", () => {
  it("returns 401 without an access token", async () => {
    const owner = await createOwner();
    const voucher = await createVoucher(owner.accessToken);

    const res = await request(app)
      .patch(`/vouchers/${voucher.id}`)
      .send({ name: "New" });
    expect(res.status).toBe(401);
  });

  it("returns 403 for a customer", async () => {
    const owner = await createOwner();
    const customer = await createCustomer();
    const voucher = await createVoucher(owner.accessToken);

    const res = await request(app)
      .patch(`/vouchers/${voucher.id}`)
      .set(authHelper(customer.accessToken))
      .send({ name: "New" });
    expect(res.status).toBe(403);
  });

  it("updates own voucher", async () => {
    const owner = await createOwner();
    const voucher = await createVoucher(owner.accessToken);

    const res = await request(app)
      .patch(`/vouchers/${voucher.id}`)
      .set(authHelper(owner.accessToken))
      .send({ name: "New" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New");
  });

  it("returns 404 when updating another owner's voucher", async () => {
    const owner = await createOwner();
    const other = await createOwner();
    const voucher = await createVoucher(owner.accessToken);

    const res = await request(app)
      .patch(`/vouchers/${voucher.id}`)
      .set(authHelper(other.accessToken))
      .send({ name: "Hacked" });

    expect(res.status).toBe(404);
    const check = await request(app).get(`/vouchers/${voucher.id}`);
    expect(check.body.name).toBe(voucher.name);
  });

  it("returns 404 for a non-existent voucher", async () => {
    const owner = await createOwner();
    const res = await request(app)
      .patch(`/vouchers/${randomUUID()}`)
      .set(authHelper(owner.accessToken))
      .send({ name: "New" });
    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid category", async () => {
    const owner = await createOwner();
    const voucher = await createVoucher(owner.accessToken);

    const res = await request(app)
      .patch(`/vouchers/${voucher.id}`)
      .set(authHelper(owner.accessToken))
      .send({ category: "NOPE" });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /vouchers/:id", () => {
  it("returns 401 without an access token", async () => {
    const owner = await createOwner();
    const voucher = await createVoucher(owner.accessToken);

    const res = await request(app).delete(`/vouchers/${voucher.id}`);
    expect(res.status).toBe(401);
  });

  it("returns 403 for a customer", async () => {
    const owner = await createOwner();
    const customer = await createCustomer();
    const voucher = await createVoucher(owner.accessToken);

    const res = await request(app)
      .delete(`/vouchers/${voucher.id}`)
      .set(authHelper(customer.accessToken));
    expect(res.status).toBe(403);
  });

  it("deletes own voucher", async () => {
    const owner = await createOwner();
    const voucher = await createVoucher(owner.accessToken);

    const res = await request(app)
      .delete(`/vouchers/${voucher.id}`)
      .set(authHelper(owner.accessToken));
    expect(res.status).toBe(204);

    const check = await request(app).get(`/vouchers/${voucher.id}`);
    expect(check.status).toBe(404);
  });

  it("returns 404 when deleting another owner's voucher", async () => {
    const owner = await createOwner();
    const other = await createOwner();
    const voucher = await createVoucher(owner.accessToken);

    const res = await request(app)
      .delete(`/vouchers/${voucher.id}`)
      .set(authHelper(other.accessToken));

    expect(res.status).toBe(404);
    const check = await request(app).get(`/vouchers/${voucher.id}`);
    expect(check.status).toBe(200);
  });
});
