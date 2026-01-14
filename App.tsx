import React, { useState } from 'react';
import { FloatingButton } from './components/FloatingButton';
import { ChatWidget } from './components/ChatWidget';

const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => setIsOpen(prev => !prev);
  const closeChat = () => setIsOpen(false);

  return (
    <div className="font-sans antialiased text-gray-900">
      {/* 
        This is a fixed widget container. 
        It sits on top of whatever website it is embedded in. 
      */}
      <ChatWidget isOpen={isOpen} onClose={closeChat} />
      <FloatingButton isOpen={isOpen} onClick={toggleChat} />
      
      {/* 
         Hidden style block for animation if Tailwind custom config isn't available in the host environment.
         This ensures the entry animation works nicely.
      */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;