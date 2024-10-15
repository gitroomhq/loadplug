import { Injectable } from '@nestjs/common';
import { pricing } from '@loadplug/nestjs-libraries/database/prisma/subscriptions/pricing';
import { SubscriptionRepository } from '@loadplug/nestjs-libraries/database/prisma/subscriptions/subscription.repository';
import { OrganizationService } from '@loadplug/nestjs-libraries/database/prisma/organizations/organization.service';
import { makeId } from '@loadplug/nestjs-libraries/services/make.is';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly _subscriptionRepository: SubscriptionRepository,
    private readonly _organizationService: OrganizationService
  ) {}

  getSubscriptionByOrganizationId(organizationId: string) {
    return this._subscriptionRepository.getSubscriptionByOrganizationId(
      organizationId
    );
  }

  async deleteSubscription(customerId: string) {
    await this.modifySubscription(customerId, 'FREE');
    return this._subscriptionRepository.deleteSubscriptionByCustomerId(
      customerId
    );
  }

  updateCustomerId(organizationId: string, customerId: string) {
    return this._subscriptionRepository.updateCustomerId(
      organizationId,
      customerId
    );
  }

  checkSubscription(organizationId: string, subscriptionId: string) {
    return this._subscriptionRepository.checkSubscription(
      organizationId,
      subscriptionId
    );
  }

  async modifySubscription(
    customerId: string,
    billing: 'FREE' | 'STANDARD' | 'PRO'
  ) {
    const getOrgByCustomerId =
      await this._subscriptionRepository.getOrganizationByCustomerId(
        customerId
      );

    const getCurrentSubscription =
      (await this._subscriptionRepository.getSubscriptionByCustomerId(
        customerId
      ))!;
    const from = pricing[getCurrentSubscription?.subscriptionTier || 'FREE'];
    const to = pricing[billing];

    if (from.team_members && !to.team_members) {
      await this._organizationService.disableOrEnableNonSuperAdminUsers(
        getOrgByCustomerId?.id!,
        true
      );
    }

    if (!from.team_members && to.team_members) {
      await this._organizationService.disableOrEnableNonSuperAdminUsers(
        getOrgByCustomerId?.id!,
        false
      );
    }
  }

  async createOrUpdateSubscription(
    identifier: string,
    customerId: string,
    billing: 'STANDARD' | 'PRO',
    period: 'MONTHLY' | 'YEARLY',
    cancelAt: number | null,
    code?: string,
    org?: string
  ) {
    if (!code) {
      await this.modifySubscription(customerId, billing);
    }
    return this._subscriptionRepository.createOrUpdateSubscription(
      identifier,
      customerId,
      billing,
      period,
      cancelAt,
      code,
      org ? { id: org } : undefined
    );
  }

  async getSubscription(organizationId: string) {
    return this._subscriptionRepository.getSubscription(organizationId);
  }

  async addSubscription(orgId: string, userId: string, subscription: any) {
    await this._subscriptionRepository.setCustomerId(orgId, orgId);
    return this.createOrUpdateSubscription(
      makeId(5),
      userId,
      subscription,
      'MONTHLY',
      null,
      undefined,
      orgId
    );
  }
}
