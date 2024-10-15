import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthController } from '@loadplug/backend/api/routes/auth.controller';
import { AuthService } from '@loadplug/backend/services/auth/auth.service';
import { UsersController } from '@loadplug/backend/api/routes/users.controller';
import { AuthMiddleware } from '@loadplug/backend/services/auth/auth.middleware';
import { StripeController } from '@loadplug/backend/api/routes/stripe.controller';
import { StripeService } from '@loadplug/nestjs-libraries/services/stripe.service';
import { PoliciesGuard } from '@loadplug/backend/services/auth/permissions/permissions.guard';
import { PermissionsService } from '@loadplug/backend/services/auth/permissions/permissions.service';
import { SettingsController } from '@loadplug/backend/api/routes/settings.controller';
import { BillingController } from '@loadplug/backend/api/routes/billing.controller';
import { PublicController } from '@loadplug/backend/api/routes/public.controller';
import { RootController } from '@loadplug/backend/api/routes/root.controller';

const authenticatedController = [
  UsersController,
  SettingsController,
  BillingController,
];
@Module({
  imports: [],
  controllers: [
    RootController,
    StripeController,
    AuthController,
    PublicController,
    ...authenticatedController,
  ],
  providers: [
    AuthService,
    StripeService,
    AuthMiddleware,
    PoliciesGuard,
    PermissionsService,
  ],
  get exports() {
    return [...this.imports, ...this.providers];
  },
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(...authenticatedController);
  }
}
