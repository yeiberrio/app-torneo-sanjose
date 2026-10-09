export interface StandingTeam { id: string; name: string; logoUrl?: string | null; groupName?: string | null }
export interface StandingMatch {
  teamAId: string; teamBId: string; scoreA: number | null; scoreB: number | null; status: string; scheduledAt?: Date;
  cards?: { teamId: string; type: string }[];
}
export interface StandingRow {
  teamId: string; teamName: string; logoUrl: string | null; groupName: string | null;
  played: number; won: number; drawn: number; lost: number;
  goalsFor: number; goalsAgainst: number; goalDifference: number; points: number;
  yellowCards: number; redCards: number; fairPlayPoints: number;
  form: ('W' | 'D' | 'L')[];
  position?: number;
}

export const DEFAULT_TIEBREAKERS = ['GOAL_DIFFERENCE', 'GOALS_FOR', 'HEAD_TO_HEAD', 'FAIR_PLAY'];

export function computeStandings(
  teams: StandingTeam[],
  matches: StandingMatch[],
  points: { winPoints: number; drawPoints: number; lossPoints: number },
  tiebreakers: string[] = DEFAULT_TIEBREAKERS,
): StandingRow[] {
  const map = new Map<string, StandingRow>();
  for (const t of teams) {
    map.set(t.id, {
      teamId: t.id, teamName: t.name, logoUrl: t.logoUrl ?? null, groupName: t.groupName ?? null,
      played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
      yellowCards: 0, redCards: 0, fairPlayPoints: 0, form: [],
    });
  }
  const finished = matches
    .filter(m => m.status === 'FINISHED')
    .sort((a, b) => (a.scheduledAt?.getTime() || 0) - (b.scheduledAt?.getTime() || 0));

  for (const m of finished) {
    const a = map.get(m.teamAId); const b = map.get(m.teamBId);
    const sa = m.scoreA ?? 0; const sb = m.scoreB ?? 0;
    if (a) {
      a.played++; a.goalsFor += sa; a.goalsAgainst += sb;
      if (sa > sb) { a.won++; a.points += points.winPoints; a.form.push('W'); }
      else if (sa === sb) { a.drawn++; a.points += points.drawPoints; a.form.push('D'); }
      else { a.lost++; a.points += points.lossPoints; a.form.push('L'); }
    }
    if (b) {
      b.played++; b.goalsFor += sb; b.goalsAgainst += sa;
      if (sb > sa) { b.won++; b.points += points.winPoints; b.form.push('W'); }
      else if (sb === sa) { b.drawn++; b.points += points.drawPoints; b.form.push('D'); }
      else { b.lost++; b.points += points.lossPoints; b.form.push('L'); }
    }
    for (const c of m.cards || []) {
      const t = map.get(c.teamId);
      if (!t) continue;
      if (c.type === 'YELLOW_CARD') t.yellowCards++;
      else if (c.type === 'RED_CARD') t.redCards++;
      else if (c.type === 'YELLOW_RED_CARD') { t.yellowCards++; t.redCards++; }
    }
  }

  const rows = Array.from(map.values());
  for (const r of rows) {
    r.goalDifference = r.goalsFor - r.goalsAgainst;
    r.fairPlayPoints = r.yellowCards + r.redCards * 3;
    r.form = r.form.slice(-5);
  }

  const h2h = (x: StandingRow, y: StandingRow) => {
    let px = 0, py = 0;
    for (const m of finished) {
      if ((m.teamAId === x.teamId && m.teamBId === y.teamId) || (m.teamAId === y.teamId && m.teamBId === x.teamId)) {
        const sx = m.teamAId === x.teamId ? (m.scoreA ?? 0) : (m.scoreB ?? 0);
        const sy = m.teamAId === x.teamId ? (m.scoreB ?? 0) : (m.scoreA ?? 0);
        if (sx > sy) px += points.winPoints; else if (sx === sy) { px += points.drawPoints; py += points.drawPoints; } else py += points.winPoints;
      }
    }
    return py - px;
  };

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    for (const c of tiebreakers) {
      let d = 0;
      switch (c) {
        case 'GOAL_DIFFERENCE': d = b.goalDifference - a.goalDifference; break;
        case 'GOALS_FOR': d = b.goalsFor - a.goalsFor; break;
        case 'GOALS_AGAINST': d = a.goalsAgainst - b.goalsAgainst; break;
        case 'WINS': d = b.won - a.won; break;
        case 'DRAWS': d = b.drawn - a.drawn; break;
        case 'FAIR_PLAY': d = a.fairPlayPoints - b.fairPlayPoints; break;
        case 'HEAD_TO_HEAD': d = h2h(a, b); break;
        default: d = 0;
      }
      if (d !== 0) return d;
    }
    return a.teamName.localeCompare(b.teamName);
  });
  rows.forEach((r, i) => { r.position = i + 1; });
  return rows;
}

/** Agrupa standings por grupo (y recalcula posicion dentro del grupo). */
export function groupStandings(rows: StandingRow[]): Record<string, StandingRow[]> {
  const groups: Record<string, StandingRow[]> = {};
  for (const r of rows) {
    const g = r.groupName || 'General';
    (groups[g] ||= []).push({ ...r });
  }
  for (const g of Object.keys(groups)) groups[g].forEach((r, i) => { r.position = i + 1; });
  return groups;
}

export function phaseLabelFor(matchCount: number): string {
  switch (matchCount) {
    case 1: return 'Final';
    case 2: return 'Semifinal';
    case 4: return 'Cuartos de final';
    case 8: return 'Octavos de final';
    case 16: return 'Dieciseisavos';
    default: return `Fase de ${matchCount * 2} equipos`;
  }
}
