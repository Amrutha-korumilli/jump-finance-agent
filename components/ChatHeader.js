import React from 'react';

export default function ChatHeader({ onClose }) {
  return (
    <header className="sticky top-0 left-0 right-0 bg-background-white px-4 py-4 z-10 border-b border-border-header">
      {/* Top Row: Ask Anything & Close Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-primary-text">Ask Anything</h2>
        <button className="text-icon-default hover:text-gray-700" onClick={onClose}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Bottom Row: Chat/History Tabs & New Thread Button */}
      <div className="flex justify-between items-center">
        <nav className="flex items-center space-x-4">
          {/* Active Chat tab styling - now uses exact tab-active-bg and border */}
          <div className="font-medium text-primary-text border-b-2 border-primary-text pb-1 px-3 py-1 rounded-md bg-tab-active-bg">
            Chat
          </div>
          {/* History tab */}
          <button className="text-secondary-text hover:text-primary-text pb-1 px-3 py-1">
            History
          </button>
        </nav>
        {/* New thread button */}
        <button className="flex items-center text-blue-action hover:text-blue-action-hover font-medium text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="inline">New thread</span>
        </button>
      </div>
    </header>
  );
}