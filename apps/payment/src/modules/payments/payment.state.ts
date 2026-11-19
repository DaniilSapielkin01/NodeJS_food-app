import { ConflictError } from "@packages/errors";

import { EPaymentStatus } from "@generated/prisma/enums";

const S = EPaymentStatus;

export const PAYMENT_TRANSITIONS: Record<EPaymentStatus, EPaymentStatus[]> = {
  [S.PENDING]: [S.AUTHORIZED, S.FAILED, S.CANCELED, S.EXPIRED],
  [S.AUTHORIZED]: [S.CAPTURED, S.RELEASED],
  [S.CAPTURED]: [S.PARTIALLY_REFUNDED, S.REFUNDED],
  [S.PARTIALLY_REFUNDED]: [S.PARTIALLY_REFUNDED, S.REFUNDED],
  [S.RELEASED]: [],
  [S.FAILED]: [],
  [S.CANCELED]: [],
  [S.EXPIRED]: [],
  [S.REFUNDED]: [],
};

export const canTransition = (from: EPaymentStatus, to: EPaymentStatus) =>
  PAYMENT_TRANSITIONS[from].includes(to);

export const assertTransition = (from: EPaymentStatus, to: EPaymentStatus) => {
  if (!canTransition(from, to)) {
    throw new ConflictError(
      `Cannot change payment status from ${from} to ${to}`,
    );
  }
};

export const isTerminal = (status: EPaymentStatus) =>
  PAYMENT_TRANSITIONS[status].length === 0;
