-- AlterTable
ALTER TABLE "sanctions" ADD COLUMN "matchId" TEXT;
ALTER TABLE "sanctions" ADD COLUMN "matchesServed" INTEGER NOT NULL DEFAULT 0;
