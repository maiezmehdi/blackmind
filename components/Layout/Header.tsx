import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X, Bell } from 'lucide-react';
import { useCourseContext } from '../../store/useCourseStore';
import { useLanguage } from '../../contexts/LanguageContext';

interface HeaderProps {
  isMobile: boolean;
  isMobileSearchOpen: boolean;
  onMobileSearchToggle: (val: boolean) => void;
  onSidebarToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  isMobile, 
  isMobileSearchOpen, 
  onMobileSearchToggle, 
  onSidebarToggle 
}) => {
  const { currentUser } = useCourseContext();
  const { t } = useLanguage();
  const location = useLocation();
  const isExplorePage = location.pathname === '/';

  return (
    <header className="h-16 border-b border-gemini-border px-4 md:px-8 flex items-center justify-between bg-gemini-header/90 backdrop-blur-md sticky top-0 z-40 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 flex-1">
        {isMobile && <button onClick={onSidebarToggle} className="p-2 text-gemini-dim"><Menu size={20} /></button>}
        
        {!isExplorePage && (
          <div className="hidden md:flex items-center gap-4 bg-gemini-surface border border-gemini-border rounded-full px-4 py-1.5 w-96 focus-within:border-gemini-dim transition-all shadow-sm">
            <Search size={16} className="text-gemini-dim" />
            <input type="text" placeholder={t('common.searchCourse')} className="bg-transparent border-none outline-none text-sm w-full text-gemini-text placeholder:text-gemini-dim/50" />
          </div>
        )}

        {isMobile && !isExplorePage && (
          isMobileSearchOpen ? (
            <div className="flex-1 flex items-center gap-2 bg-gemini-surface border border-gemini-border rounded-full px-4 py-1.5 animate-in fade-in slide-in-from-right duration-200">
               <Search size={16} className="text-gemini-dim" />
               <input autoFocus type="text" placeholder={t('common.search')} className="bg-transparent border-none outline-none text-sm w-full text-gemini-text placeholder:text-gemini-dim/50" />
               <button onClick={() => onMobileSearchToggle(false)}><X size={16} className="text-gemini-dim" /></button>
            </div>
          ) : (
            <button onClick={() => onMobileSearchToggle(true)} className="p-2 text-gemini-dim bg-gemini-surface border border-gemini-border rounded-full shadow-sm"><Search size={18} /></button>
          )
        )}
      </div>
      
      {!isMobileSearchOpen && currentUser && (
        <div className="flex items-center gap-3 pl-2">
          <Link to="/pricing" className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${currentUser.subscription === 'architect' ? 'bg-gemini-accent text-gemini-bg border-gemini-accent' : 'bg-gemini-surface text-gemini-dim border-gemini-border hover:border-gemini-accent'}`}>
            {currentUser.subscription === 'free' ? t('pricing.free') : currentUser.subscription === 'creator' ? 'Creator' : 'Architect'}
          </Link>
          <button className="p-2 text-gemini-dim hover:text-gemini-accent relative transition-colors">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-gemini-accent rounded-full animate-pulse"></span>
          </button>
          <div className={`w-8 h-8 rounded-full border border-gemini-border flex items-center justify-center text-gemini-bg font-bold text-xs cursor-pointer hover:opacity-80 transition-all shadow-md overflow-hidden ${currentUser.color || 'bg-gemini-accent'}`}>
            {currentUser.avatar ? <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" /> : currentUser.initials}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;