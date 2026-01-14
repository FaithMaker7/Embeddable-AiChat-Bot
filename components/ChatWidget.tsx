import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role, Attachment } from '../types';
import { streamChatResponse } from '../services/geminiService';
import { MessageBubble } from './MessageBubble';
import { processFiles } from '../utils/fileHelpers';

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: Role.MODEL,
      text: 'Hello! I am your AI assistant. How can I help you today? You can attach images or documents if needed.'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle Textarea Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newAttachments = await processFiles(e.target.files);
      setPendingAttachments(prev => [...prev, ...newAttachments]);
      // Reset input value to allow selecting the same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = useCallback(async () => {
    if ((!inputText.trim() && pendingAttachments.length === 0) || isLoading) return;

    const userMessageText = inputText.trim();
    const userAttachments = [...pendingAttachments];

    // Clear input state immediately
    setInputText('');
    setPendingAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const newMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: userMessageText,
      attachments: userAttachments
    };

    // Add user message to state
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      let fullResponseText = '';
      
      // Create a placeholder for the model response
      const responseId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: responseId,
        role: Role.MODEL,
        text: ''
      }]);

      // Call streaming service
      // We pass the current history (excluding the message we just added visually to avoid duplication if logic differs, 
      // but here we pass 'messages' which represents history BEFORE the current new message)
      await streamChatResponse(
        messages, 
        userMessageText,
        userAttachments,
        (chunk) => {
          fullResponseText += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === responseId 
              ? { ...msg, text: fullResponseText }
              : msg
          ));
        }
      );

    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: Role.MODEL,
        text: "I'm sorry, I encountered an error processing your request.",
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, pendingAttachments, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-[90vw] sm:w-[380px] h-[600px] max-h-[80vh] bg-gray-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 z-40 transition-all animate-fade-in-up">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <i className="fas fa-robot text-white text-sm"></i>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">AI Assistant</h3>
            <p className="text-blue-100 text-xs">Powered by Gemini</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="text-white/80 hover:text-white transition-colors"
          aria-label="Close"
        >
          <i className="fas fa-chevron-down"></i>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll bg-[#f8f9fa]">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && messages[messages.length - 1].role === Role.USER && (
           <div className="flex justify-start w-full mb-4">
             <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-200"></div>
                </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-3 border-t border-gray-100 shrink-0">
        
        {/* Attachment Previews */}
        {pendingAttachments.length > 0 && (
          <div className="flex space-x-2 mb-2 overflow-x-auto pb-2 scrollbar-hide">
            {pendingAttachments.map((att, idx) => (
              <div key={idx} className="relative shrink-0 h-16 w-16 rounded-lg border border-gray-200 overflow-hidden group">
                {att.mimeType.startsWith('image/') ? (
                  <img src={`data:${att.mimeType};base64,${att.data}`} className="h-full w-full object-cover" alt="preview" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500 text-xs text-center p-1 break-all">
                    {att.name.slice(-4)}
                  </div>
                )}
                <button 
                  onClick={() => removeAttachment(idx)}
                  className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-bl-md text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end space-x-2">
          {/* File Input Trigger */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="h-10 w-10 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors flex items-center justify-center shrink-0"
            title="Attach file"
          >
            <i className="fas fa-paperclip"></i>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            onChange={handleFileSelect}
            // Accept images and common text/pdf formats
            accept="image/*,application/pdf,text/plain,application/json,text/csv" 
          />

          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-100 transition-shadow">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full bg-transparent border-none focus:ring-0 outline-none text-sm resize-none max-h-[120px] py-1 text-gray-700 placeholder-gray-400"
              rows={1}
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={(!inputText.trim() && pendingAttachments.length === 0) || isLoading}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all shrink-0 shadow-sm ${
              (!inputText.trim() && pendingAttachments.length === 0) || isLoading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            {isLoading ? (
               <i className="fas fa-spinner animate-spin text-sm"></i>
            ) : (
               <i className="fas fa-paper-plane text-sm"></i>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};