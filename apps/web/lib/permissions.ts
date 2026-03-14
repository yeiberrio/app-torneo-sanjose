type Action = 'create' | 'update' | 'delete' | 'manage';
type Subject = 'Tournament' | 'Team' | 'Player' | 'Match' | 'MatchEvent' | 'User' | 'Sanction' | 'News';

const rolePermissions: Record<string, Record<string, Action[]>> = {
  SUPER_ADMIN: {
    Tournament: ['manage'], Team: ['manage'], Player: ['manage'], Match: ['manage'],
    MatchEvent: ['manage'], User: ['manage'], Sanction: ['manage'], News: ['manage'],
  },
  ADMIN: {
    Tournament: ['manage'], Team: ['manage'], Player: ['manage'], Match: ['manage'],
    MatchEvent: ['manage'], User: ['update'], Sanction: ['manage'], News: ['manage'],
  },
  ORGANIZER: {
    Tournament: ['manage'], Team: ['manage'], Player: ['manage'], Match: ['manage'],
    MatchEvent: ['create'], News: ['manage'],
  },
  REFEREE: {
    Match: ['update'], MatchEvent: ['manage'], Sanction: ['create'],
  },
  SCOREKEEPER: {
    MatchEvent: ['manage'],
  },
  DIRECTOR: {
    Team: ['manage'], Player: ['manage'],
  },
  JOURNALIST: {
    News: ['create', 'update'],
  },
};

export function can(role: string, action: Action, subject: Subject): boolean {
  const perms = rolePermissions[role];
  if (!perms) return false;
  const actions = perms[subject];
  if (!actions) return false;
  return actions.includes('manage') || actions.includes(action);
}
