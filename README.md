# ⏳ Futuring - Web3 Time Capsule Service

**Futuring**은 소중한 기억(텍스트와 사진)을 미래의 특정 시점에 안전하게 전달하는 Web3 기반 타임캡슐 서비스입니다.
보내는 사람의 메시지와 사진은 완벽하게 암호화되어 분산 저장소에 보관되며, 오직 지정된 시간이 되어야만 지정된 수신자가 해독하여 열어볼 수 있습니다. 발송이 완료되면 블록체인 스마트 컨트랙트에 영구 기록을 남겨 배달을 증명합니다.

---

## 🔗 서비스 배포 링크 (Live Demo)
- **웹사이트 (프론트엔드):** [https://futuring-mail.vercel.app/](https://futuring-mail.vercel.app/)
- **백엔드 API (Render):** [https://futuring-vsz1.onrender.com/](https://futuring-vsz1.onrender.com/)

---

## 📚 기획 및 아키텍처 문서 (Documentation)

본 프로젝트의 기획 의도와 기술적 의사결정 과정, 그리고 새롭게 학습한 기술들에 대한 문서는 아래 링크에서 확인할 수 있습니다.

- [PRD.md](file:///.gemini/doc/PRD.md) : 최초 과제 시 제출했던 초안(기본 기획 및 구조)입니다.
- [PRD2.0.md](file:///.gemini/doc/PRD2.0.md) : 개념 증명(PoC) 및 MVP 개발을 위해 현실적인 기술 스택과 아키텍처로 업데이트한 최종 기획안입니다.
- [Blockchain_Architecture_Guide.md](file:///.gemini/doc/Blockchain_Architecture_Guide.md) : 본 프로젝트를 위해 새롭게 스터디한 블록체인(스마트 컨트랙트, IPFS, 트랜잭션) 기술 적용 가이드입니다.
- [MessageQueue_Guide.md](file:///.gemini/doc/MessageQueue_Guide.md) : 백그라운드 예약 발송을 위해 새롭게 스터디한 메시지 큐(BullMQ, Redis) 기술 적용 가이드입니다.

---

## ✨ 핵심 기능 (Key Features)

1. **하이브리드 암호화 (RSA + AES-GCM)**
   - 타임캡슐 내용(텍스트 및 최대 2MB 사진)은 브라우저 환경에서 즉시 암호화됩니다.
   - 서버를 포함한 그 누구도 수신자의 개인키(Private Key) 없이는 내용을 절대 해독할 수 없습니다.
2. **분산 저장소 보관 (IPFS)**
   - 암호화된 타임캡슐 데이터는 중앙 서버가 아닌 IPFS(Pinata)에 영구 분산 저장됩니다.
3. **정밀한 예약 발송 (BullMQ + Redis)**
   - 1시간 뒤부터 50년 뒤까지, 지정된 시간에 정확히 작동하는 백그라운드 Worker 큐 시스템을 구축했습니다.
4. **블록체인 발송 증명 (Polygon Smart Contract)**
   - 지정된 시간이 되어 타임캡슐이 수신자에게 이메일로 배달되면, 폴리곤(Polygon Amoy) 네트워크의 스마트 컨트랙트를 호출하여 발송 시간, 수신자 지갑, IPFS CID를 온체인(On-chain)에 영구 박제합니다.

---

## 🏗 시스템 아키텍처 (Architecture)

### 📊 데이터 흐름 (Data Flow)

1. **[사용자]** 프론트엔드에서 텍스트와 사진을 입력하고 수신자의 공개키(Public Key)로 암호화합니다.
2. **[백엔드 API]** 암호화된 문자열을 받아 IPFS(Pinata)에 업로드하고 `CID`를 반환받습니다.
3. **[데이터베이스 & 큐]** 메타데이터(`CID`, 수신자 정보, 발송 시간 등)를 DB(Supabase)에 저장하고, BullMQ를 통해 지정된 시간에 큐(Queue)를 예약합니다.
4. **[백그라운드 Worker]** 시간이 도달하면 Worker가 깨어나 이메일 발송(Nodemailer) 작업을 수행합니다.
5. **[스마트 컨트랙트]** 발송과 동시에 폴리곤 네트워크에 트랜잭션을 보내 배달 기록(TxHash)을 남깁니다.
6. **[수신자]** 이메일 알림을 받고 프론트엔드에 접속해 자신의 개인키(Private Key)를 입력하면, IPFS에서 데이터를 불러와 브라우저 단에서 복호화(해독)하여 사진과 편지를 확인합니다.

### ⚠️ MVP 제한 사항 (Limitation & Trade-off)

초기 PRD 기획 단계에서는 **"수신자가 메타마스크(MetaMask) 등 웹3 지갑을 연결하여 서명(Sign)을 통해 복호화하는 기능"**을 구상했습니다.
하지만 MVP 개발 기간 단축과 사용자 경험(UX) 직관성을 위해, 지갑 연동 대신 **브라우저에서 생성한 RSA 개인키(Private Key) 파일(`.txt`)을 직접 업로드하거나 붙여넣어 해독하는 방식**으로 대체 구현하였습니다.

---

## 🔐 50년 뒤 완벽한 해독을 위한 물리적 보관 요건

타임캡슐이 50년이라는 긴 세월을 버티고 수신자에게 온전히 닿기 위해, 물리적으로 보존해야 할 필수 요소는 다음과 같습니다.

1. **[절대 분실 금지] 수신자의 개인키 (Private Key)**
   - 타임캡슐 생성 시 발급받은 `.txt` 파일 형태의 개인키는 **절대 온라인에 노출되어서는 안 되며, 50년 동안 물리적으로 안전하게 보관**되어야 합니다. (예: 암호화된 USB 보관, 종이에 인쇄하여 개인 금고 보관, 금속판에 각인 등)
   - 개인키를 분실하면 IPFS에 데이터가 살아있어도 영원히 해독할 수 없습니다.
2. **IPFS 주소 (CID) 및 트랜잭션 해시 (TxHash)**
   - 현재(MVP) 구조에서는 지정된 시간에 Futuring 서버가 수신자에게 이메일로 CID가 포함된 링크를 발송합니다.
   - 하지만 50년 뒤 서버가 종료될 최악의 상황을 대비하려면, **발송자가 타임캡슐 생성 직후 부여받은 `CID`를 수신자의 `Private Key`와 함께 물리적 매체에 미리 백업**해 두어야 합니다. (이 경우 전 세계 IPFS 네트워크 어디서든 원본을 다운로드할 수 있습니다.)
   - **한계점 및 넥스트 스텝:** 만약 누군가 이 두 가지(CID + Private Key)를 미리 발견하면 50년이 되기 전에도 해독할 수 있다는 한계가 있습니다. 이를 완벽히 방지하기 위해 추후 지정된 블록 높이(시간)가 도달하기 전까지는 해독이 불가능한 **분산형 타임락 암호화(Timelock Encryption)** 기술을 도입하면 가능할 것이라고 생각합니다.

---

## 🛠 기술 스택 (Tech Stack)

### Frontend (Client)

- **Framework:** Next.js (App Router), React
- **Styling:** Tailwind CSS, Lucide Icons
- **Web3 / Crypto:** Web Crypto API (RSA-OAEP, AES-GCM)
- **Deployment:** **Vercel** (서버리스 환경 배포 및 전역 CDN 캐싱)

### Backend (Server & Worker)

- **Framework:** NestJS
- **Database / ORM:** Supabase (PostgreSQL), Prisma
- **Message Queue:** BullMQ, Upstash Redis
- **Blockchain / Web3:** Ethers.js, Hardhat, Solidity, Polygon Amoy Testnet
- **Storage / Notification:** Pinata (IPFS), Nodemailer
- **Deployment:** **Render** (백그라운드 예약 큐 처리를 위한 영구 실행 웹 서비스 배포)

---

## 🚀 배포 환경 (Deployment Strategy)

본 프로젝트는 구조적 특성상 프론트엔드와 백엔드를 완벽히 분리하여 최적의 플랫폼에 배포했습니다.

1. **Frontend (Vercel)**
   - 정적 파일 제공 및 클라이언트 사이드 암호화 로직을 빠르게 제공하기 위해 Vercel의 엣지 네트워크를 활용합니다.
   - 환경 변수: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_IPFS_GATEWAY`
2. **Backend (Render)**
   - 타임캡슐 발송을 예약하고 감시하는 **BullMQ Worker**는 Vercel 같은 서버리스(Serverless) 환경에서는 지속 실행이 불가능합니다.
   - 따라서 24시간 백그라운드 프로세스가 유지되는 **Render (Web Service)** 플랫폼을 사용하여 정확한 스케줄링을 보장합니다.

---

## 🎮 서비스 사용 및 테스트 방법 (How to Test)

실제 배포된 환경에서 타임캡슐의 생성부터 해독, 블록체인 기록 검증까지 전체 사이클을 테스트하는 방법입니다.

### 1단계: 타임캡슐 발송하기 (Send)

1. 배포된 프론트엔드 웹사이트에 접속합니다.
2. `수신자 이메일`과 `수신자 지갑 주소`를 입력합니다. (지갑 주소는 자신의 임의의 메타마스크 주소를 입력해도 무방합니다.)
3. **[임시 키 발급]** 버튼을 눌러 일회용 RSA 키 페어를 생성합니다.
   - 이때 다운로드되는 `private_key.txt` 파일은 나중에 캡슐을 열어볼 때 **반드시 필요**하므로 잘 보관합니다.
   - 발급된 `Public Key(공개키)`를 복사하여 입력칸에 붙여넣습니다.
4. 즉각적인 테스트를 위해 예약 시간을 **현재 시간으로부터 1~2분 뒤**로 설정합니다.
5. 편지 내용과 사진을 첨부한 뒤 전송 버튼을 누릅니다.

### 2단계: 메일 수신 및 해독하기 (Receive)

1. 예약한 시간이 지나면 입력했던 이메일로 **IPFS CID**가 포함된 '타임캡슐 도착 알림 메일'이 발송됩니다.
2. 메일 내의 링크를 클릭하거나 사이트의 `Receive` 탭으로 이동하여, 메일로 받은 `CID`와 1단계에서 저장해둔 `private_key.txt`의 암호 키 텍스트를 붙여넣습니다.
3. **[Decrypt Message]** 버튼을 누르면, 브라우저 단에서 오프라인 복호화가 진행되며 원본 사진과 편지가 화면에 나타납니다.

### 3단계: 블록체인 온체인 기록 확인하기 (Verify)

지정된 시간에 타임캡슐 배달이 완료되는 즉시, 폴리곤 블록체인 네트워크에 영수증(Transaction)이 영구 기록됩니다.

- 👉 **[Futuring 스마트 컨트랙트 기록 보러가기 (Polygonscan Amoy)](https://amoy.polygonscan.com/address/0x7D9d6D1B38725A364dAc52251965688a87673ca7)**
- 위 링크에 접속하여 최신 트랜잭션의 **Txn Hash**를 클릭합니다.
- 화면을 아래로 내려 **[Click to see More]**를 누른 뒤, **[Input Data]** 항목 아래에 있는 `View Input As` 버튼을 **UTF-8**로 변경해 봅니다.
- 자신이 발송했던 편지의 `CID`가 블록체인 장부 심장부에 영구적으로 새겨져 있는 것을 직접 눈으로 확인할 수 있습니다.

---

## 💻 로컬 실행 방법 (How to run locally)

### 1. Backend 설정

```bash
cd backend
npm install
# .env 파일 생성 후 DB, Redis, Pinata, Polygon 지갑 정보 등 기입
npx prisma generate
npm run start:dev
```

### 2. Frontend 설정

```bash
cd frontend
npm install
# .env.local 파일 생성 후 백엔드 API URL 기입
npm run dev
```
