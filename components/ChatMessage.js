
import React from "react";
import MessageBubble from "./MessageBubble";
import MeetingCard from "./MeetingCard";

export default function ChatMessage({ type, content, context, timestamp, avatars, meetings }) {
  if (type === "context") {
    const time = new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const date = new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return (
      <div className="my-6">
        <hr className="border-t border-gray-300 mb-3" />
        <div className="text-center text-sm text-gray-500">
          Context set to {context}
          <br />
          {time} – {date}
        </div>
      </div>
    );
  }

  return (
    <>
      <MessageBubble type={type} content={content} avatars={avatars} />
      {type === "agent" && meetings?.length > 0 && (
        <div className="space-y-3 mt-2">
          {meetings.map((meeting, i) => (
            <MeetingCard key={i} {...meeting} />
          ))}
        </div>
      )}
    </>
  );
}