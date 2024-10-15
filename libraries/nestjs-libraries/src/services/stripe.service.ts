import Stripe from 'stripe';
import { Injectable } from '@nestjs/common';
import { Organization, User } from '@prisma/client';
import { SubscriptionService } from '@loadplug/nestjs-libraries/database/prisma/subscriptions/subscription.service';
import { OrganizationService } from '@loadplug/nestjs-libraries/database/prisma/organizations/organization.service';
import { makeId } from '@loadplug/nestjs-libraries/services/make.is';
import { BillingSubscribeDto } from '@loadplug/nestjs-libraries/dtos/billing/billing.subscribe.dto';
import { capitalize, groupBy } from 'lodash';
import { pricing } from '@loadplug/nestjs-libraries/database/prisma/subscriptions/pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

@Injectable()
export class StripeService {
  constructor(
    private _subscriptionService: SubscriptionService,
    private _organizationService: OrganizationService
  ) {}
  validateRequest(rawBody: Buffer, signature: string, endpointSecret: string) {
    return stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
  }

  createSubscription(event: Stripe.CustomerSubscriptionCreatedEvent) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const {
      id,
      billing,
      period,
    }: {
      billing: 'STANDARD' | 'PRO';
      period: 'MONTHLY' | 'YEARLY';
      id: string;
    } = event.data.object.metadata;
    return this._subscriptionService.createOrUpdateSubscription(
      id,
      event.data.object.customer as string,
      billing,
      period,
      event.data.object.cancel_at
    );
  }
  updateSubscription(event: Stripe.CustomerSubscriptionUpdatedEvent) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const {
      id,
      billing,
      period,
    }: {
      billing: 'STANDARD' | 'PRO';
      period: 'MONTHLY' | 'YEARLY';
      id: string;
    } = event.data.object.metadata;
    return this._subscriptionService.createOrUpdateSubscription(
      id,
      event.data.object.customer as string,
      billing,
      period,
      event.data.object.cancel_at
    );
  }

  async deleteSubscription(event: Stripe.CustomerSubscriptionDeletedEvent) {
    await this._subscriptionService.deleteSubscription(
      event.data.object.customer as string
    );
  }

  async createOrGetCustomer(organization: Organization) {
    if (organization.paymentId) {
      return organization.paymentId;
    }

    const customer = await stripe.customers.create({
      name: organization.name,
    });
    await this._subscriptionService.updateCustomerId(
      organization.id,
      customer.id
    );
    return customer.id;
  }

  async getPackages() {
    const products = await stripe.prices.list({
      active: true,
      expand: ['data.tiers', 'data.product'],
      lookup_keys: [
        'standard_monthly',
        'standard_yearly',
        'pro_monthly',
        'pro_yearly',
      ],
    });

    const productsList = groupBy(
      products.data.map((p) => ({
        // @ts-ignore
        name: p.product?.name,
        recurring: p?.recurring?.interval!,
        price: p?.tiers?.[0]?.unit_amount! / 100,
      })),
      'recurring'
    );

    return { ...productsList };
  }

  async prorate(organizationId: string, body: BillingSubscribeDto) {
    const org = await this._organizationService.getOrgById(organizationId);
    const customer = await this.createOrGetCustomer(org!);
    const priceData = pricing[body.billing];
    const allProducts = await stripe.products.list({
      active: true,
      expand: ['data.prices'],
    });

    const findProduct =
      allProducts.data.find(
        (product) => product.name.toUpperCase() === body.billing.toUpperCase()
      ) ||
      (await stripe.products.create({
        active: true,
        name: body.billing,
      }));

    const pricesList = await stripe.prices.list({
      active: true,
      product: findProduct!.id,
    });

    const findPrice =
      pricesList.data.find(
        (p) =>
          p?.recurring?.interval?.toLowerCase() ===
            (body.period === 'MONTHLY' ? 'month' : 'year') &&
          p?.nickname === body.billing + ' ' + body.period &&
          p?.unit_amount ===
            (body.period === 'MONTHLY'
              ? priceData.month_price
              : priceData.year_price) *
              100
      ) ||
      (await stripe.prices.create({
        active: true,
        product: findProduct!.id,
        currency: 'usd',
        nickname: body.billing + ' ' + body.period,
        unit_amount:
          (body.period === 'MONTHLY'
            ? priceData.month_price
            : priceData.year_price) * 100,
        recurring: {
          interval: body.period === 'MONTHLY' ? 'month' : 'year',
        },
      }));

    const proration_date = Math.floor(Date.now() / 1000);

    const currentUserSubscription = {
      data: (
        await stripe.subscriptions.list({
          customer,
          status: 'all',
        })
      ).data.filter((f) => f.status === 'active' || f.status === 'trialing'),
    };

    try {
      const price = await stripe.invoices.retrieveUpcoming({
        customer,
        subscription: currentUserSubscription?.data?.[0]?.id,
        subscription_proration_behavior: 'create_prorations',
        subscription_billing_cycle_anchor: 'now',
        subscription_items: [
          {
            id: currentUserSubscription?.data?.[0]?.items?.data?.[0]?.id,
            price: findPrice?.id!,
            quantity: 1,
          },
        ],
        subscription_proration_date: proration_date,
      });

      return {
        price: price?.amount_remaining ? price?.amount_remaining / 100 : 0,
      };
    } catch (err) {
      return { price: 0 };
    }
  }

  async setToCancel(organizationId: string) {
    const id = makeId(10);
    const org = await this._organizationService.getOrgById(organizationId);
    const customer = await this.createOrGetCustomer(org!);
    const currentUserSubscription = {
      data: (
        await stripe.subscriptions.list({
          customer,
          status: 'all',
        })
      ).data.filter((f) => f.status === 'active' || f.status === 'trialing'),
    };

    const { cancel_at } = await stripe.subscriptions.update(
      currentUserSubscription.data[0].id,
      {
        cancel_at_period_end:
          !currentUserSubscription.data[0].cancel_at_period_end,
        metadata: {
          service: 'gitroom',
          id,
        },
      }
    );

    return {
      id,
      cancel_at: cancel_at ? new Date(cancel_at * 1000) : undefined,
    };
  }

  async getCustomerByOrganizationId(organizationId: string) {
    const org = (await this._organizationService.getOrgById(organizationId))!;
    return org.paymentId;
  }

  async createBillingPortalLink(customer: string) {
    return stripe.billingPortal.sessions.create({
      customer,
      flow_data: {
        after_completion: {
          type: 'redirect',
          redirect: {
            return_url: process.env['FRONTEND_URL'] + '/billing',
          },
        },
        type: 'payment_method_update',
      },
    });
  }

  private async createCheckoutSession(
    uniqueId: string,
    customer: string,
    body: BillingSubscribeDto,
    price: string
  ) {
    const { url } = await stripe.checkout.sessions.create({
      customer,
      cancel_url: process.env['FRONTEND_URL'] + `/billing`,
      success_url:
        process.env['FRONTEND_URL'] +
        `/integrations?onboarding=true&check=${uniqueId}`,
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          service: 'gitroom',
          ...body,
          uniqueId,
        },
      },
      allow_promotion_codes: true,
      line_items: [
        {
          price,
          quantity: 1,
        },
      ],
    });

    return { url };
  }

  async addBankAccount(userId: string) {
    const accountLink = await stripe.accountLinks.create({
      account: userId,
      refresh_url: process.env['FRONTEND_URL'] + '/marketplace/seller',
      return_url: process.env['FRONTEND_URL'] + '/marketplace/seller',
      type: 'account_onboarding',
      collection_options: {
        fields: 'eventually_due',
      },
    });

    return accountLink.url;
  }

  async payAccountStepOne(
    userId: string,
    organization: Organization,
    seller: User,
    orderId: string,
    ordersItems: Array<{
      integrationType: string;
      quantity: number;
      price: number;
    }>,
    groupId: string
  ) {
    const customer = (await this.createOrGetCustomer(organization))!;

    const price = ordersItems.reduce((all, current) => {
      return all + current.price * current.quantity;
    }, 0);

    const { url } = await stripe.checkout.sessions.create({
      customer,
      mode: 'payment',
      currency: 'usd',
      success_url: process.env['FRONTEND_URL'] + `/messages/${groupId}`,
      metadata: {
        orderId,
        service: 'gitroom',
        type: 'marketplace',
      },
      line_items: [
        ...ordersItems,
        {
          integrationType: `Gitroom Fee (${+process.env.FEE_AMOUNT! * 100}%)`,
          quantity: 1,
          price: price * +process.env.FEE_AMOUNT!,
        },
      ].map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            // @ts-ignore
            name:
              (!item.price ? 'Platform: ' : '') +
              capitalize(item.integrationType),
          },
          // @ts-ignore
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      })),
      payment_intent_data: {
        transfer_group: orderId,
      },
    });

    return { url };
  }

  async subscribe(organizationId: string, body: BillingSubscribeDto) {
    const id = makeId(10);
    const priceData = pricing[body.billing];
    const org = await this._organizationService.getOrgById(organizationId);
    const customer = await this.createOrGetCustomer(org!);
    const allProducts = await stripe.products.list({
      active: true,
      expand: ['data.prices'],
    });

    const findProduct =
      allProducts.data.find(
        (product) => product.name.toUpperCase() === body.billing.toUpperCase()
      ) ||
      (await stripe.products.create({
        active: true,
        name: body.billing,
      }));

    const pricesList = await stripe.prices.list({
      active: true,
      product: findProduct!.id,
    });

    const findPrice =
      pricesList.data.find(
        (p) =>
          p?.recurring?.interval?.toLowerCase() ===
            (body.period === 'MONTHLY' ? 'month' : 'year') &&
          p?.unit_amount ===
            (body.period === 'MONTHLY'
              ? priceData.month_price
              : priceData.year_price) *
              100
      ) ||
      (await stripe.prices.create({
        active: true,
        product: findProduct!.id,
        currency: 'usd',
        nickname: body.billing + ' ' + body.period,
        unit_amount:
          (body.period === 'MONTHLY'
            ? priceData.month_price
            : priceData.year_price) * 100,
        recurring: {
          interval: body.period === 'MONTHLY' ? 'month' : 'year',
        },
      }));

    const currentUserSubscription = {
      data: (
        await stripe.subscriptions.list({
          customer,
          status: 'all',
        })
      ).data.filter((f) => f.status === 'active' || f.status === 'trialing'),
    };

    if (!currentUserSubscription.data.length) {
      return this.createCheckoutSession(id, customer, body, findPrice!.id);
    }

    try {
      await stripe.subscriptions.update(currentUserSubscription.data[0].id, {
        cancel_at_period_end: false,
        metadata: {
          service: 'gitroom',
          ...body,
          id,
        },
        proration_behavior: 'always_invoice',
        items: [
          {
            id: currentUserSubscription.data[0].items.data[0].id,
            price: findPrice!.id,
            quantity: 1,
          },
        ],
      });

      return { id };
    } catch (err) {
      const { url } = await this.createBillingPortalLink(customer);
      return {
        portal: url,
      };
    }
  }

  async payout(
    orderId: string,
    charge: string,
    account: string,
    price: number
  ) {
    return stripe.transfers.create({
      amount: price * 100,
      currency: 'usd',
      destination: account,
      source_transaction: charge,
      transfer_group: orderId,
    });
  }
}
