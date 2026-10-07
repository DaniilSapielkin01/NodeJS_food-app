import { randomUUID } from "node:crypto";

import request from "supertest";

import { prisma } from "@database";
import { EOrderStatus, EVoucherCategory } from "@generated/prisma/enums";

import { app } from "../src/app";
import { createCourier, createCustomer, createOwner } from "./helpers";

const [category] = Object.values(EVoucherCategory);

// adjust if the router is mounted under another prefix
const CUSTOMER = "/orders/customer";
const OWNER = "/orders/owner";
const COURIER = "/orders/courier";

const voucherData = {
  name: "Test voucher",
  image: "https://example.com/voucher.png",
  description: "Test voucher description",
};

const productData = {
  name: "Test product",
  image: "https://example.com/product.png",
  description: "Test description",
  price: 10.5,
  discount: "0",
  inStock: true,
  count: 10,
};

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

const statusOf = async (id: string) =>
  (await prisma.order.findUniqueOrThrow({ where: { id } })).status;

// owner + voucher + store + product, all created directly in the DB
const setup = async () => {
  const owner = await createOwner();
  const profile = await prisma.ownerProfile.findUniqueOrThrow({
    where: { userId: owner.user.id },
  });
  const voucher = await prisma.voucher.create({
    data: { ...voucherData, category: category!, ownerId: profile.id },
  });
  const store = await prisma.store.create({
    data: {
      name: "Test store",
      address: "Test street 1",
      voucherId: voucher.id,
    },
  });
  const product = await prisma.product.create({
    data: {
      ...productData,
      voucherId: voucher.id,
      stores: { connect: [{ id: store.id }] },
    },
  });
  return { owner, voucher, store, product };
};

// courier with a profile; verified and online by default
const setupCourier = async ({ verified = true, online = true } = {}) => {
  const courier = await createCourier();
  await prisma.courierProfile.updateMany({
    where: { userId: courier.user.id },
    data: { isVerified: verified, isOnline: online },
  });
  const profile = await prisma.courierProfile.findFirstOrThrow({
    where: { userId: courier.user.id },
  });
  return { courier, profile };
};

// order created directly in the DB with the given status
const createOrder = (
  customerId: string,
  storeId: string,
  status: EOrderStatus,
  courierId?: string,
) =>
  prisma.order.create({
    data: {
      customerId,
      storeId,
      status,
      totalAmount: 10.5,
      deliveryAddress: "Test address",
      ...(courierId && { courierId }),
    },
  });

const orderBody = (storeId: string, productId: string, quantity = 1) => ({
  storeId,
  deliveryAddress: "Test address 1",
  items: [{ productId, quantity }],
});

beforeEach(async () => {
  await prisma.order.deleteMany(); // order items are removed by cascade
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ---------------------------------------------------------------- CUSTOMER

describe("POST /orders/customer", () => {
  it("returns 401 without an access token", async () => {
    const res = await request(app)
      .post(CUSTOMER)
      .send(orderBody(randomUUID(), randomUUID()));
    expect(res.status).toBe(401);
  });

  it("returns 403 for an owner", async () => {
    const { owner, store, product } = await setup();
    const res = await request(app)
      .post(CUSTOMER)
      .set(auth(owner.accessToken))
      .send(orderBody(store.id, product.id));
    expect(res.status).toBe(403);
  });

  it("creates an order with items and a correct total", async () => {
    const { store, voucher, product } = await setup();
    const second = await prisma.product.create({
      data: {
        ...productData,
        name: "Second product",
        price: 5,
        voucherId: voucher.id,
        stores: { connect: [{ id: store.id }] },
      },
    });
    const customer = await createCustomer();

    const res = await request(app)
      .post(CUSTOMER)
      .set(auth(customer.accessToken))
      .send({
        storeId: store.id,
        deliveryAddress: "Test address 1",
        items: [
          { productId: product.id, quantity: 2 }, // 2 * 10.5 = 21
          { productId: second.id, quantity: 3 }, // 3 * 5 = 15
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe(EOrderStatus.PENDING_OWNER);
    expect(res.body.customerId).toBe(customer.user.id);
    expect(res.body.storeId).toBe(store.id);
    expect(Number(res.body.totalAmount)).toBe(36);
    expect(res.body.items).toHaveLength(2);

    const item = res.body.items.find(
      (i: { productId: string }) => i.productId === product.id,
    );
    expect(item.quantity).toBe(2);
    expect(Number(item.price)).toBe(10.5);

    expect(await prisma.order.count()).toBe(1);
    expect(await prisma.orderItem.count()).toBe(2);
  });

  it("stores the price at the moment of the order", async () => {
    const { store, product } = await setup();
    const customer = await createCustomer();

    const res = await request(app)
      .post(CUSTOMER)
      .set(auth(customer.accessToken))
      .send(orderBody(store.id, product.id));
    expect(res.status).toBe(201);

    await prisma.product.update({
      where: { id: product.id },
      data: { price: 99 },
    });

    const item = await prisma.orderItem.findFirstOrThrow({
      where: { orderId: res.body.id },
    });
    expect(Number(item.price)).toBe(10.5);
  });

  it("returns 404 for a non-existent store", async () => {
    const { product } = await setup();
    const customer = await createCustomer();

    const res = await request(app)
      .post(CUSTOMER)
      .set(auth(customer.accessToken))
      .send(orderBody(randomUUID(), product.id));

    expect(res.status).toBe(404);
    expect(await prisma.order.count()).toBe(0);
  });

  it("returns 400 for a product from another store", async () => {
    const { store } = await setup();
    const other = await setup();
    const customer = await createCustomer();

    const res = await request(app)
      .post(CUSTOMER)
      .set(auth(customer.accessToken))
      .send(orderBody(store.id, other.product.id));

    expect(res.status).toBe(400);
    expect(await prisma.order.count()).toBe(0);
  });

  it("returns 400 for a non-existent product", async () => {
    const { store } = await setup();
    const customer = await createCustomer();

    const res = await request(app)
      .post(CUSTOMER)
      .set(auth(customer.accessToken))
      .send(orderBody(store.id, randomUUID()));

    expect(res.status).toBe(400);
  });

  it("returns 400 for a product that is not in stock", async () => {
    const { store, product } = await setup();
    await prisma.product.update({
      where: { id: product.id },
      data: { inStock: false },
    });
    const customer = await createCustomer();

    const res = await request(app)
      .post(CUSTOMER)
      .set(auth(customer.accessToken))
      .send(orderBody(store.id, product.id));

    expect(res.status).toBe(400);
    expect(await prisma.order.count()).toBe(0);
  });

  it("returns 400 when quantity is bigger than the product count", async () => {
    const { store, product } = await setup();
    const customer = await createCustomer();

    const res = await request(app)
      .post(CUSTOMER)
      .set(auth(customer.accessToken))
      .send(orderBody(store.id, product.id, productData.count + 1));

    expect(res.status).toBe(400);
    expect(await prisma.order.count()).toBe(0);
  });

  describe("validation", () => {
    it("returns 400 for an invalid storeId", async () => {
      const { product } = await setup();
      const customer = await createCustomer();
      const res = await request(app)
        .post(CUSTOMER)
        .set(auth(customer.accessToken))
        .send(orderBody("not-a-uuid", product.id));
      expect(res.status).toBe(400);
    });

    it("returns 400 without deliveryAddress", async () => {
      const { store, product } = await setup();
      const customer = await createCustomer();
      const { deliveryAddress: _address, ...noAddress } = orderBody(
        store.id,
        product.id,
      );
      const res = await request(app)
        .post(CUSTOMER)
        .set(auth(customer.accessToken))
        .send(noAddress);
      expect(res.status).toBe(400);
    });

    it("returns 400 for empty items", async () => {
      const { store } = await setup();
      const customer = await createCustomer();
      const res = await request(app)
        .post(CUSTOMER)
        .set(auth(customer.accessToken))
        .send({ storeId: store.id, deliveryAddress: "Addr", items: [] });
      expect(res.status).toBe(400);
    });

    it("returns 400 for an invalid productId", async () => {
      const { store } = await setup();
      const customer = await createCustomer();
      const res = await request(app)
        .post(CUSTOMER)
        .set(auth(customer.accessToken))
        .send(orderBody(store.id, "not-a-uuid"));
      expect(res.status).toBe(400);
    });

    it("returns 400 for quantity 0", async () => {
      const { store, product } = await setup();
      const customer = await createCustomer();
      const res = await request(app)
        .post(CUSTOMER)
        .set(auth(customer.accessToken))
        .send(orderBody(store.id, product.id, 0));
      expect(res.status).toBe(400);
    });

    it("returns 400 for a fractional quantity", async () => {
      const { store, product } = await setup();
      const customer = await createCustomer();
      const res = await request(app)
        .post(CUSTOMER)
        .set(auth(customer.accessToken))
        .send(orderBody(store.id, product.id, 1.5));
      expect(res.status).toBe(400);
    });
  });
});

describe("GET /orders/customer", () => {
  it("returns 401 without an access token", async () => {
    const res = await request(app).get(CUSTOMER);
    expect(res.status).toBe(401);
  });

  it("returns 403 for an owner", async () => {
    const { owner } = await setup();
    const res = await request(app).get(CUSTOMER).set(auth(owner.accessToken));
    expect(res.status).toBe(403);
  });

  it("returns only own orders", async () => {
    const { store } = await setup();
    const customer = await createCustomer();
    const another = await createCustomer();
    const mine = await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.PENDING_OWNER,
    );
    await createOrder(another.user.id, store.id, EOrderStatus.PENDING_OWNER);

    const res = await request(app)
      .get(CUSTOMER)
      .set(auth(customer.accessToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(mine.id);
  });

  it("returns an empty array when there are no orders", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .get(CUSTOMER)
      .set(auth(customer.accessToken));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("GET /orders/customer/:id", () => {
  it("returns own order", async () => {
    const { store } = await setup();
    const customer = await createCustomer();
    const order = await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.PENDING_OWNER,
    );

    const res = await request(app)
      .get(`${CUSTOMER}/${order.id}`)
      .set(auth(customer.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(order.id);
  });

  it("returns 404 for another customer's order", async () => {
    const { store } = await setup();
    const customer = await createCustomer();
    const another = await createCustomer();
    const order = await createOrder(
      another.user.id,
      store.id,
      EOrderStatus.PENDING_OWNER,
    );

    const res = await request(app)
      .get(`${CUSTOMER}/${order.id}`)
      .set(auth(customer.accessToken));

    expect(res.status).toBe(404);
  });

  it("returns 404 for a non-existent order", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .get(`${CUSTOMER}/${randomUUID()}`)
      .set(auth(customer.accessToken));
    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid id", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .get(`${CUSTOMER}/not-a-uuid`)
      .set(auth(customer.accessToken));
    expect(res.status).toBe(400);
  });
});

describe("PATCH /orders/customer/:id/cancel", () => {
  it.each([EOrderStatus.PENDING_PAYMENT, EOrderStatus.PENDING_OWNER])(
    "cancels an order in %s status",
    async (status) => {
      const { store } = await setup();
      const customer = await createCustomer();
      const order = await createOrder(customer.user.id, store.id, status);

      const res = await request(app)
        .patch(`${CUSTOMER}/${order.id}/cancel`)
        .set(auth(customer.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.message).toContain(order.id);
      expect(await statusOf(order.id)).toBe(EOrderStatus.CANCELLED);
    },
  );

  it.each([
    EOrderStatus.ACCEPTED,
    EOrderStatus.READY,
    EOrderStatus.TAKEN,
    EOrderStatus.PICKED_UP,
    EOrderStatus.DELIVERED,
    EOrderStatus.REJECTED,
    EOrderStatus.CANCELLED,
  ])("returns 404 and keeps the status for an order in %s", async (status) => {
    const { store } = await setup();
    const customer = await createCustomer();
    const order = await createOrder(customer.user.id, store.id, status);

    const res = await request(app)
      .patch(`${CUSTOMER}/${order.id}/cancel`)
      .set(auth(customer.accessToken));

    expect(res.status).toBe(404);
    expect(await statusOf(order.id)).toBe(status);
  });

  it("returns 404 when cancelling another customer's order", async () => {
    const { store } = await setup();
    const customer = await createCustomer();
    const another = await createCustomer();
    const order = await createOrder(
      another.user.id,
      store.id,
      EOrderStatus.PENDING_OWNER,
    );

    const res = await request(app)
      .patch(`${CUSTOMER}/${order.id}/cancel`)
      .set(auth(customer.accessToken));

    expect(res.status).toBe(404);
    expect(await statusOf(order.id)).toBe(EOrderStatus.PENDING_OWNER);
  });

  it("returns 400 for an invalid id", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .patch(`${CUSTOMER}/not-a-uuid/cancel`)
      .set(auth(customer.accessToken));
    expect(res.status).toBe(400);
  });
});

// ------------------------------------------------------------------- OWNER

describe("GET /orders/owner/store/:storeId", () => {
  it("returns 401 without an access token", async () => {
    const res = await request(app).get(`${OWNER}/store/${randomUUID()}`);
    expect(res.status).toBe(401);
  });

  it("returns 403 for a customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .get(`${OWNER}/store/${randomUUID()}`)
      .set(auth(customer.accessToken));
    expect(res.status).toBe(403);
  });

  it("returns store orders except PENDING_PAYMENT", async () => {
    const { owner, store } = await setup();
    const customer = await createCustomer();
    await createOrder(customer.user.id, store.id, EOrderStatus.PENDING_PAYMENT);
    await createOrder(customer.user.id, store.id, EOrderStatus.PENDING_OWNER);
    await createOrder(customer.user.id, store.id, EOrderStatus.ACCEPTED);

    const res = await request(app)
      .get(`${OWNER}/store/${store.id}`)
      .set(auth(owner.accessToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(
      res.body.some(
        (o: { status: EOrderStatus }) =>
          o.status === EOrderStatus.PENDING_PAYMENT,
      ),
    ).toBe(false);
  });

  it("does not return orders of another store", async () => {
    const { owner, voucher, store } = await setup();
    const secondStore = await prisma.store.create({
      data: {
        name: "Second store",
        address: "Street 2",
        voucherId: voucher.id,
      },
    });
    const customer = await createCustomer();
    const mine = await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.PENDING_OWNER,
    );
    await createOrder(
      customer.user.id,
      secondStore.id,
      EOrderStatus.PENDING_OWNER,
    );

    const res = await request(app)
      .get(`${OWNER}/store/${store.id}`)
      .set(auth(owner.accessToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(mine.id);
  });

  it("returns an empty array for another owner's store", async () => {
    const { store } = await setup();
    const other = await setup();
    const customer = await createCustomer();
    await createOrder(customer.user.id, store.id, EOrderStatus.PENDING_OWNER);

    const res = await request(app)
      .get(`${OWNER}/store/${store.id}`)
      .set(auth(other.owner.accessToken));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns 400 for an invalid storeId", async () => {
    const { owner } = await setup();
    const res = await request(app)
      .get(`${OWNER}/store/not-a-uuid`)
      .set(auth(owner.accessToken));
    expect(res.status).toBe(400);
  });
});

describe("PATCH /orders/owner/:id/accept", () => {
  it("returns 403 for a customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .patch(`${OWNER}/${randomUUID()}/accept`)
      .set(auth(customer.accessToken));
    expect(res.status).toBe(403);
  });

  it("accepts an order in PENDING_OWNER status", async () => {
    const { owner, store } = await setup();
    const customer = await createCustomer();
    const order = await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.PENDING_OWNER,
    );

    const res = await request(app)
      .patch(`${OWNER}/${order.id}/accept`)
      .set(auth(owner.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(EOrderStatus.ACCEPTED);
    expect(await statusOf(order.id)).toBe(EOrderStatus.ACCEPTED);
  });

  it.each([
    EOrderStatus.PENDING_PAYMENT,
    EOrderStatus.ACCEPTED,
    EOrderStatus.READY,
    EOrderStatus.CANCELLED,
  ])("returns 404 for an order in %s", async (status) => {
    const { owner, store } = await setup();
    const customer = await createCustomer();
    const order = await createOrder(customer.user.id, store.id, status);

    const res = await request(app)
      .patch(`${OWNER}/${order.id}/accept`)
      .set(auth(owner.accessToken));

    expect(res.status).toBe(404);
    expect(await statusOf(order.id)).toBe(status);
  });

  it("returns 404 for another owner's order", async () => {
    const { store } = await setup();
    const other = await setup();
    const customer = await createCustomer();
    const order = await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.PENDING_OWNER,
    );

    const res = await request(app)
      .patch(`${OWNER}/${order.id}/accept`)
      .set(auth(other.owner.accessToken));

    expect(res.status).toBe(404);
    expect(await statusOf(order.id)).toBe(EOrderStatus.PENDING_OWNER);
  });

  it("returns 400 for an invalid id", async () => {
    const { owner } = await setup();
    const res = await request(app)
      .patch(`${OWNER}/not-a-uuid/accept`)
      .set(auth(owner.accessToken));
    expect(res.status).toBe(400);
  });
});

describe("PATCH /orders/owner/:id/reject", () => {
  it.each([EOrderStatus.PENDING_OWNER, EOrderStatus.ACCEPTED])(
    "rejects an order in %s status",
    async (status) => {
      const { owner, store } = await setup();
      const customer = await createCustomer();
      const order = await createOrder(customer.user.id, store.id, status);

      const res = await request(app)
        .patch(`${OWNER}/${order.id}/reject`)
        .set(auth(owner.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(EOrderStatus.REJECTED);
      expect(await statusOf(order.id)).toBe(EOrderStatus.REJECTED);
    },
  );

  it.each([
    EOrderStatus.PENDING_PAYMENT,
    EOrderStatus.READY,
    EOrderStatus.TAKEN,
    EOrderStatus.DELIVERED,
  ])("returns 404 for an order in %s", async (status) => {
    const { owner, store } = await setup();
    const customer = await createCustomer();
    const order = await createOrder(customer.user.id, store.id, status);

    const res = await request(app)
      .patch(`${OWNER}/${order.id}/reject`)
      .set(auth(owner.accessToken));

    expect(res.status).toBe(404);
    expect(await statusOf(order.id)).toBe(status);
  });

  it("returns 404 for another owner's order", async () => {
    const { store } = await setup();
    const other = await setup();
    const customer = await createCustomer();
    const order = await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.PENDING_OWNER,
    );

    const res = await request(app)
      .patch(`${OWNER}/${order.id}/reject`)
      .set(auth(other.owner.accessToken));

    expect(res.status).toBe(404);
    expect(await statusOf(order.id)).toBe(EOrderStatus.PENDING_OWNER);
  });

  it("returns 403 for a customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .patch(`${OWNER}/${randomUUID()}/reject`)
      .set(auth(customer.accessToken));
    expect(res.status).toBe(403);
  });
});

describe("PATCH /orders/owner/:id/ready", () => {
  it("marks an ACCEPTED order as READY", async () => {
    const { owner, store } = await setup();
    const customer = await createCustomer();
    const order = await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.ACCEPTED,
    );

    const res = await request(app)
      .patch(`${OWNER}/${order.id}/ready`)
      .set(auth(owner.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(EOrderStatus.READY);
    expect(await statusOf(order.id)).toBe(EOrderStatus.READY);
  });

  it.each([
    EOrderStatus.PENDING_OWNER,
    EOrderStatus.READY,
    EOrderStatus.REJECTED,
    EOrderStatus.TAKEN,
  ])("returns 404 for an order in %s", async (status) => {
    const { owner, store } = await setup();
    const customer = await createCustomer();
    const order = await createOrder(customer.user.id, store.id, status);

    const res = await request(app)
      .patch(`${OWNER}/${order.id}/ready`)
      .set(auth(owner.accessToken));

    expect(res.status).toBe(404);
    expect(await statusOf(order.id)).toBe(status);
  });

  it("returns 404 for another owner's order", async () => {
    const { store } = await setup();
    const other = await setup();
    const customer = await createCustomer();
    const order = await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.ACCEPTED,
    );

    const res = await request(app)
      .patch(`${OWNER}/${order.id}/ready`)
      .set(auth(other.owner.accessToken));

    expect(res.status).toBe(404);
    expect(await statusOf(order.id)).toBe(EOrderStatus.ACCEPTED);
  });

  it("returns 403 for a customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .patch(`${OWNER}/${randomUUID()}/ready`)
      .set(auth(customer.accessToken));
    expect(res.status).toBe(403);
  });
});

// ----------------------------------------------------------------- COURIER

describe("GET /orders/courier/available", () => {
  it("returns 401 without an access token", async () => {
    const res = await request(app).get(`${COURIER}/available`);
    expect(res.status).toBe(401);
  });

  it("returns 403 for a customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .get(`${COURIER}/available`)
      .set(auth(customer.accessToken));
    expect(res.status).toBe(403);
  });

  it("returns only READY orders without a courier", async () => {
    const { store } = await setup();
    const customer = await createCustomer();
    const { courier, profile } = await setupCourier();
    const free = await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.READY,
    );
    await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.READY,
      profile.id,
    ); // READY, but already has a courier
    await createOrder(customer.user.id, store.id, EOrderStatus.ACCEPTED);
    await createOrder(customer.user.id, store.id, EOrderStatus.PENDING_OWNER);

    const res = await request(app)
      .get(`${COURIER}/available`)
      .set(auth(courier.accessToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(free.id);
  });
});

describe("GET /orders/courier", () => {
  it("returns only the courier's own orders", async () => {
    const { store } = await setup();
    const customer = await createCustomer();
    const first = await setupCourier();
    const second = await setupCourier();
    const mine = await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.TAKEN,
      first.profile.id,
    );
    await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.TAKEN,
      second.profile.id,
    );
    await createOrder(customer.user.id, store.id, EOrderStatus.READY);

    const res = await request(app)
      .get(COURIER)
      .set(auth(first.courier.accessToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(mine.id);
  });

  it("returns 403 for a customer", async () => {
    const customer = await createCustomer();
    const res = await request(app).get(COURIER).set(auth(customer.accessToken));
    expect(res.status).toBe(403);
  });
});

describe("PATCH /orders/courier/:id/take", () => {
  it("returns 403 for a customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .patch(`${COURIER}/${randomUUID()}/take`)
      .set(auth(customer.accessToken));
    expect(res.status).toBe(403);
  });

  it("takes a READY order", async () => {
    const { store } = await setup();
    const customer = await createCustomer();
    const { courier, profile } = await setupCourier();
    const order = await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.READY,
    );

    const res = await request(app)
      .patch(`${COURIER}/${order.id}/take`)
      .set(auth(courier.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(EOrderStatus.TAKEN);
    expect(res.body.courierId).toBe(profile.id);
  });

  it("returns 400 for a non-verified courier", async () => {
    const { store } = await setup();
    const customer = await createCustomer();
    const { courier } = await setupCourier({ verified: false });
    const order = await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.READY,
    );

    const res = await request(app)
      .patch(`${COURIER}/${order.id}/take`)
      .set(auth(courier.accessToken));

    expect(res.status).toBe(400);
    expect(await statusOf(order.id)).toBe(EOrderStatus.READY);
  });

  it("returns 400 for an offline courier", async () => {
    const { store } = await setup();
    const customer = await createCustomer();
    const { courier } = await setupCourier({ online: false });
    const order = await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.READY,
    );

    const res = await request(app)
      .patch(`${COURIER}/${order.id}/take`)
      .set(auth(courier.accessToken));

    expect(res.status).toBe(400);
    expect(await statusOf(order.id)).toBe(EOrderStatus.READY);
  });

  it.each([
    EOrderStatus.PENDING_OWNER,
    EOrderStatus.ACCEPTED,
    EOrderStatus.TAKEN,
    EOrderStatus.DELIVERED,
  ])("returns 404 for an order in %s", async (status) => {
    const { store } = await setup();
    const customer = await createCustomer();
    const { courier } = await setupCourier();
    const order = await createOrder(customer.user.id, store.id, status);

    const res = await request(app)
      .patch(`${COURIER}/${order.id}/take`)
      .set(auth(courier.accessToken));

    expect(res.status).toBe(404);
    expect(await statusOf(order.id)).toBe(status);
  });

  it("returns 404 when the order is already taken by another courier", async () => {
    const { store } = await setup();
    const customer = await createCustomer();
    const first = await setupCourier();
    const second = await setupCourier();
    const order = await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.READY,
    );

    const ok = await request(app)
      .patch(`${COURIER}/${order.id}/take`)
      .set(auth(first.courier.accessToken));
    const fail = await request(app)
      .patch(`${COURIER}/${order.id}/take`)
      .set(auth(second.courier.accessToken));

    expect(ok.status).toBe(200);
    expect(fail.status).toBe(404);
    const db = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(db.courierId).toBe(first.profile.id);
  });

  it("lets only one of two simultaneous couriers take the order", async () => {
    const { store } = await setup();
    const customer = await createCustomer();
    const first = await setupCourier();
    const second = await setupCourier();
    const order = await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.READY,
    );

    const results = await Promise.all([
      request(app)
        .patch(`${COURIER}/${order.id}/take`)
        .set(auth(first.courier.accessToken)),
      request(app)
        .patch(`${COURIER}/${order.id}/take`)
        .set(auth(second.courier.accessToken)),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([200, 404]);
  });

  it("returns 404 for a non-existent order", async () => {
    const { courier } = await setupCourier();
    const res = await request(app)
      .patch(`${COURIER}/${randomUUID()}/take`)
      .set(auth(courier.accessToken));
    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid id", async () => {
    const { courier } = await setupCourier();
    const res = await request(app)
      .patch(`${COURIER}/not-a-uuid/take`)
      .set(auth(courier.accessToken));
    expect(res.status).toBe(400);
  });
});

describe("PATCH /orders/courier/:id/pickup", () => {
  it("picks up own TAKEN order", async () => {
    const { store } = await setup();
    const customer = await createCustomer();
    const { courier, profile } = await setupCourier();
    const order = await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.TAKEN,
      profile.id,
    );

    const res = await request(app)
      .patch(`${COURIER}/${order.id}/pickup`)
      .set(auth(courier.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(EOrderStatus.PICKED_UP);
  });

  it.each([EOrderStatus.READY, EOrderStatus.PICKED_UP, EOrderStatus.DELIVERED])(
    "returns 400 for an own order in %s",
    async (status) => {
      const { store } = await setup();
      const customer = await createCustomer();
      const { courier, profile } = await setupCourier();
      const order = await createOrder(
        customer.user.id,
        store.id,
        status,
        profile.id,
      );

      const res = await request(app)
        .patch(`${COURIER}/${order.id}/pickup`)
        .set(auth(courier.accessToken));

      expect(res.status).toBe(400);
      expect(await statusOf(order.id)).toBe(status);
    },
  );

  it("returns 404 for another courier's order", async () => {
    const { store } = await setup();
    const customer = await createCustomer();
    const owner = await setupCourier();
    const stranger = await setupCourier();
    const order = await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.TAKEN,
      owner.profile.id,
    );

    const res = await request(app)
      .patch(`${COURIER}/${order.id}/pickup`)
      .set(auth(stranger.courier.accessToken));

    expect(res.status).toBe(404);
    expect(await statusOf(order.id)).toBe(EOrderStatus.TAKEN);
  });

  it("returns 404 for a non-existent order", async () => {
    const { courier } = await setupCourier();
    const res = await request(app)
      .patch(`${COURIER}/${randomUUID()}/pickup`)
      .set(auth(courier.accessToken));
    expect(res.status).toBe(404);
  });

  it("returns 403 for a customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .patch(`${COURIER}/${randomUUID()}/pickup`)
      .set(auth(customer.accessToken));
    expect(res.status).toBe(403);
  });
});

describe("PATCH /orders/courier/:id/deliver", () => {
  it("delivers own PICKED_UP order", async () => {
    const { store } = await setup();
    const customer = await createCustomer();
    const { courier, profile } = await setupCourier();
    const order = await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.PICKED_UP,
      profile.id,
    );

    const res = await request(app)
      .patch(`${COURIER}/${order.id}/deliver`)
      .set(auth(courier.accessToken));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Delivered order" });
    expect(await statusOf(order.id)).toBe(EOrderStatus.DELIVERED);
  });

  it.each([EOrderStatus.TAKEN, EOrderStatus.DELIVERED])(
    "returns 400 for an own order in %s",
    async (status) => {
      const { store } = await setup();
      const customer = await createCustomer();
      const { courier, profile } = await setupCourier();
      const order = await createOrder(
        customer.user.id,
        store.id,
        status,
        profile.id,
      );

      const res = await request(app)
        .patch(`${COURIER}/${order.id}/deliver`)
        .set(auth(courier.accessToken));

      expect(res.status).toBe(400);
      expect(await statusOf(order.id)).toBe(status);
    },
  );

  it("returns 404 for another courier's order", async () => {
    const { store } = await setup();
    const customer = await createCustomer();
    const owner = await setupCourier();
    const stranger = await setupCourier();
    const order = await createOrder(
      customer.user.id,
      store.id,
      EOrderStatus.PICKED_UP,
      owner.profile.id,
    );

    const res = await request(app)
      .patch(`${COURIER}/${order.id}/deliver`)
      .set(auth(stranger.courier.accessToken));

    expect(res.status).toBe(404);
    expect(await statusOf(order.id)).toBe(EOrderStatus.PICKED_UP);
  });

  it("returns 404 for a non-existent order", async () => {
    const { courier } = await setupCourier();
    const res = await request(app)
      .patch(`${COURIER}/${randomUUID()}/deliver`)
      .set(auth(courier.accessToken));
    expect(res.status).toBe(404);
  });

  it("returns 403 for a customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .patch(`${COURIER}/${randomUUID()}/deliver`)
      .set(auth(customer.accessToken));
    expect(res.status).toBe(403);
  });
});

// --------------------------------------------------------------- LIFECYCLE

describe("order lifecycle", () => {
  it("goes through the whole flow from creation to delivery", async () => {
    const { owner, store, product } = await setup();
    const customer = await createCustomer();
    const { courier, profile } = await setupCourier();

    const created = await request(app)
      .post(CUSTOMER)
      .set(auth(customer.accessToken))
      .send(orderBody(store.id, product.id, 2));
    expect(created.status).toBe(201);
    const id = created.body.id as string;

    const accept = await request(app)
      .patch(`${OWNER}/${id}/accept`)
      .set(auth(owner.accessToken));
    expect(accept.status).toBe(200);

    const ready = await request(app)
      .patch(`${OWNER}/${id}/ready`)
      .set(auth(owner.accessToken));
    expect(ready.status).toBe(200);

    const available = await request(app)
      .get(`${COURIER}/available`)
      .set(auth(courier.accessToken));
    expect(available.body.map((o: { id: string }) => o.id)).toEqual([id]);

    const take = await request(app)
      .patch(`${COURIER}/${id}/take`)
      .set(auth(courier.accessToken));
    expect(take.status).toBe(200);

    const pickup = await request(app)
      .patch(`${COURIER}/${id}/pickup`)
      .set(auth(courier.accessToken));
    expect(pickup.status).toBe(200);

    const deliver = await request(app)
      .patch(`${COURIER}/${id}/deliver`)
      .set(auth(courier.accessToken));
    expect(deliver.status).toBe(200);

    const db = await prisma.order.findUniqueOrThrow({ where: { id } });
    expect(db.status).toBe(EOrderStatus.DELIVERED);
    expect(db.courierId).toBe(profile.id);

    // the customer can no longer cancel a delivered order
    const cancel = await request(app)
      .patch(`${CUSTOMER}/${id}/cancel`)
      .set(auth(customer.accessToken));
    expect(cancel.status).toBe(404);
  });
});
