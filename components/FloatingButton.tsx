import React from 'react';

interface FloatingButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({ isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all duration-300 z-50 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-blue-300 transform ${
        isOpen ? 'rotate-90 bg-gray-800 hover:bg-gray-900' : 'hover:scale-105'
      }`}
      aria-label="Toggle Chat"
    >
      {isOpen ? (
        <i className="fas fa-times text-xl"></i>
      ) : (
        <i className="fas fa-robot text-xl"></i>
      )}
    </button>
  );
};