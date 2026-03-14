import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory, Action, Subject } from './casl-ability.factory';

export const CHECK_POLICIES_KEY = 'check_policies';

export interface PolicyCheck {
  action: Action;
  subject: Subject;
}

export const CheckPolicies = (...policies: PolicyCheck[]) =>
  SetMetadata(CHECK_POLICIES_KEY, policies);

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const policies = this.reflector.getAllAndOverride<PolicyCheck[]>(CHECK_POLICIES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!policies || policies.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    const ability = this.caslAbilityFactory.createForUser(user);
    return policies.every((policy) => ability.can(policy.action, policy.subject));
  }
}
