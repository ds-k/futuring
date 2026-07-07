# PRD 2.0 – “Future‑Message (50 년 후 전달) 서비스 MVP”

본 문서는 초기 PRD를 바탕으로 AI 어시스턴트와의 초단기(1-2일) 페어 프로그래밍을 위해 재구성된 **MVP(Minimum Viable Product) 버전의 PRD**입니다.

## 1. 핵심 목표

사용자가 지정된 날짜에 텍스트·사진·영상 등을 신뢰성 있게 전달받도록 하는 서비스의 **핵심 파이프라인(업로드 → IPFS 저장 → 예약 큐 대기 → 블록체인 기록 → 이메일 전송)을 가장 빠르게 검증**합니다.

## 2. MVP 기술 스택 및 채택 사유 (단기 완성을 위한 전략적 축약)

- **프론트엔드**: **Next.js** 
  - *채택 사유*: 현대적인 웹 생태계(Next.js/React)의 표준 스택이며, Vercel 등을 통한 즉각적인 배포가 가능하여 단기 완성에 최적화되어 있습니다.
- **백엔드**: **NestJS** 
  - *채택 사유*: 엔터프라이즈급 아키텍처에 적합한 구조를 갖추고 있습니다. 기존 원본 PRD의 OpenFaaS/Lambda 기반 분산 처리를 단일 서버 구조로 축약하여 개발 속도와 완성도를 극대화했습니다.
- **메시지 큐**: **BullMQ + Redis** 
  - *채택 사유*: 원본 PRD의 무거운 Pulsar/Kafka 대신, NestJS와 가장 통합이 잘 되며 세팅이 거의 필요 없는 BullMQ(Redis 기반)를 사용하여 지연 큐(Delay Queue)를 1일 내에 빠르게 구현합니다.
- **데이터베이스**: **PostgreSQL (AWS RDS)** 
  - *채택 사유*: 관계형 데이터베이스의 표준인 PostgreSQL을 채택하여 데이터의 정합성과 안정성을 확보하고, 가장 대중적인 생태계를 활용합니다.
- **분산 스토리지**: **IPFS (Pinata API)** 
  - *채택 사유*: 로컬 IPFS 클러스터를 직접 띄우고 유지보수하는 인프라 비용과 시간을 0으로 줄이기 위해, 매니지드 서비스인 Pinata API를 사용하여 핵심인 '영구 저장' 로직만 빠르게 구현합니다.
- **블록체인 네트워크**: **Polygon Amoy 테스트넷** 
  - *채택 사유*: 메인넷 배포 시 발생하는 가스비(비용)를 없애고 빠른 테스트를 위해 사용 종료된 Mumbai 대신 최신 테스트넷인 Amoy를 사용합니다.
- **암호화 방식 (AI 추천안 적용)**:
  - **MVP 구현**: 클라이언트 단에서 `AES-256-GCM` (대칭키) + `RSA-OAEP` (공개키) 조합으로 하이브리드 암호화를 수행.
  - **양자 컴퓨터 대비 전략**: DB에 `crypto_version: "1.0"` 필드를 추가하여, 향후 양자 내성 암호(PQC)가 표준화되면 기존 데이터를 클라이언트에서 내려받아 PQC로 재암호화(`crypto_version: "2.0"`)하여 덮어쓸 수 있도록 **'버전 관리형 암호화 아키텍처'**를 도입합니다.

## 3. 전체 아키텍처 흐름 (MVP)

1. **업로드**: [Next.js] 파일 및 메타데이터, 예약 시간(Delay) 전송
2. **저장**: [NestJS] 파일을 Pinata(IPFS)에 업로드 후 CID 반환. PostgreSQL(AWS RDS)에 메타데이터(CID, 예약시간 등) 저장.
3. **예약**: [NestJS] BullMQ에 지연(Delay) 작업 추가.
4. **전송 트리거**: 예약 시간이 되면 BullMQ Worker가 깨어나 IPFS에서 암호화된 파일 스트림 획득.
5. **블록체인 증명**: Polygon Amoy의 스마트 컨트랙트를 호출하여 전송 완료 로그(TxHash) 기록.
6. **발송**: Nodemailer를 통해 수신자에게 이메일 전송.

## 4. 초단기 마일스톤 (1-2 Days MVP)

### Day 1: 코어 파이프라인 관통 (Next.js + NestJS + PostgreSQL)

- 프론트엔드(Next.js)/백엔드(NestJS) 뼈대 구성 (Monorepo 기반)
- Pinata API 연동하여 IPFS 파일 업로드 및 CID 발급 (NestJS Service)
- AWS RDS (PostgreSQL) 연동 및 Prisma/TypeORM을 통한 메타데이터 설계
- BullMQ (Redis) 연동하여 Delay Job 생성 테스트

### Day 2: 블록체인 연동 및 최종 전송 확인

- Polygon Amoy 테스트넷용 스마트 컨트랙트(`MessageVault`) 배포
- Node.js에서 Web3.js를 사용해 컨트랙트 호출 및 TxHash 확인
- Nodemailer(SMTP) 연동 및 예약 발송 E2E(End-to-End) 테스트 완료
