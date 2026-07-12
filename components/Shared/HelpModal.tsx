import React from 'react';
import { X, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQ_KEYS = ['aiKeys', 'export', 'googleDrive', 'accessibility', 'workspaces', 'monetize'];

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-gemini-surface border border-gemini-border rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        <div className="p-8 border-b border-gemini-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gemini-accent text-gemini-bg flex items-center justify-center shrink-0">
              <HelpCircle size={20} />
            </div>
            <h3 className="text-xl font-bold text-gemini-text font-outfit">{t('help.title')}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gemini-dim hover:text-gemini-text transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 space-y-6 overflow-y-auto no-scrollbar">
          {FAQ_KEYS.map((key) => (
            <div key={key} className="space-y-1.5">
              <p className="font-bold text-sm text-gemini-text">{t(`help.${key}Q`)}</p>
              <p className="text-sm text-gemini-dim leading-relaxed">{t(`help.${key}A`)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
