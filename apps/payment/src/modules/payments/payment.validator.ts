import {
  body,
  header,
  param,
  query,
  type ValidationChain,
} from "express-validator";

import { withValidation } from "@packages/validation";

import {
  ECurrency,
  EMethodPayment,
  EPaymentStatus,
  EProviderPayment,
} from "@generated/prisma/enums";

const MAX_AMOUNT = 9223372036854775807n; // max int8 in Postgres

const RULES: Record<
  EMethodPayment,
  { providers: EProviderPayment[]; currencies: ECurrency[] }
> = {
  CARD: {
    providers: [EProviderPayment.MOCK, EProviderPayment.STRIPE],
    currencies: [ECurrency.USD, ECurrency.EUR, ECurrency.UAH],
  },
  CRYPTO: {
    providers: [EProviderPayment.CRYPTO],
    currencies: [ECurrency.USDT, ECurrency.USDC],
  },
};

// UUID validate
const uuid = (chain: ValidationChain) =>
  chain
    .isString()
    .withMessage("must be a string")
    .bail()
    .isUUID()
    .withMessage("must be a UUID")
    .bail()
    .toLowerCase();

// ---------- Idempotency-Key (use in refund) ----------

export const idempotencyKeyValidator = header("idempotency-key")
  .isString()
  .withMessage("Idempotency-Key header is required")
  .bail()
  .matches(/^[\w.:-]{8,128}$/)
  .withMessage("Idempotency-Key must be 8-128 chars: letters, digits, _ . : -");

// ---------- POST /payments ----------

export const createPaymentValidator = withValidation([
  idempotencyKeyValidator,

  uuid(body("orderId")),
  uuid(body("userId")),
  uuid(body("toUserId").optional()), // либо нет поля, либо UUID; null не принимаем

  body("amount")
    .isString()
    .withMessage("amount must be a string")
    .bail()
    .matches(/^[1-9]\d{0,18}$/)
    .withMessage(
      "amount must be a positive integer in minor units, no leading zeros",
    )
    .bail()
    .custom((value: string) => BigInt(value) <= MAX_AMOUNT)
    .withMessage("amount is too large")
    .bail()
    .customSanitizer((value: string) => BigInt(value)),

  body("method")
    .isIn(Object.values(EMethodPayment))
    .withMessage(
      `method must be one of: ${Object.values(EMethodPayment).join(", ")}`,
    ),

  body("provider")
    .isIn(Object.values(EProviderPayment))
    .withMessage(
      `provider must be one of: ${Object.values(EProviderPayment).join(", ")}`,
    )
    .bail()
    .custom((provider, { req }) => {
      const rule = RULES[req.body.method as EMethodPayment];
      return !rule || rule.providers.includes(provider);
    })
    .withMessage("provider does not match method"),

  body("currency")
    .isIn(Object.values(ECurrency))
    .withMessage(
      `currency must be one of: ${Object.values(ECurrency).join(", ")}`,
    )
    .bail()
    .custom((currency, { req }) => {
      const rule = RULES[req.body.method as EMethodPayment];
      return !rule || rule.currencies.includes(currency);
    })
    .withMessage("currency does not match method"),
]);

// ---------- :id в cancel, capture, release, GET /payments/:id ----------

export const paymentIdParamValidator = withValidation([uuid(param("id"))]);

// ---------- GET /payments ----------

export const listPaymentsValidator = withValidation([
  uuid(query("orderId").optional()),
  uuid(query("userId").optional()),

  query("status")
    .optional()
    .isString()
    .bail()
    .isIn(Object.values(EPaymentStatus))
    .withMessage(
      `status must be one of: ${Object.values(EPaymentStatus).join(", ")}`,
    ),

  query("limit")
    .optional()
    .isString()
    .bail()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be 1-100")
    .toInt(),

  query("offset")
    .optional()
    .isString()
    .bail()
    .isInt({ min: 0, max: 1_000_000 })
    .withMessage("offset must be 0-1000000")
    .toInt(),
]);
