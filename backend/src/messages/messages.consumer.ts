import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { BlockchainService } from '../blockchain/blockchain.service';

@Processor('messages')
export class MessagesConsumer extends WorkerHost {
  private readonly logger = new Logger(MessagesConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly blockchainService: BlockchainService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { messageId } = job.data;
    this.logger.log(`[Worker] 타임캡슐 발송 작업 시작! 메시지 ID: ${messageId}`);

    try {
      // 1. DB에서 메시지 조회
      const message = await this.prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        this.logger.error(`메시지를 찾을 수 없습니다: ${messageId}`);
        return;
      }

      if (message.status === 'SENT') {
        this.logger.warn(`이미 발송 완료된 메시지입니다: ${messageId}`);
        return;
      }

      // 2. 블록체인에 영구 기록 (TxHash 발급)
      this.logger.log(`[Worker] 🔗 블록체인 스마트 컨트랙트에 기록 중...`);
      const txHash = await this.blockchainService.recordTx(message.recipientDid, message.cid);

      // 3. 이메일 발송 (이메일 주소로 무조건 발송)
      if (message.recipientEmail) {
        this.logger.log(`[Worker] 📧 수신자에게 이메일 알림 발송 중...`);
        await this.emailService.sendCapsuleArrivalEmail(message.recipientEmail, message.cid);
      } else {
        this.logger.warn(`[Worker] 수신자 이메일 정보가 없어 이메일 발송을 생략합니다.`);
      }

      // 4. DB 상태 업데이트
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'SENT',
          txHash: txHash,
        },
      });

      this.logger.log(`✅ [Worker] 타임캡슐 발송 완벽 성공! 메시지 ID: ${messageId} | TxHash: ${txHash}`);
    } catch (error) {
      this.logger.error(`[Worker] 타임캡슐 발송 실패: ${messageId}`, error.stack);
      throw error;
    }
  }
}
