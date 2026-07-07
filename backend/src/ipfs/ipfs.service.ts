import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IpfsService {
  private readonly logger = new Logger(IpfsService.name);
  private readonly pinataJwt: string;

  constructor(private configService: ConfigService) {
    this.pinataJwt = this.configService.get<string>('PINATA_JWT') || '';
  }

  /**
   * 텍스트(문자열)를 IPFS에 업로드하고 CID를 반환합니다.
   * Pinata의 JSON 업로드 API를 사용하여 텍스트 데이터를 감싸서 저장합니다.
   */
  async uploadText(text: string): Promise<string> {
    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.pinataJwt}`,
        },
        body: JSON.stringify({
          pinataContent: {
            message: text,
          },
          pinataMetadata: {
            name: 'futuring-message.json',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Pinata API Error: ${response.statusText}`);
      }

      const data = await response.json();
      this.logger.log(`IPFS 업로드 성공: ${data.IpfsHash}`);
      return data.IpfsHash;
    } catch (error) {
      this.logger.error('IPFS 업로드 실패', error);
      throw error;
    }
  }
}
