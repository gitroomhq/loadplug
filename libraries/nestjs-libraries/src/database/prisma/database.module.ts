import { Global, Module } from '@nestjs/common';
import { PrismaRepository, PrismaService } from './prisma.service';
import { OrganizationRepository } from '@loadplug/nestjs-libraries/database/prisma/organizations/organization.repository';
import { OrganizationService } from '@loadplug/nestjs-libraries/database/prisma/organizations/organization.service';
import { UsersService } from '@loadplug/nestjs-libraries/database/prisma/users/users.service';
import { UsersRepository } from '@loadplug/nestjs-libraries/database/prisma/users/users.repository';
import { SubscriptionService } from '@loadplug/nestjs-libraries/database/prisma/subscriptions/subscription.service';
import { SubscriptionRepository } from '@loadplug/nestjs-libraries/database/prisma/subscriptions/subscription.repository';
import { NotificationService } from '@loadplug/nestjs-libraries/database/prisma/notifications/notification.service';
import { NotificationsRepository } from '@loadplug/nestjs-libraries/database/prisma/notifications/notifications.repository';
import { EmailService } from '@loadplug/nestjs-libraries/services/email.service';
import { StripeService } from '@loadplug/nestjs-libraries/services/stripe.service';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [
    PrismaService,
    PrismaRepository,
    UsersService,
    UsersRepository,
    OrganizationService,
    OrganizationRepository,
    SubscriptionService,
    SubscriptionRepository,
    NotificationService,
    NotificationsRepository,
    StripeService,
    EmailService,
  ],
  get exports() {
    return this.providers;
  },
})
export class DatabaseModule {}
