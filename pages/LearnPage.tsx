import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  Play, 
  Award,
  Sparkles,
  ArrowRight,
  Copy
} from 'lucide-react';
import { marked } from 'marked';
import { useCourseContext } from '../store/useCourseStore';
import { Course } from '../types';
import ArModelBlock from '../components/ArModelBlock';
import CourseMetadataCard from '../components/Shared/CourseMetadataCard';

// @ts-ignore
marked.setOptions({
  gfm: true,
  breaks: true,
  highlight: function(code, lang) {
    // @ts-ignore
    const hljs = window.hljs;
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-'
} as any);

const LearnPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { courses, updateCourse, remixCourse, logLessonActivity, t } = useCourseContext();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [currentModuleIdx, setCurrentModuleIdx] = useState(0);
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const [showCompletionState, setShowCompletionState] = useState(false);
  const [remixSuccess, setRemixSuccess] = useState(false);

  useEffect(() => {
    const found = courses.find(c => c.id === id);
    if (found) setCourse(found);
    else navigate('/');
  }, [id, courses, navigate]);

  useEffect(() => {
    setCurrentModuleIdx(0);
    setCurrentLessonIdx(0);
    setShowCompletionState(false);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTo(0, 0);
  }, [id]);

  // Recompute on every lesson change, not just the "Next" button — jumping
  // straight to a lesson via the syllabus sidebar previously left progress
  // stuck wherever it started, since only handleNext used to update it.
  useEffect(() => {
    if (!course) return;
    const total = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    if (total === 0) return;
    const curr = course.modules.slice(0, currentModuleIdx).reduce((acc, m) => acc + m.lessons.length, 0) + currentLessonIdx + 1;
    const progress = Math.round((curr / total) * 100);
    if (progress > (course.progress || 0)) updateCourse({ ...course, progress });
    logLessonActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModuleIdx, currentLessonIdx, course?.id]);

  useEffect(() => {
    if (contentRef.current && (window as any).renderMathInElement) {
      (window as any).renderMathInElement(contentRef.current, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\(', right: '\\)', display: false},
          {left: '\\[', right: '\\]', display: true}
        ],
        throwOnError: false
      });
    }
  }, [currentModuleIdx, currentLessonIdx, course]);

  const handleRemix = () => {
    if (!course) return;
    const remixed = remixCourse(course.id);
    if (remixed) {
      setRemixSuccess(true);
      setTimeout(() => {
        setRemixSuccess(false);
        navigate(`/create?remixId=${remixed.id}`);
      }, 800);
    }
  };

  if (!course) return null;

  const currentModule = course.modules[currentModuleIdx];
  const currentLesson = currentModule?.lessons[currentLessonIdx];

  const handleNext = () => {
    if (currentLessonIdx < currentModule.lessons.length - 1) setCurrentLessonIdx(currentLessonIdx + 1);
    else if (currentModuleIdx < course.modules.length - 1) {
      setCurrentModuleIdx(currentModuleIdx + 1);
      setCurrentLessonIdx(0);
    } else setShowCompletionState(true);
    
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    if (showCompletionState) setShowCompletionState(false);
    else if (currentLessonIdx > 0) setCurrentLessonIdx(currentLessonIdx - 1);
    else if (currentModuleIdx > 0) {
      const prevIdx = currentModuleIdx - 1;
      setCurrentModuleIdx(prevIdx);
      setCurrentLessonIdx(course.modules[prevIdx].lessons.length - 1);
    }
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex h-full bg-gemini-bg overflow-hidden relative">
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-gemini-sidebar border-r border-gemini-border transition-all duration-300 flex flex-col overflow-hidden fixed lg:relative h-full z-30 shadow-2xl`}>
        <div className="p-6 border-b border-gemini-border flex items-center justify-between shrink-0">
          <h2 className="font-bold text-xs uppercase tracking-[0.2em] text-gemini-accent">{t('learn.syllabus')}</h2>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5"><X size={18} className="text-gemini-dim"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
          {course.modules.map((mod, mIdx) => (
            <div key={mod.id} className="space-y-2">
              <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-gemini-dim px-2">{t('learn.module')} 0{mIdx + 1}</h3>
              <div className="space-y-1">
                {mod.lessons.map((lesson, lIdx) => {
                  const isActive = !showCompletionState && mIdx === currentModuleIdx && lIdx === currentLessonIdx;
                  return (
                    <button key={lesson.id} onClick={() => { setShowCompletionState(false); setCurrentModuleIdx(mIdx); setCurrentLessonIdx(lIdx); if(window.innerWidth < 1024) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all text-left ${isActive ? 'bg-gemini-accent text-gemini-bg font-bold shadow-md' : 'text-gemini-dim hover:bg-gemini-surface'}`}>
                      <span className="truncate">{lesson.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-16 border-b border-gemini-border flex items-center justify-between px-6 bg-gemini-header/50 backdrop-blur-xl shrink-0 z-20">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-gemini-dim"><Menu size={20} /></button>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRemix}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all border ${remixSuccess ? 'bg-green-500 border-green-500 text-white' : 'bg-gemini-surface border-gemini-border text-gemini-accent hover:border-gemini-accent'}`}
            >
              <Copy size={14} /> {remixSuccess ? t('learn.remixed') : t('learn.remix')}
            </button>
                      </div>
        </header>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 md:px-16 py-10 md:py-20 no-scrollbar relative">
          {showCompletionState ? (
            <div className="max-w-3xl mx-auto py-12 text-center space-y-8">
              <Award size={64} className="mx-auto text-gemini-accent" />
              <h2 className="text-4xl font-bold font-outfit text-gemini-accent">{t('learn.congrats')}</h2>
              <button onClick={() => navigate('/')} className="px-10 py-4 bg-gemini-accent text-gemini-bg rounded-2xl font-bold text-xs uppercase tracking-[0.2em]">{t('learn.dashboardBtn')}</button>
            </div>
          ) : (
            <article ref={contentRef} className="max-w-3xl mx-auto animate-in fade-in duration-500 pb-32">
              <div className="mb-12 space-y-6">
                <nav className="text-[10px] text-gemini-dim font-bold uppercase tracking-[0.2em]">{t('learn.lesson')} 0{currentLessonIdx + 1}</nav>
                <h1 className="text-3xl md:text-6xl font-bold font-outfit text-gemini-accent leading-tight">{currentLesson?.title}</h1>
              </div>

              <div className="space-y-12">
                {currentLesson?.content.map((block) => {
                  if (block.type === 'overview') return <CourseMetadataCard key={block.id} data={block.value} t={t} className="mb-16" />;
                  
                  return (
                    <div key={block.id} className="animate-in fade-in duration-700">
                      {block.type === 'text' && <div className="prose-gemini" dangerouslySetInnerHTML={{ __html: marked.parse(block.value || '') }} />}
                      {block.type === 'image' && <div className="rounded-[3.5rem] overflow-hidden border border-gemini-border shadow-2xl bg-gemini-surface"><img src={block.value} alt="" className="w-full h-auto" /></div>}
                      {block.type === 'ar' && <ArModelBlock value={block.value} onUpload={() => {}} isEditable={false} />}
                      {block.type === 'insight' && (
                        <div className={`p-8 rounded-[2rem] border relative overflow-hidden group/insight my-12 shadow-inner bg-indigo-500/5 border-indigo-500/20 text-indigo-400`}>
                          <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Sparkles size={120} className="text-current" />
                          </div>
                          <div className={`flex items-center gap-3 mb-4`}>
                            <Sparkles size={20} className="animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-[0.4em]">{block.value.title || "AI Insight"}</span>
                          </div>
                          <div className="prose-gemini prose-sm text-gemini-text/90 italic leading-relaxed" dangerouslySetInnerHTML={{ __html: marked.parse(block.value.content || '') }} />
                        </div>
                      )}
                      {block.type === 'quiz' && (
                        <div className="bg-gemini-surface border border-gemini-border rounded-[3.5rem] p-10 md:p-14 space-y-10 shadow-2xl relative overflow-hidden border-t-8 border-t-gemini-accent">
                          <h4 className="text-3xl font-bold text-gemini-accent font-outfit">{block.value.question}</h4>
                          <div className="grid gap-4">
                            {block.value.options.map((opt: string, i: number) => (
                              <button key={i} className="p-6 rounded-[2rem] border border-gemini-border bg-gemini-bg text-left hover:bg-gemini-surface transition-all text-lg">{opt}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <footer className="pt-16 border-t border-gemini-border flex items-center justify-between gap-8 mt-24">
                <button onClick={handlePrev} disabled={currentModuleIdx === 0 && currentLessonIdx === 0} className="flex items-center gap-3 text-gemini-dim disabled:opacity-10">
                   <ChevronLeft size={24} /> {t('learn.prev')}
                </button>
                <button onClick={handleNext} className="bg-gemini-accent text-gemini-bg px-12 py-5 rounded-[2rem] font-bold flex items-center gap-4 shadow-2xl hover:scale-105 active:scale-95 transition-all">
                  <span className="uppercase tracking-[0.2em] text-[11px] font-black">{currentModuleIdx === course.modules.length - 1 && currentLessonIdx === currentModule.lessons.length - 1 ? t('learn.finish') : t('learn.next')}</span>
                  <ArrowRight size={20} />
                </button>
              </footer>
            </article>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnPage;