import request from "supertest";

import { prisma } from "@database";
import { ERole, EVehicleType } from "@generated/prisma/enums";

import { app } from "../src/app";
import {
  authHelper,
  cleanDb,
  createCourier,
  createCustomer,
  createOwner,
} from "./helpers";

const vehicleType = [Object.values(EVehicleType)[0]];
const phone = "+380000000000";

beforeEach(cleanDb);

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /users/me", () => {
  it("returns 401 without an access token", async () => {
    const res = await request(app).get("/users/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user without the password", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .get("/users/me")
      .set(authHelper(customer.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(customer.user.id);
    expect(res.body.password).toBeUndefined();
  });

  it("includes the owner profile only with ?role=OWNER", async () => {
    const owner = await createOwner();

    const without = await request(app)
      .get("/users/me")
      .set(authHelper(owner.accessToken));
    expect(without.body.ownerProfile).toBeUndefined();

    const withRole = await request(app)
      .get("/users/me?role=OWNER")
      .set(authHelper(owner.accessToken));
    expect(withRole.body.ownerProfile).toBeDefined();
  });

  it("includes the courier profile with ?role=COURIER", async () => {
    const courier = await createCourier();
    const res = await request(app)
      .get("/users/me?role=COURIER")
      .set(authHelper(courier.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.courierProfile).toBeDefined();
  });

  it("returns 400 for an invalid role", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .get("/users/me?role=NOPE")
      .set(authHelper(customer.accessToken));
    expect(res.status).toBe(400);
  });
});

describe("PATCH /users/me", () => {
  it("returns 401 without an access token", async () => {
    const res = await request(app).patch("/users/me").send({ name: "New" });
    expect(res.status).toBe(401);
  });

  it("updates the name", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .patch("/users/me")
      .set(authHelper(customer.accessToken))
      .send({ name: "New name" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New name");
  });

  it("does not return the password", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .patch("/users/me")
      .set(authHelper(customer.accessToken))
      .send({ name: "New name" });

    expect(res.body.password).toBeUndefined();
  });

  it("returns 400 for an empty name", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .patch("/users/me")
      .set(authHelper(customer.accessToken))
      .send({ name: "   " });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /users/owner", () => {
  it("returns 403 for a customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .patch("/users/owner")
      .set(authHelper(customer.accessToken))
      .send({ companyName: "New" });
    expect(res.status).toBe(403);
  });

  it("updates the owner profile", async () => {
    const owner = await createOwner();
    const res = await request(app)
      .patch("/users/owner")
      .set(authHelper(owner.accessToken))
      .send({ companyName: "New company", phone: "+380111111111" });

    expect(res.status).toBe(200);
    expect(res.body.companyName).toBe("New company");
    expect(res.body.phone).toBe("+380111111111");
  });

  it("returns 400 for an empty companyName", async () => {
    const owner = await createOwner();
    const res = await request(app)
      .patch("/users/owner")
      .set(authHelper(owner.accessToken))
      .send({ companyName: "" });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /users/courier", () => {
  it("returns 403 for a customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .patch("/users/courier")
      .set(authHelper(customer.accessToken))
      .send({ phone });
    expect(res.status).toBe(403);
  });

  it("updates the courier profile", async () => {
    const courier = await createCourier();
    const res = await request(app)
      .patch("/users/courier")
      .set(authHelper(courier.accessToken))
      .send({ phone: "+380111111111", vehicleType });

    expect(res.status).toBe(200);
    expect(res.body.phone).toBe("+380111111111");
    expect(res.body.vehicleType).toEqual(vehicleType);
  });

  it("returns 400 for an invalid vehicleType", async () => {
    const courier = await createCourier();
    const res = await request(app)
      .patch("/users/courier")
      .set(authHelper(courier.accessToken))
      .send({ vehicleType: ["NOPE"] });
    expect(res.status).toBe(400);
  });

  it("returns 400 for an empty vehicleType array", async () => {
    const courier = await createCourier();
    const res = await request(app)
      .patch("/users/courier")
      .set(authHelper(courier.accessToken))
      .send({ vehicleType: [] });
    expect(res.status).toBe(400);
  });
});

describe("POST /users/roles", () => {
  it("returns 401 without an access token", async () => {
    const res = await request(app)
      .post("/users/roles")
      .send({ role: "OWNER", companyName: "Acme", phone });
    expect(res.status).toBe(401);
  });

  it("adds the owner role and creates the profile", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post("/users/roles")
      .set(authHelper(customer.accessToken))
      .send({ role: "OWNER", companyName: "Acme", phone });

    expect(res.status).toBe(201);

    const db = await prisma.user.findUniqueOrThrow({
      where: { id: customer.user.id },
      include: { ownerProfile: true },
    });
    expect(db.roles).toContain(ERole.OWNER);
    expect(db.ownerProfile?.companyName).toBe("Acme");
  });

  it("adds the courier role and creates the profile", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post("/users/roles")
      .set(authHelper(customer.accessToken))
      .send({ role: "COURIER", vehicleType, phone });

    expect(res.status).toBe(201);

    const db = await prisma.user.findUniqueOrThrow({
      where: { id: customer.user.id },
      include: { courierProfile: true },
    });
    expect(db.roles).toContain(ERole.COURIER);
    expect(db.courierProfile?.vehicleType).toEqual(vehicleType);
  });

  it("returns new tokens that give access to the new role", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post("/users/roles")
      .set(authHelper(customer.accessToken))
      .send({ role: "OWNER", companyName: "Acme", phone });

    const check = await request(app)
      .patch("/users/owner")
      .set(authHelper(res.body.accessToken))
      .send({ companyName: "Changed" });
    expect(check.status).toBe(200);
  });

  it("returns 400 if the role is already added", async () => {
    const owner = await createOwner();
    const res = await request(app)
      .post("/users/roles")
      .set(authHelper(owner.accessToken))
      .send({ role: "OWNER", companyName: "Acme", phone });
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid role", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post("/users/roles")
      .set(authHelper(customer.accessToken))
      .send({ role: "CUSTOMER", phone });
    expect(res.status).toBe(400);
  });

  it("returns 400 for OWNER without companyName", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post("/users/roles")
      .set(authHelper(customer.accessToken))
      .send({ role: "OWNER", phone });
    expect(res.status).toBe(400);
  });

  it("returns 400 for COURIER without vehicleType", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post("/users/roles")
      .set(authHelper(customer.accessToken))
      .send({ role: "COURIER", phone });
    expect(res.status).toBe(400);
  });

  it("returns 400 without phone", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post("/users/roles")
      .set(authHelper(customer.accessToken))
      .send({ role: "OWNER", companyName: "Acme" });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /users/roles", () => {
  it("returns 401 without an access token", async () => {
    const res = await request(app).delete("/users/roles?role=OWNER");
    expect(res.status).toBe(401);
  });

  it("removes the role and the profile", async () => {
    const owner = await createOwner();
    const res = await request(app)
      .delete("/users/roles?role=OWNER")
      .set(authHelper(owner.accessToken));

    expect(res.status).toBe(200);

    const db = await prisma.user.findUniqueOrThrow({
      where: { id: owner.user.id },
      include: { ownerProfile: true },
    });
    expect(db.roles).not.toContain(ERole.OWNER);
    expect(db.ownerProfile).toBeNull();
  });

  it("returns new tokens without access to the removed role", async () => {
    const owner = await createOwner();
    const res = await request(app)
      .delete("/users/roles?role=OWNER")
      .set(authHelper(owner.accessToken));

    const check = await request(app)
      .patch("/users/owner")
      .set(authHelper(res.body.tokens.accessToken))
      .send({ companyName: "Changed" });
    expect(check.status).toBe(403);
  });

  it("returns 400 if the user does not have the role", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .delete("/users/roles?role=COURIER")
      .set(authHelper(customer.accessToken));
    expect(res.status).toBe(400);
  });

  it("returns 400 without the role query", async () => {
    const owner = await createOwner();
    const res = await request(app)
      .delete("/users/roles")
      .set(authHelper(owner.accessToken));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /users/me", () => {
  it("returns 401 without an access token", async () => {
    const res = await request(app).delete("/users/me");
    expect(res.status).toBe(401);
  });

  it("deletes the user with the profile", async () => {
    const owner = await createOwner();
    const res = await request(app)
      .delete("/users/me")
      .set(authHelper(owner.accessToken));
    expect(res.status).toBe(200);

    const user = await prisma.user.findUnique({ where: { id: owner.user.id } });
    expect(user).toBeNull();

    const profile = await prisma.ownerProfile.findUnique({
      where: { userId: owner.user.id },
    });
    expect(profile).toBeNull();
  });
});
