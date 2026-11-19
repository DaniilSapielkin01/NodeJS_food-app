/*
  Warnings:

  - Added the required column `requestHash` to the `Refund` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Refund" ADD COLUMN     "requestHash" TEXT NOT NULL;

-- Payment: суммы
ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_amount_positive" CHECK ("amount" > 0),
  ADD CONSTRAINT "Payment_fee_range" CHECK ("feeAmount" >= 0 AND "feeAmount" <= "amount"),
  ADD CONSTRAINT "Payment_refunded_range" CHECK ("refundedAmount" >= 0 AND "refundedAmount" <= "amount");

-- Balance: held никогда не уходит в минус; available не уходит в минус,
-- кроме системного аккаунта EXTERNAL (в него по схеме проводок DEPOSIT пишется минус)
ALTER TABLE "Balance"
  ADD CONSTRAINT "Balance_held_non_negative" CHECK ("held" >= 0),
  ADD CONSTRAINT "Balance_available_non_negative"
    CHECK ("available" >= 0 OR "userId" = '00000000-0000-0000-0000-000000000001');

-- Положительные суммы в остальных таблицах
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_amount_positive" CHECK ("amount" > 0);

-- Один живой платёж на заказ
CREATE UNIQUE INDEX "Payment_orderId_active_key"
  ON "Payment" ("orderId")
  WHERE "status" IN ('PENDING', 'AUTHORIZED', 'CAPTURED', 'PARTIALLY_REFUNDED');