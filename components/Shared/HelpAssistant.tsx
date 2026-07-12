import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import HelpModal from './HelpModal';

// Floating help launcher shown on every page when the user enables
// "Assistant IA" in Réglages → Apparence.
const HelpAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[150] w-14 h-14 rounded-full bg-gemini-accent text-gemini-bg shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        aria-label="Help"
      >
        <HelpCircle size={24} />
      </button>
      <HelpModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default HelpAssistant;
