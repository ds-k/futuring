"use client";

import { useState } from "react";
import { Mail, Inbox, LockOpen, Paperclip } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"send" | "receive">("send");

  // Send Form State
  const [formData, setFormData] = useState({
    recipientEmail: "",
    recipientDid: "",
    senderDid: "",
    scheduledAt: "",
    content: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // Receive Form State
  const [receiveCid, setReceiveCid] = useState("");
  const [receiveStatus, setReceiveStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [receiveMessage, setReceiveMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("http://localhost:8000/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setStatus("success");
      setMessage("Message successfully scheduled for the future! 🚀");
      setFormData({ recipientEmail: "", recipientDid: "", senderDid: "", scheduledAt: "", content: "" });
      
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage("Failed to schedule message. Please check the backend connection.");
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

  const renderSendForm = () => (
    <form onSubmit={handleSubmit} className="flex flex-col h-full w-full">
      <div className="flex-1 p-5 sm:p-8 overflow-y-auto">
        <div className="flex flex-col h-full space-y-4">
          {/* 받는 사람 그룹 */}
          <div className="bg-[#F7F7F5] border border-[#E6E6E3] rounded-2xl p-4 sm:p-5 flex flex-col gap-3 transition-colors focus-within:bg-white focus-within:border-[#D4D4D0] focus-within:shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4" title="50년 뒤에 타임캡슐 도착 알림을 받을 이메일 주소입니다.">
              <span className="w-full sm:w-24 text-sm font-semibold text-[#8C8C88]">To (Email)</span>
              <input
                type="email"
                name="recipientEmail"
                className="flex-1 bg-transparent text-sm text-[#2D2D2A] outline-none placeholder:text-[#B4B4B0]"
                placeholder="recipient@example.com"
                value={formData.recipientEmail}
                onChange={handleChange}
                required
              />
            </div>
            <div className="w-full h-px bg-[#E6E6E3] my-1" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4" title="메시지 암호화를 위한 수신자의 지갑 주소입니다.">
              <span className="w-full sm:w-24 text-sm font-semibold text-[#8C8C88]">To (Wallet)</span>
              <input
                type="text"
                name="recipientDid"
                className="flex-1 bg-transparent text-sm text-[#2D2D2A] outline-none placeholder:text-[#B4B4B0]"
                placeholder="0x..."
                value={formData.recipientDid}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* 보내는 사람 */}
          <div className="bg-[#F7F7F5] border border-[#E6E6E3] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 transition-colors focus-within:bg-white focus-within:border-[#D4D4D0] focus-within:shadow-[0_2px_10px_rgba(0,0,0,0.02)]" title="보내는 사람의 지갑 주소입니다.">
            <span className="w-full sm:w-24 text-sm font-semibold text-[#8C8C88]">From (Wallet)</span>
            <input
              type="text"
              name="senderDid"
              className="flex-1 bg-transparent text-sm text-[#2D2D2A] outline-none placeholder:text-[#B4B4B0]"
              placeholder="0x..."
              value={formData.senderDid}
              onChange={handleChange}
              required
            />
          </div>

          {/* 시간 설정 */}
          <div className="bg-[#F7F7F5] border border-[#E6E6E3] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 transition-colors focus-within:bg-white focus-within:border-[#D4D4D0] focus-within:shadow-[0_2px_10px_rgba(0,0,0,0.02)]" title="메시지가 열릴 시간을 설정합니다.">
            <span className="w-full sm:w-24 text-sm font-semibold text-[#8C8C88]">Time Capsule</span>
            <input
              type="datetime-local"
              name="scheduledAt"
              className="flex-1 bg-transparent text-sm text-[#2D2D2A] outline-none cursor-pointer"
              value={formData.scheduledAt}
              onChange={handleChange}
              required
            />
          </div>

          {/* 메시지 본문 */}
          <div className="flex-1 rounded-2xl bg-[#F7F7F5] border border-[#E6E6E3] p-4 sm:p-5 flex flex-col transition-colors focus-within:bg-white focus-within:border-[#D4D4D0] focus-within:shadow-[0_2px_10px_rgba(0,0,0,0.02)] min-h-[150px]">
            <textarea
              name="content"
              className="w-full flex-1 bg-transparent resize-none outline-none text-[#2D2D2A] text-lg sm:text-xl font-medium leading-relaxed placeholder:text-[#B4B4B0]"
              placeholder="Write a message to the future..."
              spellCheck="false"
              value={formData.content}
              onChange={handleChange}
              required
            />
          </div>

          {status === "success" && (
            <div className="mt-4 rounded-xl bg-[#E8F3E9] border border-[#C5E1A5] px-5 py-3 text-center text-sm font-medium text-[#2E7D32]">
              {message}
            </div>
          )}
          {status === "error" && (
            <div className="mt-4 rounded-xl bg-[#FDECEA] border border-[#FFAB91] px-5 py-3 text-center text-sm font-medium text-[#C62828]">
              {message}
            </div>
          )}
        </div>
      </div>

      {/* 하단 툴바 */}
      <div className="h-16 sm:h-20 bg-[#FCFCFB] border-t border-[#F0F0EE] flex items-center justify-between px-6 sm:px-8 shrink-0 relative">
        <button type="button" className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#A3A3A0] hover:bg-[#EBEBE8] hover:text-[#2D2D2A] transition-colors border border-[#EAEAEA]">
          <Paperclip size={16} />
        </button>

        {/* 탭 토글버튼 (정중앙 둥둥) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-[#EBEBE8] p-1 rounded-full shadow-sm border border-[#E6E6E3]">
          <button
            type="button"
            onClick={() => setActiveTab("send")}
            title="편지 보내기"
            className={`p-1.5 px-5 rounded-full transition-all text-sm font-semibold flex items-center gap-2 ${
              activeTab === "send" ? "bg-white shadow-sm text-[#2D2D2A]" : "text-[#8C8C88] hover:text-[#2D2D2A]"
            }`}
          >
            <Mail size={16} />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("receive")}
            title="타임캡슐 열기"
            className={`p-1.5 px-5 rounded-full transition-all text-sm font-semibold flex items-center gap-2 ${
              activeTab === "receive" ? "bg-white shadow-sm text-[#2D2D2A]" : "text-[#8C8C88] hover:text-[#2D2D2A]"
            }`}
          >
            <Inbox size={16} />
          </button>
        </div>
        
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-10 sm:h-11 px-6 sm:px-8 rounded-full bg-[#2D2D2A] hover:bg-[#1A1A18] text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span>{status === "loading" ? "Scheduling..." : "Send to the Future"}</span>
        </button>
      </div>
    </form>
  );

  const renderReceiveForm = () => (
    <form onSubmit={handleReceive} className="flex flex-col h-full w-full">
      <div className="flex-1 p-5 sm:p-8 overflow-y-auto flex flex-col items-center justify-center">
        <div className="w-full max-w-md flex flex-col gap-6 items-center text-center">
          <div className="w-16 h-16 bg-[#F7F7F5] border border-[#E6E6E3] rounded-2xl flex items-center justify-center text-[#2D2D2A] mb-2 shadow-sm">
            <Inbox size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#2D2D2A]">타임캡슐 열기</h2>
            <p className="text-sm text-[#8C8C88] mt-2">
              이메일로 전달받은 데이터 주소(CID)를 입력하고<br/>
              지갑을 연결하여 캡슐의 암호를 해독하세요.
            </p>
          </div>

          <div className="w-full bg-[#F7F7F5] border border-[#E6E6E3] rounded-2xl p-4 sm:p-5 flex flex-col transition-colors focus-within:bg-white focus-within:border-[#D4D4D0] focus-within:shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <input
              type="text"
              className="w-full bg-transparent text-lg sm:text-xl text-center font-medium text-[#2D2D2A] outline-none placeholder:text-[#B4B4B0]"
              placeholder="타임캡슐 CID 입력 (예: QmXyZ...)"
              value={receiveCid}
              onChange={(e) => setReceiveCid(e.target.value)}
              required
            />
          </div>

          {receiveStatus === "success" && (
            <div className="w-full rounded-xl bg-[#E8F3E9] border border-[#C5E1A5] px-5 py-4 text-center text-sm font-medium text-[#2E7D32]">
              {receiveMessage}<br/>
              <span className="block mt-2 text-xs opacity-80">
                "안녕! 50년 전의 내가 보내는 편지야..."
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 하단 툴바 */}
      <div className="h-16 sm:h-20 bg-[#FCFCFB] border-t border-[#F0F0EE] flex items-center justify-center px-6 sm:px-8 shrink-0 relative">
        {/* 탭 토글버튼 (정중앙 둥둥) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-[#EBEBE8] p-1 rounded-full shadow-sm border border-[#E6E6E3]">
          <button
            type="button"
            onClick={() => setActiveTab("send")}
            title="편지 보내기"
            className={`p-1.5 px-5 rounded-full transition-all text-sm font-semibold flex items-center gap-2 ${
              activeTab === "send" ? "bg-white shadow-sm text-[#2D2D2A]" : "text-[#8C8C88] hover:text-[#2D2D2A]"
            }`}
          >
            <Mail size={16} />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("receive")}
            title="타임캡슐 열기"
            className={`p-1.5 px-5 rounded-full transition-all text-sm font-semibold flex items-center gap-2 ${
              activeTab === "receive" ? "bg-white shadow-sm text-[#2D2D2A]" : "text-[#8C8C88] hover:text-[#2D2D2A]"
            }`}
          >
            <Inbox size={16} />
          </button>
        </div>

        <button
          type="submit"
          disabled={receiveStatus === "loading" || receiveStatus === "success" || !receiveCid}
          className="absolute right-6 sm:right-8 h-10 sm:h-11 px-6 sm:px-8 rounded-full bg-[#2D2D2A] hover:bg-[#1A1A18] text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <LockOpen size={16} />
          <span>{receiveStatus === "loading" ? "해독 중..." : "지갑으로 해독하기"}</span>
        </button>
      </div>
    </form>
  );

  return (
    <main className="min-h-screen bg-[#EBEBE8] flex items-center justify-center p-4 font-sans selection:bg-[#D4D4D0] selection:text-[#2D2D2A]">
      {/* 엽서 컨테이너 */}
      <div className="w-full max-w-[640px] aspect-[1/1.2] sm:aspect-[4/3] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative flex flex-col border border-[#E6E6E3]">
        
        {/* 상단 타이틀 바 */}
        <div className="h-12 sm:h-14 bg-[#FCFCFB] border-b border-[#F0F0EE] flex items-center px-4 sm:px-6 shrink-0 justify-between">
          <div className="flex items-center space-x-2 w-16">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
          </div>
          <div className="flex-1 flex justify-center items-center text-[#2D2D2A] font-semibold text-sm space-x-2">
            {activeTab === "send" ? <Mail size={16} /> : <Inbox size={16} />}
            <span>{activeTab === "send" ? "New Future Message" : "Open Time Capsule"}</span>
          </div>
          <div className="w-16"></div>
        </div>

        {activeTab === "send" ? renderSendForm() : renderReceiveForm()}
      </div>
    </main>
  );
}
