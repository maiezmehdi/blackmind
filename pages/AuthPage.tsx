
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useCourseContext } from '../store/useCourseStore';

const RabbitLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M5 2h4v8H5V2zm6 0h4v8h-4V2z" />
    <path d="M2 9h20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z" />
    <rect x="15" y="15" width="4" height="4" rx="1.2" fill="var(--gemini-bg)" />
  </svg>
);

const AuthPage: React.FC = () => {
  const { login, signup, loginWithGoogle, t } = useCourseContext();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name, email);
      }
      navigate('/');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-gemini-bg font-sans">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gemini-surface items-center justify-center border-r border-gemini-border">
        <div className="absolute inset-0 opacity-30">
           {/* Abstract Background pattern simulation */}
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-gemini-bg to-transparent" />
           <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-500/20 via-gemini-bg to-transparent" />
        </div>
        
        <div className="relative z-10 p-12 text-center space-y-8 max-w-lg">
          <div className="w-24 h-24 bg-gemini-bg border border-gemini-border rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl mb-8">
            <RabbitLogo className="w-12 h-12 text-gemini-accent" />
          </div>
          <h1 className="text-5xl font-bold font-outfit text-gemini-accent tracking-tight leading-tight">
            {t('auth.welcomeTitle')}
          </h1>
          <p className="text-xl text-gemini-dim leading-relaxed">
            {t('auth.welcomeSubtitle')}
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div className="text-center lg:hidden mb-8">
            <div className="w-16 h-16 bg-gemini-surface border border-gemini-border rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4">
              <RabbitLogo className="w-8 h-8 text-gemini-accent" />
            </div>
            <h1 className="text-2xl font-bold font-outfit text-gemini-accent">Blackmind</h1>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold font-outfit text-gemini-accent">
              {isLogin ? t('auth.loginTitle') : t('auth.signupTitle')}
            </h2>
            <p className="text-gemini-dim">
              {isLogin ? t('auth.loginSubtitle') : t('auth.signupSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gemini-dim ml-1">{t('auth.nameLabel')}</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gemini-surface border border-gemini-border rounded-2xl px-5 py-4 text-sm outline-none focus:border-gemini-accent transition-all text-gemini-text placeholder:text-gemini-dim/50 shadow-sm"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gemini-dim ml-1">{t('auth.emailLabel')}</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gemini-surface border border-gemini-border rounded-2xl px-5 py-4 text-sm outline-none focus:border-gemini-accent transition-all text-gemini-text placeholder:text-gemini-dim/50 shadow-sm"
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gemini-dim">{t('auth.passwordLabel')}</label>
                {isLogin && <button type="button" className="text-[10px] font-bold uppercase tracking-widest text-gemini-accent hover:underline">{t('auth.forgotPassword')}</button>}
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gemini-surface border border-gemini-border rounded-2xl px-5 py-4 text-sm outline-none focus:border-gemini-accent transition-all text-gemini-text placeholder:text-gemini-dim/50 shadow-sm pr-12"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gemini-dim hover:text-gemini-text transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gemini-accent text-gemini-bg py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> {isLogin ? t('auth.loggingIn') : t('auth.signingUp')}
                </>
              ) : (
                <>
                  {isLogin ? t('auth.loginButton') : t('auth.signupButton')} <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gemini-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-gemini-bg px-4 text-gemini-dim uppercase tracking-wider font-medium">{t('auth.or')}</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white text-black border border-neutral-200 py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-neutral-50 transition-all flex items-center justify-center gap-3 shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t('auth.googleButton')}
          </button>

          <p className="text-center text-sm text-gemini-dim">
            {isLogin ? t('auth.noAccount') : t('auth.hasAccount')} {' '}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-gemini-accent font-bold hover:underline transition-all"
            >
              {isLogin ? t('auth.signupButton') : t('auth.loginButton')}
            </button>
          </p>

          <p className="text-[10px] text-center text-gemini-dim/60 leading-relaxed px-8">
            {t('auth.terms')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
