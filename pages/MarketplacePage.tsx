
import React, { useState, useMemo } from 'react';
import { ShoppingBag, Star, Zap, Users, Search, Filter, TrendingUp, Sparkles, ArrowRight, Heart, ShoppingCart, CheckCircle2, X, Award, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCourseContext } from '../store/useCourseStore';
import { useLanguage } from '../contexts/LanguageContext';
import { Course } from '../types';

const MarketplacePage: React.FC = () => {
  const { marketplaceCourses, buyCourse, courses, t } = useCourseContext();
  const { language } = useLanguage();
  const formatPrice = (priceStr: string | undefined) => {
    if (!priceStr) return priceStr;
    if (priceStr === 'Gratuit' || priceStr === 'Free') return t('marketplace.free');
    const num = parseFloat(priceStr);
    if (isNaN(num)) return priceStr;
    return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'EUR' }).format(num);
  };

  const navigate = useNavigate();
  const [selectedCategoryKey, setSelectedCategoryKey] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Using category keys for filtering logic
  const categoryKeys = ["all", "favorites", "ai", "dev", "design", "business", "languages", "science"];

  const featuredCourse = marketplaceCourses[0];

  const filteredCourses = useMemo(() => {
    // Helper to map UI category string back to key if needed, 
    // but here courses have hardcoded category strings in French/English mixed in mock data.
    // For a real app, courses would have category keys. 
    // We will do a basic string match or mapped match.
    // Since mock data has "IA", "Design" etc, we map the selected Key to the mock data string expected.
    
    // Mapping keys to what is in the Mock Data (which is currently mixed, mostly French in MOCKUP_MARKETPLACE_COURSES)
    // To make this robust with the translation change, we should check against the translated values or the raw values.
    // Let's assume the mock data uses the localized string for now or we map based on index.
    
    const selectedCategoryLabel = t(`categories.${selectedCategoryKey}`);

        return marketplaceCourses.filter(c => {
      if (selectedCategoryKey === 'favorites') {
        return favorites.includes(c.id);
      }
      const selectedCategoryLabel = t(`categories.${selectedCategoryKey}`);
      const matchesCategory = selectedCategoryKey === "all" || c.category === selectedCategoryLabel || c.category === selectedCategoryKey || (selectedCategoryKey === 'dev' && c.category === 'Développement') || (selectedCategoryKey === 'dev' && c.category === 'Development');
      
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [marketplaceCourses, selectedCategoryKey, searchTerm, t, favorites]);

  const isCourseOwned = (courseId: string) => {
    return courses.some(c => c.title === marketplaceCourses.find(mc => mc.id === courseId)?.title);
  };

  const handleBuyCourse = () => {
    if (!selectedCourse) return;
    
    // Simulate API call
    setTimeout(() => {
      buyCourse(selectedCourse);
      setPurchaseSuccess(true);
      // Reset after a delay or let user navigate
    }, 500);
  };

  const openCourseModal = (course: Course) => {
    setPurchaseSuccess(false);
    setSelectedCourse(course);
  };

  const closeCourseModal = () => {
    setSelectedCourse(null);
    setPurchaseSuccess(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, courseTitle: string) => {
    e.currentTarget.src = `https://picsum.photos/seed/${courseTitle}/600/400`;
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-12 pb-32 no-scrollbar animate-in fade-in duration-500 relative">
      
      {/* Course Detail / Purchase Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={closeCourseModal}></div>
          <div className="relative w-full max-w-4xl bg-gemini-bg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col md:flex-row border border-gemini-border">
            
            <button onClick={closeCourseModal} className="absolute top-4 right-4 z-20 p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors">
              <X size={20} />
            </button>

            {/* Modal Image Section */}
            <div className="w-full md:w-2/5 relative h-64 md:h-auto">
              <img 
                src={selectedCourse.image} 
                alt={selectedCourse.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/50"></div>
              <div className="absolute bottom-6 left-6 text-white space-y-2">
                 <div className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/20 rounded-lg text-[10px] font-bold uppercase tracking-widest w-fit">
                   {selectedCourse.category}
                 </div>
                 <div className="flex items-center gap-2">
                    <Star size={16} className="text-amber-400" fill="currentColor" />
                    <span className="font-bold">{selectedCourse.rating}</span>
                    <span className="text-white/70 text-xs">({Math.floor(selectedCourse.students! / 4)} {t('marketplace.reviews')}) · {selectedCourse.students} {t('marketplace.students')}</span>
                 </div>
              </div>
            </div>

            {/* Modal Content Section */}
            <div className="flex-1 p-8 md:p-10 flex flex-col bg-gemini-surface">
              <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
                <div>
                  <h2 className="text-3xl font-bold font-outfit text-gemini-accent leading-tight mb-2">{selectedCourse.title}</h2>
                  <p className="text-gemini-dim font-medium">Par {selectedCourse.author}</p>
                </div>
                
                <p className="text-gemini-text leading-relaxed text-lg opacity-90">
                  {selectedCourse.description}
                </p>

                {selectedCourse.modules.length > 0 && (
                    <div className="space-y-4 pt-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gemini-dim">{t('marketplace.whatYouLearn')}</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {selectedCourse.modules.flatMap(m => m.lessons).slice(0, 5).map((les, i) => (
                          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl bg-gemini-bg border border-gemini-border ${i >= 1 ? 'opacity-70' : ''}`}>
                            {i === 0 ? <CheckCircle2 size={16} className="text-green-500 shrink-0" /> : <span className="text-gemini-dim text-xs shrink-0">🔒</span>}
                            <span className="text-sm text-gemini-text">{les.title}</span>
                          </div>
                        ))}
                        {selectedCourse.modules.flatMap(m => m.lessons).length > 5 && (
                          <div className="text-xs text-gemini-dim italic">+ {selectedCourse.modules.flatMap(m => m.lessons).length - 5} autres leçons...</div>
                        )}
                      </div>
                    </div>
                  )}
              </div>

              <div className="pt-8 mt-6 border-t border-gemini-border flex items-center justify-between gap-6">
                <div>
                  <div className="text-3xl font-bold text-gemini-accent">{formatPrice(selectedCourse.price)}</div>
                  <div className="text-[10px] text-gemini-dim uppercase tracking-wider font-bold">{t('marketplace.lifetime')}</div>
                </div>

                {purchaseSuccess ? (
                   <button 
                     onClick={() => navigate(`/`)} // Navigate to home/dashboard where the course should appear
                     className="px-8 py-4 bg-green-500 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 animate-in zoom-in"
                   >
                     <Play size={16} fill="currentColor" /> {t('marketplace.start')}
                   </button>
                ) : isCourseOwned(selectedCourse.id) ? (
                   <button 
                      disabled
                      className="px-8 py-4 bg-gemini-bg border border-gemini-border text-gemini-dim rounded-2xl font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2 cursor-not-allowed"
                   >
                     <CheckCircle2 size={16} /> {t('marketplace.alreadyOwned')}
                   </button>
                ) : (
                  <button 
                    onClick={handleBuyCourse}
                    className="px-8 py-4 bg-gemini-accent text-gemini-bg rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <ShoppingCart size={16} /> {t('marketplace.buyNow')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header & Search */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gemini-dim text-[10px] font-bold uppercase tracking-[0.3em]">
              <ShoppingBag size={14} /> {t('marketplace.subtitle')}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-outfit text-gemini-accent">{t('marketplace.title')}</h1>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="flex-1 md:w-96 bg-gemini-surface border border-gemini-border rounded-full px-6 py-3 flex items-center gap-3 shadow-xl focus-within:border-gemini-dim transition-all">
              <Search size={18} className="text-gemini-dim" />
              <input 
                type="text" 
                placeholder={t('marketplace.search')}
                className="bg-transparent border-none outline-none text-sm w-full text-gemini-text placeholder:text-gemini-dim/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-3 bg-gemini-surface border border-gemini-border rounded-full text-gemini-dim hover:text-gemini-accent transition-all shadow-lg">
              <Filter size={20} />
            </button>
          </div>
        </div>

        {/* Categories Scroller */}
        <div className="relative -mx-4 px-4"><div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-gemini-bg to-transparent pointer-events-none z-10" /><div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory pr-12">
          {categoryKeys.map((catKey) => (
            <button
              key={catKey}
              onClick={() => setSelectedCategoryKey(catKey)}
              style={{ scrollSnapAlign: "start" }}
              className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${
                selectedCategoryKey === catKey 
                ? 'bg-gemini-accent text-gemini-bg border-gemini-accent' 
                : 'bg-gemini-surface text-gemini-dim border-gemini-border hover:border-gemini-dim hover:text-gemini-accent'
              }`}
            >
              {t(`categories.${catKey}`)}
            </button>
          ))}
        </div></div>
      </section>

      {/* Hero Featured Course */}
      {selectedCategoryKey === "all" && !searchTerm && featuredCourse && (
        <section className="rounded-[3rem] overflow-hidden group shadow-2xl border border-gemini-border bg-gemini-surface flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 relative h-[300px] md:h-auto overflow-hidden">
            <img 
              src={featuredCourse.image} 
              alt={featuredCourse.title} 
              onError={(e) => handleImageError(e, featuredCourse.title)}
              className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105" 
            />
          </div>
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gemini-accent/10 border border-gemini-accent/20 px-4 py-1.5 rounded-full w-fit">
                <Sparkles size={14} className="text-gemini-accent animate-pulse" />
                <span className="text-[10px] font-bold text-gemini-accent uppercase tracking-widest">{t('marketplace.featured')}</span>
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-outfit text-gemini-accent leading-tight">{featuredCourse.title}</h2>
            <p className="text-gemini-dim text-base leading-relaxed line-clamp-3">{featuredCourse.description}</p>
            <div className="flex items-center gap-8 py-2">
              <div className="flex items-center gap-2">
                <Star size={16} className="text-amber-500" fill="currentColor" />
                <span className="text-sm font-bold text-gemini-text">{featuredCourse.rating} <span className="font-normal opacity-70">({Math.floor(featuredCourse.students! / 4)})</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gemini-dim" />
                <span className="text-sm font-medium text-gemini-dim">{featuredCourse.students} {t('marketplace.students')}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-4 mt-auto">
              <button 
                onClick={() => openCourseModal(featuredCourse)}
                className="flex-1 px-8 py-4 bg-gemini-accent text-gemini-bg rounded-2xl font-bold text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <ShoppingCart size={18} /> {t('marketplace.buy')} — {formatPrice(featuredCourse.price)}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setFavorites(prev => prev.includes(featuredCourse.id) ? prev.filter(id => id !== featuredCourse.id) : [...prev, featuredCourse.id]); }}
                className={`p-4 border rounded-2xl transition-all active:scale-90 ${favorites.includes(featuredCourse.id) ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-gemini-bg border-gemini-border text-gemini-dim hover:text-red-500 hover:border-red-500/30'}`}>
                <Heart size={20} fill={favorites.includes(featuredCourse.id) ? "currentColor" : "none"} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Grid */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold font-outfit text-gemini-accent flex items-center gap-3">
            <TrendingUp size={24} className="text-gemini-dim" /> {t('marketplace.trends')}
          </h3>
          <button className="text-[10px] font-bold uppercase tracking-widest text-gemini-dim hover:text-gemini-accent transition-colors">{t('marketplace.explore')}</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.length > 0 ? filteredCourses.map((course) => (
            <div 
              key={course.id} 
              onClick={() => openCourseModal(course)}
              className="glass-card rounded-[2.5rem] overflow-hidden group hover:bg-gemini-surface transition-all duration-500 border-gemini-border bg-gemini-surface/50 flex flex-col shadow-xl cursor-pointer"
            >
              <div className="h-56 overflow-hidden relative shrink-0">
                <img 
                  src={course.image} 
                  alt={course.title} 
                  onError={(e) => handleImageError(e, course.title)}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
                />
                <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-widest text-white border border-white/10">
                    {course.category}
                  </div>
                  {isCourseOwned(course.id) && (
                     <div className="bg-green-600/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-widest text-white border border-green-400/30 flex items-center gap-1">
                        <CheckCircle2 size={10} /> {t('marketplace.owned')}
                     </div>
                  )}
                </div>
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFavorites(prev => prev.includes(course.id) ? prev.filter(id => id !== course.id) : [...prev, course.id]); }}
                  className={`absolute bottom-4 right-4 p-2.5 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 z-10 active:scale-90 ${favorites.includes(course.id) ? 'bg-red-500 text-white opacity-100 translate-y-0' : 'bg-white/10 text-white opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 hover:bg-white hover:text-black'}`}
                >
                  <Heart size={18} fill={favorites.includes(course.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="p-8 flex-1 flex flex-col gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-gemini-dim mb-1">
                    <Star size={14} fill="currentColor" className="text-amber-500" />
                    <span className="text-xs font-bold text-gemini-text">{course.rating} <span className="font-normal text-gemini-dim">({Math.floor(course.students! / 4)})</span></span>
                  </div>
                  <h3 className="font-bold text-xl leading-tight group-hover:text-gemini-accent transition-colors text-gemini-text line-clamp-2">{course.title}</h3>
                  <p className="text-gemini-dim text-sm">Par {course.author}</p>
                </div>
                
                <div className="mt-auto pt-6 flex items-center justify-between border-t border-gemini-border">
                  <span className="text-lg font-bold text-gemini-accent">{formatPrice(course.price)}</span>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gemini-text group-hover:text-gemini-accent transition-colors">
                    {t('marketplace.details')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center flex flex-col items-center gap-3 text-gemini-dim">
               <Search size={48} className="opacity-20" />
               <p className="font-bold text-lg text-gemini-text">{t('marketplace.emptyTitle')}</p>
               <p className="max-w-sm text-sm">{t('marketplace.emptyDesc')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gemini-accent text-gemini-bg rounded-[3.5rem] p-12 md:p-20 text-center space-y-8 border border-gemini-border relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-white/5 blur-[120px] rounded-full -z-10"></div>
        <div className="max-w-2xl mx-auto space-y-6">
          <Zap size={48} className="mx-auto" />
          <h2 className="text-3xl md:text-5xl font-bold font-outfit leading-tight">{t('marketplace.monetize')}</h2>
          <p className="opacity-80 text-lg leading-relaxed">
            {t('marketplace.monetizeDesc')}
          </p>
          <Link to="/create" className="inline-flex items-center gap-3 px-10 py-5 bg-gemini-bg text-gemini-accent rounded-3xl font-bold text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all mt-4">
            {t('marketplace.startCreating')} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default MarketplacePage;
