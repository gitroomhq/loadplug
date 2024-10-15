import { Global, Module } from '@nestjs/common';
import { BullMqClient } from '@loadplug/nestjs-libraries/bull-mq-transport-new/client';

@Global()
@Module({
  providers: [BullMqClient],
  exports: [BullMqClient],
})
export class BullMqModule {}
