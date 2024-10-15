import { Global, Module } from '@nestjs/common';

import { DatabaseModule } from '@loadplug/nestjs-libraries/database/prisma/database.module';
import { ApiModule } from '@loadplug/backend/api/api.module';
import { APP_GUARD } from '@nestjs/core';
import { PoliciesGuard } from '@loadplug/backend/services/auth/permissions/permissions.guard';
import { BullMqModule } from '@loadplug/nestjs-libraries/bull-mq-transport-new/bull.mq.module';
import { PluginModule } from '@loadplug/plugins/plugin.module';

@Global()
@Module({
  imports: [BullMqModule, DatabaseModule, ApiModule, PluginModule],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: PoliciesGuard,
    },
  ],
  get exports() {
    return [...this.imports];
  },
})
export class AppModule {}
