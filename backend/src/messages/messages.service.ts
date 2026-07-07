import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IpfsService } from '../ipfs/ipfs.service';
import { QueueService } from '../queue/queue.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private prisma: PrismaService,
    private ipfs: IpfsService,
    private queue: QueueService,
  ) {}

  async createMessage(dto: CreateMessageDto) {
    this.logger.log(`새 메시지 생성 요청 수신: 발신자 ${dto.senderDid}`);
    
    // 1. IPFS에 암호화된 메시지(텍스트) 업로드 및 CID 획득
    const cid = await this.ipfs.uploadText(dto.content);
    
    // 2. 예약된 날짜 객체 생성
    const scheduledAt = new Date(dto.scheduledAt);

    // 3. 데이터베이스에 메타데이터 저장
    const message = await this.prisma.message.create({
      data: {
        cid,
        senderDid: dto.senderDid,
        recipientDid: dto.recipientDid,
        scheduledAt,
      },
    });

    this.logger.log(`DB 저장 완료: 메시지 ID ${message.id}`);

    // 4. BullMQ 예약 큐에 등록
    await this.queue.scheduleMessage(message.id, scheduledAt);

    return {
      messageId: message.id,
      cid,
      scheduledAt: message.scheduledAt,
      status: message.status,
    };
  }
}
