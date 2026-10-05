/*
  Warnings:

  - The values [PENDING] on the enum `EOrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EOrderStatus_new" AS ENUM ('PENDING_PAYMENT', 'PENDING_OWNER', 'ACCEPTED', 'REJECTED', 'READY', 'TAKEN', 'PICKED_UP', 'DELIVERED', 'CANCELLED');
ALTER TABLE "public"."Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "EOrderStatus_new" USING ("status"::text::"EOrderStatus_new");
ALTER TYPE "EOrderStatus" RENAME TO "EOrderStatus_old";
ALTER TYPE "EOrderStatus_new" RENAME TO "EOrderStatus";
DROP TYPE "public"."EOrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';
COMMIT;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';
