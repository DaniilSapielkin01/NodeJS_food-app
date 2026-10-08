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
  productData,
  voucherData,
} from "./helpers";

const [categoryA, categoryB] = Object.values(EVoucherCategory) as [
  EVoucherCategory,
  EVoucherCategory,
];

// voucher directly in the DB, the name is unique because of @unique
const createVoucherDb = (ownerId: string, category = categoryA) =>
  prisma.voucher.create({
    data: {
      ...voucherData,
      name: `Test voucher ${randomUUID()}`,
      category,
      ownerId,
    },
  });

// owner + voucher + store + product, all created directly in the DB
const setup = async (category = categoryA) => {
  const owner = await createOwner();
  const profile = await prisma.ownerProfile.findUniqueOrThrow({
    where: { userId: owner.user.id },
  });
  const voucher = await createVoucherDb(profile.id, category);
  const store = await prisma.store.create({
    data: {
      name: `Test product ${randomUUID()}`,
      address: "Test street 1",
      voucherId: voucher.id,
    },
  });
  const product = await prisma.product.create({
    data: {
      ...productData,
      name: `Test product ${randomUUID()}`,
      voucherId: voucher.id,
      stores: { connect: [{ id: store.id }] },
    },
  });
  return { owner, voucher, store, product };
};

beforeEach(cleanDb);

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /products", () => {
  it("returns the list without authorization", async () => {
    await setup();

    const res = await request(app).get("/products");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("filters by voucher category", async () => {
    const a = await setup(categoryA);
    await setup(categoryB);

    const res = await request(app).get(`/products?category=${categoryA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(a.product.id);
  });

  it("returns 400 for an invalid category", async () => {
    const res = await request(app).get("/products?category=NOPE");
    expect(res.status).toBe(400);
  });
});

describe("GET /products/my", () => {
  it("returns 401 without an access token", async () => {
    const res = await request(app).get("/products/my");
    expect(res.status).toBe(401);
  });

  it("returns 403 for a customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .get("/products/my")
      .set(authHelper(customer.accessToken));
    expect(res.status).toBe(403);
  });

  it("returns only own products", async () => {
    const { owner, product } = await setup();
    await setup(); // another owner with their own product

    const res = await request(app)
      .get("/products/my")
      .set(authHelper(owner.accessToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(product.id);
  });

  it("returns an empty array when the owner has no products", async () => {
    const owner = await createOwner();

    const res = await request(app)
      .get("/products/my")
      .set(authHelper(owner.accessToken));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("GET /products/:id", () => {
  it("returns a product without authorization", async () => {
    const { product } = await setup();

    const res = await request(app).get(`/products/${product.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(product.id);
  });

  it("returns 404 for a non-existent product", async () => {
    const res = await request(app).get(`/products/${randomUUID()}`);
    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid id", async () => {
    const res = await request(app).get("/products/not-a-uuid");
    expect(res.status).toBe(400);
  });
});

describe("POST /products", () => {
  it("returns 401 without an access token", async () => {
    const res = await request(app)
      .post("/products")
      .send({
        ...productData,
        voucherId: randomUUID(),
        storeIds: [randomUUID()],
      });
    expect(res.status).toBe(401);
  });

  it("returns 403 for a customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post("/products")
      .set(authHelper(customer.accessToken))
      .send({
        ...productData,
        voucherId: randomUUID(),
        storeIds: [randomUUID()],
      });
    expect(res.status).toBe(403);
  });

  it("creates a product and links it to the store", async () => {
    const { owner, voucher, store } = await setup();

    const res = await request(app)
      .post("/products")
      .set(authHelper(owner.accessToken))
      .send({
        ...productData,
        name: "Second product",
        voucherId: voucher.id,
        storeIds: [store.id],
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Second product");

    const db = await prisma.product.findUniqueOrThrow({
      where: { id: res.body.id },
      include: { stores: true },
    });
    expect(db.stores.map((s) => s.id)).toEqual([store.id]);
  });

  it("saves custom image, discount and inStock", async () => {
    const { owner, voucher, store } = await setup();

    const res = await request(app)
      .post("/products")
      .set(authHelper(owner.accessToken))
      .send({
        ...productData,
        image: "https://example.com/custom.png",
        discount: "2",
        inStock: false,
        voucherId: voucher.id,
        storeIds: [store.id],
      });

    expect(res.status).toBe(201);
    expect(res.body.image).toBe("https://example.com/custom.png");
    expect(Number(res.body.discount)).toBe(2);
    expect(res.body.inStock).toBe(false);
  });

  it("returns 404 for another owner's voucher", async () => {
    const { owner } = await setup();
    const other = await setup();

    const res = await request(app)
      .post("/products")
      .set(authHelper(owner.accessToken))
      .send({
        ...productData,
        voucherId: other.voucher.id,
        storeIds: [other.store.id],
      });

    expect(res.status).toBe(404);
    expect(await prisma.product.count()).toBe(2);
  });

  it("returns 404 for a store of a different voucher of the same owner", async () => {
    const { owner, voucher, store } = await setup();
    const secondVoucher = await createVoucherDb(voucher.ownerId);

    const res = await request(app)
      .post("/products")
      .set(authHelper(owner.accessToken))
      .send({
        ...productData,
        voucherId: secondVoucher.id,
        storeIds: [store.id], // store belongs to the first voucher
      });

    expect(res.status).toBe(404);
    expect(await prisma.product.count()).toBe(1);
  });

  it("returns 404 for another owner's store", async () => {
    const { owner, voucher } = await setup();
    const foreign = await setup();

    const res = await request(app)
      .post("/products")
      .set(authHelper(owner.accessToken))
      .send({
        ...productData,
        voucherId: voucher.id,
        storeIds: [foreign.store.id],
      });

    expect(res.status).toBe(404);
    expect(await prisma.product.count()).toBe(2);
  });

  it("returns 400 for empty storeIds", async () => {
    const { owner, voucher } = await setup();
    const res = await request(app)
      .post("/products")
      .set(authHelper(owner.accessToken))
      .send({ ...productData, voucherId: voucher.id, storeIds: [] });
    expect(res.status).toBe(400);
  });

  it("returns 400 when storeIds contain a non-UUID", async () => {
    const { owner, voucher, store } = await setup();
    const res = await request(app)
      .post("/products")
      .set(authHelper(owner.accessToken))
      .send({
        ...productData,
        voucherId: voucher.id,
        storeIds: [store.id, "not-a-uuid"],
      });
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid voucherId", async () => {
    const { owner, store } = await setup();
    const res = await request(app)
      .post("/products")
      .set(authHelper(owner.accessToken))
      .send({ ...productData, voucherId: "not-a-uuid", storeIds: [store.id] });
    expect(res.status).toBe(400);
  });

  it("returns 400 without name", async () => {
    const { owner, voucher, store } = await setup();
    const { name: _name, ...noName } = productData;
    const res = await request(app)
      .post("/products")
      .set(authHelper(owner.accessToken))
      .send({ ...noName, voucherId: voucher.id, storeIds: [store.id] });
    expect(res.status).toBe(400);
  });

  it("returns 400 for a negative price", async () => {
    const { owner, voucher, store } = await setup();
    const res = await request(app)
      .post("/products")
      .set(authHelper(owner.accessToken))
      .send({
        ...productData,
        price: -1,
        voucherId: voucher.id,
        storeIds: [store.id],
      });
    expect(res.status).toBe(400);
  });

  it("returns 400 for a negative count", async () => {
    const { owner, voucher, store } = await setup();
    const res = await request(app)
      .post("/products")
      .set(authHelper(owner.accessToken))
      .send({
        ...productData,
        count: -1,
        voucherId: voucher.id,
        storeIds: [store.id],
      });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /products/:id", () => {
  it("returns 401 without an access token", async () => {
    const { product } = await setup();
    const res = await request(app)
      .patch(`/products/${product.id}`)
      .send({ name: "New" });
    expect(res.status).toBe(401);
  });

  it("returns 403 for a customer", async () => {
    const { product } = await setup();
    const customer = await createCustomer();

    const res = await request(app)
      .patch(`/products/${product.id}`)
      .set(authHelper(customer.accessToken))
      .send({ name: "New" });
    expect(res.status).toBe(403);
  });

  it("updates own product", async () => {
    const { owner, product } = await setup();

    const res = await request(app)
      .patch(`/products/${product.id}`)
      .set(authHelper(owner.accessToken))
      .send({ name: "New name", price: 20, count: 9 });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New name");
    expect(Number(res.body.price)).toBe(20);
    expect(res.body.count).toBe(9);
  });

  it("replaces linked stores with storeIds", async () => {
    const { owner, voucher, product } = await setup();
    const second = await prisma.store.create({
      data: {
        name: "Second store",
        address: "Street 2",
        voucherId: voucher.id,
      },
    });

    const res = await request(app)
      .patch(`/products/${product.id}`)
      .set(authHelper(owner.accessToken))
      .send({ storeIds: [second.id] });

    expect(res.status).toBe(200);
    expect(res.body.stores.map((s: { id: string }) => s.id)).toEqual([
      second.id,
    ]);
  });

  it("returns 404 for a store of a different voucher", async () => {
    const { owner, voucher, store, product } = await setup();
    const secondVoucher = await createVoucherDb(voucher.ownerId);
    const foreignStore = await prisma.store.create({
      data: {
        name: "Foreign store",
        address: "Street 3",
        voucherId: secondVoucher.id,
      },
    });

    const res = await request(app)
      .patch(`/products/${product.id}`)
      .set(authHelper(owner.accessToken))
      .send({ storeIds: [foreignStore.id] });

    expect(res.status).toBe(404);
    const db = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      include: { stores: true },
    });
    expect(db.stores.map((s) => s.id)).toEqual([store.id]);
  });

  it("returns 404 when updating another owner's product", async () => {
    const { product } = await setup();
    const other = await createOwner();

    const res = await request(app)
      .patch(`/products/${product.id}`)
      .set(authHelper(other.accessToken))
      .send({ name: "Hacked" });

    expect(res.status).toBe(404);
    const db = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
    });
    expect(db.name).toBe(product.name);
  });

  it("returns 404 for a non-existent product", async () => {
    const owner = await createOwner();
    const res = await request(app)
      .patch(`/products/${randomUUID()}`)
      .set(authHelper(owner.accessToken))
      .send({ name: "New" });
    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid id", async () => {
    const owner = await createOwner();
    const res = await request(app)
      .patch("/products/not-a-uuid")
      .set(authHelper(owner.accessToken))
      .send({ name: "New" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when storeIds contain a non-UUID", async () => {
    const { owner, product } = await setup();
    const res = await request(app)
      .patch(`/products/${product.id}`)
      .set(authHelper(owner.accessToken))
      .send({ storeIds: ["not-a-uuid"] });
    expect(res.status).toBe(400);
  });

  it("returns 400 for a negative price", async () => {
    const { owner, product } = await setup();
    const res = await request(app)
      .patch(`/products/${product.id}`)
      .set(authHelper(owner.accessToken))
      .send({ price: -5 });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /products/:id", () => {
  it("returns 401 without an access token", async () => {
    const { product } = await setup();
    const res = await request(app).delete(`/products/${product.id}`);
    expect(res.status).toBe(401);
  });

  it("returns 403 for a customer", async () => {
    const { product } = await setup();
    const customer = await createCustomer();

    const res = await request(app)
      .delete(`/products/${product.id}`)
      .set(authHelper(customer.accessToken));
    expect(res.status).toBe(403);
  });

  it("deletes own product", async () => {
    const { owner, product } = await setup();
    console.log("setup done");

    const res = await request(app)
      .delete(`/products/${product.id}`)
      .set(authHelper(owner.accessToken));

    console.log("response", res.status);
    expect(res.status).toBe(204);
    expect(await prisma.product.count()).toBe(0);
  });

  it("returns 404 when deleting another owner's product", async () => {
    const { product } = await setup();
    const other = await createOwner();

    const res = await request(app)
      .delete(`/products/${product.id}`)
      .set(authHelper(other.accessToken));

    expect(res.status).toBe(404);
    expect(await prisma.product.count()).toBe(1);
  });

  it("returns 404 for a non-existent product", async () => {
    const owner = await createOwner();
    const res = await request(app)
      .delete(`/products/${randomUUID()}`)
      .set(authHelper(owner.accessToken));
    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid id", async () => {
    const owner = await createOwner();
    const res = await request(app)
      .delete("/products/not-a-uuid")
      .set(authHelper(owner.accessToken));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /products (bulk)", () => {
  it("returns 401 without an access token", async () => {
    const res = await request(app)
      .delete("/products")
      .send({ productsIds: [randomUUID()] });
    expect(res.status).toBe(401);
  });

  it("returns 403 for a customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .delete("/products")
      .set(authHelper(customer.accessToken))
      .send({ productsIds: [randomUUID()] });
    expect(res.status).toBe(403);
  });

  it("deletes own products and returns the count", async () => {
    const { owner, voucher, store, product } = await setup();
    const second = await prisma.product.create({
      data: {
        ...productData,
        voucherId: voucher.id,
        stores: { connect: [{ id: store.id }] },
      },
    });

    const res = await request(app)
      .delete("/products")
      .set(authHelper(owner.accessToken))
      .send({ productsIds: [product.id, second.id] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: 2 });
    expect(await prisma.product.count()).toBe(0);
  });

  it("does not delete another owner's products", async () => {
    const { owner } = await setup();
    const other = await setup();

    const res = await request(app)
      .delete("/products")
      .set(authHelper(owner.accessToken))
      .send({ productsIds: [other.product.id] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: 0 });
    expect(await prisma.product.count()).toBe(2);
  });

  it("deletes only own products when ids are mixed", async () => {
    const { owner, product } = await setup();
    const other = await setup();

    const res = await request(app)
      .delete("/products")
      .set(authHelper(owner.accessToken))
      .send({ productsIds: [product.id, other.product.id] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: 1 });
    const left = await prisma.product.findMany();
    expect(left.map((p) => p.id)).toEqual([other.product.id]);
  });

  it("returns 400 when productsIds is not an array", async () => {
    const { owner } = await setup();
    const res = await request(app)
      .delete("/products")
      .set(authHelper(owner.accessToken))
      .send({ productsIds: "abc" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when productsIds contain a non-UUID", async () => {
    const { owner, product } = await setup();
    const res = await request(app)
      .delete("/products")
      .set(authHelper(owner.accessToken))
      .send({ productsIds: [product.id, "not-a-uuid"] });
    expect(res.status).toBe(400);
    expect(await prisma.product.count()).toBe(1);
  });
});
