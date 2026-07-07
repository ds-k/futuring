import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.init();
  }

  async init() {
    try {
      // Ethereal 가상 이메일 계정 생성 (테스트용)
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, 
          pass: testAccount.pass, 
        },
      });
      this.logger.log('📧 Ethereal Email SMTP connected!');
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
      
      // Ethereal은 실제 발송 대신 '미리보기 URL'을 제공합니다. MVP 시연용으로 매우 훌륭합니다.
      const previewUrl = nodemailer.getTestMessageUrl(info);
      this.logger.log(`🔗 Email Preview URL: ${previewUrl}`);
      
      return previewUrl;
    } catch (error) {
      this.logger.error('Email sending failed', error);
      throw error;
    }
  }
}
