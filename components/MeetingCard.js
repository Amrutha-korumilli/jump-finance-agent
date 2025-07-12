
import React from "react";

const MeetingCard = ({ time, title, attendees }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 w-full">
      <p className="text-sm text-gray-500 mb-1">{time}</p>
      <h3 className="font-medium text-black mb-2">{title}</h3>
      <div className="flex -space-x-2">
        {attendees.map((person, index) => (
          <img
            key={index}
            src={person.avatar}
            alt={person.name}
            className="w-7 h-7 rounded-full ring-2 ring-white"
          />
        ))}
      </div>
    </div>
  );
};

export default MeetingCard;