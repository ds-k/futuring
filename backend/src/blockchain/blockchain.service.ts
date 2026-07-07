import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  
  // 추후 실제 배포된 스마트 컨트랙트 주소를 넣습니다.
  private contractAddress = process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
  
  // 컴파일된 MessageVault.sol의 ABI
  private readonly abi = [
    "event MessageRecorded(address indexed sender, address indexed recipient, string cid, uint256 timestamp)",
    "function recordMessage(address recipient, string cid) public"
  ];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const rpcUrl = process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      const privateKey = process.env.PRIVATE_KEY;
      if (privateKey) {
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.logger.log(`🔗 Blockchain Service initialized with Wallet: ${this.wallet.address}`);
      } else {
        this.logger.warn('⚠️ PRIVATE_KEY가 설정되지 않았습니다. MVP 시연을 위해 가상(Mock) 트랜잭션 모드로 작동합니다.');
      }
    } catch (e) {
      this.logger.error('Failed to init BlockchainService', e);
    }
  }

  async recordTx(recipient: string, cid: string): Promise<string> {
    if (!this.wallet) {
      this.logger.log(`[MOCK TX] 스마트 컨트랙트 기록 시뮬레이션: 수신자 ${recipient}, CID ${cid}`);
      // 실제 지갑이 없을 경우 가짜 TxHash 생성 반환 (MVP 데모용)
      const mockTxHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
      this.logger.log(`✅ [MOCK TX] 가상 TxHash 발급 완료: ${mockTxHash}`);
      return mockTxHash;
    }

    try {
      const contract = new ethers.Contract(this.contractAddress, this.abi, this.wallet);
      this.logger.log(`Polygon Amoy 테스트넷으로 트랜잭션 전송 중...`);
      const tx = await contract.recordMessage(recipient, cid);
      this.logger.log(`트랜잭션 제출됨! TxHash: ${tx.hash}`);
      
      // 블록에 포함될 때까지 대기
      await tx.wait();
      this.logger.log(`✅ 트랜잭션 확정 완료: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      this.logger.error(`블록체인 트랜잭션 실패: ${error.message}`);
      throw error;
    }
  }
}
