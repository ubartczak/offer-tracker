/*
  Warnings:

  - You are about to drop the column `salary` on the `JobApplication` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('MONTHLY', 'HOURLY');

-- AlterTable
ALTER TABLE "JobApplication" DROP COLUMN "salary",
ADD COLUMN     "contractType" TEXT,
ADD COLUMN     "currency" TEXT DEFAULT 'PLN',
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "interviewAt" TIMESTAMP(3),
ADD COLUMN     "offerExpiresAt" TIMESTAMP(3),
ADD COLUMN     "replyBy" TIMESTAMP(3),
ADD COLUMN     "salaryMax" INTEGER,
ADD COLUMN     "salaryMin" INTEGER,
ADD COLUMN     "salaryType" "SalaryType" NOT NULL DEFAULT 'MONTHLY';
