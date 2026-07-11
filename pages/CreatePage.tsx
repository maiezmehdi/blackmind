import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Send, 
  Sparkles, 
  Eye,
  EyeOff,
  MessageSquare, 
  MoreHorizontal, 
  Plus, 
  Trash2, 
  List, 
  Brain, 
  Maximize, 
  Minimize, 
  Save, 
  Undo2, 
  Rocket, 
  Loader2, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Type as TypeIcon, 
  X, 
  Copy, 
  CheckCircle2, 
  Bold, 
  Italic, 
  Code as CodeIcon, 
  Link as LinkIcon, 
  Heading1, 
  Heading2, 
  Heading3, 
  Lightbulb, 
  Share2, 
  Users, 
  Upload, 
  AlertTriangle, 
  Key, 
  FileText, 
  Languages, 
  HelpCircle, 
  Layers, 
  Mic, 
  Volume2, 
  Play, 
  ClipboardCheck, 
  Zap, 
  GripVertical,
  CheckSquare,
  Globe,
  ShoppingBag,
  Briefcase,
  MicOff,
  Download,
  ArrowRight,
  ArrowUpRight,
  Dumbbell,
  Terminal,
  Store,
  Monitor,
  Layout,
  BoxSelect,
  ArrowUp,
  ArrowDown,
  FolderPlus,
  Clock,
  Target,
  Accessibility,
  Mail,
  FileDown,
  History,
  Search,
  UserPlus,
  ChevronDown,
  ChevronUp,
  AlignLeft,
  AlignCenter,
  Maximize2,
  Minimize2,
  FileSearch,
  UserCheck,
  MessageCircle,
  Smile,
  GraduationCap,
  Megaphone,
  BookOpen, Calendar,
  XCircle,
  ListChecks,
  Highlighter,
  AlertCircle,
  LayoutTemplate,
  Cloud,
  User,
  Camera
} from 'lucide-react';
import { marked } from 'marked';
import { generateCourseStructure, generateStorytellingStructure, refineContent, generateAiBlock } from '../services/geminiService';
import { exportCoursePdf, exportCourseDocx } from '../services/exportService';
import { makeGradientCover } from '../services/coverImage';
import { Course, Module, Lesson, ContentBlock, BlockType, UserProfile, WorkspaceMember } from '../types';
import { useCourseContext } from '../store/useCourseStore';
import ArModelBlock from '../components/ArModelBlock';
import RabbitLogo from '../components/Layout/RabbitLogo';

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

const CourseMetadataCard: React.FC<{ data: any, t: any }> = ({ data, t }) => {
  if (!data) return null;
  
  return (
    <div className="bg-gemini-surface/40 backdrop-blur-xl border border-gemini-border rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gemini-accent text-gemini-bg rounded-2xl flex items-center justify-center shadow-lg">
          <Layers size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold font-outfit text-gemini-accent">{data.moduleTitle || "Aperçu du cours"}</h3>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gemini-dim">{t('overview.moduleIntro')}</p>
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

interface CreatePageProps {}

const CreatePage: React.FC<CreatePageProps> = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addCourse, updateCourse, deleteCourse, courses, workspaces, sendInvitation, currentUser, t } = useCourseContext();
  const [view, setView] = useState<'chat' | 'preview'>('chat');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // AI Prompt Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiModalConfig, setAiModalConfig] = useState<{
    action: string;
    targetType: BlockType | 'refine' | 'cover' | 'overview' | 'chat-image';
    modId?: string;
    lesId?: string;
    blockId?: string;
    placeholder: string;
    title: string;
  } | null>(null);
  const [aiModalInput, setAiModalInput] = useState('');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Google Import State
  const [isGoogleImportModalOpen, setIsGoogleImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    type: 'module' | 'lesson' | 'block' | 'course';
    params: any;
  }>({ show: false, type: 'module', params: {} });

  // Translation State
  const [targetLang, setTargetLang] = useState('fr');
  const [targetLocale, setTargetLocale] = useState('none');

  // Menu Modal states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'docx' | null>(null);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [wsSearchTerm, setWsSearchTerm] = useState('');
  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isToolbarLoading, setIsToolbarLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: t('create.welcome'), timestamp: new Date() }
  ]);
  const [generatedCourse, setGeneratedCourse] = useState<Course | null>(null);
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set());
  const [isPublished, setIsPublished] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [speakingMessageIdx, setSpeakingMessageIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedText, setSelectedText] = useState('');
  const [selectionContext, setSelectionContext] = useState<{ modId: string, lesId: string, blockId: string } | null>(null);
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });
  const [showToolbar, setShowToolbar] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isChatOptionsOpen, setIsChatOptionsOpen] = useState(false);
  const [isStorytellingMode, setIsStorytellingMode] = useState(false);
  const [contentLanguage, setContentLanguage] = useState("fr");
  const [generatedStory, setGeneratedStory] = useState<any>(null);

  // Refinement Dropdown State
  const [activeRefinementMenu, setActiveRefinementMenu] = useState<{ type: 'block' | 'selection', id?: string } | null>(null);

  const recognitionRef = useRef<any>(null);
  const promptBeforeVoiceRef = useRef<string>('');

  const canvasRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const refinementDropdownRef = useRef<HTMLDivElement>(null);
  const chatOptionsRef = useRef<HTMLDivElement>(null);

  // Mock Google Drive Documents
  const mockGDocs = [
    { id: 'gd-1', title: 'Cours - Introduction à la Cytologie.docx', lastModified: '2 jours' },
    { id: 'gd-2', title: 'Plan de formation IA et Ethique.gdoc', lastModified: '1 semaine' },
    { id: 'gd-3', title: 'Notes Masterclass UX 2025.pdf', lastModified: 'Aujourd\'hui' },
    { id: 'gd-4', title: 'Syllabus Management Agile.docx', lastModified: 'Hier' }
  ];

  // Automatic Saving Logic
  useEffect(() => {
    if (generatedCourse) {
      const timeoutId = setTimeout(() => {
        addCourse(generatedCourse);
        setLastSaved(new Date());
        setShowSaveIndicator(true);
      }, 2000); 
      return () => clearTimeout(timeoutId);
    }
  }, [generatedCourse, addCourse]);

  // Timer to hide save indicator after 15 seconds
  useEffect(() => {
    if (showSaveIndicator) {
      const timer = setTimeout(() => {
        setShowSaveIndicator(false);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [showSaveIndicator, lastSaved]);

  const appliedRemixIdRef = useRef<string | null>(null);
  useEffect(() => {
    const remixId = searchParams.get('remixId');
    if (remixId && remixId !== appliedRemixIdRef.current && courses.length > 0) {
      const courseToRemix = courses.find(c => c.id === remixId);
      if (courseToRemix) {
        appliedRemixIdRef.current = remixId; // avoid duplicate welcome on auto-save re-renders
        setGeneratedCourse(courseToRemix);
        setMessages(prev => [...prev, { role: 'assistant', content: t('create.remixActivated', { title: courseToRemix.title }) }]);
      }
    }
  }, [searchParams, courses]);

  // Pre-fill the prompt from the Home hero / discovery cards (?prompt=...)
  useEffect(() => {
    const initialPrompt = searchParams.get('prompt');
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
    // Only on first mount / when the query param changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (canvasRef.current && (window as any).renderMathInElement) {
      setTimeout(() => {
        if(canvasRef.current) {
          (window as any).renderMathInElement(canvasRef.current, {
            delimiters: [
              {left: '$$', right: '$$', display: true},
              {left: '$', right: '$', display: false},
              {left: '\\(', right: '\\)', display: false},
              {left: '\\[', right: '\\]', display: true}
            ],
            throwOnError: false
          });
        }
      }, 500);
    }
  }, [generatedCourse, view]);

  useEffect(() => {
    if (isLiveMode) {
      startLiveSession();
    } else {
      stopLiveSession();
    }
    return () => stopLiveSession();
  }, [isLiveMode]);

  // Voice input via the browser's free Web Speech API (speech-to-text).
  // Transcribes what you say into the chat composer — create a course by
  // voice, no API key, no quota, no billing.
  const startLiveSession = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setMessages(prev => [...prev, { role: 'assistant', content: t('create.voiceUnsupported') }]);
      setIsLiveMode(false);
      return;
    }
    const recognition = new SR();
    recognition.lang = contentLanguage === 'en' ? 'en-US' : 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = true;
    promptBeforeVoiceRef.current = prompt ? prompt.trim() + ' ' : '';

    recognition.onresult = (event: any) => {
      let finalText = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += chunk;
        else interim += chunk;
      }
      if (finalText) promptBeforeVoiceRef.current += finalText + ' ';
      setPrompt((promptBeforeVoiceRef.current + interim).trimStart());
    };
    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') console.error('[speech]', e.error);
      setIsLiveMode(false);
    };
    recognition.onend = () => setIsLiveMode(false);

    recognitionRef.current = recognition;
    try { recognition.start(); } catch { /* already started */ }
  };

  const stopLiveSession = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  };

  // Read a message aloud with the browser's free speech synthesis (no API).
  const handlePlayMessage = (index: number, content: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speakingMessageIdx === index) {
      synth.cancel();
      setSpeakingMessageIdx(null);
      return;
    }
    synth.cancel();
    // strip markdown so it reads naturally
    const text = content.replace(/[#*`_>[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = contentLanguage === 'en' ? 'en-US' : 'fr-FR';
    utter.onend = () => setSpeakingMessageIdx(null);
    utter.onerror = () => setSpeakingMessageIdx(null);
    setSpeakingMessageIdx(index);
    synth.speak(utter);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (actionMenuRef.current && !actionMenuRef.current.contains(target)) setIsActionMenuOpen(false);
      if (showToolbar && toolbarRef.current && toolbarRef.current.contains(target)) return;
      if (showToolbar && canvasRef.current && !canvasRef.current.contains(target)) setShowToolbar(false);
      if (activeRefinementMenu && refinementDropdownRef.current && !refinementDropdownRef.current.contains(target)) {
        const isToggleButton = (target as HTMLElement).closest('.refinement-toggle');
        if (!isToggleButton) setActiveRefinementMenu(null);
      }
      if (chatOptionsRef.current && !chatOptionsRef.current.contains(target)) {
        setIsChatOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showToolbar, activeRefinementMenu, isActionMenuOpen]);

  
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport && document.activeElement && document.activeElement.tagName === 'DIV' && document.activeElement.hasAttribute('contenteditable')) {
        const viewportHeight = window.visualViewport.height;
        const rect = document.activeElement.getBoundingClientRect();
        
        // If element is below the visible viewport, scroll it up
        if (rect.bottom > viewportHeight) {
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.scrollBy({
              top: rect.bottom - viewportHeight + 20,
              behavior: 'smooth'
            });
          }
        }
      }
    };
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }
  }, []);

  const handleOpenSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setError(null);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: t('create.welcome'), timestamp: new Date() }]);
  };


  const handleExportStory = () => {
    if (!generatedStory) return;
    let text = `# ${generatedStory.title}\n\n`;
    text += `**Logline:** ${generatedStory.logline}\n\n`;
    text += `---\n\n`;
    
    generatedStory.scenes?.forEach((scene: any, idx: number) => {
      text += `## Scene ${idx + 1}: ${scene.title}\n`;
      text += `**Setting:** ${scene.setting}\n\n`;
      text += `${scene.action}\n\n`;
      if (scene.characters && scene.characters.length > 0) {
        text += `**Characters:** ${scene.characters.join(', ')}\n\n`;
      }
      text += `---\n\n`;
    });

    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedStory.title.replace(/\s+/g, '_').toLowerCase()}_script.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateCourse = async (customPrompt?: string) => {
    const activePrompt = customPrompt || prompt;
    if (!activePrompt.trim()) return;
    
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: activePrompt, timestamp: new Date() }]);
    setIsGenerating(true);
    if (!customPrompt) setPrompt('');

    try {
      if (isStorytellingMode) {
        const response = await generateStorytellingStructure(activePrompt, isThinkingMode, contentLanguage);
        const cleanResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();
        let responseData = JSON.parse(cleanResponse);
        setGeneratedCourse(null);
        setGeneratedStory(responseData);
        setMessages(prev => [...prev, { role: 'assistant', content: t('create.storyGenerated', { count: responseData.modules.length }), suggestions: ["__ACTION_PREVIEW__"], timestamp: new Date() }]);
      } else {
        const response = await generateCourseStructure(activePrompt, isThinkingMode, contentLanguage);
        const cleanResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();
        let responseData = JSON.parse(cleanResponse);

        const courseData = responseData.course || responseData;
        const commentary = responseData.commentary || "Architecture générée.";
        const suggestions = responseData.suggestions || [];

        // Failed generation returns an empty "Erreur" course — surface a clear
        // message instead of creating a broken course in the workspace.
        if (!courseData || courseData.title === 'Erreur' || !Array.isArray(courseData.modules) || courseData.modules.length === 0) {
          setMessages(prev => [...prev, { role: 'assistant', content: t('create.quotaError'), timestamp: new Date() }]);
          setIsGenerating(false);
          return;
        }

        const newCourse: Course = {
          id: Math.random().toString(36).substr(2, 9),
          ...courseData,
          image: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200`,
          progress: 0,
          author: currentUser?.name || 'Anonyme',
          category: courseData.category || 'Général',
          collaborators: []
        };

        setGeneratedStory(null);
        setGeneratedCourse(newCourse);
        setIsPublished(false);
        setMessages(prev => [...prev, { role: 'assistant', content: commentary, suggestions: [...(suggestions || []), "__ACTION_PREVIEW__"], timestamp: new Date() }]);

        // Generate the course cover right away from the generated content
        // (async, non-blocking — the placeholder stays until the image lands).
        const coverPrompt = `Couverture de cours en ligne : "${newCourse.title}". ${newCourse.description || activePrompt}`;
        setIsGeneratingCover(true);
        const setCover = (src: string) =>
          setGeneratedCourse(prev => (prev && prev.id === newCourse.id ? { ...prev, image: src } : prev));
        const applyCover = (img: any) => {
          if (typeof img === 'string' && img) {
            // Verify the image (Gemini data URL or free Pollinations URL) really
            // loads; fall back to a unique on-brand gradient if it doesn't.
            const test = new Image();
            test.onload = () => { setCover(img); setIsGeneratingCover(false); };
            test.onerror = () => { setCover(makeGradientCover(newCourse.title)); setIsGeneratingCover(false); };
            test.src = img;
          } else {
            setCover(makeGradientCover(newCourse.title));
            setIsGeneratingCover(false);
          }
        };
        generateAiBlock('image', coverPrompt, { aspectRatio: '16:9' })
          .then(applyCover)
          .catch(() => applyCover(null));
      }
    } catch (err: any) {
      setError("Erreur de génération.");
      setMessages(prev => [...prev, { role: 'assistant', content: t('create.generationError'), timestamp: new Date() }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImportGDoc = async (doc: any) => {
    setIsImporting(true);
    // Simulation: Reading the document content
    setTimeout(() => {
       const simulatedImportPrompt = `Basé sur mon document Google Drive "${doc.title}", génère une structure de formation structurée et interactive.`;
       setIsImporting(false);
       setIsGoogleImportModalOpen(false);
       handleGenerateCourse(simulatedImportPrompt);
    }, 1500);
  };

  const handleChatImageGeneration = async (customPrompt: string) => {
    setIsAiGenerating(true);
    try {
      const imageUrl = await generateAiBlock('image', customPrompt, { thinking: isThinkingMode });
      if (imageUrl) {
        setMessages(prev => [...prev, 
          { role: 'user', content: t('create.imagePromptUser', { prompt: customPrompt }), timestamp: new Date() }, 
          { role: 'assistant', content: t('create.imageGenerated'), imageUrl, timestamp: new Date() }
        ]);
      }
      setIsAiModalOpen(false);
    } catch (err) {
      setError("Erreur image.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleGenerateCoverImage = async (customPrompt?: string, size: string = '1K') => {
    if (!generatedCourse) return;
    setIsGeneratingCover(true);
    setIsAiGenerating(true);
    try {
      const imagePrompt = customPrompt || `Educational cover image: "${generatedCourse.title}".`;
      const imageUrl = await generateAiBlock('image', imagePrompt, { 
        thinking: isThinkingMode, 
        imageSize: size,
        aspectRatio: '16:9'
      });
      if (imageUrl) {
        setGeneratedCourse(prev => prev ? { ...prev, image: imageUrl } : null);
      }
      setIsAiModalOpen(false);
    } catch (err) {
      setError("Erreur image.");
    } finally {
      setIsGeneratingCover(false);
      setIsAiGenerating(false);
    }
  };

  const handleRefineSelection = async (action: string, customInput?: string) => {
    if (!selectionContext || !generatedCourse) return;
    const textToRefine = selectedText.trim();
    if (!textToRefine) return;

    setIsToolbarLoading(true);
    setIsAiGenerating(true);
    try {
      const refineAction = customInput ? customInput : action;
      const refinedText = await refineContent(textToRefine, refineAction, isThinkingMode);
      
      const updatedModules = generatedCourse.modules.map(mod => {
        if (mod.id !== selectionContext.modId) return mod;
        return {
          ...mod,
          lessons: mod.lessons.map(lesson => {
            if (lesson.id !== selectionContext.lesId) return lesson;
            return {
              ...lesson,
              content: lesson.content.map(b => {
                if (b.id !== selectionContext.blockId) return b;
                let newValue = b.value;
                if (typeof b.value === 'string' && selectedText) {
                  newValue = b.value.replace(selectedText, refinedText);
                } else {
                  newValue = refinedText;
                }
                return { ...b, value: newValue };
              })
            };
          })
        };
      });
      setGeneratedCourse({ ...generatedCourse, modules: updatedModules });
      setShowToolbar(false);
      setIsAiModalOpen(false);
      setActiveRefinementMenu(null);
    } catch (err) {
      setError("Raffinement échoué.");
    } finally {
      setIsToolbarLoading(false);
      setIsAiGenerating(false);
    }
  };

  const handleFormatting = (type: 'bold' | 'italic' | 'highlight') => {
    if (!selectionContext || !generatedCourse || !selectedText) return;
    
    let formattedText = selectedText;
    if (type === 'bold') formattedText = `**${selectedText}**`;
    else if (type === 'italic') formattedText = `*${selectedText}*`;
    else if (type === 'highlight') formattedText = `<mark>${selectedText}</mark>`;

    const updatedModules = generatedCourse.modules.map(mod => {
      if (mod.id !== selectionContext.modId) return mod;
      return {
        ...mod,
        lessons: mod.lessons.map(lesson => {
          if (lesson.id !== selectionContext.lesId) return lesson;
          return {
            ...lesson,
            content: lesson.content.map(b => {
              if (b.id !== selectionContext.blockId) return b;
              let newValue = b.value;
              if (typeof b.value === 'string') {
                newValue = b.value.replace(selectedText, formattedText);
              }
              return { ...b, value: newValue };
            })
          };
        })
      };
    });
    setGeneratedCourse({ ...generatedCourse, modules: updatedModules });
    setShowToolbar(false);
  };

  const handleBlockAction = async (modId: string, lesId: string, blockId: string, action: string, customInput?: string) => {
    if (!generatedCourse) return;
    
    if (action === 'delete') {
      setDeleteConfirm({ show: true, type: 'block', params: { modId, lesId, blockId } });
      return;
    }

    if (action === 'move-up' || action === 'move-down') {
      moveBlock(modId, lesId, blockId, action === 'move-up' ? 'up' : 'down');
      return;
    }

    const block = generatedCourse.modules.find(m => m.id === modId)?.lessons.find(l => l.id === lesId)?.content.find(b => b.id === blockId);

    setIsToolbarLoading(true);
    setIsAiGenerating(true);
    try {
      if (action === 'expand' || action === 'improve' || action === 'summarize' || action === 'refine' || action === 'generate-text' || action.startsWith('refine-')) {
        const textToRefine = typeof block?.value === 'string' ? block.value : '';
        const instruction = customInput || action;
        
        const generatedValue = await refineContent(textToRefine, instruction, isThinkingMode);
        
        if (action === 'generate-text') {
          const newBlock: ContentBlock = { id: Math.random().toString(36).substr(2, 9), type: 'text', value: generatedValue };
          const updatedModules = generatedCourse.modules.map(mod => {
            if (mod.id !== modId) return mod;
            return {
              ...mod,
              lessons: mod.lessons.map(lesson => {
                if (lesson.id !== lesId) return lesson;
                let newContent = [...lesson.content];
                if (blockId) {
                  const index = lesson.content.findIndex(b => b.id === blockId);
                  newContent.splice(index + 1, 0, newBlock);
                } else {
                  newContent.push(newBlock);
                }
                return { ...lesson, content: newContent };
              })
            };
          });
          setGeneratedCourse({ ...generatedCourse, modules: updatedModules });
        } else {
          updateBlockValue(modId, lesId, blockId, generatedValue);
        }
      } else if (action === 'generate-image' || action === 'generate-exercise' || action === 'generate-video' || action === 'generate-quiz') {
        const type = action.split('-')[1] as BlockType;
        const generationPrompt = customInput || (block ? block.value : "Général");
        const generatedValue = await generateAiBlock(type, generationPrompt, { thinking: isThinkingMode });
        
        const newBlock: ContentBlock = { id: Math.random().toString(36).substr(2, 9), type, value: generatedValue };
        const updatedModules = generatedCourse.modules.map(mod => {
          if (mod.id !== modId) return mod;
          return {
            ...mod,
            lessons: mod.lessons.map(lesson => {
              if (lesson.id !== lesId) return lesson;
              let newContent = [...lesson.content];
              if (blockId) {
                const index = lesson.content.findIndex(b => b.id === blockId);
                newContent.splice(index + 1, 0, newBlock);
              } else {
                newContent.push(newBlock);
              }
              return { ...lesson, content: newContent };
            })
          };
        });
        setGeneratedCourse({ ...generatedCourse, modules: updatedModules });
      } else if (action === 'add-ar') {
        const newBlock: ContentBlock = { id: Math.random().toString(36).substr(2, 9), type: 'ar', value: '' };
        const updatedModules = generatedCourse.modules.map(mod => {
          if (mod.id !== modId) return mod;
          return {
            ...mod,
            lessons: mod.lessons.map(lesson => {
              if (lesson.id !== lesId) return lesson;
              let newContent = [...lesson.content];
              if (blockId) {
                const index = lesson.content.findIndex(b => b.id === blockId);
                newContent.splice(index + 1, 0, newBlock);
              } else {
                newContent.push(newBlock);
              }
              return { ...lesson, content: newContent };
            })
          };
        });
        setGeneratedCourse({ ...generatedCourse, modules: updatedModules });
      }
      setIsAiModalOpen(false);
      setActiveRefinementMenu(null);
    } catch (err: any) {
      setError("Action IA échouée.");
    } finally {
      setIsToolbarLoading(false);
      setIsAiGenerating(false);
    }
  };

  const openAiModal = (config: any) => {
    setAiModalConfig(config);
    setAiModalInput('');
    setIsAiModalOpen(true);
    setShowToolbar(false);
  };

  const handleAiModalSubmit = () => {
    if (!aiModalConfig) return;
    const { action, targetType, modId, lesId, blockId } = aiModalConfig;
    
    // Handle Translation specialized logic
    if (action === 'translate') {
      const languageMap: Record<string, string> = {
        fr: "Français", en: "Anglais", es: "Espagnol", pt: "Portugais", de: "Allemand", 
        it: "Italien", zh: "Chinois", ja: "Japonais", ar: "Arabe", ru: "Russe"
      };
      const localeMap: Record<string, string> = {
        france: "France", canada: "Canada", brazil: "Brésil", portugal: "Portugal", 
        usa: "USA", uk: "Royaume-Uni", spain: "Espagne", mexico: "Mexique", none: ""
      };
      
      const langName = languageMap[targetLang];
      const localeName = localeMap[targetLocale];
      const instruction = `Traduire en ${langName}${localeName ? ` (${localeName})` : ''}. Préserve le style et le formatage Markdown.`;
      
      if (targetType === 'refine') handleRefineSelection(instruction);
      else if (modId && lesId) handleBlockAction(modId, lesId, blockId || '', instruction);
      return;
    }

    if (targetType === 'refine') handleRefineSelection(action, aiModalInput);
    else if (targetType === 'cover') handleGenerateCoverImage(aiModalInput, imageSize);
    else if (targetType === 'chat-image') handleChatImageGeneration(aiModalInput);
    else if (modId && lesId) handleBlockAction(modId, lesId, blockId || '', action, aiModalInput);
  };

  const moveModule = (index: number, direction: 'up' | 'down') => {
    if (!generatedCourse) return;
    const newModules = [...generatedCourse.modules];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex >= 0 && swapIndex < newModules.length) {
      [newModules[index], newModules[swapIndex]] = [newModules[swapIndex], newModules[index]];
      setGeneratedCourse({ ...generatedCourse, modules: newModules });
    }
  };

  const toggleModuleCollapse = (moduleId: string) => {
    setCollapsedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const moveLesson = (mIdx: number, lIdx: number, direction: 'up' | 'down') => {
    if (!generatedCourse) return;
    const newModules = [...generatedCourse.modules];
    const lessons = [...newModules[mIdx].lessons];
    const swapIndex = direction === 'up' ? lIdx - 1 : lIdx + 1;
    if (swapIndex >= 0 && swapIndex < lessons.length) {
      [lessons[lIdx], lessons[swapIndex]] = [lessons[swapIndex], lessons[lIdx]];
      newModules[mIdx].lessons = lessons;
      setGeneratedCourse({ ...generatedCourse, modules: newModules });
    }
  };

  const handleAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatedCourse || !newModuleTitle.trim()) return;
    const newModule: Module = {
      id: Math.random().toString(36).substr(2, 9),
      title: newModuleTitle,
      lessons: [{
        id: Math.random().toString(36).substr(2, 9),
        title: "Nouvelle leçon",
        content: []
      }]
    };
    setGeneratedCourse({ ...generatedCourse, modules: [...generatedCourse.modules, newModule] });
    setNewModuleTitle('');
    setIsAddModuleModalOpen(false);
  };

  const deleteModuleActual = (moduleId: string) => {
    if (!generatedCourse) return;
    setGeneratedCourse({ ...generatedCourse, modules: generatedCourse.modules.filter(m => m.id !== moduleId) });
    setDeleteConfirm({ show: false, type: 'module', params: {} });
  };

  const deleteLessonActual = (moduleId: string, lessonId: string) => {
    if (!generatedCourse) return;
    const updatedModules = generatedCourse.modules.map(mod => {
      if (mod.id !== moduleId) return mod;
      return { ...mod, lessons: mod.lessons.filter(l => l.id !== lessonId) };
    });
    setGeneratedCourse({ ...generatedCourse, modules: updatedModules });
    setDeleteConfirm({ show: false, type: 'lesson', params: {} });
  };

  const deleteBlockActual = (moduleId: string, lessonId: string, blockId: string) => {
    if (!generatedCourse) return;
    const updatedModules = generatedCourse.modules.map(mod => {
      if (mod.id !== moduleId) return mod;
      return {
        ...mod,
        lessons: mod.lessons.map(lesson => {
          if (lesson.id !== lessonId) return lesson;
          return { ...lesson, content: lesson.content.filter(block => block.id !== blockId) };
        })
      };
    });
    setGeneratedCourse({ ...generatedCourse, modules: updatedModules });
    setDeleteConfirm({ show: false, type: 'block', params: {} });
  };

  const updateBlockValue = (moduleId: string, lessonId: string, blockId: string, newValue: any) => {
    if (!generatedCourse) return;
    const updatedModules = generatedCourse.modules.map(mod => {
      if (mod.id !== moduleId) return mod;
      return {
        ...mod,
        lessons: mod.lessons.map(lesson => {
          if (lesson.id !== lessonId) return lesson;
          return { ...lesson, content: lesson.content.map(b => b.id === blockId ? { ...b, value: newValue } : b) };
        })
      };
    });
    setGeneratedCourse({ ...generatedCourse, modules: updatedModules });
  };

  const moveBlock = (moduleId: string, lessonId: string, blockId: string, direction: 'up' | 'down') => {
    if (!generatedCourse) return;
    const updatedModules = generatedCourse.modules.map(mod => {
      if (mod.id !== moduleId) return mod;
      return {
        ...mod,
        lessons: mod.lessons.map(lesson => {
          if (lesson.id !== lessonId) return lesson;
          const index = lesson.content.findIndex(b => b.id === blockId);
          if (index === -1) return lesson;
          const newContent = [...lesson.content];
          const swapIndex = direction === 'up' ? index - 1 : index + 1;
          if (swapIndex >= 0 && swapIndex < newContent.length) {
            [newContent[index], newContent[swapIndex]] = [newContent[swapIndex], newContent[index]];
          }
          return { ...lesson, content: newContent };
        })
      };
    });
    setGeneratedCourse({ ...generatedCourse, modules: updatedModules });
  };

  const handleSelection = useCallback((e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      let target = e.target as HTMLElement;
      let blockEl = target.closest('[data-block-id]');
      if (blockEl) {
        const blockId = blockEl.getAttribute('data-block-id') || '';
        const modId = blockEl.getAttribute('data-mod-id') || '';
        const lesId = blockEl.getAttribute('data-les-id') || '';
        setSelectionContext({ modId, lesId, blockId });
      }
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setToolbarPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
      setSelectedText(selection.toString());
      setShowToolbar(true);
    } else if (!isToolbarLoading) {
      setTimeout(() => {
        const activeSel = window.getSelection();
        if (!activeSel || activeSel.toString().trim().length === 0) setShowToolbar(false);
      }, 100);
    }
  }, [isToolbarLoading]);

  const handleDeleteCourseAction = () => {
    setDeleteConfirm({ show: true, type: 'course', params: {}, title: generatedCourse?.title || '' });
  };

  const handlePublish = () => {
    if (!generatedCourse) return;
    addCourse(generatedCourse);
    setIsPublished(true);
    setIsActionMenuOpen(false);
    setTimeout(() => navigate(`/learn/${generatedCourse.id}`), 2000);
  };

  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter(ws => ws.name.toLowerCase().includes(wsSearchTerm.toLowerCase()));
  }, [workspaces, wsSearchTerm]);

  const allSuggestedContacts = useMemo(() => {
    const contactsMap = new Map<string, UserProfile>();
    workspaces.forEach(ws => {
      ws.members.forEach(member => {
        if (member.userId !== currentUser?.id) {
          contactsMap.set(member.userId, member.profile);
        }
      });
    });
    return Array.from(contactsMap.values());
  }, [workspaces, currentUser]);

  const refinementActions = useMemo(() => [
    { id: 'expand', label: t('create.toolbar.actions.expand'), icon: Maximize2, prompt: "Développer ce paragraphe pour le rendre plus détaillé et complet." },
    { id: 'shorten', label: t('create.toolbar.actions.shorten'), icon: Minimize2, prompt: "Raccourcir ce texte pour le rendre plus concis et percutant." },
    { id: 'simplify', label: t('create.toolbar.actions.simplify'), icon: FileSearch, prompt: "Simplifier ce texte pour un niveau débutant, en utilisant un langage clair et accessible." },
    { id: 'expert', label: t('create.toolbar.actions.expert'), icon: UserCheck, prompt: "Réécrire ce texte pour un niveau expert, en utilisant une terminologie avancée et des concepts approfondis." },
    { id: 'clarity', label: t('create.toolbar.actions.clarity'), icon: AlignLeft, prompt: "Améliorer la clarté et la fluidité de ce texte." },
    { id: 'grammar', label: t('create.toolbar.actions.grammar'), icon: CheckSquare, prompt: "Corriger la grammaire, l'orthographe et le style de ce texte." },
    { id: 'friendly', label: t('create.toolbar.actions.friendly'), icon: Smile, prompt: "Réécrire ce texte avec un ton amical et encourageant." },
    { id: 'academic', label: t('create.toolbar.actions.academic'), icon: GraduationCap, prompt: "Réécrire ce texte avec un ton académique et formel." },
    { id: 'persuasive', label: t('create.toolbar.actions.persuasive'), icon: Megaphone, prompt: "Réécrire ce texte avec un ton persuasif et convaincant." },
    { id: 'storytelling', label: t('create.toolbar.actions.storytelling'), icon: BookOpen, prompt: "Réécrire ce texte sous forme de storytelling narratif." },
    { id: 'engaging', label: t('create.toolbar.actions.engaging'), icon: Sparkles, prompt: "Rendre ce texte plus engageant et interactif." },
    { id: 'examples', label: t('create.toolbar.actions.examples'), icon: ListChecks, prompt: "Ajouter des exemples concrets et illustratifs à ce texte." },
    { id: 'analogies', label: t('create.toolbar.actions.analogies'), icon: Brain, prompt: "Ajouter des analogies pour aider à comprendre les concepts complexes." },
    { id: 'counterexamples', label: t('create.toolbar.actions.counterexamples'), icon: XCircle, prompt: "Ajouter des contre-exemples pour clarifier ce que le concept n'est pas." },
    { id: 'translate', label: t('create.toolbar.actions.translate'), icon: Globe, prompt: "Ouvrir les options de traduction." },
  ], [t]);

  const RefinementDropdown = ({ type, id, onAction }: { type: 'block' | 'selection', id?: string, onAction: (id: string, prompt: string) => void }) => (
    <div 
      ref={refinementDropdownRef}
      className={`absolute z-[120] bg-gemini-surface border border-gemini-border rounded-2xl shadow-2xl py-2 w-56 md:w-64 max-w-[calc(100vw-1.5rem)] animate-in fade-in zoom-in-95 duration-200 overflow-hidden ${type === 'block' ? 'top-10 left-1/2 -ml-28 md:ml-0 md:left-auto md:right-0' : 'left-0 top-full mt-2'}`}
    >
      <div className="px-4 py-2 border-b border-gemini-border mb-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gemini-dim">Actions IA</p>
      </div>
      <div className="max-h-80 overflow-y-auto no-scrollbar">
        {refinementActions.map((act) => (
          <button 
            key={act.id}
            onClick={() => {
              if (act.id === 'translate') {
                if (type === 'selection') {
                  openAiModal({ title: t('create.toolbar.translate'), action: "translate", targetType: "refine", modId: selectionContext?.modId, lesId: selectionContext?.lesId, placeholder: "" });
                } else {
                  const [mId, lId, bId] = id?.split(':') || [];
                  openAiModal({ title: t('create.toolbar.translate'), action: "translate", targetType: "refine", modId: mId, lesId: lId, blockId: bId, placeholder: "" });
                }
                setActiveRefinementMenu(null);
                return;
              }
              onAction(act.id, act.prompt);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gemini-bg text-left group transition-colors"
          >
            <act.icon size={16} className="text-gemini-dim group-hover:text-gemini-accent" />
            <span className="text-xs font-medium text-gemini-text group-hover:text-gemini-accent">{act.label}</span>
          </button>
        ))}
      </div>
      <div className="p-2 mt-1 border-t border-gemini-border">
         <button 
          onClick={() => {
            if (type === 'selection') {
               openAiModal({ title: t('create.toolbar.improve'), action: "improve", targetType: "refine", modId: selectionContext?.modId, lesId: selectionContext?.lesId, placeholder: "Décrivez..." });
            } else {
               const [mId, lId, bId] = id?.split(':') || [];
               openAiModal({ title: t('create.toolbar.improve'), action: "improve", targetType: "refine", modId: mId, lesId: lId, blockId: bId, placeholder: "Que souhaitez-vous améliorer ?" });
            }
            setActiveRefinementMenu(null);
          }}
          className="w-full flex items-center gap-3 px-3 py-2 bg-gemini-accent/5 rounded-xl group hover:bg-gemini-accent/10 transition-colors"
         >
           <MoreHorizontal size={14} className="text-gemini-accent" />
           <span className="text-[10px] font-bold uppercase tracking-widest text-gemini-accent">{t('create.customOption')}</span>
         </button>
      </div>
    </div>
  );

  const getInsightColorClass = (id: string) => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'bg-indigo-500/5 border-indigo-500/20 text-indigo-400',
      'bg-purple-500/5 border-purple-500/20 text-purple-400',
      'bg-amber-500/5 border-amber-500/20 text-amber-400',
      'bg-cyan-500/5 border-cyan-500/20 text-cyan-400',
      'bg-rose-500/5 border-rose-500/20 text-rose-400'
    ];
    return colors[hash % colors.length];
  };

  const getInsightAccentClass = (id: string) => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'text-indigo-400',
      'text-purple-400',
      'text-amber-400',
      'text-cyan-400',
      'text-rose-400'
    ];
    return colors[hash % colors.length];
  };

  const handleExportCourse = async (format: 'pdf' | 'docx') => {
    if (!generatedCourse || exportingFormat) return;
    setExportingFormat(format);
    try {
      if (format === 'pdf') await exportCoursePdf(generatedCourse);
      else await exportCourseDocx(generatedCourse);
      setIsDownloadModalOpen(false);
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      setExportingFormat(null);
    }
  };

  // Toggle voice dictation (starts/stops via the isLiveMode effect)
  const handleMicClick = () => {
    setIsLiveMode(!isLiveMode);
  };

  return (
    <div className="flex flex-col h-full bg-gemini-bg relative overflow-hidden">
      
      {/* Top Save Indicator */}
      

      {/* Google Import Modal */}
      {isGoogleImportModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isImporting && setIsGoogleImportModalOpen(false)}></div>
          <div className="relative w-full max-w-xl bg-gemini-surface border border-gemini-border rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="p-8 border-b border-gemini-border flex items-center justify-between shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border border-neutral-200 rounded-xl flex items-center justify-center shadow-sm">
                     <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gemini-text font-outfit">Importer depuis Google Workspace</h3>
                    <p className="text-[10px] text-gemini-dim uppercase tracking-widest font-bold">Google Drive & Docs</p>
                  </div>
               </div>
               <button onClick={() => setIsGoogleImportModalOpen(false)} className="p-2 text-gemini-dim hover:text-gemini-text transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-8 overflow-y-auto no-scrollbar relative min-h-[300px]">
               {isImporting ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gemini-surface z-10 animate-in fade-in duration-300">
                    <div className="relative">
                       <Loader2 size={48} className="text-gemini-accent animate-spin" />
                       <Cloud size={20} className="absolute inset-0 m-auto text-gemini-dim animate-pulse" />
                    </div>
                    <p className="text-sm font-bold text-gemini-text uppercase tracking-widest animate-pulse">Analyse du document...</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                    <div className="flex items-center gap-2 bg-gemini-bg px-4 py-2 rounded-xl border border-gemini-border focus-within:border-gemini-dim transition-all mb-4">
                       <Search size={16} className="text-gemini-dim" />
                       <input type="text" placeholder="Rechercher un document..." className="bg-transparent border-none outline-none text-sm w-full py-1 text-gemini-text" />
                    </div>
                    <div className="space-y-2">
                       {mockGDocs.map(doc => (
                         <button 
                           key={doc.id}
                           onClick={() => handleImportGDoc(doc)}
                           className="w-full flex items-center justify-between p-4 rounded-2xl border border-gemini-border hover:bg-gemini-accent/5 hover:border-gemini-accent transition-all group"
                         >
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-gemini-bg rounded-xl flex items-center justify-center text-gemini-dim group-hover:text-gemini-accent shadow-sm border border-gemini-border">
                                  <FileText size={20} />
                               </div>
                               <div className="text-left">
                                  <p className="text-sm font-bold text-gemini-text group-hover:text-gemini-accent transition-colors">{doc.title}</p>
                                  <p className="text-[10px] text-gemini-dim uppercase tracking-widest font-bold">Modifié il y a {doc.lastModified}</p>
                               </div>
                            </div>
                            <Plus size={18} className="text-gemini-dim opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                         </button>
                       ))}
                    </div>
                 </div>
               )}
            </div>
            
            <div className="p-8 bg-gemini-bg/30 border-t border-gemini-border text-center">
               <p className="text-[10px] text-gemini-dim font-bold uppercase tracking-widest leading-relaxed">
                  L'IA analysera le contenu de votre document pour en extraire la structure pédagogique optimale.
               </p>
            </div>
          </div>
        </div>
      )}

      {/* AI MODAL */}
      {isAiModalOpen && aiModalConfig && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isAiGenerating && setIsAiModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] bg-gemini-surface border border-gemini-border">
            <div className="p-8 border-b border-gemini-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gemini-accent rounded-xl flex items-center justify-center text-gemini-bg shadow-sm">
                  {aiModalConfig.action === 'translate' ? <Globe size={20} /> : <RabbitLogo className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gemini-text font-outfit">{aiModalConfig.title}</h3>
                  <p className="text-[10px] text-gemini-dim uppercase tracking-widest font-bold">Blackmind Intelligence</p>
                </div>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="p-2 text-gemini-dim hover:text-gemini-text transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto no-scrollbar">
              {/* Specialized Translation UI */}
              {aiModalConfig.action === 'translate' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase tracking-widest text-gemini-dim ml-1">{t('create.toolbar.selectLang')}</label>
                         <div className="relative">
                            <select 
                                value={targetLang}
                                onChange={(e) => setTargetLang(e.target.value)}
                                className="w-full bg-gemini-bg border border-gemini-border rounded-2xl px-5 py-4 text-sm outline-none focus:border-gemini-accent text-gemini-text appearance-none cursor-pointer"
                            >
                                <option value="fr">Français</option>
                                <option value="en">English</option>
                                <option value="es">Español</option>
                                <option value="pt">Português</option>
                                <option value="de">Deutsch</option>
                                <option value="it">Italiano</option>
                                <option value="ja">日本語 (Japonais)</option>
                                <option value="zh">中文 (Chinois)</option>
                                <option value="ar">العربية (Arabe)</option>
                                <option value="ru">Русский (Russe)</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-gemini-dim pointer-events-none" />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase tracking-widest text-gemini-dim ml-1">{t('create.toolbar.selectLocale')}</label>
                         <div className="relative">
                            <select 
                                value={targetLocale}
                                onChange={(e) => setTargetLocale(e.target.value)}
                                className="w-full bg-gemini-bg border border-gemini-border rounded-2xl px-5 py-4 text-sm outline-none focus:border-gemini-accent text-gemini-text appearance-none cursor-pointer"
                            >
                                <option value="none">{t('create.toolbar.locales.none')}</option>
                                {targetLang === 'fr' && (
                                  <>
                                    <option value="france">{t('create.toolbar.locales.france')}</option>
                                    <option value="canada">{t('create.toolbar.locales.canada')}</option>
                                  </>
                                )}
                                {targetLang === 'en' && (
                                  <>
                                    <option value="usa">{t('create.toolbar.locales.usa')}</option>
                                    <option value="uk">{t('create.toolbar.locales.uk')}</option>
                                  </>
                                )}
                                {targetLang === 'pt' && (
                                  <>
                                    <option value="brazil">{t('create.toolbar.locales.brazil')}</option>
                                    <option value="portugal">{t('create.toolbar.locales.portugal')}</option>
                                  </>
                                )}
                                {targetLang === 'es' && (
                                  <>
                                    <option value="spain">{t('create.toolbar.locales.spain')}</option>
                                    <option value="mexico">{t('create.toolbar.locales.mexico')}</option>
                                  </>
                                )}
                            </select>
                            <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-gemini-dim pointer-events-none" />
                         </div>
                      </div>
                   </div>
                   <div className="p-5 rounded-2xl bg-gemini-accent/5 border border-gemini-accent/10 flex items-start gap-4">
                      <Globe className="text-gemini-accent mt-1 shrink-0" size={20} />
                      <p className="text-xs text-gemini-dim leading-relaxed">{t('create.toolbar.translateSubtitle')}</p>
                   </div>
                </div>
              ) : (
                <>
                  {/* Quick Actions Grid for Refinement */}
                  {(aiModalConfig.targetType === 'refine' || aiModalConfig.action === 'improve') && (
                    <div className="space-y-4">
                       <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gemini-dim ml-1">
                          <Sparkles size={12} /> {t('create.toolbar.improveSubtitle')}
                       </div>
                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {refinementActions.map((act) => (
                            <button 
                              key={act.id}
                              disabled={isAiGenerating}
                              onClick={() => {
                                if (act.id === 'translate') {
                                  setAiModalConfig({ ...aiModalConfig, action: 'translate', title: t('create.toolbar.translate') });
                                  return;
                                }
                                if (aiModalConfig.targetType === 'refine') {
                                  handleRefineSelection(act.id, act.prompt);
                                } else if (aiModalConfig.modId && aiModalConfig.lesId && aiModalConfig.blockId) {
                                  handleBlockAction(aiModalConfig.modId, aiModalConfig.lesId, aiModalConfig.blockId, `refine-${act.id}`, act.prompt);
                                }
                              }}
                              className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-gemini-border bg-gemini-bg hover:bg-gemini-accent hover:text-gemini-bg hover:border-gemini-accent transition-all group disabled:opacity-50 text-center"
                            >
                              <act.icon size={18} className="text-gemini-dim group-hover:text-gemini-bg transition-colors" />
                              <span className="text-[9px] font-bold uppercase tracking-tight line-clamp-1">{act.label}</span>
                            </button>
                          ))}
                       </div>
                       <div className="relative flex items-center py-2">
                          <div className="flex-grow border-t border-gemini-border"></div>
                          <span className="flex-shrink mx-4 text-[9px] font-bold text-gemini-dim uppercase tracking-widest">{t('create.orCustomInstruction')}</span>
                          <div className="flex-grow border-t border-gemini-border"></div>
                       </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gemini-dim ml-1">{t('create.customInstruction')}</label>
                    <div className="relative">
                      <textarea 
                        autoFocus
                        value={aiModalInput}
                        onChange={(e) => setAiModalInput(e.target.value)}
                        placeholder={aiModalConfig.placeholder}
                        className="w-full bg-gemini-bg border border-gemini-border rounded-2xl p-5 text-sm outline-none focus:border-gemini-accent transition-all placeholder:text-gemini-dim text-gemini-text min-h-[120px] resize-none"
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAiModalSubmit())}
                      />
                      {isAiGenerating && (
                        <div className="absolute inset-0 bg-gemini-bg/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
                          <Loader2 size={24} className="text-gemini-text animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-8 bg-gemini-bg/30 border-t border-gemini-border flex gap-3 shrink-0">
              <button onClick={() => setIsAiModalOpen(false)} className="flex-1 px-6 py-4 border border-gemini-border rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gemini-dim hover:text-gemini-accent transition-all">{t('common.cancel')}</button>
              <button 
                onClick={handleAiModalSubmit} 
                disabled={isAiGenerating || (aiModalConfig.action !== 'translate' && aiModalConfig.targetType !== 'refine' && !aiModalInput.trim() && (aiModalConfig.action === 'improve' || aiModalConfig.targetType === 'cover'))} 
                className="flex-1 px-6 py-4 bg-gemini-accent text-gemini-bg rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAiGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {t('common.generate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MISSING MODALS IMPLEMENTATION */}
      
      {/* ADD MODULE MODAL */}
      {isAddModuleModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAddModuleModalOpen(false)}></div>
          <form onSubmit={handleAddModule} className="relative w-full max-w-md bg-gemini-surface border border-gemini-border rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gemini-border flex items-center justify-between">
              <h3 className="text-xl font-bold text-gemini-text font-outfit">{t('create.addModule')}</h3>
              <button type="button" onClick={() => setIsAddModuleModalOpen(false)} className="p-2 text-gemini-dim hover:text-gemini-text transition-colors"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gemini-dim ml-1">{t('create.moduleTitle')}</label>
                  <input autoFocus type="text" value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} placeholder="Ex: Fondamentaux de la Physique..." className="w-full bg-gemini-bg border border-gemini-border rounded-2xl px-5 py-4 text-sm outline-none focus:border-gemini-accent transition-all placeholder:text-gemini-dim/50 text-gemini-text" />
               </div>
            </div>
            <div className="p-8 bg-gemini-bg/30 border-t border-gemini-border flex gap-3">
              <button type="button" onClick={() => setIsAddModuleModalOpen(false)} className="flex-1 px-6 py-4 border border-gemini-border rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gemini-dim hover:text-gemini-accent transition-all">{t('common.cancel')}</button>
              <button type="submit" disabled={!newModuleTitle.trim()} className="flex-1 px-6 py-4 bg-gemini-accent text-gemini-bg rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">{t('create.createModule')}</button>
            </div>
          </form>
        </div>
      )}

      {/* SHARE MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsShareModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-gemini-surface border border-gemini-border rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-gemini-text font-outfit">{t('workspace.share')}</h3>
              <button onClick={() => setIsShareModalOpen(false)} className="p-2 text-gemini-dim hover:text-gemini-text transition-colors"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gemini-accent/5 border border-gemini-accent/10 rounded-2xl flex items-center gap-4">
                <Briefcase className="text-gemini-accent" size={24} />
                <p className="text-sm text-gemini-text">{t('create.shareDesc')}</p>
              </div>
              <div className="max-h-60 overflow-y-auto no-scrollbar space-y-2">
                {workspaces.map(ws => (
                  <button key={ws.id} className="w-full flex items-center justify-between p-4 rounded-2xl border border-gemini-border hover:bg-gemini-accent/5 hover:border-gemini-accent transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gemini-bg rounded-xl flex items-center justify-center text-gemini-dim group-hover:text-gemini-accent font-bold uppercase">
                        {ws.name.charAt(0)}
                      </div>
                      <span className="font-bold text-gemini-text">{ws.name}</span>
                    </div>
                    <ArrowRight size={16} className="text-gemini-dim group-hover:text-gemini-accent" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOWNLOAD MODAL */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsDownloadModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-gemini-surface border border-gemini-border rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-gemini-accent text-gemini-bg rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <FileDown size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold font-outfit text-gemini-text">Exporter le savoir</h3>
              <p className="text-gemini-dim text-sm">{t('create.exportDesc')}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleExportCourse('pdf')}
                disabled={!!exportingFormat}
                className="flex flex-col items-center gap-3 p-6 rounded-[2rem] border border-gemini-border hover:border-gemini-accent hover:bg-gemini-accent/5 transition-all group disabled:opacity-50"
              >
                {exportingFormat === 'pdf' ? <Loader2 size={32} className="animate-spin text-gemini-accent" /> : <FileText size={32} className="text-gemini-dim group-hover:text-gemini-accent" />}
                <span className="font-black text-[10px] uppercase tracking-[0.2em] text-gemini-dim group-hover:text-gemini-accent">{exportingFormat === 'pdf' ? t('create.exporting') : 'Format PDF'}</span>
              </button>
              <button
                onClick={() => handleExportCourse('docx')}
                disabled={!!exportingFormat}
                className="flex flex-col items-center gap-3 p-6 rounded-[2rem] border border-gemini-border hover:border-gemini-accent hover:bg-gemini-accent/5 transition-all group disabled:opacity-50"
              >
                {exportingFormat === 'docx' ? <Loader2 size={32} className="animate-spin text-gemini-accent" /> : <Layout size={32} className="text-gemini-dim group-hover:text-gemini-accent" />}
                <span className="font-black text-[10px] uppercase tracking-[0.2em] text-gemini-dim group-hover:text-gemini-accent">{exportingFormat === 'docx' ? t('create.exporting') : 'Format DOCX'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setDeleteConfirm({ ...deleteConfirm, show: false })}></div>
          <div className="relative w-full max-w-md bg-gemini-surface border border-gemini-border rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-500/20">
                <AlertCircle size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold font-outfit text-gemini-text">{deleteConfirm.type === 'course' ? t('common.confirmDeleteCourse', { title: deleteConfirm.title || '' }) : t('common.confirmDeleteTitle', { title: deleteConfirm.title || '' })}</h3>
                <p className="text-sm text-gemini-dim leading-relaxed">{t('common.confirmDeleteDesc')}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setDeleteConfirm({ ...deleteConfirm, show: false })} 
                  className="flex-1 px-6 py-4 bg-gemini-bg border border-gemini-border rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gemini-text hover:bg-gemini-surface transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  onClick={() => {
                    const { type, params } = deleteConfirm;
                    if (type === 'module') deleteModuleActual(params.moduleId);
                    else if (type === 'lesson') deleteLessonActual(params.modId, params.lesId);
                    else if (type === 'block') deleteBlockActual(params.modId, params.lesId, params.blockId);
                    else if (type === 'course') {
                      deleteCourse(generatedCourse?.id || '');
                      setGeneratedCourse(null);
                      setDeleteConfirm({ show: false, type: 'course', params: {} });
                      navigate('/');
                    }
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

      {showToolbar && (
        <div 
          ref={toolbarRef}
          className="fixed z-[100] bg-gemini-surface/90 backdrop-blur-xl border border-gemini-border rounded-2xl shadow-2xl p-1 flex items-center gap-1 animate-in fade-in zoom-in duration-200"
          style={{ top: toolbarPos.y - 10, left: toolbarPos.x, transform: 'translateX(-50%) translateY(-100%)' }}
        >
          {isToolbarLoading ? (
            <div className="px-4 py-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gemini-dim">
              <Loader2 size={14} className="animate-spin text-gemini-text" /> {t('create.generatingImage')}
            </div>
          ) : (
            <div className="flex items-center gap-0.5 relative">
              <div className="flex items-center relative">
                 <button 
                  onMouseDown={(e) => e.preventDefault()} 
                  onClick={() => setActiveRefinementMenu(activeRefinementMenu?.type === 'selection' ? null : { type: 'selection' })} 
                  className={`refinement-toggle p-2.5 rounded-xl transition-all ${activeRefinementMenu?.type === 'selection' ? 'bg-gemini-accent text-gemini-bg' : 'text-gemini-dim hover:text-gemini-accent hover:bg-gemini-bg'}`} 
                  title="Améliorer avec l'IA"
                 >
                    <Sparkles size={16} />
                 </button>
                 {activeRefinementMenu?.type === 'selection' && (
                    <RefinementDropdown type="selection" onAction={(actionId, prompt) => handleRefineSelection(actionId, prompt)} />
                 )}
              </div>
              <div className="w-px h-4 bg-gemini-border mx-1" />
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormatting('bold')} title={t('create.toolbar.actions.bold')} className="p-2.5 hover:bg-gemini-bg rounded-xl text-gemini-dim hover:text-gemini-text transition-all"><Bold size={16} /></button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormatting('italic')} title={t('create.toolbar.actions.italic')} className="p-2.5 hover:bg-gemini-bg rounded-xl text-gemini-dim hover:text-gemini-text transition-all"><Italic size={16} /></button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormatting('highlight')} title={t('create.toolbar.actions.highlight')} className="p-2.5 hover:bg-gemini-bg rounded-xl text-gemini-dim hover:text-gemini-text transition-all"><Highlighter size={16} /></button>
              <div className="w-px h-4 bg-gemini-border mx-1" />
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleRefineSelection('summarize')} title="Résumer" className="p-2.5 hover:bg-gemini-bg rounded-xl text-gemini-dim hover:text-gemini-text transition-all"><FileText size={16} /></button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleRefineSelection('expand')} title="Développer" className="p-2.5 hover:bg-gemini-bg rounded-xl text-gemini-dim hover:text-gemini-text transition-all"><Maximize size={16} /></button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => openAiModal({
                title: t('create.toolbar.translate'),
                action: "translate",
                targetType: "refine",
                modId: selectionContext?.modId || '',
                lesId: selectionContext?.lesId || '',
                placeholder: ""
              })} title="Traduire" className="p-2.5 hover:bg-gemini-bg rounded-xl text-gemini-dim hover:text-gemini-text transition-all"><Globe size={16} /></button>
              <div className="w-px h-4 bg-gemini-border mx-1" />
              <button 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => {
                  if (selectionContext) {
                    setDeleteConfirm({ show: true, type: 'block', params: { modId: selectionContext.modId, lesId: selectionContext.lesId, blockId: selectionContext.blockId }, title: 'Sélection' });
                    setShowToolbar(false);
                  }
                }} 
                title="Supprimer l'élément" 
                className="p-2.5 hover:bg-red-500/10 rounded-xl text-gemini-dim hover:text-red-500 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="h-14 border-b border-gemini-border flex items-center justify-between px-6 bg-gemini-header shrink-0 z-20">
        <div className="flex items-center gap-4">
          {!isPreviewMode && (
            <div className="flex bg-gemini-sidebar p-1 rounded-full border border-gemini-border">
              <button onClick={() => setView('chat')} className={`px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'chat' ? 'bg-gemini-accent text-gemini-bg shadow-sm' : 'text-gemini-dim hover:text-gemini-text'}`}><MessageSquare size={14}/><span className="hidden sm:inline">{t('create.chat')}</span></button>
              <button onClick={() => setView('preview')} className={`px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'preview' ? 'bg-gemini-accent text-gemini-bg shadow-sm' : 'text-gemini-dim hover:text-gemini-text'}`}><Eye size={14}/><span className="hidden sm:inline">{t('create.preview')}</span></button>
            </div>
          )}
        </div>
        
        
        <div className="flex items-center gap-3 relative" ref={actionMenuRef}>
          {showSaveIndicator && lastSaved && (
             <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-gemini-surface/50 border border-gemini-border rounded-full text-[9px] font-bold uppercase tracking-widest text-gemini-dim">
               <History size={10} className="text-gemini-accent" /> {t('common.save', { defaultValue: 'Enregistré' })} · {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </div>
          )}

          
          <button onClick={() => setIsActionMenuOpen(!isActionMenuOpen)} className="p-2.5 bg-gemini-surface border border-gemini-border hover:border-gemini-text text-gemini-text rounded-full transition-all flex items-center gap-2 shadow-lg"><MoreHorizontal size={20} /></button>
          {isActionMenuOpen && (
            <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-2rem)] bg-gemini-surface border border-gemini-border rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 divide-y divide-gemini-border">
              <div className="py-2">
                <button onClick={handlePublish} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gemini-bg text-[11px] font-bold uppercase tracking-widest transition-colors text-left text-gemini-text bg-gemini-surface/50"><Rocket size={16} /> PUBLIER</button>
              </div>
              <div className="py-1">
                <button onClick={() => { setIsShareModalOpen(true); setIsActionMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gemini-bg text-[11px] font-bold uppercase tracking-widest transition-colors text-left text-gemini-dim hover:text-gemini-text"><Briefcase size={16} /> PARTAGER SUR UN ESPACE</button>
                <button onClick={() => { setIsTeamModalOpen(true); setIsActionMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gemini-bg text-[11px] font-bold uppercase tracking-widest transition-colors text-left text-gemini-dim hover:text-gemini-text"><Users size={16} /> INVITER DES COLLABORATEURS</button>
                <button onClick={() => { setIsEmailModalOpen(true); setIsActionMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gemini-bg text-[11px] font-bold uppercase tracking-widest transition-colors text-left text-gemini-dim hover:text-gemini-text"><Mail size={16} /> ENVOYER PAR EMAIL</button>
              </div>
              <div className="py-1">
                 <button onClick={() => { setIsDownloadModalOpen(true); setIsActionMenuOpen(false); }} className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-gemini-bg text-[11px] font-bold uppercase tracking-widest transition-colors text-gemini-dim hover:text-gemini-text group relative">
                  <div className="flex items-center gap-3 whitespace-nowrap min-w-0"><FileDown size={16} className="shrink-0" /> <span className="truncate">TÉLÉCHARGER LE COURS</span></div>
                  <div className="flex items-center gap-2 text-[9px] shrink-0 whitespace-nowrap">
                    <span onClick={(e) => { e.stopPropagation(); setIsActionMenuOpen(false); handleExportCourse('pdf'); }} className="px-1.5 py-0.5 rounded border border-gemini-border hover:border-gemini-accent hover:text-gemini-accent transition-colors">PDF</span>
                    <span onClick={(e) => { e.stopPropagation(); setIsActionMenuOpen(false); handleExportCourse('docx'); }} className="px-1.5 py-0.5 rounded border border-gemini-border hover:border-gemini-accent hover:text-gemini-accent transition-colors">DOCX</span>
                  </div>
                </button>
                <button onClick={() => { setIsSellModalOpen(true); setIsActionMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gemini-bg text-[11px] font-bold uppercase tracking-widest transition-colors text-left text-gemini-dim hover:text-gemini-text"><Store size={16} /> VENDRE (MARKETPLACE)</button>
              </div>
              <div className="py-1">
                <button onClick={() => { handleDeleteCourseAction(); setIsActionMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 text-[11px] font-bold uppercase tracking-widest transition-colors text-left text-red-500"><Trash2 size={16} /> SUPPRIMER</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {view === 'chat' && !isPreviewMode && (
          <div className="w-full md:w-[450px] flex flex-col border-r border-gemini-border bg-gemini-sidebar animate-in slide-in-from-left duration-300 shrink-0 shadow-xl pb-0 relative">
            <div className="flex-1 overflow-y-auto p-4 space-y-8 no-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} group/msg space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                   <div className="flex items-center gap-2 mb-1">
                      {m.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-lg bg-gemini-accent text-gemini-bg flex items-center justify-center shadow-sm">
                          <RabbitLogo className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gemini-dim">
                        {m.role === 'user' ? (currentUser?.name || 'Moi') : 'Blackmind AI'}
                      </span>
                      {m.role === 'user' && (
                        <div className={`w-6 h-6 rounded-lg ${currentUser?.color || 'bg-gemini-accent'} text-white flex items-center justify-center shadow-sm text-[10px] font-bold`}>
                          {currentUser?.initials || 'ME'}
                        </div>
                      )}
                   </div>

                   <div className={`relative max-w-[90%] p-4 rounded-3xl text-sm transition-all shadow-md ${m.role === 'user' ? 'bg-gemini-accent text-gemini-bg font-medium rounded-tr-sm' : 'bg-gemini-surface border border-gemini-border text-gemini-text rounded-tl-sm'}`}>
                      {m.role === 'assistant' ? (
                        <div className="prose-gemini prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(m.content || '') }} />
                      ) : (
                        <p className="leading-relaxed">{m.content}</p>
                      )}
                      
                      {m.imageUrl && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-gemini-border shadow-inner bg-black/5">
                          <img src={m.imageUrl} alt="AI Generated" className="w-full h-auto" />
                        </div>
                      )}
                      
                      {m.role === 'assistant' && !isGenerating && (
                        <div className="absolute -right-12 top-0 flex flex-col gap-1 opacity-0 group-hover/msg:opacity-100 transition-all">
                          <button 
                            onClick={() => handlePlayMessage(i, m.content)}
                            className={`p-2 rounded-xl transition-all border shadow-sm ${speakingMessageIdx === i ? 'bg-gemini-accent text-gemini-bg border-gemini-accent' : 'bg-gemini-surface text-gemini-dim border-gemini-border hover:text-gemini-accent hover:border-gemini-accent'}`}
                            title="Écouter le message"
                          >
                            {speakingMessageIdx === i ? <Volume2 size={14} className="animate-pulse" /> : <Play size={14} />}
                          </button>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(m.content);
                            }}
                            className="p-2 rounded-xl transition-all border shadow-sm bg-gemini-surface text-gemini-dim border-gemini-border hover:text-gemini-accent hover:border-gemini-accent"
                            title="Copier le texte"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      )}

                      {m.timestamp && (
                        <div className={`mt-2 text-[8px] font-bold uppercase tracking-widest opacity-40 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                   </div>
                   
                   {/* Contextual Suggestions Area */}
                   {m.role === 'assistant' && m.suggestions && m.suggestions.length > 0 && !isGenerating && (
                     <div className="flex flex-wrap gap-2 mt-3 px-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {m.suggestions.map((suggestion: string, sIdx: number) => {
                          if (suggestion === '__ACTION_PREVIEW__') {
                            return (
                              <div key={sIdx} className="relative group inline-block">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-amber-500 to-pink-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                                <button
                                  onClick={() => setView('preview')}
                                  className="relative px-8 py-3 bg-gemini-accent text-gemini-bg rounded-full text-[10px] font-bold tracking-wider hover:scale-105 transition-all shadow-lg whitespace-nowrap flex items-center gap-2"
                                >
                                  {t('create.viewResult') || 'Voir le résultat ->'} <ArrowRight size={14} />
                                </button>
                              </div>
                            );
                          }
                          return (
                          <button 
                            key={sIdx}
                            onClick={() => handleGenerateCourse(suggestion)}
                            className="px-4 py-2.5 bg-gemini-surface border border-gemini-border rounded-full text-[10px] font-bold tracking-wider text-gemini-dim hover:text-gemini-accent hover:border-gemini-accent hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm whitespace-nowrap group/sug"
                          >
                            <Plus size={12} className="inline mr-1 group-hover/sug:rotate-90 transition-transform" /> {suggestion}
                          </button>
                        )})}
                     </div>
                   )}
                </div>
              ))}
              {isGenerating && (
                <div className="p-6 space-y-4 text-center py-12 animate-in fade-in duration-500">
                   {isThinkingMode && (
                      <div className="mb-6 inline-flex items-center gap-3 px-4 py-2 bg-gemini-accent/5 border border-gemini-accent/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-gemini-accent animate-pulse shadow-sm">
                        <Brain size={14} /> {t('create.analyzing')}
                      </div>
                   )}
                  <div className="flex justify-center gap-2 mb-6">
                    <div className="w-2.5 h-2.5 bg-gemini-accent rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-gemini-accent rounded-full animate-bounce [animation-delay:-.3s]"></div>
                    <div className="w-2.5 h-2.5 bg-gemini-accent rounded-full animate-bounce [animation-delay:-.5s]"></div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gemini-accent">{t('create.generating')}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gemini-dim">{t('create.optimizing')}</p>
                  </div>
                </div>
              )}
              {isLiveMode && (
                <div className="flex justify-start px-4">
                  <div className="bg-red-500/10 border border-red-500/20 px-5 py-2.5 rounded-full flex items-center gap-3 animate-pulse shadow-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">{t('create.listening')}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className={`px-4 pt-4 border-t border-gemini-border bg-gemini-bg relative z-30 space-y-3 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]`} style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
                {messages.length === 1 && !isGenerating && (
                  <div className="flex flex-wrap items-center gap-2 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto w-full">
                    <button onClick={() => setPrompt(t('create.suggestions.marketing'))} className="px-3 py-1.5 rounded-full bg-gemini-surface border border-gemini-border text-gemini-dim text-xs font-medium hover:text-gemini-text hover:border-gemini-dim transition-colors shadow-sm">{t('create.suggestions.marketing')}</button>
                    <button onClick={() => setPrompt(t('create.suggestions.python'))} className="px-3 py-1.5 rounded-full bg-gemini-surface border border-gemini-border text-gemini-dim text-xs font-medium hover:text-gemini-text hover:border-gemini-dim transition-colors shadow-sm">{t('create.suggestions.python')}</button>
                    <button onClick={() => setPrompt(t('create.suggestions.photography'))} className="px-3 py-1.5 rounded-full bg-gemini-surface border border-gemini-border text-gemini-dim text-xs font-medium hover:text-gemini-text hover:border-gemini-dim transition-colors shadow-sm">{t('create.suggestions.photography')}</button>
                  </div>
                )}
                {isStorytellingMode && (
                  <div className="flex items-center gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-widest border border-purple-500/20 flex items-center gap-1.5 shadow-sm">
                      <BookOpen size={12} />
                      Mode Storytelling
                      <button onClick={() => setIsStorytellingMode(false)} className="ml-1 hover:text-purple-300 hover:bg-purple-500/20 rounded-full p-0.5 transition-colors">
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                )}
                <div className="bg-gemini-surface border border-gemini-border rounded-2xl px-3 py-2 md:px-4 md:py-3 flex items-center gap-2 focus-within:border-gemini-dim transition-all duration-300 shadow-2xl relative min-h-[52px] max-w-4xl mx-auto w-full">
                  <textarea rows={1} value={prompt} onChange={(e) => {
                    setPrompt(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }} placeholder={t('create.placeholder')} className="bg-transparent border-none outline-none flex-1 py-1 text-sm resize-none text-gemini-text placeholder:text-gemini-dim/50 my-auto" onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerateCourse();
                    }
                  }} style={{ minHeight: '24px', maxHeight: '120px' }} />
                  <div className="flex items-center gap-2 shrink-0" ref={chatOptionsRef}>
                    <div className="relative">
                      <button 
                        onClick={() => setIsChatOptionsOpen(!isChatOptionsOpen)}
                        className="p-1.5 text-gemini-dim hover:text-gemini-accent rounded-lg transition-colors"
                        title="Options supplémentaires"
                      >
                        <Plus size={18} className={`transition-transform duration-300 ${isChatOptionsOpen ? 'rotate-45' : ''}`} />
                      </button>
                      {isChatOptionsOpen && (
                        <div className="absolute bottom-full right-0 mb-2 bg-gemini-surface border border-gemini-border rounded-xl shadow-lg p-2 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                          
                          <div className="px-2 py-1.5 flex items-center justify-between border-b border-gemini-border/50 mb-1">
                            <span className="text-[10px] font-bold text-gemini-dim uppercase tracking-widest">{t('settings.language')} du contenu</span>
                            <div className="flex gap-1">
                              <button onClick={() => setContentLanguage('fr')} className={`px-2 py-1 text-[10px] font-bold rounded ${contentLanguage === 'fr' ? 'bg-gemini-accent text-gemini-bg' : 'text-gemini-dim hover:text-gemini-accent'}`}>FR</button>
                              <button onClick={() => setContentLanguage('en')} className={`px-2 py-1 text-[10px] font-bold rounded ${contentLanguage === 'en' ? 'bg-gemini-accent text-gemini-bg' : 'text-gemini-dim hover:text-gemini-accent'}`}>EN</button>
                            </div>
                          </div>
                          <button 

                            onClick={() => { setIsStorytellingMode(!isStorytellingMode); setIsChatOptionsOpen(false); }} 
                            className={`p-2 rounded-lg transition-colors flex items-center gap-3 ${isStorytellingMode ? 'text-purple-500 bg-purple-500/10' : 'text-gemini-dim hover:bg-gemini-bg hover:text-purple-500'}`}
                            title="Storytelling Mode"
                          >
                            <BookOpen size={16} />
                            <span className="text-xs font-medium whitespace-nowrap">Mode Storytelling</span>
                          </button>
                          <button 
                            onClick={() => { setIsGoogleImportModalOpen(true); setIsChatOptionsOpen(false); }} 
                            className="p-2 text-gemini-dim hover:bg-gemini-bg hover:text-gemini-accent rounded-lg transition-colors flex items-center gap-3"
                            title="Importer depuis Google Workspace"
                          >
                            <FileText size={16} />
                            <span className="text-xs font-medium whitespace-nowrap">Importer un document</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleMicClick}
                      className={`p-1.5 rounded-lg transition-all ${isLiveMode ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse' : 'text-gemini-dim hover:text-gemini-accent'}`}
                      title={isLiveMode ? t('create.liveStop') : t('create.liveStart')}
                    >
                      {isLiveMode ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    <button
                      onClick={() => handleGenerateCourse()}
                      disabled={!prompt.trim() || isGenerating}
                      className="p-1.5 bg-gemini-accent text-gemini-bg rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                </div>
            </div>
          </div>
        )}

        <div className={`flex-1 overflow-y-auto p-4 md:p-16 bg-gemini-bg no-scrollbar relative ${view === 'chat' && !isPreviewMode ? 'hidden md:block' : 'block'}`} ref={canvasRef} onClick={handleSelection}>
           {(!generatedCourse && !generatedStory) ? (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto px-4">
               <div className="w-24 h-24 bg-gemini-surface rounded-[2.5rem] flex items-center justify-center border border-gemini-border shadow-2xl">
                 <RabbitLogo className="w-12 h-12 text-gemini-accent" />
               </div>
               <div className="max-w-md space-y-2">
                 <h3 className="text-2xl md:text-3xl font-bold font-outfit text-gemini-text">{t('create.readyTitle')}</h3>
                 <p className="text-gemini-dim">{t('create.readySubtitle')}</p>
               </div>
               
               {/* 4 Templates */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-8">
                 {[
                   { title: "Cours structuré 5 chapitres", icon: BookOpen, prompt: "Génère un cours structuré en 5 chapitres sur [SUJET]." },
                   { title: "Mini-cours 3 modules", icon: Zap, prompt: "Génère un mini-cours rapide en 3 modules sur [SUJET]." },
                   { title: "Plan intensif 7 jours", icon: Calendar, prompt: "Crée un plan intensif de 7 jours pour apprendre [SUJET]." },
                   { title: "Cours avec quiz", icon: MessageSquare, prompt: "Crée un cours interactif incluant des quiz pour valider les connaissances sur [SUJET]." }
                 ].map((template, idx) => (
                   <button 
                     key={idx}
                     onClick={() => setPrompt(template.prompt)}
                     className="flex flex-col items-start gap-3 p-6 rounded-[2rem] bg-gemini-surface border border-gemini-border hover:border-gemini-accent hover:shadow-lg transition-all text-left group"
                   >
                     <div className="w-10 h-10 rounded-xl bg-gemini-bg flex items-center justify-center text-gemini-dim group-hover:text-gemini-accent transition-colors">
                       <template.icon size={20} />
                     </div>
                     <span className="font-bold text-sm text-gemini-text group-hover:text-gemini-accent transition-colors">
                       {template.title}
                     </span>
                   </button>
                 ))}
               </div>
             </div>
           ) : generatedStory ? (
             <div className="max-w-4xl mx-auto p-6 md:p-10 rounded-[3rem] border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-transparent space-y-12 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
               <div className="space-y-6 text-center">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] border border-purple-500/20 shadow-sm">
                   <BookOpen size={14} className="animate-pulse" /> Storytelling Mode
                 </div>
                 <h1 className="text-4xl md:text-6xl font-black font-outfit text-gemini-accent tracking-tight leading-tight" contentEditable suppressContentEditableWarning onBlur={(e) => setGeneratedStory({...generatedStory, title: e.currentTarget.textContent || ''})}>{generatedStory.title}</h1>
                 <p className="text-xl md:text-2xl text-gemini-text/80 font-light leading-relaxed max-w-2xl mx-auto" contentEditable suppressContentEditableWarning onBlur={(e) => setGeneratedStory({...generatedStory, logline: e.currentTarget.textContent || ''})}>{generatedStory.logline}</p>
               </div>
               
               <div className="flex items-center justify-center gap-4 border-t border-gemini-border/50 pt-8 pb-4">
                  <div className="px-4 py-2 rounded-2xl bg-gemini-surface border border-gemini-border flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gemini-dim uppercase tracking-widest">Scenes</span>
                    <span className="text-sm font-black text-gemini-accent">{generatedStory.scenes?.length || 0}</span>
                  </div>
                  <button onClick={handleExportStory} className="px-4 py-2 bg-purple-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-purple-600 transition-colors shadow-lg flex items-center gap-2">
                    <Download size={14} /> Exporter le script
                  </button>
               </div>

               <div className="space-y-8">
                 {generatedStory.scenes && generatedStory.scenes.map((scene: any, idx: number) => (
                   <div key={idx} className="group relative p-6 md:p-8 rounded-[2rem] bg-gemini-surface border border-gemini-border shadow-sm hover:shadow-xl hover:border-purple-500/30 transition-all duration-300">
                     <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-gemini-bg border border-gemini-border flex items-center justify-center text-xs font-black text-gemini-dim shadow-sm group-hover:text-purple-400 group-hover:border-purple-400/50 transition-colors">
                       {idx + 1}
                     </div>
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gemini-border/50">
                       <h3 className="font-bold text-xl text-gemini-text" contentEditable suppressContentEditableWarning onBlur={(e) => {
                         const newScenes = [...generatedStory.scenes];
                         newScenes[idx].title = e.currentTarget.textContent || '';
                         setGeneratedStory({...generatedStory, scenes: newScenes});
                       }}>{scene.title}</h3>
                       <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gemini-bg border border-gemini-border">
                         <Camera size={14} className="text-gemini-dim" />
                         <span className="text-[10px] font-mono text-purple-400 font-bold tracking-wider" contentEditable suppressContentEditableWarning onBlur={(e) => {
                           const newScenes = [...generatedStory.scenes];
                           newScenes[idx].setting = e.currentTarget.textContent || '';
                           setGeneratedStory({...generatedStory, scenes: newScenes});
                         }}>{scene.setting}</span>
                       </div>
                     </div>
                     
                     <div className="relative">
                       <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500/20 to-transparent rounded-full"></div>
                       <p className="text-lg text-gemini-dim font-medium leading-relaxed pl-6" contentEditable suppressContentEditableWarning onBlur={(e) => {
                         const newScenes = [...generatedStory.scenes];
                         newScenes[idx].action = e.currentTarget.textContent || '';
                         setGeneratedStory({...generatedStory, scenes: newScenes});
                       }}>{scene.action}</p>
                     </div>
                     
                     {scene.characters && scene.characters.length > 0 && (
                       <div className="mt-8 pt-6 border-t border-gemini-border/30 flex flex-wrap gap-2 items-center">
                         <span className="text-[10px] font-bold text-gemini-dim uppercase tracking-widest mr-2"><User size={12} className="inline mr-1" /> Casting :</span>
                         {scene.characters.map((char: string, i: number) => (
                           <span key={i} className="text-xs font-bold bg-gemini-bg text-gemini-text px-3 py-1.5 rounded-xl border border-gemini-border shadow-sm">
                             {char}
                           </span>
                         ))}
                       </div>
                     )}
                   </div>
                 ))}
               </div>
             </div>
           ) : (
             <div className="max-w-3xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
               <div className="relative group rounded-[3rem] overflow-hidden aspect-video shadow-2xl border border-gemini-border">
                 <img src={generatedCourse.image} alt="Cover" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                 <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-all ${isPreviewMode ? 'hidden' : 'opacity-0 group-hover:opacity-100'}`}>
                   <button onClick={() => openAiModal({ action: "generate-cover", targetType: "cover", title: t('create.regenerateCover'), placeholder: t('create.coverLabel') })} className="bg-gemini-accent text-gemini-bg px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-lg">
                      <ImageIcon size={14} /> Nano Banana
                   </button>
                 </div>
               </div>
               
               <div className="text-center space-y-4">
                 <div className="inline-block px-4 py-1.5 rounded-full border border-gemini-border bg-gemini-surface text-[10px] font-bold uppercase tracking-[0.2em] text-gemini-dim">
                   {generatedCourse.category}
                 </div>
                 <h1 className="text-3xl md:text-6xl font-bold font-outfit text-gemini-accent leading-tight" contentEditable={!isPreviewMode} suppressContentEditableWarning={true} onBlur={(e) => setGeneratedCourse({...generatedCourse, title: e.currentTarget.textContent || ''})}>{generatedCourse.title}</h1>
                 <p className="text-xl text-gemini-text/80 leading-relaxed font-light" contentEditable={!isPreviewMode} suppressContentEditableWarning={true} onBlur={(e) => setGeneratedCourse({...generatedCourse, description: e.currentTarget.textContent || ''})}>{generatedCourse.description}</p>
               </div>

               {(() => {
                  const overviewBlock = generatedCourse.modules[0]?.lessons[0]?.content.find(b => b.type === 'overview');
                  return overviewBlock ? <CourseMetadataCard data={overviewBlock.value} t={t} /> : null;
               })()}
               
               <div className="space-y-12">
                 {generatedCourse.modules.map((mod, mIdx) => {
                   const isCollapsed = collapsedModules.has(mod.id);
                   return (
                     <div key={mod.id} className="space-y-8 group/module relative bg-gemini-surface p-6 md:p-8 rounded-[2.5rem] border border-gemini-border/60 hover:border-gemini-border shadow-sm hover:shadow-md transition-all">
                       <div className="flex items-start md:items-center gap-3 md:gap-4">
                         <button 
                           onClick={() => toggleModuleCollapse(mod.id)}
                           className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gemini-bg border border-gemini-border flex items-center justify-center text-gemini-dim hover:text-gemini-accent transition-all shadow-sm shrink-0 mt-0.5 md:mt-0"
                         >
                           {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                         </button>
                         <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gemini-surface border-2 border-gemini-border flex items-center justify-center text-gemini-accent font-black text-xl md:text-2xl shadow-sm shrink-0 mt-0.5 md:mt-0">
                           {mIdx + 1}
                         </div>
                         <h2 className="text-lg md:text-2xl font-bold font-outfit text-gemini-text flex-1 break-words" contentEditable={!isPreviewMode} suppressContentEditableWarning={true} onBlur={(e) => {
                            const newModules = [...generatedCourse.modules];
                            newModules[mIdx].title = e.currentTarget.textContent || '';
                            setGeneratedCourse({...generatedCourse, modules: newModules});
                         }}>{mod.title}</h2>
                         <div className={`flex gap-1 transition-all ${isPreviewMode ? 'hidden' : 'opacity-0 group-hover/module:opacity-100'}`}>
                            <button onClick={() => moveModule(mIdx, 'up')} disabled={mIdx === 0} className="p-2 text-gemini-dim hover:text-gemini-accent disabled:opacity-20"><ArrowUp size={18} /></button>
                            <button onClick={() => moveModule(mIdx, 'down')} disabled={mIdx === generatedCourse.modules.length - 1} className="p-2 text-gemini-dim hover:text-gemini-accent disabled:opacity-20"><ArrowDown size={18} /></button>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setDeleteConfirm({ show: true, type: 'module', params: { moduleId: mod.id }, title: mod.title });
                              }} 
                              className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                         </div>
                       </div>

                       {!isCollapsed && (
                         <div className="border-l-2 border-gemini-border pl-6 md:pl-10 space-y-12 ml-4 md:ml-5">
                           {mod.lessons.map((lesson, lIdx) => (
                             <div key={lesson.id} className="space-y-6 group/lesson relative">
                               <div className="flex items-center justify-between">
                                 <h3 className="text-xl font-bold text-gemini-text group-hover/lesson:text-gemini-accent transition-colors cursor-text flex-1 break-words" contentEditable={!isPreviewMode} suppressContentEditableWarning={true} onBlur={(e) => {
                                    const newModules = [...generatedCourse.modules];
                                    newModules[mIdx].lessons[lIdx].title = e.currentTarget.textContent || '';
                                    setGeneratedCourse({...generatedCourse, modules: newModules});
                                 }}>{lesson.title}</h3>
                                 <div className={`flex gap-1 transition-all ${isPreviewMode ? 'hidden' : 'opacity-0 group-hover/lesson:opacity-100'}`}>
                                    <button onClick={() => moveLesson(mIdx, lIdx, 'up')} disabled={lIdx === 0} className="p-1.5 text-gemini-dim hover:text-gemini-accent disabled:opacity-20"><ArrowUp size={16}/></button>
                                    <button onClick={() => moveLesson(mIdx, lIdx, 'down')} disabled={lIdx === mod.lessons.length - 1} className="p-1.5 text-gemini-dim hover:text-gemini-accent disabled:opacity-20"><ArrowDown size={16}/></button>
                                    <button onClick={() => setDeleteConfirm({ show: true, type: 'lesson', params: { modId: mod.id, lesId: lesson.id }, title: lesson.title })} className="p-1.5 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                                 </div>
                               </div>

                               <div className="space-y-6">
                                 {lesson.content.map((block, bIdx) => {
                                   if (block.type === 'overview') return null;
                                   
                                   return (
                                     <React.Fragment key={block.id}>
                                       <div className={`flex items-center justify-center h-4 -my-2 group/inter transition-all relative z-20 ${isPreviewMode ? 'hidden' : 'opacity-0 hover:opacity-100'}`}>
                                          <button onClick={() => openAiModal({ action: "generate-text", modId: mod.id, lesId: lesson.id, blockId: block.id, title: "Ajouter du contenu ici", placeholder: "Sujet du nouveau bloc..." })} className="bg-gemini-accent text-gemini-bg p-1 rounded-full scale-75 hover:scale-100 transition-all shadow-xl">
                                             <Plus size={14} />
                                          </button>
                                          <div className="absolute left-0 right-0 h-px bg-gemini-accent/20 -z-10" />
                                       </div>

                                       <div className="relative group/block hover:ring-2 hover:ring-gemini-border/80 hover:bg-gemini-surface/50 rounded-3xl p-4 -mx-4 transition-all" data-block-id={block.id} data-mod-id={mod.id} data-les-id={lesson.id}>
                                          {block.type === 'text' && (
                                            <div className="prose-gemini" contentEditable={!isPreviewMode} suppressContentEditableWarning={true} onBlur={(e) => updateBlockValue(mod.id, lesson.id, block.id, e.currentTarget.textContent || '')} dangerouslySetInnerHTML={{ __html: marked.parse(block.value || '') }} />
                                          )}
                                          {block.type === 'image' && (
                                            <div className="rounded-3xl overflow-hidden border border-gemini-border shadow-lg">
                                              <img src={block.value} alt="" className="w-full h-auto" />
                                            </div>
                                          )}
                                          {block.type === 'ar' && (
                                            <ArModelBlock value={block.value} onUpload={(url) => updateBlockValue(mod.id, lesson.id, block.id, url)} isEditable={true} />
                                          )}
                                          {block.type === 'video' && (
                                            <div className="aspect-video rounded-3xl overflow-hidden bg-black border border-gemini-border shadow-lg">
                                              <iframe src={block.value} className="w-full h-full" allowFullScreen />
                                            </div>
                                          )}
                                          {block.type === 'quiz' && (
                                            <div className="bg-gemini-surface p-8 rounded-[2rem] border border-gemini-border shadow-md transition-shadow hover:shadow-lg">
                                              <p className="font-bold text-gemini-accent text-lg mb-6">{block.value.question}</p>
                                              <ul className="space-y-3">
                                                {block.value.options.map((o: string, i: number) => (
                                                  <li key={i} className={`p-4 rounded-2xl border font-medium transition-all cursor-pointer ${i === block.value.correctAnswer ? 'bg-gemini-accent/10 border-gemini-accent/40 text-gemini-accent' : 'bg-gemini-bg border-gemini-border text-gemini-dim hover:border-gemini-dim'}`}>{o}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                          {block.type === 'insight' && (
                                            <div className={`p-8 rounded-[2rem] border relative overflow-hidden group/insight animate-in zoom-in duration-500 bg-gemini-warning-bg border-gemini-warning-border text-gemini-warning-text`}>
                                              <div className="absolute top-0 right-0 p-4 opacity-5">
                                                <Sparkles size={120} className="text-current" />
                                              </div>
                                              <div className={`flex items-center gap-3 mb-3 text-gemini-warning-text`}>
                                                <Sparkles size={18} className="animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">{block.value.title || "AI Insight"}</span>
                                              </div>
                                              <div className="prose-gemini prose-sm text-gemini-warning-text font-medium" dangerouslySetInnerHTML={{ __html: marked.parse(block.value.content || '') }} />
                                            </div>
                                          )}
                                          
                                          <div className={`absolute -top-4 right-4 flex gap-1 transition-opacity bg-gemini-surface border border-gemini-border rounded-lg shadow-lg p-1 z-[100] ${isPreviewMode ? 'hidden' : 'opacity-0 group-hover/block:opacity-100'}`}>
                                            <button onClick={() => openAiModal({ action: 'refine-regenerate', modId: mod.id, lesId: lesson.id, blockId: block.id, title: 'Améliorer avec l\'IA', placeholder: 'Quelles modifications apporter ?' })} className="p-1.5 hover:bg-gemini-bg rounded text-gemini-dim hover:text-gemini-accent" title="Améliorer avec l'IA"><Sparkles size={14}/></button>
                                            <button onClick={() => moveBlock(mod.id, lesson.id, block.id, 'up')} className="p-1.5 hover:bg-gemini-bg rounded text-gemini-dim hover:text-gemini-text"><ArrowUp size={14}/></button>
                                            <button onClick={() => moveBlock(mod.id, lesson.id, block.id, 'down')} className="p-1.5 hover:bg-gemini-bg rounded text-gemini-dim hover:text-gemini-text"><ArrowDown size={14}/></button>
                                            <button onClick={() => setDeleteConfirm({ show: true, type: 'block', params: { modId: mod.id, lesId: lesson.id, blockId: block.id }, title: 'Bloc de contenu' })} className="p-1.5 hover:bg-red-500/10 rounded text-red-500/70 hover:text-red-500"><Trash2 size={14}/></button>
                                          </div>

                                          <div className={`absolute -bottom-5 left-1/2 -translate-x-1/2 transition-opacity z-20 py-2 ${isPreviewMode ? 'hidden' : 'opacity-0 group-hover/block:opacity-100'}`}>
                                            <div className="flex items-center gap-1 bg-gemini-surface border border-gemini-border rounded-full p-1 shadow-xl scale-75 hover:scale-100 transition-transform">
                                              <div className="relative">
                                                 <button 
                                                  onClick={() => setActiveRefinementMenu(activeRefinementMenu?.id === `${mod.id}:${lesson.id}:${block.id}` ? null : { type: 'block', id: `${mod.id}:${lesson.id}:${block.id}` })} 
                                                  className={`refinement-toggle p-2 rounded-full transition-all flex items-center gap-0.5 ${activeRefinementMenu?.id === `${mod.id}:${lesson.id}:${block.id}` ? 'bg-gemini-accent text-gemini-bg' : 'text-gemini-dim hover:text-gemini-accent hover:bg-gemini-bg'}`} 
                                                  title={t('create.toolbar.improve')}
                                                 >
                                                    <Sparkles size={14}/>
                                                    <ChevronDown size={10} />
                                                 </button>
                                                 {activeRefinementMenu?.id === `${mod.id}:${lesson.id}:${block.id}` && (
                                                    <RefinementDropdown type="block" id={`${mod.id}:${lesson.id}:${block.id}`} onAction={(actionId, p) => handleBlockAction(mod.id, lesson.id, block.id, `refine-${actionId}`, p)} />
                                                 )}
                                              </div>
                                              <div className="w-px h-4 bg-gemini-border mx-0.5" />
                                              <button onClick={() => openAiModal({ action: "generate-image", modId: mod.id, lesId: lesson.id, blockId: block.id, title: "Générer une Image", placeholder: "Décrivez l'image que vous souhaitez ajouter..." })} className="p-2 hover:bg-gemini-bg rounded-full text-gemini-dim hover:text-gemini-accent" title="Générer une Image"><ImageIcon size={14}/></button>
                                              <button onClick={() => handleBlockAction(mod.id, lesson.id, block.id, 'add-ar', '')} className="p-2 hover:bg-gemini-bg rounded-full text-gemini-dim hover:text-gemini-accent" title="Ajouter un Modèle 3D"><BoxSelect size={14}/></button>
                                              <button onClick={() => openAiModal({ action: "generate-video", modId: mod.id, lesId: lesson.id, blockId: block.id, title: "Générer une Vidéo", placeholder: "Décrivez le sujet de la vidéo explicative..." })} className="p-2 hover:bg-gemini-bg rounded-full text-gemini-dim hover:text-gemini-accent" title="Générer une Vidéo"><VideoIcon size={14}/></button>
                                              <button onClick={() => openAiModal({ action: "generate-quiz", modId: mod.id, lesId: lesson.id, blockId: block.id, title: "Générer un Quiz", placeholder: "Sur quel sujet doit porter le quiz ?" })} className="p-2 hover:bg-gemini-bg rounded-full text-gemini-dim hover:text-gemini-accent" title="Générer un Quiz"><HelpCircle size={14}/></button>
                                            </div>
                                          </div>
                                       </div>
                                     </React.Fragment>
                                   );
                                 })}
                                 <div className="flex items-center justify-center h-16 pt-4 animate-in slide-in-from-bottom-2 duration-500">
                                    <button 
                                      onClick={() => openAiModal({ action: "generate-text", modId: mod.id, lesId: lesson.id, title: "Ajouter du contenu", placeholder: "De quoi doit parler ce nouveau bloc ?" })} 
                                      className="flex items-center gap-3 px-8 py-3 bg-gemini-accent text-gemini-bg rounded-full text-xs font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all group"
                                    >
                                       <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" /> Ajouter du contenu
                                    </button>
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                   );
                 })}
                 
                 {!isPreviewMode && (<div className="pt-2 flex justify-center">
                    <button 
                       onClick={() => setIsAddModuleModalOpen(true)}
                      className="px-8 py-4 bg-gemini-surface/50 border-2 border-dashed border-gemini-border rounded-2xl text-gemini-dim font-bold text-xs uppercase tracking-widest hover:text-gemini-accent hover:border-gemini-accent transition-all flex items-center gap-3 w-full justify-center group"
                    >
                      <Layers size={16} className="group-hover:scale-110 transition-transform" /> Ajouter un module
                    </button>
                 </div>)}

                 {!isPreviewMode && (<div className="pt-8 flex justify-center">
                   <button onClick={() => setIsActionMenuOpen(true)} className="px-8 py-4 bg-gemini-surface border border-gemini-border rounded-full text-gemini-dim font-bold text-xs uppercase tracking-widest hover:text-gemini-text hover:border-gemini-dim transition-all flex items-center gap-3 shadow-xl">
                     <List size={16} /> Options du cours
                   </button>
                 </div>)}
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default CreatePage;