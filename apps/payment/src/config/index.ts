import "dotenv/config";

const rawPublicKey = process.env.SERVICE_JWT_PUBLIC_KEY;
if (!rawPublicKey) {
  throw new Error("SERVICE_JWT_PUBLIC_KEY is required");
}

export const config = {
  port: Number(process.env.PORT ?? 5004),
  nodeEnv: process.env.NODE_ENV ?? "development",

  serviceJwt: {
    publicKey: rawPublicKey,
    issuer: "marketplace",
    audience: "payment",
  },
};
