
import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Calendar, Award, Clock, BookOpen, BarChart2 } from 'lucide-react';
import { useCourseContext } from '../store/useCourseStore';
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

const ProgressPage: React.FC = () => {

  const [goals, setGoals] = useState([
    { id: 1, title: 'Terminer 2 modules', progress: 50 },
    { id: 2, title: 'Étudier 5 heures', progress: 80 }
  ]);

  const handleAddGoal = () => {
    const title = window.prompt('Nouvel objectif hebdomadaire :');
    if (title) {
      setGoals([...goals, { id: Date.now(), title, progress: 0 }]);
    }
  };

  const { t } = useCourseContext();
  const { language } = useLanguage();
  const isDarkMode = document.documentElement.classList.contains('dark');
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--gemini-accent').trim();
  const dimColor = getComputedStyle(document.documentElement).getPropertyValue('--gemini-dim').trim();
  const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--gemini-border').trim();

    const data = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', day: 'numeric' });
    const today = new Date();
    return [6, 5, 4, 3, 2, 1, 0].map(daysAgo => {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      return {
        name: formatter.format(d).replace(/\./g, ''), // e.g. "dim 12"
        hours: Math.floor(Math.random() * 5 * 10) / 10 + 1
      };
    });
  }, [language]);

  const activityData = useMemo(() => [
    { name: `${t('days.week')} 1`, progress: 20 },
    { name: `${t('days.week')} 2`, progress: 45 },
    { name: `${t('days.week')} 3`, progress: 60 },
    { name: `${t('days.week')} 4`, progress: 85 },
  ], [t]);

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
          <button className="bg-gemini-surface border border-gemini-border rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gemini-dim">{t('progress.month')}</button>
          <button className="bg-gemini-accent text-gemini-bg rounded-full px-6 py-2 text-[10px] font-bold uppercase tracking-widest shadow-xl">{t('common.export')}</button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label={t('progress.courses')} value="8" />
        <StatCard icon={Clock} label={t('progress.hours')} value="42.5h" />
        <StatCard icon={Award} label={t('progress.certificates')} value="3" />
        <StatCard icon={Calendar} label={t('progress.streak')} value="12j" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-card p-8 rounded-3xl border-gemini-border space-y-6 bg-gemini-surface/50 shadow-2xl">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gemini-dim">{t('progress.dailyActivity')}</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: dimColor, fontSize: 10 }} />
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
            <button onClick={handleAddGoal} className="text-[10px] font-bold uppercase tracking-widest text-gemini-accent flex items-center gap-1 hover:bg-gemini-accent/10 px-2 py-1 rounded-lg transition-colors">
              <Plus size={12} /> Ajouter un objectif
            </button>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor} />
                <defs>
                  <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accentColor} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF', border: `1px solid ${borderColor}`, borderRadius: '12px', fontSize: 10 }}
                />
                <Area type="monotone" dataKey="progress" stroke={accentColor} fillOpacity={1} fill="url(#colorProg)" strokeWidth={2} opacity={0.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4 pt-4 border-t border-gemini-border">
            {goals.map(goal => (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-gemini-text">{goal.title}</span>
                  <span className="text-gemini-accent">{goal.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-gemini-bg rounded-full overflow-hidden border border-gemini-border">
                  <div className="h-full bg-gemini-accent transition-all duration-500" style={{ width: `${goal.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
