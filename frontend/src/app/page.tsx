"use client";

import { useState } from "react";
import { Mail, Send, Paperclip } from "lucide-react";

export default function Home() {
  const [formData, setFormData] = useState({
    senderDid: "",
    recipientDid: "",
    scheduledAt: "",
    content: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("http://localhost:3000/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setStatus("success");
      setMessage("Message successfully scheduled for the future! 🚀");
      setFormData({ senderDid: "", recipientDid: "", scheduledAt: "", content: "" });
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage("Failed to schedule message. Please check the backend connection.");
    }
  };

  return (
    <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)] sm:m-4 m-0 h-screen sm:h-auto">
      {/* macOS Style Title Bar */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-6">
        <div className="flex w-16 gap-2">
          <div className="h-3 w-3 rounded-full bg-red-400"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
          <div className="h-3 w-3 rounded-full bg-green-400"></div>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <Mail size={16} />
          New Future Message
        </div>
        {/* 우측 상단 여백 (타이틀 중앙 정렬 유지용) */}
        <div className="flex w-16 justify-end gap-3 text-gray-500">
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        {/* Form Content */}
        <div className="flex flex-col gap-5 px-4 py-6 sm:px-8 sm:py-8 flex-1">
          
          <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-100 pb-3 gap-2 sm:gap-0">
            <span className="w-full sm:w-32 text-sm font-medium text-gray-400">To</span>
            <input
              type="email"
              name="recipientDid"
              className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-300"
              placeholder="recipient@example.com (받는 사람 이메일)"
              value={formData.recipientDid}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-100 pb-3 gap-2 sm:gap-0">
            <span className="w-full sm:w-32 text-sm font-medium text-gray-400">From</span>
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

          <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-100 pb-3 gap-2 sm:gap-0">
            <span className="w-full sm:w-32 text-sm font-medium text-gray-400">Time Capsule</span>
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
            className="mt-4 w-full flex-1 resize-none bg-transparent text-base leading-relaxed text-gray-800 outline-none placeholder:text-gray-300 min-h-[200px]"
            placeholder="Write a message to the future..."
            value={formData.content}
            onChange={handleChange}
            required
          ></textarea>

          {status === "success" && (
            <div className="mt-4 rounded-lg bg-green-50 px-5 py-3 text-center text-sm font-medium text-green-800">
              {message}
            </div>
          )}
          {status === "error" && (
            <div className="mt-4 rounded-lg bg-red-50 px-5 py-3 text-center text-sm font-medium text-red-800">
              {message}
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-4 sm:px-8">
          <div className="flex gap-2 sm:gap-3">
            <button
              type="button"
              className="flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-200"
            >
              <Paperclip size={18} />
            </button>
          </div>
          
          <button
            type="submit"
            disabled={status === "loading"}
            className="flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-neutral-800 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} />
            {status === "loading" ? "Scheduling..." : "Send to the Future"}
          </button>
        </div>
      </form>
    </div>
  );
}
