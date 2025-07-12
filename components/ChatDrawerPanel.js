
import React, { useState } from "react";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";

export default function ChatDrawerPanel({ onClose }) {
  const [messages, setMessages] = useState([
    {
      type: "context",
      context: "All meetings",
      timestamp: new Date(),
    },
  ]);
  const [currentContext, setCurrentContext] = useState("All meetings");
  const [loading, setLoading] = useState(false);

  const handleSend = async (text, contextOverride = null) => {
    const context = contextOverride || currentContext;
    const userMessage = { type: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, context }),
      });
      const data = await res.json();

      const assistantMessage = {
        type: "agent",
        content: data.reply,
        meetings: data.meetings || [],
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleContextChange = (newContext) => {
    if (newContext !== currentContext) {
      const contextMessage = {
        type: "context",
        context: newContext,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, contextMessage]);
      setCurrentContext(newContext);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm md:max-w-md lg:max-w-lg h-[80vh] bg-background-white rounded-lg shadow-chat-modal flex flex-col overflow-hidden border border-border-default">
      <ChatHeader onClose={onClose} />
      <main className="flex-1 overflow-y-auto px-4 py-4 bg-background-light">
        <div className="max-w-3xl mx-auto flex flex-col space-y-4">
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} {...msg} />
          ))}
          {loading && (
            <div className="text-sm text-gray-500 italic px-4">Thinking...</div>
          )}
        </div>
      </main>
      <ChatInput onSend={handleSend} onContextChange={handleContextChange} />
    </div>
  );
}