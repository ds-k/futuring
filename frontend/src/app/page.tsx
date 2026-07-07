"use client";

import { useState } from "react";
import { Mail, Send, Paperclip, Inbox, LockOpen, Key, X } from "lucide-react";
import {
  generateRSAKeyPair,
  encryptMessageWithHybrid,
  decryptMessageWithHybrid,
} from "../utils/crypto";
import { useRef } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"send" | "receive">("send");

  // Send Form State
  const [formData, setFormData] = useState({
    senderDid: "",
    recipientEmail: "",
    recipientDid: "",
    recipientPublicKey: "",
    scheduledAt: "",
    content: "",
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  // Receive Form State
  const [receiveCid, setReceiveCid] = useState("");
  const [receiveStatus, setReceiveStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [receiveMessage, setReceiveMessage] = useState("");
  const [receivePrivateKey, setReceivePrivateKey] = useState("");
  const [decryptedContent, setDecryptedContent] = useState("");
  const [decryptedImage, setDecryptedImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleGenerateKey = async () => {
    try {
      const keys = await generateRSAKeyPair();
      setFormData((prev) => ({
        ...prev,
        recipientPublicKey: keys.publicKeyBase64,
      }));
      const blob = new Blob([keys.privateKeyBase64], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "future_message_private_key.txt";
      a.click();
      URL.revokeObjectURL(url);
      alert(
        "키쌍이 생성되었습니다! 다운로드된 개인키(Private Key)를 안전한 곳에 보관하세요.",
      );
    } catch (error) {
      alert("키 생성에 실패했습니다.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("이미지 크기는 2MB 이하여야 합니다.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      if (!formData.recipientPublicKey) {
        throw new Error("수신자의 RSA 공개키가 필요합니다.");
      }

      const messageBody = JSON.stringify({ text: formData.content, image: selectedImage });

      const encryptedContent = await encryptMessageWithHybrid(
        messageBody,
        formData.recipientPublicKey,
      );

      const payload = {
        ...formData,
        content: encryptedContent,
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setStatus("success");
      setMessage("Message successfully scheduled for the future! 🚀");
      setFormData({
        senderDid: "",
        recipientEmail: "",
        recipientDid: "",
        recipientPublicKey: "",
        scheduledAt: "",
        content: "",
      });
      setSelectedImage(null);
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "An error occurred");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    setReceiveStatus("loading");
    setReceiveMessage("");
    setDecryptedContent("");
    setDecryptedImage(null);

    try {
      if (!receivePrivateKey) {
        throw new Error("해독을 위한 개인키가 필요합니다.");
      }

      // 1) IPFS에서 데이터 가져오기
      const gatewayUrl = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud";
      const response = await fetch(`${gatewayUrl}/ipfs/${receiveCid}`);
      if (!response.ok) {
        throw new Error("IPFS에서 데이터를 찾을 수 없습니다.");
      }
      const data = await response.json();

      // 2) 암호화된 페이로드 추출
      const encryptedPayload = data.message;
      if (!encryptedPayload) {
        throw new Error("유효하지 않은 타임캡슐 데이터입니다.");
      }

      // 3) 복호화 진행
      const decryptedText = await decryptMessageWithHybrid(
        encryptedPayload,
        receivePrivateKey,
      );

      let parsedData;
      try {
        parsedData = JSON.parse(decryptedText);
      } catch (e) {
        // 기존의 단순 텍스트 메시지 호환성 처리
        parsedData = { text: decryptedText, image: null };
      }

      setDecryptedContent(parsedData.text);
      setDecryptedImage(parsedData.image);
      setReceiveStatus("success");
      setReceiveMessage("타임캡슐 해독에 성공했습니다! 🎉");
    } catch (error: any) {
      setReceiveStatus("error");
      setReceiveMessage(error.message || "해독에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-center p-0 sm:p-6 font-sans">
      {/* 
        메인 창 (Main Card)
        PC: 최대 너비 max-w-4xl, 가운데 정렬, 높이 600px 고정으로 내용이 잘리지 않게 함
        Mobile: 좌우 꽉차는 전체화면 (w-full, h-screen)
      */}
      <div className="flex w-full max-w-4xl flex-col bg-white overflow-hidden sm:rounded-2xl sm:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)] h-screen sm:h-[600px] relative">
        {/* macOS Style Title Bar */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-6 shrink-0 bg-white">
          <div className="flex w-16 gap-2">
            <div className="h-3 w-3 rounded-full bg-red-400"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
            <div className="h-3 w-3 rounded-full bg-green-400"></div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
            {activeTab === "send" ? <Mail size={16} /> : <Inbox size={16} />}
            <span>
              {activeTab === "send"
                ? "New Future Message"
                : "Open Time Capsule"}
            </span>
          </div>
          <div className="flex w-16 justify-end gap-3 text-gray-500"></div>
        </div>

        {activeTab === "send" ? (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 bg-white overflow-hidden"
          >
            {/* Form Content */}
            <div className="flex flex-col gap-5 px-4 py-6 sm:px-8 sm:py-8 flex-1 overflow-y-auto">
              {/* Recipient Email & DID inputs */}
              <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-100 pb-3 gap-2 sm:gap-0 shrink-0">
                <span className="w-full sm:w-32 text-sm font-medium text-gray-400">
                  Email
                </span>
                <input
                  type="email"
                  name="recipientEmail"
                  className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-300"
                  placeholder="recipient@example.com (알림 받을 이메일)"
                  value={formData.recipientEmail}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-100 pb-3 gap-2 sm:gap-0 shrink-0">
                <span className="w-full sm:w-32 text-sm font-medium text-gray-400">
                  Public Key
                </span>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex flex-1 gap-2">
                    <input
                      type="text"
                      name="recipientPublicKey"
                      className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-300"
                      placeholder="수신자의 RSA 공개키 (또는 발급 버튼 클릭)"
                      value={formData.recipientPublicKey}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleGenerateKey}
                      className="flex items-center justify-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-md hover:bg-gray-200 transition-colors whitespace-nowrap"
                    >
                      <Key size={12} />
                      임시 키 발급
                    </button>
                  </div>
                  
                  {selectedImage && (
                    <div className="relative mt-2 inline-block">
                      <img src={selectedImage} alt="Preview" className="h-20 w-auto rounded-md border border-gray-200 object-cover" />
                      <button 
                        type="button" 
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm border border-gray-200 text-gray-500 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-100 pb-3 gap-2 sm:gap-0 shrink-0">
                <span className="w-full sm:w-32 text-sm font-medium text-gray-400">
                  Wallet
                </span>
                <input
                  type="text"
                  name="recipientDid"
                  className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-300"
                  placeholder="0x... (해독할 지갑 주소)"
                  value={formData.recipientDid}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-100 pb-3 gap-2 sm:gap-0 shrink-0">
                <span className="w-full sm:w-32 text-sm font-medium text-gray-400">
                  From
                </span>
                <input
                  type="text"
                  name="senderDid"
                  className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-300"
                  placeholder="보내는 사람 (이름 또는 닉네임)"
                  value={formData.senderDid}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-100 pb-3 gap-2 sm:gap-0 shrink-0">
                <span className="w-full sm:w-32 text-sm font-medium text-gray-400">
                  Time Capsule
                </span>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  className="flex-1 bg-transparent text-sm text-gray-800 outline-none cursor-pointer"
                  value={formData.scheduledAt}
                  onChange={handleChange}
                  required
                />
              </div>

              <textarea
                name="content"
                className="mt-4 w-full flex-1 resize-none bg-transparent text-base leading-relaxed text-gray-800 outline-none placeholder:text-gray-300 min-h-[150px]"
                placeholder="Write a message to the future..."
                value={formData.content}
                onChange={handleChange}
                required
              ></textarea>

              {status === "success" && (
                <div className="mt-4 rounded-lg bg-green-50 px-5 py-3 text-center text-sm font-medium text-green-800 shrink-0">
                  {message}
                </div>
              )}
              {status === "error" && (
                <div className="mt-4 rounded-lg bg-red-50 px-5 py-3 text-center text-sm font-medium text-red-800 shrink-0">
                  {message}
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-4 sm:px-8 relative min-h-[72px] shrink-0">
              <div className="hidden sm:flex items-center bg-gray-50/80 backdrop-blur-md p-1.5 rounded-full border border-gray-100 shadow-sm z-10">
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleImageUpload} 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-200/50 hover:text-gray-700 transition-colors"
                  title="사진 첨부하기"
                >
                  <Paperclip size={18} />
                </button>
              </div>

              {/* Mobile Toggle (모바일에서만 보임, 가운데 정렬) */}
              <div className="sm:hidden absolute left-1/2 -translate-x-1/2 flex items-center bg-white/60 backdrop-blur-xl p-1.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] z-20 border border-white/60">
                <button
                  type="button"
                  onClick={() => setActiveTab("send")}
                  className="p-2 px-5 rounded-full transition-all flex items-center justify-center bg-white text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                >
                  <Mail size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("receive")}
                  className="p-2 px-5 rounded-full transition-all flex items-center justify-center text-gray-500 hover:bg-white/50"
                >
                  <Inbox size={16} />
                </button>
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="flex items-center justify-center gap-2 rounded-full bg-neutral-900 h-10 w-10 sm:w-auto sm:h-11 sm:px-6 text-sm font-medium text-white transition-all hover:bg-neutral-800 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 z-10"
                title="Send to the Future"
              >
                <Send size={16} />
                <span className="hidden sm:inline-block">
                  {status === "loading"
                    ? "Scheduling..."
                    : "Send to the Future"}
                </span>
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={handleReceive}
            className="flex flex-col flex-1 bg-white overflow-hidden"
          >
            <div className="flex-1 flex flex-col p-6 sm:p-8 overflow-y-auto">
              <div className="w-full flex flex-col items-center text-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    타임캡슐 열기
                  </h2>
                  <p className="text-sm text-gray-500 mt-2">
                    이메일로 전달받은 데이터 주소(CID)를 입력하고
                    <br />
                    지갑을 연결하여 캡슐의 암호를 해독하세요.
                  </p>
                </div>
              </div>

              <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[250px]">
                {/* Left: Inputs */}
                <div className="flex flex-col gap-4 bg-gray-50/50 border border-gray-100 rounded-2xl p-5 shadow-sm h-full">
                  <h3 className="text-sm font-semibold text-gray-700">
                    입력 정보
                  </h3>
                  <div className="flex flex-col gap-3 flex-1">
                    <input
                      type="text"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-gray-400 transition-colors"
                      placeholder="타임캡슐 CID 입력 (예: QmXyZ...)"
                      value={receiveCid}
                      onChange={(e) => setReceiveCid(e.target.value)}
                      required
                    />
                    <textarea
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-gray-400 transition-colors flex-1 min-h-[120px] resize-none"
                      placeholder="다운로드 받았던 개인키(Private Key) 내용을 여기에 붙여넣어주세요."
                      value={receivePrivateKey}
                      onChange={(e) => setReceivePrivateKey(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Right: Results */}
                <div className="flex flex-col gap-4 bg-gray-50/50 border border-gray-100 rounded-2xl p-5 shadow-sm h-full">
                  <h3 className="text-sm font-semibold text-gray-700">
                    해독 결과
                  </h3>
                  <div className="flex-1 flex flex-col items-center justify-center">
                    {receiveStatus === "idle" && (
                      <span className="text-gray-400 text-sm text-center">
                        데이터를 입력하고 해독을 진행해주세요.
                      </span>
                    )}

                    {receiveStatus === "loading" && (
                      <span className="text-gray-400 text-sm text-center animate-pulse">
                        암호를 해독하는 중...
                      </span>
                    )}

                    {receiveStatus === "error" && (
                      <div className="w-full rounded-lg bg-red-50 px-5 py-4 text-center text-sm font-medium text-red-800 border border-red-100">
                        {receiveMessage}
                      </div>
                    )}

                    {receiveStatus === "success" && (
                      <div className="w-full h-full flex flex-col">
                        <div className="w-full rounded-lg bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-800 border border-green-100 mb-3 shrink-0">
                          {receiveMessage}
                        </div>
                        <div className="flex-1 p-4 bg-white rounded-xl text-left text-gray-700 whitespace-pre-wrap border border-gray-100 shadow-inner overflow-y-auto">
                          {decryptedImage && (
                            <img src={decryptedImage} alt="Decrypted" className="max-w-full h-auto rounded-lg mb-4 border border-gray-200" />
                          )}
                          {decryptedContent}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="flex flex-col border-t border-gray-100 bg-gray-50 px-4 py-4 sm:px-8 relative min-h-[72px] shrink-0">
              <div className="flex items-center justify-between w-full">
                {/* 빈 공간 차지 (Mobile Toggle 중앙 정렬 유지 위함) */}
                <div className="hidden sm:block w-[100px]"></div>

                {/* Mobile Toggle (모바일에서만 보임, 가운데 정렬) */}
                <div className="sm:hidden absolute left-1/2 -translate-x-1/2 top-4 flex items-center bg-white/60 backdrop-blur-xl p-1.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] z-20 border border-white/60">
                  <button
                    type="button"
                    onClick={() => setActiveTab("send")}
                    className="p-2 px-5 rounded-full transition-all flex items-center justify-center text-gray-500 hover:bg-white/50"
                  >
                    <Mail size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("receive")}
                    className="p-2 px-5 rounded-full transition-all flex items-center justify-center bg-white text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                  >
                    <Inbox size={16} />
                  </button>
                </div>

                <div className="flex flex-col items-end gap-2 z-10 sm:w-auto w-full flex-1">
                  <button
                    type="submit"
                    disabled={
                      receiveStatus === "loading" ||
                      !receiveCid ||
                      !receivePrivateKey
                    }
                    className="flex items-center justify-center gap-2 rounded-full bg-neutral-900 h-10 w-10 sm:w-auto sm:h-11 sm:px-6 text-sm font-medium text-white transition-all hover:bg-neutral-800 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ml-auto"
                    title="개인키(Private Key)로 해독하기"
                  >
                    <LockOpen size={16} />
                    <span className="hidden sm:inline-block">
                      {receiveStatus === "loading"
                        ? "해독 중..."
                        : "개인키로 해독하기"}
                    </span>
                  </button>
                </div>
              </div>

              {/* MVP Disclaimer text (Centered at the bottom of the form) */}
              <div className="w-full mt-4 text-center">
                <span className="text-[10px] text-gray-400">
                  * 실제 서비스에서는 지갑을 연동하여 지갑 내부의 키로
                  해독되지만, MVP 테스트를 위해 다운로드 받은 개인키를 직접
                  입력하도록 구현되었습니다.
                </span>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* 
        PC Toggle Button (Main window 외부 하단 중앙에 플로팅)
      */}
      <div className="hidden sm:flex mt-8 items-center bg-white/60 backdrop-blur-xl p-1.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/60">
        <button
          type="button"
          onClick={() => setActiveTab("send")}
          className={`px-8 py-2.5 rounded-full transition-all text-sm font-semibold flex items-center gap-2 ${
            activeTab === "send"
              ? "bg-white text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
              : "text-gray-500 hover:text-gray-800 hover:bg-white/50"
          }`}
        >
          <Mail size={18} />
          <span>Send Letter</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("receive")}
          className={`px-8 py-2.5 rounded-full transition-all text-sm font-semibold flex items-center gap-2 ${
            activeTab === "receive"
              ? "bg-white text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
              : "text-gray-500 hover:text-gray-800 hover:bg-white/50"
          }`}
        >
          <Inbox size={18} />
          <span>Open Capsule</span>
        </button>
      </div>
    </div>
  );
}
