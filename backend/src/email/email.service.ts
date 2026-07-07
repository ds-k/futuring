import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.init();
  }

  async init() {
    try {
      const smtpUser = this.configService.get<string>('SMTP_USER');
      const smtpPass = this.configService.get<string>('SMTP_PASS');

      if (smtpUser && smtpPass) {
        // 실제 SMTP 계정 사용 (예: Gmail)
        this.transporter = nodemailer.createTransport({
          service: 'gmail', // Gmail을 사용할 경우 간편 설정
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
        this.logger.log(`📧 Real SMTP connected for ${smtpUser}!`);
      } else {
        // .env에 설정이 없으면 Ethereal 가상 이메일 사용 (폴백)
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user, 
            pass: testAccount.pass, 
          },
        });
        this.logger.log('⚠️ SMTP_USER/PASS not found. Using Ethereal Email (Mock).');
      }
    } catch (error) {
      this.logger.error('Failed to init email service', error);
    }
  }

  async sendCapsuleArrivalEmail(to: string, cid: string) {
    if (!this.transporter) {
      await this.init();
    }
    try {
      const info = await this.transporter.sendMail({
        from: '"Future Message ⏳" <no-reply@future-message.app>',
        to,
        subject: '당신의 타임캡슐이 도착했습니다!',
        text: `50년의 시간을 건너 메시지가 도착했습니다. 아래 CID를 입력하여 해독하세요: ${cid}`,
        html: `
          <div style="font-family: sans-serif; text-align: center; padding: 40px; background-color: #f9fafb; border-radius: 12px;">
            <h2 style="color: #1f2937;">⏳ 당신의 타임캡슐이 도착했습니다!</h2>
            <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">긴 시간 동안 기다려주셔서 감사합니다.<br/>아래의 데이터 주소(CID)를 웹사이트에 입력하고 지갑으로 해독하세요.</p>
            <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; display: inline-block;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">데이터 고유 주소 (CID)</p>
              <p style="margin: 10px 0 0 0; font-weight: bold; color: #111827; word-break: break-all;">${cid}</p>
            </div>
            <br/><br/>
            <a href="http://localhost:3000" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 999px; font-weight: bold;">타임캡슐 열기</a>
          </div>
        `,
      });

      this.logger.log(`✅ Email sent: ${info.messageId}`);
      
      // Ethereal 계정으로 보냈을 때만 미리보기 URL을 출력합니다.
      if (!this.configService.get<string>('SMTP_USER')) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        this.logger.log(`🔗 Ethereal Email Preview URL: ${previewUrl}`);
        return previewUrl;
      }
      
      return info.messageId;
    } catch (error) {
      this.logger.error('Email sending failed', error);
      throw error;
    }
  }
}
