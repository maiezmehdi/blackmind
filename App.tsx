import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  PlusCircle, 
  Compass, 
  ShoppingBag,
  BarChart2, 
  Briefcase, 
  Settings, 
  LayoutGrid,
  Crown
} from 'lucide-react';

// Store
import { CourseProvider, useCourseContext } from './store/useCourseStore';

// Components
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import HelpAssistant from './components/Shared/HelpAssistant';

// Pages
import HomePage from './pages/HomePage';
import CreatePage from './pages/CreatePage';
import LearnPage from './pages/LearnPage';
import ProgressPage from './pages/ProgressPage';
import WorkspacesPage from './pages/WorkspacesPage';
import SettingsPage from './pages/SettingsPage';
import MarketplacePage from './pages/MarketplacePage';
import AuthPage from './pages/AuthPage';
import PricingPage from './pages/PricingPage';

// Private Route Wrapper
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated } = useCourseContext();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppLayout = ({ children }: { children?: React.ReactNode }) => {
  const { language, t } = useLanguage();
  const { preferences } = useCourseContext();

  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (location.pathname === '/create') {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebarCollapse = () => setSidebarCollapsed(!isSidebarCollapsed);

  const isFullHeightPage = location.pathname === '/create' || location.pathname.startsWith('/learn/');
  const hideHeader = location.pathname === '/create' && !isMobile;

  return (
    <div className="flex h-screen w-full bg-gemini-bg text-gemini-text font-sans overflow-hidden supports-[height:100dvh]:h-[100dvh]">
      {!isMobile && (
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={toggleSidebarCollapse} 
          pathname={location.pathname} 
        />
      )}

      {isMobile && (
        <div
          className={`fixed inset-0 z-[60] flex transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          aria-hidden={!isSidebarOpen}
        >
          <div className={`h-full transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <Sidebar isCollapsed={false} onToggle={() => setSidebarOpen(false)} onLinkClick={() => setSidebarOpen(false)} pathname={location.pathname} />
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 relative transition-all duration-300">
        {!hideHeader && (
          <Header
            isMobile={isMobile}
            onSidebarToggle={() => setSidebarOpen(true)}
          />
        )}

        <div className={`flex-1 ${isFullHeightPage ? 'overflow-hidden flex flex-col' : 'overflow-y-auto no-scrollbar'}`}>
          <div key={location.pathname} className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ${isFullHeightPage ? 'h-full flex flex-col' : ''}`}>
            {children}
          </div>
        </div>
      </main>

      {preferences.showAiAssistant && <HelpAssistant />}
    </div>
  );
};

const AppContent = () => {
  const location = useLocation();
  const { accessibility } = useCourseContext();

  // Global Theme Logic
  useEffect(() => {
    const theme = localStorage.getItem('blackmind_theme') || 'dark';
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
  }, [location.pathname]); // Re-run on navigation to ensure it stays applied


  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    body.classList.remove(
      'mode-dyslexia', 'mode-contrast', 'mode-falc', 'reduce-motion', 'mode-links', 'mode-audio', 'mode-focus',
      'mode-keyboard-nav', 'font-serif', 'font-monospace', 'font-dyslexic',
    );
    html.classList.remove('mode-colorblind-protanopia', 'mode-colorblind-deuteranopia', 'mode-colorblind-tritanopia');

    if (accessibility.dyslexiaMode) body.classList.add('mode-dyslexia');
    if (accessibility.highContrast) body.classList.add('mode-contrast');
    if (accessibility.simplifiedReading) body.classList.add('mode-falc');
    if (accessibility.reduceMotion) body.classList.add('reduce-motion');
    if (accessibility.highlightLinks) body.classList.add('mode-links');
    if (accessibility.audioReading) body.classList.add('mode-audio');
    if (accessibility.adhdFocusMode) body.classList.add('mode-focus');
    if (accessibility.keyboardNav) body.classList.add('mode-keyboard-nav');
    if (accessibility.fontFamily !== 'default') body.classList.add(`font-${accessibility.fontFamily}`);
    if (accessibility.colorBlindMode !== 'none') html.classList.add(`mode-colorblind-${accessibility.colorBlindMode}`);

    html.style.setProperty('--app-font-scale', accessibility.textSize.toString());
    html.style.setProperty('--app-line-height', accessibility.lineHeight.toString());
    html.style.setProperty('--app-letter-spacing', accessibility.letterSpacing.toString());

  }, [accessibility]);

  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="*" element={
        <ProtectedRoute>
          <AppLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/create" element={<CreatePage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/learn/:id" element={<LearnPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/workspaces" element={<WorkspacesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/pricing" element={<PricingPage />} />
            </Routes>
          </AppLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <LanguageProvider>
        <CourseProvider>
        <AppContent />
      </CourseProvider>
      </LanguageProvider>
    </Router>
  );
};

export default App;