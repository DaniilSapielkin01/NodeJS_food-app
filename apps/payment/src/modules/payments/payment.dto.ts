import { Payment } from "@generated/prisma/client";

export type PaymentDto = {
  id: string;
  orderId: string;
  userId: string;
  toUserId: string | null;

  amount: string;
  feeAmount: string;
  refundedAmount: string;

  currency: Payment["currency"];
  method: Payment["method"];
  provider: Payment["provider"];

  status: Payment["status"];
  failureReason: string | null;

  expiresAt: string | null;
  authorizedAt: string | null;
  capturedAt: string | null;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const iso = (date: Date | null): string | null =>
  date ? date.toISOString() : null;

export const toPaymentDto = (p: Payment): PaymentDto => ({
  id: p.id,
  orderId: p.orderId,
  userId: p.userId,
  toUserId: p.toUserId,

  amount: p.amount.toString(),
  feeAmount: p.feeAmount.toString(),
  refundedAmount: p.refundedAmount.toString(),

  currency: p.currency,
  method: p.method,
  provider: p.provider,

  status: p.status,
  failureReason: p.failureReason,

  expiresAt: iso(p.expiresAt),
  authorizedAt: iso(p.authorizedAt),
  capturedAt: iso(p.capturedAt),
  releasedAt: iso(p.releasedAt),
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});

export const toPaymentDtoList = (items: Payment[]): PaymentDto[] =>
  items.map(toPaymentDto);
