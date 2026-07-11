import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, TrendingUp, Book, Brain, Code, Palette, Globe, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCourseContext } from '../store/useCourseStore';
import { useLanguage } from '../contexts/LanguageContext';
import DarkVeil from '../components/DarkVeil';

const ArIcon = ({ size = 12, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M5 7V5a2 2 0 0 1 2-2h2" />
    <path d="M15 3h2a2 2 0 0 1 2 2v2" />
    <path d="M19 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M9 21H7a2 2 0 0 1-2-2v-2" />
    <path d="M12 7l-5 3v4l5 3 5-3v-4z" />
    <path d="M12 7v10" />
    <path d="M17 10l-5 3-5-3" />
  </svg>
);

const CourseCard = ({ course, onDelete, labelStart, labelContinue, t, to }: any) => {
  // Check if any lesson contains an AR block
  const hasAr = course.modules?.some((m: any) =>
    m.lessons?.some((l: any) =>
      l.content?.some((b: any) => b.type === 'ar')
    )
  );

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = `https://picsum.photos/seed/${course.title}/600/400`;
  };

  return (
    <Link
      to={to || `/learn/${course.id}`}
      className="glass-card rounded-2xl overflow-hidden group hover:bg-gemini-surface transition-all duration-300 relative border border-gemini-border bg-gemini-surface/50 shadow-sm flex flex-col h-full"
    >
      <div className="h-40 overflow-hidden relative">
        <img 
          src={course.image || `https://picsum.photos/seed/${course.id}/600/400`} 
          alt={course.title} 
          onError={handleImageError}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          <div className="bg-gemini-bg/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-widest text-gemini-text border border-gemini-border">
            {course.category || t('common.general')}
          </div>
          {hasAr && (
            <div className="bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-600 bg-[length:200%_auto] animate-shimmer px-2.5 py-1 rounded-full text-[9px] uppercase font-black tracking-widest text-white flex items-center gap-1.5 shadow-[0_0_15px_rgba(79,70,229,0.5)] border border-white/30">
              <ArIcon size={12} className="animate-pulse" /> AR READY
            </div>
          )}
        </div>
        {onDelete && (
          <button 
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              if (window.confirm(t('common.confirmDeleteCourse'))) {
                onDelete(course.id);
              }
            }}
            className="absolute top-3 left-3 p-1.5 bg-neutral-900/60 hover:bg-red-500 text-neutral-400 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm z-10"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <h3 className="font-bold text-lg mb-1 group-hover:text-gemini-accent transition-colors line-clamp-1 text-gemini-text">{course.title}</h3>
          <p className="text-gemini-dim text-sm mb-3">{t('home.by')} {course.author || t('common.anonymous')}</p>
        </div>
        <div className="mt-auto">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gemini-dim font-medium">{course.modules?.length || 0} {course.modules?.length > 1 ? t('home.modulesCountPlural') : t('home.modulesCountSingular')}</span>
            <span className="text-gemini-dim font-medium">{course.progress || 0}% {t('home.completed')}</span>
          </div>
          <div className="w-full h-1.5 bg-gemini-border rounded-full mb-3 overflow-hidden">
            <div className="h-full bg-gemini-accent transition-all duration-500" style={{ width: `${course.progress || 0}%` }}></div>
          </div>
          <div className="flex items-center justify-end text-xs">
            <div className="text-gemini-text font-bold uppercase tracking-widest group-hover:text-gemini-accent flex items-center gap-1 transition-colors">
              {course.progress > 0 ? labelContinue : labelStart} <TrendingUp size={12}/>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const HomePage: React.FC = () => {
  const { language, t } = useLanguage();
  const { courses, deleteCourse } = useCourseContext();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [heroPrompt, setHeroPrompt] = useState('');

  // Send the user's typed intent to the Create page (pre-fills the AI chat).
  const goCreate = (prompt?: string) => {
    const text = (prompt ?? heroPrompt).trim();
    navigate(text ? `/create?prompt=${encodeURIComponent(text)}` : '/create');
  };

  // Discovery cards represent courses that don't exist yet — clicking one
  // starts a generation for that topic instead of leading to a dead link.
  const suggestLink = (title: string) =>
    `/create?prompt=${encodeURIComponent(t('home.suggestPrefill', { title }))}`;

  const categories = [
    { icon: Code, label: t('categories.dev') },
    { icon: Palette, label: t('categories.design') },
    { icon: Brain, label: t('categories.ai') },
    { icon: Globe, label: t('categories.languages') },
    { icon: TrendingUp, label: t('categories.business') },
    { icon: Book, label: t('categories.academic') },
  ];

  // Mock AI Suggestions tailored to the user profile
  const suggestions = [
    {
      id: 'ai-1',
      title: 'Cognitive Architecture 101',
      author: 'Blackmind Intelligence',
      category: 'Science',
      image: 'https://images.unsplash.com/photo-1559757175-5b2b0e8b2b73?auto=format&fit=crop&q=80&w=600',
      progress: 0,
      aiReason: t('categories.science')
    },
    {
      id: 'ai-2',
      title: 'UX Writing for AI Interfaces',
      author: 'Design Systems',
      category: 'Design',
      image: 'https://images.unsplash.com/photo-1586717791821-3f44a5638d48?auto=format&fit=crop&q=80&w=600',
      progress: 0,
      aiReason: t('categories.design')
    }
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-12 pb-24">
      {/* Hero / Global Chat Search with DarkVeil Background */}
      <section 
        ref={heroRef}
        className="relative text-center space-y-8 py-20 rounded-[3rem] overflow-hidden border border-gemini-border group bg-gemini-sidebar/20 transition-all duration-500"
      >
        {/* DarkVeil Background */}
        <div className="absolute inset-0 -z-10 opacity-60">
          <DarkVeil
            hueShift={0}
            noiseIntensity={0}
            scanlineIntensity={0}
            speed={0.5}
            scanlineFrequency={0}
            warpAmount={0}
          />
        </div>
        
        {/* Enhanced Soft Glow Gradient that follows mouse */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-0"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(233, 69, 245, 0.15), transparent 80%)`,
            zIndex: -5
          }}
        ></div>
        
        {/* Content Overlay to ensure contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-gemini-bg/20 via-transparent to-gemini-bg/40 -z-10"></div>

        <div className="space-y-4 relative z-10 px-4">
          <h2 className="text-4xl md:text-6xl font-bold font-outfit tracking-tight text-gemini-accent leading-tight">
            {t('home.heroTitle1')} <br /><span className="bg-clip-text text-transparent bg-gradient-to-r from-neutral-400 to-neutral-600 dark:from-neutral-200 dark:to-neutral-500">{t('home.heroTitle2')}</span>
          </h2>
          <p className="text-gemini-dim text-lg max-w-2xl mx-auto leading-relaxed font-medium">
            {t('home.heroSubtitle')}
          </p>
        </div>

        {/* Enhanced Floating Search Bar (Halo Effect) */}
        <div className="max-w-3xl mx-auto relative group/search z-10 px-4">
          {/* Glowing Halo */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 group-hover/search:opacity-60 blur-xl transition duration-500 group-hover/search:duration-200"></div>
          
          <div className="relative flex items-center bg-gemini-surface/90 backdrop-blur-xl border border-gemini-border rounded-full p-2 pl-6 shadow-2xl focus-within:border-indigo-500/50 transition-all duration-300 hover:scale-[1.01] focus-within:scale-[1.01]">
            <Search className="text-gemini-dim mr-4 shrink-0 group-focus-within/search:text-indigo-500 transition-colors" size={20} />
            <input
              type="text"
              value={heroPrompt}
              onChange={(e) => setHeroPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') goCreate(); }}
              placeholder={t('home.searchPlaceholder')}
              className="bg-transparent border-none outline-none flex-1 min-w-0 text-xs md:text-lg py-2 md:py-3 text-gemini-text placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
            <button type="button" onClick={() => goCreate()} className="shrink-0 bg-gemini-accent text-gemini-bg hover:text-white p-3 rounded-full transition-all duration-200 shadow-lg flex items-center gap-2 transform hover:scale-105 active:scale-95 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600">
              <Sparkles size={20} />
              <span className="hidden md:inline pr-2 font-bold uppercase tracking-widest text-[11px]">{t('home.generateBtn')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Your Courses */}
      {courses.length > 0 ? (
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold font-outfit text-gemini-accent">{t('home.yourCreations')}</h3>
            <span className="text-[10px] font-bold tracking-widest text-gemini-text bg-gemini-surface border border-gemini-border px-3 py-1 rounded-full uppercase">
              {courses.length} {t('home.coursesCount')}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onDelete={deleteCourse}
                labelContinue={t('home.continue')}
                labelStart={t('home.start')}
                t={t}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col items-center text-center gap-5 py-14 px-6 rounded-3xl border border-dashed border-gemini-border bg-gemini-surface/40">
            <div className="p-4 bg-gemini-accent text-gemini-bg rounded-2xl shadow-lg">
              <Sparkles size={28} />
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="text-xl md:text-2xl font-bold font-outfit text-gemini-accent">{t('home.emptyTitle')}</h3>
              <p className="text-gemini-dim text-sm leading-relaxed">{t('home.emptyDesc')}</p>
            </div>
            <button
              onClick={() => goCreate()}
              className="inline-flex items-center gap-2 bg-gemini-accent text-gemini-bg px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-transform"
            >
              <Sparkles size={16} /> {t('home.emptyCta')}
            </button>
          </div>
        </section>
      )}

      {/* AI Suggestions Section */}
      <section className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gemini-accent text-gemini-bg rounded-xl shadow-lg">
              <Sparkles size={20} />
          </div>
          <div>
              <h3 className="text-2xl font-bold font-outfit text-gemini-accent">{t('home.aiSuggestions')}</h3>
              <p className="text-xs text-gemini-dim uppercase tracking-wider font-medium">{t('home.aiSuggestionsSubtitle')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestions.map(course => (
             <div key={course.id} className="relative group">
                <div className="absolute -top-3 left-4 z-10 bg-gemini-bg/95 backdrop-blur-md border border-gemini-accent/30 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest text-gemini-accent shadow-lg flex items-center gap-1.5 transform group-hover:-translate-y-1 transition-transform">
                  <Sparkles size={10} /> {t('home.because')} {course.aiReason}
                </div>
                <CourseCard
                  course={course}
                  to={suggestLink(course.title)}
                  labelContinue={t('home.continue')}
                  labelStart={t('home.start')}
                  t={t}
                />
             </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold font-outfit text-gemini-accent">{t('home.browse')}</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 scroll-smooth">
          {categories.map((cat, i) => (
            <button key={i} className="flex-shrink-0 flex items-center gap-3 bg-gemini-surface/50 border border-gemini-border rounded-2xl p-4 hover:bg-gemini-surface hover:border-gemini-dim transition-all min-w-[200px] shadow-sm group">
              <div className="p-2.5 rounded-xl bg-gemini-bg text-gemini-dim group-hover:text-gemini-accent transition-colors">
                <cat.icon size={24} />
              </div>
              <span className="font-semibold text-sm text-gemini-dim group-hover:text-gemini-accent">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Popular on Blackmind */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold font-outfit text-gemini-accent">{t('home.popular')}</h3>
          <button className="text-[10px] font-bold uppercase tracking-widest text-gemini-dim hover:text-gemini-accent transition-colors">{t('home.seeAll')}</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
          <CourseCard t={t} to={suggestLink('Maîtriser le Prompt Engineering')} labelContinue={t('home.continue')} labelStart={t('home.start')} course={{id: 'p1', title: 'Maîtriser le Prompt Engineering', author: 'Gemini Expert', category: 'IA', progress: 0}} />
          <CourseCard t={t} to={suggestLink('Design Thinking pour Développeurs')} labelContinue={t('home.continue')} labelStart={t('home.start')} course={{id: 'p2', title: 'Design Thinking pour Développeurs', author: 'UX Collective', category: 'Design', progress: 0}} />
          <CourseCard t={t} to={suggestLink('Introduction à React 19')} labelContinue={t('home.continue')} labelStart={t('home.start')} course={{id: 'p3', title: 'Introduction à React 19', author: 'Frontend Masters', category: 'Dev', progress: 0}} />
        </div>
      </section>
    </div>
  );
};

export default HomePage;