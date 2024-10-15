import { Module } from '@nestjs/common';

import {DatabaseModule} from "@loadplug/nestjs-libraries/database/prisma/database.module";
import { BullMqModule } from '@loadplug/nestjs-libraries/bull-mq-transport-new/bull.mq.module';

@Module({
  imports: [DatabaseModule, BullMqModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
