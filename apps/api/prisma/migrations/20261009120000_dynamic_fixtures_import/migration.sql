-- Tournament configuration
ALTER TABLE "tournaments" ADD COLUMN "description" TEXT;
ALTER TABLE "tournaments" ADD COLUMN "city" TEXT;
ALTER TABLE "tournaments" ADD COLUMN "venues" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "tournaments" ADD COLUMN "matchDurationMin" INTEGER NOT NULL DEFAULT 60;

-- Match dynamic fixture fields
ALTER TABLE "matches" ADD COLUMN "groupName" TEXT;
ALTER TABLE "matches" ADD COLUMN "legNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "matches" ADD COLUMN "label" TEXT;
ALTER TABLE "matches" ADD COLUMN "phaseNumber" INTEGER;
ALTER TABLE "matches" ADD COLUMN "winnerTeamId" TEXT;

-- Round configuration
ALTER TABLE "tournament_rounds" ADD COLUMN "startDate" TIMESTAMP(3);
ALTER TABLE "tournament_rounds" ADD COLUMN "groupsCount" INTEGER;
ALTER TABLE "tournament_rounds" ADD COLUMN "description" TEXT;

CREATE INDEX "matches_tournamentId_roundId_idx" ON "matches"("tournamentId", "roundId");
CREATE INDEX "matches_tournamentId_dayNumber_idx" ON "matches"("tournamentId", "dayNumber");
