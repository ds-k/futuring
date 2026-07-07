import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(@InjectQueue('messages') private readonly messagesQueue: Queue) {}

  /**
   * 원하는 미래의 특정 시간(scheduledAt)에 메시지 발송 작업을 예약합니다.
   * BullMQ는 delay(밀리초)를 기반으로 스케줄링합니다.
   */
  async scheduleMessage(messageId: string, scheduledAt: Date) {
    const delay = scheduledAt.getTime() - Date.now();
    
    if (delay < 0) {
      throw new Error('예약 시간은 현재보다 미래여야 합니다.');
    }

    await this.messagesQueue.add(
      'sendMessage',
      { messageId },
      { delay }
    );

    this.logger.log(`Job 등록 완료: 메시지 ID [${messageId}], 딜레이 [${delay}ms]`);
  }
}
