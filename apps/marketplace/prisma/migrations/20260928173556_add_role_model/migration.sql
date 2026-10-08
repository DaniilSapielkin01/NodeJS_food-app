-- CreateEnum
CREATE TYPE "ERole" AS ENUM ('OWNER', 'COURIER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "EVoucherCategory" AS ENUM ('FOOD', 'MEDICINE', 'TRANSPORT');

-- CreateEnum
CREATE TYPE "EProductType" AS ENUM ('EDIBLE', 'NON_EDIBLE');

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "Voucher" DROP CONSTRAINT "Voucher_ownerId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "ERole" NOT NULL DEFAULT 'CUSTOMER';

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
