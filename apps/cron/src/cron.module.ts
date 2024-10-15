import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@loadplug/nestjs-libraries/database/prisma/database.module';
import { BullMqModule } from '@loadplug/nestjs-libraries/bull-mq-transport-new/bull.mq.module';

@Module({
  imports: [DatabaseModule, ScheduleModule.forRoot(), BullMqModule],
  controllers: [],
  providers: [],
})
export class CronModule {}
