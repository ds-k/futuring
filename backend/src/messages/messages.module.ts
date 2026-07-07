import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { IpfsModule } from '../ipfs/ipfs.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [PrismaModule, IpfsModule, QueueModule],
  providers: [MessagesService],
  controllers: [MessagesController]
})
export class MessagesModule {}
