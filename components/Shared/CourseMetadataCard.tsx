import React from 'react';
import { Layers, Target, Brain, Clock, Zap, Accessibility, LayoutTemplate, Volume2, MessageSquare, BoxSelect } from 'lucide-react';

interface CourseMetadataCardProps {
  data: any;
  t: any;
  className?: string;
}

const CourseMetadataCard: React.FC<CourseMetadataCardProps> = ({ data, t, className = "" }) => {
  if (!data) return null;
  
  return (
    <div className={`bg-gemini-surface/40 backdrop-blur-xl border border-gemini-border rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700 ${className}`}>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gemini-accent text-gemini-bg rounded-2xl flex items-center justify-center shadow-lg">
          <Layers size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold font-outfit text-gemini-accent">{data.moduleTitle || "Aperçu du cours"}</h3>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gemini-dim">Présentation du Module</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gemini-accent">
              <Target size={14} /> Objectifs pédagogiques
            </div>
            <ul className="space-y-2">
              {data.objectives?.map((obj: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gemini-dim leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-gemini-accent/40 mt-1.5 shrink-0" />
                  {obj}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gemini-accent">
              <Brain size={14} /> Prérequis
            </div>
            <div className="flex flex-wrap gap-2">
              {data.prerequisites?.map((pre: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-gemini-bg border border-gemini-border rounded-lg text-xs text-gemini-dim font-medium">
                  {pre}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gemini-bg/50 p-4 rounded-2xl border border-gemini-border">
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gemini-dim mb-1">
                <Clock size={12} /> Durée estimée
              </div>
              <p className="text-lg font-bold text-gemini-accent">{data.duration}</p>
            </div>
            <div className="bg-gemini-bg/50 p-4 rounded-2xl border border-gemini-border">
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gemini-dim mb-1">
                <Zap size={12} /> Niveau
              </div>
              <p className="text-lg font-bold text-gemini-accent">{data.level}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gemini-accent">
              <Accessibility size={14} /> Indications accessibilité
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div 
                title={t('settings.accessibility.falc')}
                className={`flex items-center justify-center p-3 rounded-xl border transition-all ${data.accessibility?.simplified ? 'bg-gemini-accent/10 border-gemini-accent/20 text-gemini-accent' : 'bg-gemini-bg border-gemini-border text-gemini-dim opacity-30'}`}
              >
                <LayoutTemplate size={20} />
              </div>
              <div 
                title={t('settings.accessibility.audioReading')}
                className={`flex items-center justify-center p-3 rounded-xl border transition-all ${data.accessibility?.audio ? 'bg-gemini-accent/10 border-gemini-accent/20 text-gemini-accent' : 'bg-gemini-bg border-gemini-border text-gemini-dim opacity-30'}`}
              >
                <Volume2 size={20} />
              </div>
              <div 
                title="Sous-titres disponibles"
                className={`flex items-center justify-center p-3 rounded-xl border transition-all ${data.accessibility?.subtitles ? 'bg-gemini-accent/10 border-gemini-accent/20 text-gemini-accent' : 'bg-gemini-bg border-gemini-border text-gemini-dim opacity-30'}`}
              >
                <MessageSquare size={20} />
              </div>
              <div 
                title="Expérience Réalité Augmentée"
                className={`flex items-center justify-center p-3 rounded-xl border transition-all ${data.accessibility?.ar ? 'bg-gemini-accent/10 border-gemini-accent/20 text-gemini-accent' : 'bg-gemini-bg border-gemini-border text-gemini-dim opacity-30'}`}
              >
                <BoxSelect size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseMetadataCard;