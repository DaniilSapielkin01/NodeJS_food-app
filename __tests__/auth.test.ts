import request from "supertest";

import { prisma } from "@database";

import { app } from "../src/app";

const user = {
  email: "test@example.com",
  password: "password123",
  name: "Test",
};

type Tokens = { accessToken: string; refreshToken: string };

// assumption: tokens are at the root of the body. If nested, change only here
const extractTokens = (body: Tokens): Tokens => ({
  accessToken: body.accessToken,
  refreshToken: body.refreshToken,
});

const signup = (data: object = user) =>
  request(app).post("/auth/signup").send(data);
const login = (data: object = user) =>
  request(app).post("/auth/login").send(data);

const registerAndLogin = async () => {
  await signup();
  const res = await login({ email: user.email, password: user.password });
  return extractTokens(res.body);
};

beforeEach(async () => {
  // refresh tokens are removed by cascade
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /auth/signup", () => {
  it("creates a user and does not return the password", async () => {
    const res = await signup();
    expect(res.status).toBe(201);
    expect(JSON.stringify(res.body)).not.toContain(user.password);
  });

  it("returns 409 for a taken email", async () => {
    await signup();
    const res = await signup();
    expect(res.status).toBe(409);
  });

  it("returns 400 for an invalid email", async () => {
    const res = await signup({ ...user, email: "not-an-email" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for a password shorter than 6 characters", async () => {
    const res = await signup({ ...user, password: "12345" });
    expect(res.status).toBe(400);
  });

  it("returns 400 without name", async () => {
    const res = await signup({ email: user.email, password: user.password });
    expect(res.status).toBe(400);
  });
});

describe("POST /auth/login", () => {
  it("returns access and refresh tokens", async () => {
    await signup();
    const res = await login({ email: user.email, password: user.password });
    expect(res.status).toBe(200);
    const { accessToken, refreshToken } = extractTokens(res.body);
    expect(accessToken).toEqual(expect.any(String));
    expect(refreshToken).toEqual(expect.any(String));
  });

  it("returns 401 for a wrong password", async () => {
    await signup();
    const res = await login({ email: user.email, password: "wrongpass1" });
    expect(res.status).toBe(401);
  });

  it("returns 401 with the same body for a non-existent email", async () => {
    await signup();
    const wrongPass = await login({
      email: user.email,
      password: "wrongpass1",
    });
    const noUser = await login({
      email: "nobody@example.com",
      password: "wrongpass1",
    });
    expect(noUser.status).toBe(401);
    expect(noUser.body).toEqual(wrongPass.body);
  });

  it("returns 400 for an invalid body", async () => {
    const res = await login({});
    expect(res.status).toBe(400);
  });
});

describe("POST /auth/refresh", () => {
  it("returns a new token pair", async () => {
    const { refreshToken } = await registerAndLogin();
    const res = await request(app).post("/auth/refresh").send({ refreshToken });
    expect(res.status).toBe(200);
    expect(extractTokens(res.body).accessToken).toEqual(expect.any(String));
  });

  it("returns 401 for a garbage token", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken: "garbage" });
    expect(res.status).toBe(401);
  });
});

describe("POST /auth/logout", () => {
  it("makes the refresh token unusable after logout", async () => {
    const { refreshToken } = await registerAndLogin();
    await request(app).post("/auth/logout").send({ refreshToken });
    const res = await request(app).post("/auth/refresh").send({ refreshToken });
    expect(res.status).toBe(401);
  });
});

describe("POST /auth/logout-all", () => {
  it("returns 401 without an access token", async () => {
    const res = await request(app).post("/auth/logout-all");
    expect(res.status).toBe(401);
  });

  it("returns 401 with a broken token", async () => {
    const res = await request(app)
      .post("/auth/logout-all")
      .set("Authorization", "Bearer garbage");
    expect(res.status).toBe(401);
  });

  it("revokes all refresh tokens of the user", async () => {
    await signup();
    const creds = { email: user.email, password: user.password };
    const first = extractTokens((await login(creds)).body);
    const second = extractTokens((await login(creds)).body);

    const res = await request(app)
      .post("/auth/logout-all")
      .set("Authorization", `Bearer ${first.accessToken}`);
    expect([200, 204]).toContain(res.status);

    for (const { refreshToken } of [first, second]) {
      const r = await request(app).post("/auth/refresh").send({ refreshToken });
      expect(r.status).toBe(401);
    }
  });
});
