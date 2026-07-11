import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, MicOff, Volume2, Sparkles, Loader2, Brain, AlertCircle } from 'lucide-react';
import { connectLiveAssistant } from '../services/liveService';

interface LiveAssistantOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const LiveAssistantOverlay: React.FC<LiveAssistantOverlayProps> = ({ isOpen, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{ text: string, isInput: boolean }[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const assistantRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      handleStart();
    } else {
      handleStop();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptions]);

  const handleStart = () => {
    setIsConnecting(true);
    setError(null);
    setTranscriptions([]);
    
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    nextStartTimeRef.current = 0;

    // Passing audioContextRef.current as the required second argument
    assistantRef.current = connectLiveAssistant({
      onOpen: () => {
        setIsConnecting(false);
        setIsActive(true);
      },
      onAudioData: (buffer) => {
        if (!audioContextRef.current) return;
        
        const ctx = audioContextRef.current;
        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(nextStartTimeRef.current);
        
        nextStartTimeRef.current += buffer.duration;
        sourcesRef.current.add(source);
        source.onended = () => sourcesRef.current.delete(source);
      },
      onInterrupted: () => {
        sourcesRef.current.forEach(s => s.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;
      },
      onTranscription: (text, isInput) => {
        setTranscriptions(prev => [...prev, { text, isInput }]);
      },
      onClose: () => {
        setIsActive(false);
        setIsConnecting(false);
      },
      onError: (e) => {
        console.error("Live API Error", e);
        setIsConnecting(false);
        setIsActive(false);
        
        let msg = "Une erreur est survenue.";
        const errorStr = String(e?.message || e);
        
        if (errorStr.includes("Permission denied") || errorStr.includes("NotAllowedError")) {
          msg = "Accès au micro refusé. Veuillez autoriser le microphone dans votre navigateur.";
        } else if (errorStr.includes("NotFoundError")) {
          msg = "Aucun microphone détecté sur cet appareil.";
        } else if (errorStr.includes("check HTTPS")) {
          msg = "Connexion sécurisée (HTTPS) requise pour le micro.";
        }
        
        setError(msg);
      }
    }, audioContextRef.current as AudioContext);
  };

  const handleStop = () => {
    if (assistantRef.current) {
      assistantRef.current.stop();
      assistantRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsActive(false);
    setIsConnecting(false);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="relative w-full max-w-2xl flex flex-col items-center gap-12 p-8">
        <button 
          onClick={onClose}
          className="absolute -top-16 right-0 p-3 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-all"
        >
          <X size={32} />
        </button>

        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className={`w-32 h-32 rounded-full bg-white flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.2)] transition-all duration-700 ${isActive ? 'scale-110' : error ? 'bg-red-500 scale-100' : 'scale-100'}`}>
              {isConnecting ? (
                <Loader2 size={48} className="text-black animate-spin" />
              ) : isActive ? (
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 bg-black rounded-full animate-pulse" 
                      style={{ 
                        height: `${20 + Math.random() * 40}px`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              ) : error ? (
                <AlertCircle size={48} className="text-white" />
              ) : (
                <MicOff size={48} className="text-neutral-300" />
              )}
            </div>
            {isActive && (
              <div className="absolute -inset-4 border-2 border-white/20 rounded-full animate-ping opacity-20" />
            )}
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold font-outfit text-white">
              {isConnecting ? "Connexion..." : isActive ? "En ligne" : error ? "Erreur" : "Hors ligne"}
            </h2>
            <p className="text-neutral-500 text-sm uppercase tracking-[0.2em] font-bold">
              {error ? error : "Gemini 2.5 Native Audio"}
            </p>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="w-full h-64 bg-white/5 border border-white/10 rounded-[2.5rem] p-6 overflow-y-auto no-scrollbar space-y-4 shadow-2xl"
        >
          {transcriptions.length === 0 && !isConnecting && !error && (
            <div className="h-full flex flex-col items-center justify-center text-neutral-600 gap-4 opacity-50">
              <Brain size={32} />
              <p className="text-sm font-medium">Parlez pour commencer la conversation...</p>
            </div>
          )}
          
          {error && (
            <div className="h-full flex flex-col items-center justify-center text-red-400 gap-4">
              <AlertCircle size={32} />
              <p className="text-sm font-bold text-center max-w-xs">{error}</p>
              <button onClick={handleStart} className="px-4 py-2 bg-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all">
                Réessayer
              </button>
            </div>
          )}

          {transcriptions.map((t, i) => (
            <div key={i} className={`flex flex-col ${t.isInput ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${t.isInput ? 'bg-white text-black font-medium' : 'bg-neutral-800 text-white'}`}>
                {t.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={isActive ? handleStop : handleStart}
            className={`p-6 rounded-full transition-all duration-300 shadow-2xl ${isActive ? 'bg-red-500 text-white' : 'bg-white text-black'}`}
            disabled={isConnecting}
          >
            {isActive ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
        </div>
        
        <div className="flex items-center gap-2 text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
          <Sparkles size={12} /> IA Native Voice Technology
        </div>
      </div>
    </div>
  );
};

export default LiveAssistantOverlay;
