import { Module } from '@nestjs/common';
import { CommandModule as ExternalCommandModule } from 'nestjs-command';
import { DatabaseModule } from '@loadplug/nestjs-libraries/database/prisma/database.module';
import { BullMqModule } from '@loadplug/nestjs-libraries/bull-mq-transport-new/bull.mq.module';

@Module({
  imports: [ExternalCommandModule, DatabaseModule, BullMqModule],
  controllers: [],
  providers: [],
  get exports() {
    return [...this.imports, ...this.providers];
  },
})
export class CommandModule {}
