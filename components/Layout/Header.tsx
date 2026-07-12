import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { useCourseContext } from '../../store/useCourseStore';
import { useLanguage } from '../../contexts/LanguageContext';
import RabbitLogo from './RabbitLogo';

interface HeaderProps {
  isMobile: boolean;
  onSidebarToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ isMobile, onSidebarToggle }) => {
  const { currentUser } = useCourseContext();
  const { t } = useLanguage();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notifOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifOpen]);

  const planLabel =
    currentUser?.subscription === 'free'
      ? t('pricing.free')
      : currentUser?.subscription === 'creator'
      ? 'Creator'
      : 'Architect';

  return (
    <header className="h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {isMobile && (
          <button
            onClick={onSidebarToggle}
            className="p-2 -ml-2 text-gemini-dim hover:text-gemini-accent transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu size={22} />
          </button>
        )}
        {/* Brand shown on mobile where the sidebar is hidden, for orientation */}
        {isMobile && (
          <Link to="/" className="flex items-center gap-2 text-gemini-accent min-w-0">
            <RabbitLogo className="w-7 h-7 shrink-0" />
            <span className="text-lg font-bold font-outfit tracking-tight truncate">Blackmind</span>
          </Link>
        )}
      </div>

      {currentUser && (
        <div className="flex items-center gap-2 sm:gap-3 pl-2">
          <Link
            to="/pricing"
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
              currentUser.subscription === 'architect'
                ? 'bg-gemini-accent text-gemini-bg border-gemini-accent'
                : 'bg-gemini-surface text-gemini-dim border-gemini-border hover:border-gemini-accent hover:text-gemini-text'
            }`}
          >
            {planLabel}
          </Link>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className={`p-2 rounded-full transition-colors ${
                notifOpen ? 'text-gemini-accent bg-gemini-surface' : 'text-gemini-dim hover:text-gemini-accent'
              }`}
              aria-label={t('header.notifications')}
            >
              <Bell size={20} />
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-gemini-sidebar border border-gemini-border rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="text-xs font-bold uppercase tracking-widest text-gemini-dim mb-3">
                  {t('header.notifications')}
                </p>
                <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                  <Bell size={22} className="text-gemini-dim/50" />
                  <p className="text-sm text-gemini-dim">{t('header.noNotifications')}</p>
                </div>
              </div>
            )}
          </div>

          <Link
            to="/settings"
            aria-label={t('header.account')}
            title={t('header.account')}
            className={`w-8 h-8 rounded-full border border-gemini-border flex items-center justify-center text-gemini-bg font-bold text-xs cursor-pointer hover:opacity-80 transition-all shadow-md overflow-hidden shrink-0 ${
              currentUser.color || 'bg-gemini-accent'
            }`}
          >
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              currentUser.initials
            )}
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
