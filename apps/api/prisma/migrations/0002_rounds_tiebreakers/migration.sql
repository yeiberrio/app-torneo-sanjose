-- CreateEnum
CREATE TYPE "RoundType" AS ENUM ('ROUND_ROBIN', 'KNOCKOUT', 'POINTS_CLASSIFICATION', 'GROUP_STAGE');

-- CreateEnum
CREATE TYPE "TiebreakerCriteria" AS ENUM ('HEAD_TO_HEAD', 'GOAL_DIFFERENCE', 'GOALS_FOR', 'GOALS_AGAINST', 'FAIR_PLAY', 'PENALTY_SHOOTOUT', 'LOTS_DRAWING', 'AWAY_GOALS', 'WINS', 'DRAWS');

-- CreateTable
CREATE TABLE "tournament_rounds" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "name" TEXT,
    "type" "RoundType" NOT NULL,
    "teamsAdvancing" INTEGER,
    "advanceAll" BOOLEAN NOT NULL DEFAULT false,
    "legs" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_tiebreakers" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "roundId" TEXT,
    "criteria" "TiebreakerCriteria" NOT NULL,
    "priority" INTEGER NOT NULL,

    CONSTRAINT "tournament_tiebreakers_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "matches" ADD COLUMN "roundId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tournament_rounds_tournamentId_roundNumber_key" ON "tournament_rounds"("tournamentId", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_tiebreakers_tournamentId_roundId_criteria_key" ON "tournament_tiebreakers"("tournamentId", "roundId", "criteria");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "tournament_rounds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_rounds" ADD CONSTRAINT "tournament_rounds_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_tiebreakers" ADD CONSTRAINT "tournament_tiebreakers_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_tiebreakers" ADD CONSTRAINT "tournament_tiebreakers_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "tournament_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
