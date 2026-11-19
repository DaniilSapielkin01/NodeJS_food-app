import jwt from "jsonwebtoken";

const privateKey = process.env.PAYMENT_JWT_PRIVATE_KEY;

if (!privateKey) {
  throw new Error("PAYMENT_JWT_PRIVATE_KEY is required");
}

export const signPaymentToken = () =>
  jwt.sign({}, privateKey, {
    algorithm: "ES256",
    issuer: "marketplace",
    audience: "payment",
    subject: "marketplace-service",
    expiresIn: 60,
  });
