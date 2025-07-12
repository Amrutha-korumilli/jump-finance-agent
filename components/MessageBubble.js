// /components/MessageBubble.js
const MessageBubble = ({ role, content, meetings, people }) => {
  return (
    <div className={`space-y-2 ${role === "user" ? "self-end" : "self-start"}`}>
      <div
        className={`max-w-[75%] px-4 py-2 rounded-lg ${
          role === "user" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800"
        }`}
      >
        <p>{content}</p>
        {/* optionally people chips or avatars */}
      </div>

      {meetings?.length > 0 && (
        <div className="space-y-2">
          {meetings.map((m, i) => (
            <MeetingCard key={i} {...m} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;