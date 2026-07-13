import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, TrendingUp, Book, Brain, Code, Palette, Globe, Trash2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCourseContext } from '../store/useCourseStore';
import { useLanguage } from '../contexts/LanguageContext';

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

const CourseCard = ({ course, onDeleteRequest, labelStart, labelContinue, t, to, onOpen }: any) => {
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
      onClick={onOpen ? (e: React.MouseEvent) => { e.preventDefault(); onOpen(course); } : undefined}
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
        {onDeleteRequest && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDeleteRequest(course);
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
  const { courses, deleteCourse, marketplaceCourses, buyCourse } = useCourseContext();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [heroPrompt, setHeroPrompt] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  // Marketplace-catalog cards (AI Suggestions / Popular) reference ids that
  // only exist in marketplaceCourses — LearnPage only looks courses up in
  // the user's own `courses`, so a plain <Link to="/learn/:id"> for these
  // would land on an unknown id and bounce straight back to "/". Clone it
  // into the user's library first (same free, no-payment-gate clone that
  // Marketplace's own "buy" button already does), then open the clone —
  // or just open it directly if the user already grabbed it before.
  const openSuggestedCourse = (course: any) => {
    const owned = courses.find(c => c.title === course.title);
    const target = owned || buyCourse(course);
    navigate(`/learn/${target.id}`);
  };

  // Send the user's typed intent to the Create page (pre-fills the AI chat).
  const goCreate = (prompt?: string) => {
    const text = (prompt ?? heroPrompt).trim();
    navigate(text ? `/create?prompt=${encodeURIComponent(text)}` : '/create');
  };

  const categories = [
    { key: 'dev', icon: Code, label: t('categories.dev') },
    { key: 'design', icon: Palette, label: t('categories.design') },
    { key: 'ai', icon: Brain, label: t('categories.ai') },
    { key: 'languages', icon: Globe, label: t('categories.languages') },
    { key: 'business', icon: TrendingUp, label: t('categories.business') },
    { key: 'academic', icon: Book, label: t('categories.academic') },
  ];

  // Real courses from the marketplace catalog (they have actual content via
  // createBasicModules and support the existing remix flow in LearnPage) —
  // not decorative cards pointing at a fresh AI generation. "Because you
  // like X" just reflects the course's own category.
  const suggestions = marketplaceCourses.slice(0, 2).map(c => ({ ...c, aiReason: c.category }));
  const popularCourses = [...marketplaceCourses]
    .sort((a, b) => (b.students || 0) - (a.students || 0))
    .slice(0, 3);

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
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-[32%] group-hover/search:opacity-60 blur-xl transition duration-500 group-hover/search:duration-200"></div>
          
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
                onDeleteRequest={(c: any) => setDeleteConfirm({ id: c.id, title: c.title })}
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
                  onOpen={openSuggestedCourse}
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
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => navigate(`/marketplace?category=${cat.key}`)}
              className="flex-shrink-0 flex items-center gap-3 bg-gemini-surface/50 border border-gemini-border rounded-2xl p-4 hover:bg-gemini-surface hover:border-gemini-dim transition-all min-w-[200px] shadow-sm group"
            >
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
          <button onClick={() => navigate('/marketplace')} className="text-[10px] font-bold uppercase tracking-widest text-gemini-dim hover:text-gemini-accent transition-colors">{t('home.seeAll')}</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
          {popularCourses.map(course => (
            <CourseCard key={course.id} t={t} onOpen={openSuggestedCourse} labelContinue={t('home.continue')} labelStart={t('home.start')} course={course} />
          ))}
        </div>
      </section>

      {deleteConfirm && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setDeleteConfirm(null)}></div>
          <div className="relative w-full max-w-md bg-gemini-surface border border-gemini-border rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-500/20">
                <AlertCircle size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold font-outfit text-gemini-text">{t('common.confirmDeleteCourse', { title: deleteConfirm.title })}</h3>
                <p className="text-sm text-gemini-dim leading-relaxed">{t('common.confirmDeleteDesc')}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-6 py-4 bg-gemini-bg border border-gemini-border rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gemini-text hover:bg-gemini-surface transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => {
                    deleteCourse(deleteConfirm.id);
                    setDeleteConfirm(null);
                  }}
                  className="flex-1 px-6 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 shadow-lg active:scale-95 transition-all"
                >
                  {t('common.confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;