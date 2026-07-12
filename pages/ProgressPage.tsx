
import React, { useMemo, useState } from 'react';
import { Plus, X, Award, BadgeCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Calendar, Clock, BookOpen, BarChart2 } from 'lucide-react';
import { useCourseContext, MINUTES_PER_LESSON } from '../store/useCourseStore';
import { useLanguage } from '../contexts/LanguageContext';

const StatCard = ({ icon: Icon, label, value }: any) => (
  <div className="glass-card p-6 rounded-3xl space-y-2 border-gemini-border bg-gemini-surface/50 shadow-sm">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gemini-bg text-gemini-dim">
      <Icon size={20} />
    </div>
    <div className="space-y-0.5">
      <p className="text-gemini-dim text-[10px] font-bold uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-bold text-gemini-accent">{value}</p>
    </div>
  </div>
);

const toDateKey = (d: Date) => d.toISOString().slice(0, 10);

// Monday of the week containing `d`.
const startOfWeek = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // shift Sunday(0) back to the previous Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const ProgressPage: React.FC = () => {
  const { t } = useCourseContext();
  const { language } = useLanguage();
  const { courses, studyLog, weeklyGoals, addWeeklyGoal, removeWeeklyGoal } = useCourseContext();

  const [range, setRange] = useState<'week' | 'month'>('week');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalUnit, setGoalUnit] = useState<'lessons' | 'hours'>('lessons');
  const [goalTarget, setGoalTarget] = useState('3');

  const isDarkMode = document.documentElement.classList.contains('dark');
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--gemini-accent').trim();
  const dimColor = getComputedStyle(document.documentElement).getPropertyValue('--gemini-dim').trim();
  const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--gemini-border').trim();

  // --- Real stats, derived from actual course progress + the study log ---
  const startedCourses = useMemo(() => courses.filter(c => (c.progress || 0) > 0).length, [courses]);
  const totalLessonsLogged = useMemo(() => Object.values(studyLog).reduce((a: number, b: number) => a + b, 0), [studyLog]);
  const totalHours = (totalLessonsLogged * MINUTES_PER_LESSON) / 60;
  const certificates = useMemo(() => courses.filter(c => (c.progress || 0) >= 100).length, [courses]);

  const streak = useMemo(() => {
    let count = 0;
    const cursor = new Date();
    if (!studyLog[toDateKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
    while (studyLog[toDateKey(cursor)]) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [studyLog]);

  // --- Daily activity chart: real per-day estimated study hours ---
  const data = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', day: 'numeric' });
    const days = range === 'week' ? 6 : 29;
    return Array.from({ length: days + 1 }, (_, i) => days - i).map(daysAgo => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      const lessons = studyLog[toDateKey(d)] || 0;
      return {
        name: formatter.format(d).replace(/\./g, ''),
        hours: Math.round((lessons * MINUTES_PER_LESSON / 60) * 10) / 10,
      };
    });
  }, [studyLog, language, range]);

  // --- Weekly trend: real lesson totals for the last 4 ISO weeks ---
  const weeklyTrendData = useMemo(() => {
    const weeks: { name: string; progress: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = startOfWeek(new Date());
      weekStart.setDate(weekStart.getDate() - w * 7);
      let total = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        total += studyLog[toDateKey(d)] || 0;
      }
      weeks.push({ name: `${t('days.week')} ${4 - w}`, progress: total });
    }
    return weeks;
  }, [studyLog, t]);

  // --- Weekly goals: live progress against this week's activity ---
  const thisWeekLessons = useMemo(() => {
    const weekStart = startOfWeek(new Date());
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      total += studyLog[toDateKey(d)] || 0;
    }
    return total;
  }, [studyLog]);
  const thisWeekMinutes = thisWeekLessons * MINUTES_PER_LESSON;

  const handleAddGoal = () => {
    const title = goalTitle.trim();
    const targetNum = parseFloat(goalTarget);
    if (!title || !targetNum || targetNum <= 0) return;
    if (goalUnit === 'hours') addWeeklyGoal(title, Math.round(targetNum * 60), 'minutes');
    else addWeeklyGoal(title, Math.round(targetNum), 'lessons');
    setGoalTitle('');
    setGoalTarget('3');
    setGoalUnit('lessons');
    setIsGoalModalOpen(false);
  };

  const handleExport = () => {
    const rows = [['date', 'lessons_completed', 'estimated_minutes']];
    Object.keys(studyLog).sort().forEach(date => {
      rows.push([date, String(studyLog[date]), String(studyLog[date] * MINUTES_PER_LESSON)]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blackmind-progress-${toDateKey(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8 no-scrollbar">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gemini-dim text-[10px] font-bold uppercase tracking-[0.3em]">
            <BarChart2 size={14} /> {t('progress.subtitle')}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-outfit text-gemini-accent">{t('progress.title')}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setRange(range === 'week' ? 'month' : 'week')}
            className="bg-gemini-surface border border-gemini-border rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gemini-dim hover:text-gemini-accent hover:border-gemini-accent transition-all"
          >
            {range === 'week' ? t('progress.month') : t('days.week')}
          </button>
          <button onClick={handleExport} className="bg-gemini-accent text-gemini-bg rounded-full px-6 py-2 text-[10px] font-bold uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">{t('common.export')}</button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label={t('progress.courses')} value={startedCourses} />
        <StatCard icon={Clock} label={t('progress.hours')} value={`${totalHours.toFixed(1)}h`} />
        <StatCard icon={Award} label={t('progress.certificates')} value={certificates} />
        <StatCard icon={Calendar} label={t('progress.streak')} value={`${streak}${language === 'fr' ? 'j' : 'd'}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-card p-8 rounded-3xl border-gemini-border space-y-6 bg-gemini-surface/50 shadow-2xl">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gemini-dim">{t('progress.dailyActivity')}</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: dimColor, fontSize: 10 }} interval={range === 'month' ? 3 : 0} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: dimColor, fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF', border: `1px solid ${borderColor}`, borderRadius: '12px', fontSize: 10 }}
                  itemStyle={{ color: accentColor }}
                />
                <Bar dataKey="hours" fill={accentColor} radius={[2, 2, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 rounded-3xl border-gemini-border space-y-6 bg-gemini-surface/50 shadow-2xl">

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gemini-dim">{t('progress.goals')}</h3>
            <button onClick={() => setIsGoalModalOpen(true)} className="text-[10px] font-bold uppercase tracking-widest text-gemini-accent flex items-center gap-1 hover:bg-gemini-accent/10 px-2 py-1 rounded-lg transition-colors">
              <Plus size={12} /> {t('progress.addGoal')}
            </button>
          </div>

          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor} />
                <defs>
                  <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accentColor} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: dimColor, fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF', border: `1px solid ${borderColor}`, borderRadius: '12px', fontSize: 10 }}
                />
                <Area type="monotone" dataKey="progress" stroke={accentColor} fillOpacity={1} fill="url(#colorProg)" strokeWidth={2} opacity={0.7} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4 pt-4 border-t border-gemini-border">
            {weeklyGoals.length === 0 && (
              <p className="text-xs text-gemini-dim text-center py-2">{t('progress.noGoals')}</p>
            )}
            {weeklyGoals.map(goal => {
              const current = goal.unit === 'lessons' ? thisWeekLessons : thisWeekMinutes;
              const pct = Math.min(100, Math.round((current / goal.target) * 100));
              return (
                <div key={goal.id} className="space-y-2 group">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-gemini-text truncate">{goal.title}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={pct >= 100 ? 'text-emerald-500' : 'text-gemini-accent'}>{pct}%</span>
                      <button onClick={() => removeWeeklyGoal(goal.id)} className="opacity-0 group-hover:opacity-100 text-gemini-dim hover:text-red-500 transition-all">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-gemini-bg rounded-full overflow-hidden border border-gemini-border">
                    <div className={`h-full transition-all duration-500 ${pct >= 100 ? 'bg-emerald-500' : 'bg-gemini-accent'}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {isGoalModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsGoalModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-gemini-surface border border-gemini-border rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 space-y-6">
              <div className="w-16 h-16 bg-gemini-accent/10 text-gemini-accent rounded-full flex items-center justify-center mx-auto border border-gemini-accent/20">
                <BadgeCheck size={32} />
              </div>
              <div className="space-y-1 text-center">
                <h3 className="text-2xl font-bold font-outfit text-gemini-text">{t('progress.addGoal')}</h3>
              </div>
              <div className="space-y-4">
                <input
                  autoFocus
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddGoal(); }}
                  placeholder={t('progress.newGoalTitlePlaceholder')}
                  className="w-full px-5 py-4 bg-gemini-bg border border-gemini-border rounded-2xl text-sm text-gemini-text placeholder:text-gemini-dim/60 focus:border-gemini-accent outline-none transition-all"
                />
                <div className="flex gap-3">
                  <input
                    type="number"
                    min={1}
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    className="flex-1 px-5 py-4 bg-gemini-bg border border-gemini-border rounded-2xl text-sm text-gemini-text focus:border-gemini-accent outline-none transition-all"
                  />
                  <div className="flex bg-gemini-bg border border-gemini-border rounded-2xl p-1 shrink-0">
                    <button onClick={() => setGoalUnit('lessons')} className={`px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${goalUnit === 'lessons' ? 'bg-gemini-accent text-gemini-bg' : 'text-gemini-dim'}`}>{t('progress.lessons')}</button>
                    <button onClick={() => setGoalUnit('hours')} className={`px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${goalUnit === 'hours' ? 'bg-gemini-accent text-gemini-bg' : 'text-gemini-dim'}`}>{t('progress.hours')}</button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsGoalModalOpen(false)}
                  className="flex-1 px-6 py-4 bg-gemini-bg border border-gemini-border rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gemini-text hover:bg-gemini-surface transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleAddGoal}
                  disabled={!goalTitle.trim()}
                  className="flex-1 px-6 py-4 bg-gemini-accent text-gemini-bg rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 shadow-lg active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
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

export default ProgressPage;
