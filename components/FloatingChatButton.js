"use client";
import { useState } from "react";
import ChatDrawerPanel from "./ChatDrawerPanel"; // Renamed from ChatModal

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-white shadow-lg rounded-full p-4 hover:shadow-xl transition-all border border-gray-200" // Increased padding to p-4 and shadow to lg/xl for better match with screenshot of the FAB
        aria-label="Open chat"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-icon-default" // Increased icon size and set default icon color
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>
      {isOpen && <ChatDrawerPanel onClose={() => setIsOpen(false)} />}
    </>
  );
}