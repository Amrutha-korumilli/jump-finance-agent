"use client";
import { useState, useEffect } from "react";

const ChatInput = ({ onSend, loading, context, onContextChange, showContextMessage }) => {
  const [input, setInput] = useState("");
  const [localContext, setLocalContext] = useState(context || "All meetings");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        onSend(input.trim(), localContext);
        setInput("");
      }
    }
  };

  const handleContextChange = (e) => {
    setLocalContext(e.target.value);
    onContextChange && onContextChange(e.target.value);
  };

  return (
    <div className="border-t border-gray-200 p-4">
      {showContextMessage && (
        <div className="text-center text-gray-500 text-sm mb-2">
          Context set to {localContext.toLowerCase()} <br />
          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </div>
      )}
      <textarea
        rows={2}
        className="w-full border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Ask anything about your meetings..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="flex justify-between items-center mt-2">
        <select
          value={localContext}
          onChange={handleContextChange}
          className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm"
        >
          <option>All meetings</option>
          <option>My meetings</option>
          <option>Team meetings</option>
        </select>
        <button
          onClick={() => {
            if (input.trim()) {
              onSend(input.trim(), localContext);
              setInput("");
            }
          }}
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 text-sm rounded-md hover:bg-indigo-700"
        >
          {loading ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;