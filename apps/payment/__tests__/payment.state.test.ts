import { ConflictError } from "@packages/errors";

import { EPaymentStatus } from "@generated/prisma/enums";
import {
  assertTransition,
  canTransition,
  isTerminal,
  PAYMENT_TRANSITIONS,
} from "@modules/payments/payment.state";

const S = EPaymentStatus;
const all = Object.values(S);

describe("payment state machine", () => {
  it("allows every transition from the map", () => {
    for (const from of all) {
      for (const to of PAYMENT_TRANSITIONS[from]) {
        expect(canTransition(from, to)).toBe(true);
      }
    }
  });

  it("rejects every transition not in the map", () => {
    for (const from of all) {
      for (const to of all) {
        if (!PAYMENT_TRANSITIONS[from].includes(to)) {
          expect(() => assertTransition(from, to)).toThrow(ConflictError);
        }
      }
    }
  });

  it.each([
    [S.PENDING, S.AUTHORIZED],
    [S.PENDING, S.FAILED],
    [S.PENDING, S.CANCELED],
    [S.PENDING, S.EXPIRED],
    [S.AUTHORIZED, S.CAPTURED],
    [S.AUTHORIZED, S.RELEASED],
    [S.CAPTURED, S.PARTIALLY_REFUNDED],
    [S.CAPTURED, S.REFUNDED],
    [S.PARTIALLY_REFUNDED, S.PARTIALLY_REFUNDED],
    [S.PARTIALLY_REFUNDED, S.REFUNDED],
  ])("allows %s -> %s", (from, to) => {
    expect(canTransition(from, to)).toBe(true);
    expect(() => assertTransition(from, to)).not.toThrow();
  });

  it.each([
    [S.PENDING, S.CAPTURED],
    [S.PENDING, S.REFUNDED],
    [S.AUTHORIZED, S.CANCELED],
    [S.AUTHORIZED, S.REFUNDED],
    [S.CAPTURED, S.RELEASED],
    [S.CAPTURED, S.AUTHORIZED],
    [S.CANCELED, S.AUTHORIZED],
    [S.EXPIRED, S.AUTHORIZED],
    [S.FAILED, S.PENDING],
    [S.RELEASED, S.CAPTURED],
    [S.REFUNDED, S.CAPTURED],
    [S.REFUNDED, S.PARTIALLY_REFUNDED],
  ])("rejects %s -> %s", (from, to) => {
    expect(canTransition(from, to)).toBe(false);
    expect(() => assertTransition(from, to)).toThrow(ConflictError);
  });

  it("terminal statuses have no exits", () => {
    for (const s of [S.RELEASED, S.FAILED, S.CANCELED, S.EXPIRED, S.REFUNDED]) {
      expect(isTerminal(s)).toBe(true);
    }
  });

  it("non-terminal statuses have exits", () => {
    for (const s of [
      S.PENDING,
      S.AUTHORIZED,
      S.CAPTURED,
      S.PARTIALLY_REFUNDED,
    ]) {
      expect(isTerminal(s)).toBe(false);
    }
  });
});
