import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  Compass, 
  BarChart2, 
  Briefcase, 
  Settings, 
  PanelLeftClose,
  PanelLeft,
  ShoppingBag,
  Crown
} from 'lucide-react';
import { useCourseContext } from '../../store/useCourseStore';
import { useLanguage } from '../../contexts/LanguageContext';
import RabbitLogo from './RabbitLogo';

const SidebarItem = ({ to, icon: Icon, label, active, collapsed, onClick }: { to: string, icon: any, label: string, active: boolean, collapsed: boolean, onClick?: () => void }) => (
  <Link 
    to={to}
    onClick={onClick} 
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-gemini-accent text-gemini-bg shadow-sm' 
        : 'text-gemini-dim hover:bg-gemini-surface hover:text-gemini-text'
    } ${collapsed ? 'justify-center px-0' : ''}`}
    title={collapsed ? label : ""}
  >
    <Icon size={20} className="shrink-0" />
    {!collapsed && <span className="font-medium text-sm whitespace-nowrap overflow-hidden">{label}</span>}
  </Link>
);

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  pathname: string;
  onLinkClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, pathname, onLinkClick }) => {
  const { language, t } = useLanguage();
  const { currentUser } = useCourseContext();

  return (
    <aside className={`h-full ${isCollapsed ? 'w-[72px]' : 'w-64'} transition-all duration-300 bg-gemini-sidebar border-r border-gemini-border p-4 flex flex-col gap-6 animate-in slide-in-from-left relative z-50 shadow-2xl`}>
      <div className={`flex items-center gap-2 px-2 py-2 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className={`flex items-center gap-2 ${isCollapsed ? '' : 'overflow-hidden'}`}>
          <div className="shrink-0 text-gemini-accent">
            <RabbitLogo className={`${isCollapsed ? 'w-7 h-7' : 'w-8 h-8'}`} />
          </div>
          {!isCollapsed && <h1 className="text-xl font-bold font-outfit tracking-tight whitespace-nowrap text-gemini-accent">Blackmind</h1>}
        </div>
        {!isCollapsed && (
          <button 
            onClick={onToggle} 
            className="p-1.5 hover:bg-gemini-surface rounded-lg text-gemini-dim hover:text-gemini-accent transition-all"
            title={t('nav.closeSidebar')}
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {isCollapsed && (
         <button 
            onClick={onToggle} 
            className="mx-auto p-2.5 hover:bg-gemini-surface rounded-xl text-gemini-accent transition-all mb-2"
            title={t('nav.openSidebar')}
          >
            <PanelLeft size={20} />
          </button>
      )}
      
      <nav className="flex flex-col gap-1 mt-2">
        <SidebarItem to="/" icon={Compass} label={t('nav.explorer')} active={pathname === '/'} collapsed={isCollapsed} onClick={onLinkClick} />
        <SidebarItem to="/create" icon={PlusCircle} label={t('nav.create')} active={pathname === '/create'} collapsed={isCollapsed} onClick={onLinkClick} />
        <SidebarItem to="/marketplace" icon={ShoppingBag} label={t('nav.marketplace')} active={pathname === '/marketplace'} collapsed={isCollapsed} onClick={onLinkClick} />
        <SidebarItem to="/progress" icon={BarChart2} label={t('nav.progress')} active={pathname === '/progress'} collapsed={isCollapsed} onClick={onLinkClick} />
        <SidebarItem to="/workspaces" icon={Briefcase} label={t('nav.workspaces')} active={pathname === '/workspaces'} collapsed={isCollapsed} onClick={onLinkClick} />
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        {currentUser?.subscription === 'free' && (
          <Link 
            to="/pricing" 
            className={`mb-4 rounded-2xl p-3 bg-gradient-to-br from-gemini-surface to-gemini-bg border border-gemini-border shadow-sm group hover:border-gemini-accent transition-all ${isCollapsed ? 'flex justify-center' : ''}`}
          >
            {isCollapsed ? (
              <Crown size={20} className="text-gemini-accent" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gemini-dim">{t("pricing.plan")}</p>
                  <p className="font-bold text-sm text-gemini-text group-hover:text-gemini-accent transition-colors">{t("pricing.free")}</p>
                </div>
                <div className="bg-gemini-accent text-gemini-bg p-1.5 rounded-lg">
                  <Crown size={14} />
                </div>
              </div>
            )}
          </Link>
        )}
        <SidebarItem to="/settings" icon={Settings} label={t('nav.settings')} active={pathname === '/settings'} collapsed={isCollapsed} onClick={onLinkClick} />
      </div>
    </aside>
  );
};

export default Sidebar;