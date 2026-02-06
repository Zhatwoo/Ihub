'use client';

import { useState } from 'react';
import { BsQuestionCircleFill } from 'react-icons/bs';
import SupportTicketModal from './SupportTicketModal';

export default function SupportButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Floating Support Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        title="Need Help?"
      >
        <BsQuestionCircleFill className="text-2xl group-hover:scale-110 transition-transform" />
      </button>

      {/* Support Ticket Modal */}
      <SupportTicketModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
