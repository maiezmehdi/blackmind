import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Bell,
  Shield,
  Palette,
  Database,
  HelpCircle,
  LogOut,
  Link as LinkIcon,
  Check,
  ChevronRight,
  Globe,
  Mail,
  Smartphone,
  Eye,
  Trash2,
  Download,
  Moon,
  Sun,
  Type as TypeIcon,
  Monitor,
  Camera,
  X,
  Cloud,
  Zap,
  Accessibility,
  Move,
  LayoutTemplate,
  Keyboard,
  Volume2,
  Target,
  RefreshCw,
  Settings,
  Unlink,
  FolderOpen,
  Laptop,
  AlertCircle,
} from 'lucide-react';
import { useCourseContext } from '../store/useCourseStore';
import { useLanguage } from '../contexts/LanguageContext';
import { isGoogleConfigured, isGoogleConnected as checkGoogleConnected, getGoogleEmail, connectGoogle, disconnectGoogle } from '../services/googleAuth';
import HelpModal from '../components/Shared/HelpModal';

type SettingsTab = 'general' | 'notifications' | 'security' | 'integrations' | 'appearance' | 'accessibility' | 'data';
type ThemeMode = 'oled' | 'dark' | 'light';

const SettingsItem = ({ icon: Icon, label, description, right, onClick, dangerous }: any) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between p-4 hover:bg-gemini-bg/50 rounded-2xl transition-all cursor-pointer group active:scale-[0.99] ${dangerous ? 'hover:bg-red-500/5' : ''}`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl bg-gemini-bg flex items-center justify-center transition-colors border border-gemini-border shadow-sm ${dangerous ? 'text-red-500/50 group-hover:text-red-500' : 'text-gemini-dim group-hover:text-gemini-accent'}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className={`font-bold text-sm transition-colors ${dangerous ? 'text-red-500' : 'text-gemini-text group-hover:text-gemini-accent'}`}>{label}</p>
        <p className="text-[11px] text-gemini-dim">{description}</p>
      </div>
    </div>
    <div onClick={(e) => e.stopPropagation()}>{right}</div>
  </div>
);

const Toggle = ({ active, onToggle }: { active: boolean, onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${active ? 'bg-gemini-accent' : 'bg-gemini-border'}`}
  >
    <div className={`absolute top-1 w-3 h-3 rounded-full transition-all duration-300 ${active ? 'right-1 bg-gemini-bg' : 'right-6 bg-gemini-dim'}`}></div>
  </button>
);

const ConfirmModal = ({ icon: Icon, title, desc, cancelLabel, confirmLabel, onCancel, onConfirm }: any) => (
  <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onCancel}></div>
    <div className="relative w-full max-w-md bg-gemini-surface border border-gemini-border rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
      <div className="p-10 text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-500/20">
          <Icon size={40} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold font-outfit text-gemini-text">{title}</h3>
          <p className="text-sm text-gemini-dim leading-relaxed">{desc}</p>
        </div>
        <div className="flex gap-3 pt-4">
          <button onClick={onCancel} className="flex-1 px-6 py-4 bg-gemini-bg border border-gemini-border rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gemini-text hover:bg-gemini-surface transition-all">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className="flex-1 px-6 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 shadow-lg active:scale-95 transition-all">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  </div>
);

const SettingsPage: React.FC = () => {
  const { currentUser, updateUserProfile, accessibility, updateAccessibility, resetAccessibility, preferences, updatePreferences, resetPreferences, logout } = useCourseContext();
  const { language, setLanguage, t: tGlobal } = useLanguage();
  const t = tGlobal;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem('blackmind_theme') as ThemeMode) || 'dark');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // General — inline username edit
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser?.name || '');

  // Google Workspace integration
  const [googleConnected, setGoogleConnected] = useState(checkGoogleConnected());
  const [googleEmail, setGoogleEmail] = useState(getGoogleEmail());
  const [isGoogleBusy, setIsGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState('');

  // Data tab
  const [isClearCacheConfirmOpen, setIsClearCacheConfirmOpen] = useState(false);
  const [isDeleteAccountConfirmOpen, setIsDeleteAccountConfirmOpen] = useState(false);
  const [dataActionSuccess, setDataActionSuccess] = useState<'export' | 'clear' | null>(null);

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('dark', 'oled-theme');

    if (theme === 'oled') {
      html.classList.add('dark');
      html.style.setProperty('--gemini-bg', '#000000');
    } else if (theme === 'dark') {
      html.classList.add('dark');
      html.style.setProperty('--gemini-bg', '#121212');
    } else {
      html.style.removeProperty('--gemini-bg');
    }

    localStorage.setItem('blackmind_theme', theme);
  }, [theme]);

  const deviceLabel = useMemo(() => {
    const ua = navigator.userAgent;
    const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Navigateur';
    const os = /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : 'Appareil';
    return `${browser} · ${os}`;
  }, []);

  if (!currentUser) return null;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUserProfile({ avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) updateUserProfile({ name: trimmed, initials: trimmed.slice(0, 2).toUpperCase() });
    setIsEditingName(false);
  };

  const handleGoogleConnect = async () => {
    if (googleConnected) {
      disconnectGoogle();
      setGoogleConnected(false);
      setGoogleEmail(null);
      return;
    }
    setGoogleError('');
    setIsGoogleBusy(true);
    try {
      const { email } = await connectGoogle();
      setGoogleConnected(true);
      setGoogleEmail(email);
    } catch (e: any) {
      setGoogleError(e?.message === 'GOOGLE_CLIENT_ID not configured' ? t('settings.googleNotConfigured') : t('settings.googleConnectFailed'));
    } finally {
      setIsGoogleBusy(false);
    }
  };

  const handleExportData = () => {
    const data = {
      user: currentUser,
      courses: JSON.parse(localStorage.getItem('blackmind_courses') || '[]'),
      workspaces: JSON.parse(localStorage.getItem('blackmind_workspaces') || '[]'),
      accessibility,
      preferences,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blackmind-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setDataActionSuccess('export');
    setTimeout(() => setDataActionSuccess(null), 2500);
  };

  const handleClearCache = () => {
    resetAccessibility();
    resetPreferences();
    localStorage.removeItem('blackmind_theme');
    setTheme('dark');
    setIsClearCacheConfirmOpen(false);
    setDataActionSuccess('clear');
    setTimeout(() => setDataActionSuccess(null), 2500);
  };

  const handleDeleteAccount = () => {
    Object.keys(localStorage).filter((k) => k.startsWith('blackmind_')).forEach((k) => localStorage.removeItem(k));
    setIsDeleteAccountConfirmOpen(false);
    logout();
    navigate('/login');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs: { id: SettingsTab, label: string, icon: any }[] = [
    { id: 'general', label: t('settings.tabs.general'), icon: User },
    { id: 'accessibility', label: t('settings.tabs.accessibility'), icon: Accessibility },
    { id: 'appearance', label: t('settings.tabs.appearance'), icon: Palette },
    { id: 'integrations', label: t('settings.tabs.integrations'), icon: LinkIcon },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: Bell },
    { id: 'security', label: t('settings.tabs.security'), icon: Shield },
    { id: 'data', label: t('settings.tabs.data'), icon: Database },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-10 animate-in fade-in duration-500">
            <section className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gemini-dim px-2">{t('settings.visualIdentity')}</h3>
              <div className="glass-card p-8 rounded-[3rem] border-gemini-border shadow-2xl flex flex-col items-center md:flex-row gap-8 bg-gemini-surface/50">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                   <div className={`w-32 h-32 rounded-full border-4 border-gemini-border overflow-hidden flex items-center justify-center shadow-2xl transition-all group-hover:border-gemini-accent ${currentUser.color}`}>
                     {currentUser.avatar ? (
                       <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                     ) : (
                       <span className="text-4xl font-black text-white">{currentUser.initials}</span>
                     )}
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                       <Camera size={24} className="text-white" />
                     </div>
                   </div>
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </div>
                <div className="flex-1 text-center md:text-left space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold font-outfit text-gemini-accent">{currentUser.name}</h2>
                    <p className="text-gemini-dim text-sm">{currentUser.email}</p>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="px-5 py-2 bg-gemini-accent text-gemini-bg rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md">{t('settings.changeImage')}</button>
                    <button onClick={() => updateUserProfile({ avatar: undefined })} className="px-5 py-2 bg-gemini-surface text-gemini-dim border border-gemini-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-gemini-accent transition-all">{t('settings.remove')}</button>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gemini-dim px-2">{t('settings.accountInfo')}</h3>
              <div className="glass-card rounded-[2.5rem] overflow-hidden divide-y divide-gemini-border border-gemini-border shadow-2xl bg-gemini-surface/30">
                <SettingsItem
                  icon={User}
                  label={t('settings.username')}
                  description={isEditingName ? '' : currentUser.name}
                  right={
                    isEditingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveName();
                            if (e.key === 'Escape') { setNameInput(currentUser.name); setIsEditingName(false); }
                          }}
                          className="bg-gemini-bg border border-gemini-border rounded-lg px-3 py-1.5 text-sm text-gemini-text outline-none focus:border-gemini-accent w-36"
                        />
                        <button onClick={handleSaveName} className="p-1.5 text-gemini-accent hover:scale-110 transition-all"><Check size={16} /></button>
                        <button onClick={() => { setNameInput(currentUser.name); setIsEditingName(false); }} className="p-1.5 text-gemini-dim hover:text-red-500 transition-all"><X size={16} /></button>
                      </div>
                    ) : (
                      <button onClick={() => setIsEditingName(true)} className="text-[10px] font-bold text-gemini-accent uppercase tracking-widest hover:underline">{t('common.edit')}</button>
                    )
                  }
                />
                <SettingsItem icon={Mail} label={t('settings.email')} description={currentUser.email} right={<div className="flex items-center gap-1.5 text-green-500 text-[10px] font-bold"><Check size={12}/> {t('settings.verified')}</div>} />
                <SettingsItem
                  icon={Globe}
                  label={t('settings.language')}
                  description={language === 'fr' ? 'Français' : 'English'}
                  right={
                    <div className="flex items-center bg-gemini-bg rounded-lg p-1 border border-gemini-border">
                      <button
                        onClick={() => setLanguage('fr')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${language === 'fr' ? 'bg-gemini-accent text-gemini-bg shadow-sm' : 'text-gemini-dim hover:text-gemini-accent'}`}
                      >
                        FR
                      </button>
                      <button
                        onClick={() => setLanguage('en')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${language === 'en' ? 'bg-gemini-accent text-gemini-bg shadow-sm' : 'text-gemini-dim hover:text-gemini-accent'}`}
                      >
                        EN
                      </button>
                    </div>
                  }
                />
              </div>
            </section>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="glass-card p-6 rounded-[2.5rem] bg-gemini-surface/50 border border-gemini-border flex items-start gap-4">
              <div className="p-3 bg-gemini-accent text-gemini-bg rounded-2xl shadow-lg">
                <Cloud size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold font-outfit text-gemini-accent">{t('settings.integrationsTitle')}</h2>
                <p className="text-gemini-dim text-sm mt-1">{t('settings.integrationsDesc')}</p>
              </div>
            </div>

            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gemini-dim px-2">Google Workspace</h3>
              <div className="glass-card rounded-[2.5rem] p-6 border border-gemini-border shadow-2xl bg-gemini-surface/30">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center shadow-sm shrink-0">
                      <svg viewBox="0 0 24 24" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gemini-accent">Google Docs & Drive</h4>
                      <p className="text-sm text-gemini-dim leading-relaxed">{t('settings.googleDesc')}</p>
                    </div>
                  </div>
                  {!isGoogleConfigured() ? (
                    <div className="px-5 py-3 bg-gemini-bg border border-gemini-border rounded-xl text-[10px] font-bold uppercase tracking-widest text-gemini-dim whitespace-nowrap text-center">
                      {t('settings.googleNotConfigured')}
                    </div>
                  ) : (
                    <button
                      onClick={handleGoogleConnect}
                      disabled={isGoogleBusy}
                      className={`px-8 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl whitespace-nowrap ${googleConnected ? 'bg-gemini-surface border border-gemini-border text-red-500' : 'bg-gemini-accent text-gemini-bg hover:scale-105 active:scale-95'}`}
                    >
                      {isGoogleBusy ? <RefreshCw size={14} className="animate-spin" /> : googleConnected ? <Unlink size={14} /> : null}
                      {isGoogleBusy ? t('settings.connecting') : googleConnected ? t('settings.disconnect') : t('settings.connectGoogle')}
                    </button>
                  )}
                </div>

                {googleError && (
                  <p className="mt-4 text-xs text-red-500 flex items-center gap-2"><AlertCircle size={14} /> {googleError}</p>
                )}

                {googleConnected && (
                  <div className="mt-8 pt-8 border-t border-gemini-border animate-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-full w-fit border border-green-500/20">
                        <Check size={12} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">{t('settings.connectedAs', { email: googleEmail || currentUser.email || '' })}</span>
                      </div>
                      <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 bg-gemini-bg border border-gemini-border rounded-xl text-[10px] font-bold uppercase tracking-widest text-gemini-dim hover:text-gemini-accent transition-all w-fit">
                        <FolderOpen size={14} /> {t('settings.openDrive')}
                      </a>
                    </div>
                    <p className="mt-4 text-xs text-gemini-dim leading-relaxed">{t('settings.googleScopeNote')}</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        );

            case 'accessibility': {
        const t = (key: string) => tGlobal(`settings.accessibility.${key}`);
        return (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="glass-card p-6 rounded-[2.5rem] bg-gemini-surface/50 border border-gemini-border flex items-start gap-4">
              <div className="p-3 bg-gemini-accent text-gemini-bg rounded-2xl shadow-lg">
                <Accessibility size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold font-outfit text-gemini-accent">{t('title')}</h2>
                <p className="text-gemini-dim text-sm mt-1">{t('subtitle')}</p>
              </div>
            </div>

            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gemini-dim px-2">{t('profiles')}</h3>
              <div className="glass-card rounded-[2.5rem] overflow-hidden divide-y divide-gemini-border border-gemini-border shadow-2xl bg-gemini-surface/30">
                <SettingsItem
                  icon={TypeIcon}
                  label={t('dyslexia')}
                  description={t('dyslexiaDesc')}
                  right={<Toggle active={accessibility.dyslexiaMode} onToggle={() => updateAccessibility({ dyslexiaMode: !accessibility.dyslexiaMode })} />}
                />
                <SettingsItem
                  icon={Eye}
                  label={t('contrast')}
                  description={t('contrastDesc')}
                  right={<Toggle active={accessibility.highContrast} onToggle={() => updateAccessibility({ highContrast: !accessibility.highContrast })} />}
                />
                <SettingsItem
                  icon={LayoutTemplate}
                  label={t('falc')}
                  description={t('falcDesc')}
                  right={<Toggle active={accessibility.simplifiedReading} onToggle={() => updateAccessibility({ simplifiedReading: !accessibility.simplifiedReading })} />}
                />
                <SettingsItem
                  icon={Volume2}
                  label={t('audioReading')}
                  description={t('audioReadingDesc')}
                  right={<Toggle active={accessibility.audioReading} onToggle={() => updateAccessibility({ audioReading: !accessibility.audioReading })} />}
                />
                <SettingsItem
                  icon={Target}
                  label={t('adhd')}
                  description={t('adhdDesc')}
                  right={<Toggle active={accessibility.adhdFocusMode} onToggle={() => updateAccessibility({ adhdFocusMode: !accessibility.adhdFocusMode })} />}
                />
                <SettingsItem
                  icon={Palette}
                  label={t('daltonism')}
                  description={t('daltonismDesc')}
                  right={
                    <select
                      value={accessibility.colorBlindMode}
                      onChange={(e) => updateAccessibility({ colorBlindMode: e.target.value as any })}
                      className="bg-gemini-bg border border-gemini-border rounded-lg text-[10px] font-bold uppercase py-1 px-2 text-gemini-text outline-none focus:border-gemini-accent"
                    >
                      <option value="none">{tGlobal('settings.accessibility.colorNone')}</option>
                      <option value="protanopia">{tGlobal('settings.accessibility.protanopia')}</option>
                      <option value="deuteranopia">{tGlobal('settings.accessibility.deuteranopia')}</option>
                      <option value="tritanopia">{tGlobal('settings.accessibility.tritanopia')}</option>
                    </select>
                  }
                />
                <SettingsItem
                  icon={Keyboard}
                  label={t('keyboard')}
                  description={t('keyboardDesc')}
                  right={<Toggle active={accessibility.keyboardNav} onToggle={() => updateAccessibility({ keyboardNav: !accessibility.keyboardNav })} />}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gemini-dim px-2">{t('custom')}</h3>
              <div className="glass-card rounded-[2.5rem] overflow-hidden divide-y divide-gemini-border border-gemini-border shadow-2xl bg-gemini-surface/30">
                <div className="p-4 space-y-3 hover:bg-gemini-bg/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gemini-bg flex items-center justify-center text-gemini-dim border border-gemini-border shadow-sm">
                      <TypeIcon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gemini-text">{t('textSize')}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gemini-dim">A</span>
                        <input
                          type="range"
                          min="0.8"
                          max="1.5"
                          step="0.1"
                          value={accessibility.textSize}
                          onChange={(e) => updateAccessibility({ textSize: parseFloat(e.target.value) })}
                          className="flex-1 h-2 bg-gemini-border rounded-lg appearance-none cursor-pointer accent-gemini-accent"
                        />
                        <span className="text-lg font-bold text-gemini-accent">A</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3 hover:bg-gemini-bg/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gemini-bg flex items-center justify-center text-gemini-dim border border-gemini-border shadow-sm">
                      <Move size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gemini-text">{t('spacing')}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <input
                          type="range"
                          min="1"
                          max="2"
                          step="0.1"
                          value={accessibility.lineHeight}
                          onChange={(e) => updateAccessibility({ lineHeight: parseFloat(e.target.value) })}
                          className="flex-1 h-2 bg-gemini-border rounded-lg appearance-none cursor-pointer accent-gemini-accent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <SettingsItem
                  icon={Zap}
                  label={t('motion')}
                  description={t('motionDesc')}
                  right={<Toggle active={accessibility.reduceMotion} onToggle={() => updateAccessibility({ reduceMotion: !accessibility.reduceMotion })} />}
                />

                <SettingsItem
                  icon={LinkIcon}
                  label={t('links')}
                  description={t('linksDesc')}
                  right={<Toggle active={accessibility.highlightLinks} onToggle={() => updateAccessibility({ highlightLinks: !accessibility.highlightLinks })} />}
                />
              </div>
            </section>

            <div className="flex justify-center">
              <button
                onClick={resetAccessibility}
                className="text-[10px] font-bold uppercase tracking-widest text-gemini-dim hover:text-gemini-accent transition-colors"
              >
                {t('reset')}
              </button>
            </div>
          </div>
        );
      }


      case 'notifications':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gemini-dim px-2">{t('settings.tabs.notifications')}</h3>
              <div className="glass-card rounded-[2.5rem] overflow-hidden divide-y divide-gemini-border border-gemini-border shadow-2xl bg-gemini-surface/30">
                <SettingsItem
                  icon={Mail}
                  label={t('settings.notifications.email')}
                  description={t('settings.notifications.emailDesc')}
                  right={<Toggle active={preferences.notifications.email} onToggle={() => updatePreferences({ notifications: { ...preferences.notifications, email: !preferences.notifications.email } })} />}
                />
                <SettingsItem
                  icon={Smartphone}
                  label={t('settings.notifications.push')}
                  description={t('settings.notifications.pushDesc')}
                  right={<Toggle active={preferences.notifications.push} onToggle={() => updatePreferences({ notifications: { ...preferences.notifications, push: !preferences.notifications.push } })} />}
                />
                <SettingsItem
                  icon={Zap}
                  label={t('settings.notifications.ai')}
                  description={t('settings.notifications.aiDesc')}
                  right={<Toggle active={preferences.notifications.aiUpdates} onToggle={() => updatePreferences({ notifications: { ...preferences.notifications, aiUpdates: !preferences.notifications.aiUpdates } })} />}
                />
              </div>
            </section>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-10 animate-in fade-in duration-500">
            <section className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gemini-dim px-2">{t('settings.theme')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'light', label: 'Light', icon: Sun, color: 'bg-white border-neutral-200 text-neutral-900' },
                  { id: 'dark', label: 'Gemini Dark', icon: Moon, color: 'bg-[#121212] border-white/10 text-white' },
                  { id: 'oled', label: 'OLED Black', icon: Monitor, color: 'bg-black border-white/20 text-white' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setTheme(m.id as ThemeMode)}
                    className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all ${theme === m.id ? 'border-gemini-accent scale-105 shadow-2xl bg-gemini-surface' : 'border-gemini-border opacity-50 hover:opacity-100 hover:bg-gemini-surface/50'}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${m.color} border border-white/10`}>
                      <m.icon size={24} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gemini-text">{m.label}</span>
                    {theme === m.id && <div className="w-1.5 h-1.5 bg-gemini-accent rounded-full"></div>}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gemini-dim px-2">{t('settings.typography')}</h3>
              <div className="glass-card rounded-[2.5rem] overflow-hidden divide-y divide-gemini-border border-gemini-border shadow-2xl bg-gemini-surface/30">
                <SettingsItem
                  icon={TypeIcon}
                  label={t('settings.font')}
                  description={t('settings.appearance.fontDesc')}
                  right={
                    <select
                      value={accessibility.fontFamily}
                      onChange={(e) => updateAccessibility({ fontFamily: e.target.value as any })}
                      className="bg-gemini-bg border border-gemini-border rounded-lg text-[10px] font-bold uppercase py-1 px-2 text-gemini-text outline-none focus:border-gemini-accent"
                    >
                      <option value="default">{t('settings.appearance.fontDefault')}</option>
                      <option value="serif">{t('settings.appearance.fontSerif')}</option>
                      <option value="monospace">{t('settings.appearance.fontMono')}</option>
                      <option value="dyslexic">{t('settings.appearance.fontDyslexic')}</option>
                    </select>
                  }
                />
                <SettingsItem
                  icon={Zap}
                  label={t('settings.aiAssistant')}
                  description={t('settings.appearance.assistantDesc')}
                  right={<Toggle active={preferences.showAiAssistant} onToggle={() => updatePreferences({ showAiAssistant: !preferences.showAiAssistant })} />}
                />
              </div>
            </section>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-10 animate-in fade-in duration-500">
            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gemini-dim px-2">{t('settings.security.sessionTitle')}</h3>
              <div className="glass-card rounded-[2.5rem] overflow-hidden divide-y divide-gemini-border border-gemini-border shadow-2xl bg-gemini-surface/30">
                <SettingsItem
                  icon={Laptop}
                  label={t('settings.security.thisDevice')}
                  description={deviceLabel}
                  right={<div className="flex items-center gap-1.5 text-green-500 text-[10px] font-bold"><Check size={12} /> {t('settings.security.active')}</div>}
                />
                <SettingsItem
                  icon={LogOut}
                  label={t('settings.logout')}
                  description={t('settings.security.logoutDesc')}
                  dangerous
                  onClick={handleLogout}
                  right={<ChevronRight size={16} className="text-red-500/50" />}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gemini-dim px-2">{t('settings.security.connectedAppsTitle')}</h3>
              <div className="glass-card rounded-[2.5rem] overflow-hidden divide-y divide-gemini-border border-gemini-border shadow-2xl bg-gemini-surface/30">
                {googleConnected ? (
                  <SettingsItem
                    icon={Cloud}
                    label="Google Drive & Docs"
                    description={t('settings.connectedAs', { email: googleEmail || currentUser.email || '' })}
                    right={<button onClick={handleGoogleConnect} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline">{t('settings.revoke')}</button>}
                  />
                ) : (
                  <div className="p-6 text-center text-sm text-gemini-dim">{t('settings.security.noConnectedApps')}</div>
                )}
              </div>
            </section>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gemini-dim px-2">{t('settings.storage')}</h3>
              <div className="glass-card rounded-[2.5rem] overflow-hidden divide-y divide-gemini-border border-gemini-border shadow-2xl bg-gemini-surface/30">
                <SettingsItem
                  icon={Download}
                  label={t('settings.exportData')}
                  description={t('settings.exportDataDesc')}
                  onClick={handleExportData}
                  right={dataActionSuccess === 'export' ? <Check size={18} className="text-green-500" /> : <button className="p-2 text-gemini-dim hover:text-gemini-accent transition-colors"><Download size={18} /></button>}
                />
                <SettingsItem
                  icon={Trash2}
                  label={t('settings.clearCache')}
                  description={t('settings.clearCacheDesc')}
                  onClick={() => setIsClearCacheConfirmOpen(true)}
                  right={dataActionSuccess === 'clear' ? <Check size={18} className="text-green-500" /> : <button className="text-[10px] font-bold text-gemini-dim uppercase tracking-widest hover:text-gemini-accent">{t('settings.clean')}</button>}
                />
                <SettingsItem
                  icon={LogOut}
                  label={t('settings.deleteAccount')}
                  description={t('settings.deleteAccountDesc')}
                  dangerous={true}
                  onClick={() => setIsDeleteAccountConfirmOpen(true)}
                  right={<ChevronRight size={16} />}
                />
              </div>
            </section>
          </div>
        );

      default:
        return <div className="py-20 text-center text-gemini-dim uppercase text-[10px] font-bold tracking-widest">{t('settings.inDevelopment')}</div>;
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-gemini-bg overflow-x-hidden no-scrollbar">
      <div className="p-4 md:p-10 max-w-5xl mx-auto w-full flex flex-col md:flex-row gap-10">
        <aside className="w-full md:w-72 shrink-0">
          <header className="mb-10 hidden md:block space-y-2">
            <div className="flex items-center gap-2 text-gemini-dim text-[10px] font-bold uppercase tracking-[0.3em]">
              <Settings size={14} /> {t('settings.subtitle')}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-outfit text-gemini-accent tracking-tight">{t('settings.title')}</h1>
          </header>

          <div className="relative md:static md:w-full"><div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gemini-bg to-transparent pointer-events-none md:hidden z-10" /><nav className="flex md:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 sticky top-24 snap-x snap-mandatory pr-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ scrollSnapAlign: "start" }}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap group ${
                  activeTab === tab.id
                  ? 'bg-gemini-accent text-gemini-bg shadow-2xl scale-105'
                  : 'text-gemini-dim hover:text-gemini-accent hover:bg-gemini-surface border border-transparent hover:border-gemini-border'
                }`}
              >
                <tab.icon size={18} className={activeTab === tab.id ? 'text-gemini-bg' : 'text-gemini-dim group-hover:text-gemini-accent'} />
                <span>{tab.label}</span>
              </button>
            ))}
            <div className="hidden md:block pt-6 mt-6 border-t border-gemini-border">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-gemini-dim hover:text-red-500 hover:bg-red-500/5 transition-all">
                <LogOut size={18} />
                <span>{t('settings.logout')}</span>
              </button>
            </div>
          </nav></div>
        </aside>

        <div className="flex-1 pb-24 md:pb-10 min-w-0">
          <header className="mb-6 md:hidden flex items-center justify-between">
            <h1 className="text-3xl font-bold font-outfit tracking-tight capitalize text-gemini-accent">{t(`settings.tabs.${activeTab}`)}</h1>
          </header>
          {renderContent()}

          <div className="mt-12 p-8 rounded-[3rem] bg-gemini-surface/30 border border-gemini-border flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gemini-bg border border-gemini-border flex items-center justify-center text-gemini-dim shadow-lg">
                <HelpCircle size={28} />
              </div>
              <div className="text-center md:text-left">
                <p className="font-bold text-sm text-gemini-text">{t('settings.needHelp')}</p>
                <p className="text-xs text-gemini-dim mt-1">{t('settings.helpText')}</p>
              </div>
            </div>
            <button onClick={() => setIsHelpOpen(true)} className="px-8 py-4 bg-gemini-surface hover:bg-gemini-bg border border-gemini-border rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gemini-dim hover:text-gemini-accent transition-all shadow-xl hover:scale-105 active:scale-95">
              {t('settings.docs')}
            </button>
          </div>
        </div>
      </div>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {isClearCacheConfirmOpen && (
        <ConfirmModal
          icon={Trash2}
          title={t('settings.clearCacheConfirmTitle')}
          desc={t('settings.clearCacheConfirmDesc')}
          cancelLabel={t('common.cancel')}
          confirmLabel={t('settings.clean')}
          onCancel={() => setIsClearCacheConfirmOpen(false)}
          onConfirm={handleClearCache}
        />
      )}

      {isDeleteAccountConfirmOpen && (
        <ConfirmModal
          icon={AlertCircle}
          title={t('settings.deleteAccountConfirmTitle')}
          desc={t('settings.deleteAccountConfirmDesc')}
          cancelLabel={t('common.cancel')}
          confirmLabel={t('settings.deleteAccount')}
          onCancel={() => setIsDeleteAccountConfirmOpen(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
    </div>
  );
};

export default SettingsPage;
