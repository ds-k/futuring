// src/utils/crypto.ts

/**
 * ArrayBuffer 또는 Uint8Array를 Base64 문자열로 변환합니다.
 */
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  let binary = "";
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Base64 문자열을 ArrayBuffer로 변환합니다.
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 1. 즉석에서 테스트용 RSA 키쌍(공개키, 개인키)을 생성하여 Base64 형태로 반환합니다.
 */
export async function generateRSAKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const exportedPublicKey = await window.crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey
  );
  const exportedPrivateKey = await window.crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey
  );

  return {
    publicKeyBase64: arrayBufferToBase64(exportedPublicKey),
    privateKeyBase64: arrayBufferToBase64(exportedPrivateKey),
  };
}

/**
 * 2. 원문 텍스트를 AES-GCM으로 암호화한 뒤,
 *    AES 대칭키를 수신자의 RSA 공개키로 암호화하여(하이브리드) 반환합니다.
 */
export async function encryptMessageWithHybrid(
  plainText: string,
  publicKeyBase64: string
): Promise<string> {
  // 1) 수신자의 공개키(Base64)를 Web Crypto Key 객체로 복원
  const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);
  const rsaPublicKey = await window.crypto.subtle.importKey(
    "spki",
    publicKeyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );

  // 2) 이번 편지만을 위한 일회용 대칭키(AES-256-GCM) 생성
  const aesKey = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // 내보내기 가능하게 설정
    ["encrypt", "decrypt"]
  );

  // 3) 원문을 AES 키로 암호화
  const encoder = new TextEncoder();
  const encodedText = encoder.encode(plainText);
  // IV(초기화 벡터)는 랜덤이어야 안전합니다.
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); 

  const encryptedDataBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    encodedText
  );

  // 4) 일회용 AES 키를 추출한 뒤, 수신자의 RSA 공개키로 암호화 (하이브리드 핵심)
  const rawAesKeyBuffer = await window.crypto.subtle.exportKey("raw", aesKey);
  const encryptedAesKeyBuffer = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    rsaPublicKey,
    rawAesKeyBuffer
  );

  // 5) JSON 형태로 모든 정보(IV, 암호화된 본문, 암호화된 키)를 묶어서 Base64 문자열로 변환
  const payload = {
    iv: arrayBufferToBase64(iv.buffer),
    encryptedData: arrayBufferToBase64(encryptedDataBuffer),
    encryptedKey: arrayBufferToBase64(encryptedAesKeyBuffer),
    cryptoVersion: "1.0", // 향후 양자내성암호 업데이트를 위한 버전
  };

  return btoa(JSON.stringify(payload));
}

/**
 * 3. Base64로 인코딩된 암호화 페이로드와 수신자의 RSA 개인키(Base64)를 사용하여 원문을 복호화합니다.
 */
export async function decryptMessageWithHybrid(
  encryptedPayloadBase64: string,
  privateKeyBase64: string
): Promise<string> {
  // 1) 페이로드 파싱
  const payloadJson = atob(encryptedPayloadBase64);
  const payload = JSON.parse(payloadJson);

  // 2) RSA 개인키 복원
  const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
  const rsaPrivateKey = await window.crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );

  // 3) RSA 개인키로 암호화된 AES 대칭키 복호화
  const encryptedAesKeyBuffer = base64ToArrayBuffer(payload.encryptedKey);
  const rawAesKeyBuffer = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    rsaPrivateKey,
    encryptedAesKeyBuffer
  );

  // 4) 복원된 AES 대칭키를 Web Crypto Key 객체로 변환
  const aesKey = await window.crypto.subtle.importKey(
    "raw",
    rawAesKeyBuffer,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["decrypt"]
  );

  // 5) 복원된 대칭키와 IV를 사용하여 원문 복호화
  const ivBuffer = base64ToArrayBuffer(payload.iv);
  const encryptedDataBuffer = base64ToArrayBuffer(payload.encryptedData);

  const decryptedDataBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(ivBuffer),
    },
    aesKey,
    encryptedDataBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedDataBuffer);
}
