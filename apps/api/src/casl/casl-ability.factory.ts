import { AbilityBuilder, PureAbility, AbilityClass } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

export type Action = 'manage' | 'create' | 'read' | 'update' | 'delete';
export type Subject =
  | 'Tournament'
  | 'Team'
  | 'Player'
  | 'Match'
  | 'MatchEvent'
  | 'User'
  | 'RoleRequest'
  | 'AuditLog'
  | 'Sanction'
  | 'News'
  | 'all';

export type AppAbility = PureAbility<[Action, Subject]>;
const AppAbility = PureAbility as AbilityClass<AppAbility>;

interface UserContext {
  id: string;
  role: Role;
}

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: UserContext): AppAbility {
    const { can, cannot, build } = new AbilityBuilder(AppAbility);

    switch (user.role) {
      case Role.SUPER_ADMIN:
        can('manage', 'all');
        break;

      case Role.ADMIN:
        can('manage', 'Tournament');
        can('manage', 'Team');
        can('manage', 'Player');
        can('manage', 'Match');
        can('manage', 'MatchEvent');
        can('manage', 'Sanction');
        can('manage', 'News');
        can('read', 'User');
        can('update', 'User');
        can('read', 'RoleRequest');
        can('update', 'RoleRequest');
        can('read', 'AuditLog');
        break;

      case Role.ORGANIZER:
        can('manage', 'Tournament');
        can('manage', 'Team');
        can('manage', 'Player');
        can('manage', 'Match');
        can('create', 'MatchEvent');
        can('read', 'MatchEvent');
        can('manage', 'News');
        can('read', 'User');
        can('read', 'Sanction');
        break;

      case Role.REFEREE:
        can('read', 'Tournament');
        can('read', 'Team');
        can('read', 'Player');
        can('read', 'Match');
        can('update', 'Match');
        can('manage', 'MatchEvent');
        can('create', 'Sanction');
        can('read', 'Sanction');
        break;

      case Role.SCOREKEEPER:
        can('read', 'Tournament');
        can('read', 'Team');
        can('read', 'Player');
        can('read', 'Match');
        can('manage', 'MatchEvent');
        break;

      case Role.DIRECTOR:
        can('read', 'Tournament');
        can('manage', 'Team');
        can('manage', 'Player');
        can('read', 'Match');
        can('read', 'MatchEvent');
        can('read', 'Sanction');
        break;

      case Role.PLAYER:
        can('read', 'Tournament');
        can('read', 'Team');
        can('read', 'Player');
        can('read', 'Match');
        can('read', 'MatchEvent');
        can('read', 'Sanction');
        break;

      case Role.OBSERVER:
        can('read', 'Tournament');
        can('read', 'Team');
        can('read', 'Player');
        can('read', 'Match');
        can('read', 'MatchEvent');
        break;

      case Role.JOURNALIST:
        can('read', 'Tournament');
        can('read', 'Team');
        can('read', 'Player');
        can('read', 'Match');
        can('read', 'MatchEvent');
        can('create', 'News');
        can('read', 'News');
        can('update', 'News');
        break;

      case Role.CITIZEN:
      case Role.BETTOR:
      default:
        can('read', 'Tournament');
        can('read', 'Team');
        can('read', 'Player');
        can('read', 'Match');
        can('read', 'MatchEvent');
        break;
    }

    return build();
  }
}
