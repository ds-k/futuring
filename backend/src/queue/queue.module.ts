import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'messages',
    }),
  ],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
