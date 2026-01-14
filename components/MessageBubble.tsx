import React from 'react';
import { Message, Role } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Render Attachments if any */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 justify-end">
            {message.attachments.map((att, idx) => (
              <div key={idx} className="relative group overflow-hidden rounded-lg border border-gray-200">
                {att.mimeType.startsWith('image/') ? (
                  <img 
                    src={`data:${att.mimeType};base64,${att.data}`} 
                    alt={att.name}
                    className="h-24 w-auto object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-20 w-20 bg-gray-100 text-gray-500">
                    <i className="fas fa-file text-2xl"></i>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[10px] p-1 truncate px-2">
                  {att.name}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
          } ${message.isError ? 'bg-red-50 border-red-200 text-red-600' : ''}`}
        >
          {message.text}
        </div>
        
        {/* Timestamp or role label (Optional aesthetic touch) */}
        <span className="text-[10px] text-gray-400 mt-1 px-1">
          {isUser ? 'You' : 'AI Assistant'}
        </span>
      </div>
    </div>
  );
};