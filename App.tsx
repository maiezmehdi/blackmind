import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
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
  const { preferences, accessibility } = useCourseContext();

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

  const isFullHeightPage = location.pathname === '/create' || location.pathname.startsWith('/learn/') || location.pathname === '/workspaces';
  const hideHeader = location.pathname === '/create' && !isMobile;

  return (
    <MotionConfig reducedMotion={accessibility.reduceMotion ? 'always' : 'never'}>
    <div className="flex h-screen w-full bg-gemini-bg text-gemini-text font-sans overflow-hidden supports-[height:100dvh]:h-[100dvh]">
      {!isMobile && (
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={toggleSidebarCollapse}
          pathname={location.pathname}
        />
      )}

      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            key="mobile-sidebar"
            className="fixed inset-0 z-[60] flex"
            initial="closed"
            animate="open"
            exit="closed"
          >
            <motion.div
              className="h-full"
              variants={{ open: { x: 0 }, closed: { x: '-100%' } }}
              transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            >
              <Sidebar isCollapsed={false} onToggle={() => setSidebarOpen(false)} onLinkClick={() => setSidebarOpen(false)} pathname={location.pathname} />
            </motion.div>
            <motion.div
              className="flex-1 bg-black/50 backdrop-blur-sm"
              variants={{ open: { opacity: 1 }, closed: { opacity: 0 } }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={() => setSidebarOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-w-0 relative transition-all duration-300">
        {!hideHeader && (
          <Header
            isMobile={isMobile}
            onSidebarToggle={() => setSidebarOpen(true)}
          />
        )}

        <div className={`flex-1 ${isFullHeightPage ? 'overflow-hidden flex flex-col' : 'overflow-y-auto no-scrollbar'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: isMobile ? 12 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: isMobile ? -12 : -8 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className={isFullHeightPage ? 'h-full flex flex-col' : ''}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {preferences.showAiAssistant && <HelpAssistant />}
    </div>
    </MotionConfig>
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
      html.style.setProperty('--gemini-bg', '#101010');
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