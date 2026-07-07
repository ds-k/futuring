import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinataSDK } from 'pinata';

@Injectable()
export class IpfsService {
  private pinata: PinataSDK;
  private readonly logger = new Logger(IpfsService.name);

  constructor(private configService: ConfigService) {
    this.pinata = new PinataSDK({
      pinataJwt: this.configService.get<string>('PINATA_JWT'),
    });
  }

  /**
   * 텍스트(문자열)를 IPFS에 업로드하고 CID를 반환합니다.
   * @param text 업로드할 문자열 데이터 (예: 암호화된 메시지 내용)
   * @param fileName 저장할 파일명
   * @returns IPFS CID (Content Identifier)
   */
  async uploadText(text: string, fileName: string = 'message.txt'): Promise<string> {
    try {
      // Pinata SDK는 File 객체를 요구하므로 메모리 상에서 File 객체 생성
      const file = new File([text], fileName, { type: 'text/plain' });
      const upload = await this.pinata.upload.file(file);
      this.logger.log(`IPFS 업로드 성공: ${upload.IpfsHash}`);
      return upload.IpfsHash;
    } catch (error) {
      this.logger.error('IPFS 업로드 실패', error);
      throw error;
    }
  }
}
