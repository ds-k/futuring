"use client";

import { useState } from "react";
import { Mail, Send, Paperclip, Inbox, LockOpen, Key } from "lucide-react";
import { generateRSAKeyPair, encryptMessageWithHybrid } from "../utils/crypto";

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
      alert("키쌍이 생성되었습니다! 다운로드된 개인키(Private Key)를 안전한 곳에 보관하세요.");
    } catch (error) {
      alert("키 생성에 실패했습니다.");
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
      
      const encryptedContent = await encryptMessageWithHybrid(
        formData.content,
        formData.recipientPublicKey
      );

      const payload = {
        ...formData,
        content: encryptedContent,
      };

      const response = await fetch("http://localhost:8000/messages", {
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
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "An error occurred");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const handleReceive = (e: React.FormEvent) => {
    e.preventDefault();
    setReceiveStatus("loading");
    setReceiveMessage("");

    // 시뮬레이션: 1.5초 후 성공
    setTimeout(() => {
      setReceiveStatus("success");
      setReceiveMessage("지갑 서명을 통해 성공적으로 타임캡슐을 해독했습니다!");
    }, 1500);
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
                <span className="w-full sm:w-32 text-sm font-medium text-gray-400">Email</span>
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

              <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-100 pb-3 gap-2 sm:gap-0 mt-3 sm:mt-4 shrink-0">
                <span className="w-full sm:w-32 text-sm font-medium text-gray-400">Public Key</span>
                <div className="flex-1 flex gap-2">
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
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-100 pb-3 gap-2 sm:gap-0 mt-3 sm:mt-4 shrink-0">
                <span className="w-full sm:w-32 text-sm font-medium text-gray-400">Wallet</span>
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
              <div className="flex gap-2 sm:gap-3 z-10">
                <button
                  type="button"
                  className="flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-200"
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
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 overflow-y-auto">
              <div className="w-full max-w-md flex flex-col gap-6 items-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 mb-2 border border-gray-100 shadow-sm">
                  <Inbox size={32} />
                </div>
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

                <input
                  type="text"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-gray-400 focus:bg-white transition-colors text-center"
                  placeholder="타임캡슐 CID 입력 (예: QmXyZ...)"
                  value={receiveCid}
                  onChange={(e) => setReceiveCid(e.target.value)}
                  required
                />

                {receiveStatus === "success" && (
                  <div className="w-full rounded-lg bg-green-50 px-5 py-4 text-center text-sm font-medium text-green-800 border border-green-100">
                    {receiveMessage}
                    <br />
                    <span className="block mt-2 text-xs opacity-70">
                      &quot;안녕! 50년 전의 내가 보내는 편지야...&quot;
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="flex items-center justify-end border-t border-gray-100 bg-gray-50 px-4 py-4 sm:px-8 relative min-h-[72px] shrink-0">
              {/* Mobile Toggle (모바일에서만 보임, 가운데 정렬) */}
              <div className="sm:hidden absolute left-1/2 -translate-x-1/2 flex items-center bg-white/60 backdrop-blur-xl p-1.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] z-20 border border-white/60">
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

              <button
                type="submit"
                disabled={
                  receiveStatus === "loading" ||
                  receiveStatus === "success" ||
                  !receiveCid
                }
                className="flex items-center justify-center gap-2 rounded-full bg-neutral-900 h-10 w-10 sm:w-auto sm:h-11 sm:px-6 text-sm font-medium text-white transition-all hover:bg-neutral-800 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 z-10"
                title="지갑으로 해독하기"
              >
                <LockOpen size={16} />
                <span className="hidden sm:inline-block">
                  {receiveStatus === "loading"
                    ? "해독 중..."
                    : "지갑으로 해독하기"}
                </span>
              </button>
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
