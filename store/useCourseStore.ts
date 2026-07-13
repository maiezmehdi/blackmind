
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Course, UserProfile, Workspace, Invitation, WorkspaceMember, Language, SubscriptionTier, AccessibilitySettings, AppPreferences } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

// A course has no real per-lesson duration data, so activity/goal progress is
// estimated using a flat reading-time assumption per lesson visited.
export const MINUTES_PER_LESSON = 8;

export interface WeeklyGoal {
  id: string;
  title: string;
  target: number;
  unit: 'lessons' | 'minutes';
}

interface CourseContextType {
  courses: Course[];
  marketplaceCourses: Course[];
  workspaces: Workspace[];
  invitations: Invitation[];
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  activeCourse: Course | null;
  language: Language;
  accessibility: AccessibilitySettings;
  preferences: AppPreferences;
  studyLog: Record<string, number>;
  weeklyGoals: WeeklyGoal[];

  // Helpers
  t: (key: string, variables?: any) => string;
  setLanguage: (lang: Language) => void;
  updateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  resetAccessibility: () => void;
  updatePreferences: (prefs: Partial<AppPreferences>) => void;
  resetPreferences: () => void;
  logLessonActivity: () => void;
  addWeeklyGoal: (title: string, target: number, unit: 'lessons' | 'minutes') => void;
  removeWeeklyGoal: (id: string) => void;

  setActiveCourse: (course: Course | null) => void;
  addCourse: (course: Course) => void;
  updateCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;
  shareCourse: (courseId: string, user: UserProfile) => void;
  remixCourse: (courseId: string) => Course | null;
  buyCourse: (course: Course) => Course;
  sellCourse: (courseId: string, price: string) => void;
  
  // User Actions
  login: (email?: string, password?: string) => Promise<void>;
  signup: (name: string, email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  upgradeSubscription: (tier: SubscriptionTier) => void;
  
  // Workspace Actions
  addWorkspace: (name: string, visibility: 'public' | 'private') => void;
  deleteWorkspace: (id: string) => void;
  sendInvitation: (workspaceId: string, email: string) => void;
  getWorkspaceMembers: (workspaceId: string) => WorkspaceMember[];
}

const DEFAULT_USER: UserProfile = {
  id: 'user-1',
  name: 'John Doe',
  initials: 'JD',
  color: 'bg-neutral-800',
  email: 'john.doe@blackmind.ai',
  avatar: undefined,
  subscription: 'free'
};

const DEFAULT_PREFERENCES: AppPreferences = {
  notifications: {
    email: true,
    push: false,
    aiUpdates: true,
  },
  showAiAssistant: true,
};

const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  dyslexiaMode: false,
  highContrast: false,
  simplifiedReading: false,
  colorBlindMode: 'none',
  keyboardNav: false,
  audioReading: false,
  adhdFocusMode: false,
  textSize: 1,
  lineHeight: 1.5,
  letterSpacing: 0,
  reduceMotion: false,
  highlightLinks: false,
  fontFamily: 'default'
};

const MOCKUP_WORKSPACES: Workspace[] = [
  {
    id: 'ws-1',
    name: 'Design Team',
    visibility: 'private',
    ownerId: 'user-1',
    createdAt: new Date(),
    members: [
      { userId: 'user-1', role: 'owner', joinedAt: new Date(), profile: DEFAULT_USER },
    ]
  }
];

// Helper to create basic content for marketplace courses so they are functional
const createBasicModules = (title: string): any[] => [
  {
    id: `m-${Math.random()}`,
    title: "Introduction",
    lessons: [
      {
        id: `l-${Math.random()}`,
        title: "Bienvenue dans le cours",
        content: [
          { id: `b-${Math.random()}`, type: 'text', value: `# Bienvenue dans ${title}\n\nMerci d'avoir acheté ce cours. Ce contenu a été généré pour vous donner un aperçu de la structure.` },
          { id: `b-${Math.random()}`, type: 'image', value: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200' }
        ]
      }
    ]
  }
];

const MOCKUP_MARKETPLACE_COURSES: Course[] = [
  {
    id: 'f1',
    title: "L'Art du Prompt Engineering Avancé",
    description: "Apprenez les techniques secrètes utilisées par les experts pour dompter les LLM les plus puissants du marché. Un guide complet.",
    author: "Gemini Master",
    price: "49.00 €",
    rating: 4.9,
    students: 1250,
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200",
    category: "IA",
    progress: 0,
    modules: createBasicModules("L'Art du Prompt Engineering"),
    allowRemix: true
  },
  {
    id: 'm1',
    title: "Masterclass UI/UX Minimaliste",
    description: "Les principes fondamentaux pour créer des interfaces épurées et fonctionnelles.",
    author: "Elena Design",
    price: "29.90 €",
    rating: 4.8,
    students: 850,
    image: "https://images.unsplash.com/photo-1541462608141-ad4371eecc47?auto=format&fit=crop&q=80&w=600",
    category: "Design",
    progress: 0,
    modules: createBasicModules("Masterclass UI/UX Minimaliste"),
    allowRemix: false
  },
  {
    id: 'm2',
    title: "Python pour la Data Science",
    description: "De zéro à héros : analysez des données complexes avec Pandas et NumPy.",
    author: "Data Mindset",
    price: "19.90 €",
    rating: 4.7,
    students: 2300,
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600",
    category: "Développement",
    progress: 0,
    modules: createBasicModules("Python pour la Data Science"),
    allowRemix: true
  },
  {
    id: 'm3',
    title: "Psychologie du Consommateur",
    description: "Comprendre pourquoi vos clients achètent (ou pas).",
    author: "Neuromarketing Lab",
    price: "34.00 €",
    rating: 4.9,
    students: 540,
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=600",
    category: "Business",
    progress: 0,
    modules: createBasicModules("Psychologie du Consommateur"),
    allowRemix: true
  },
  {
    id: 'm4',
    title: "Astrophysique de poche",
    description: "L'univers expliqué simplement. Idéal pour les curieux.",
    author: "Dr. Stellar",
    price: "Gratuit",
    rating: 5.0,
    students: 15000,
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=600",
    category: "Science",
    progress: 0,
    modules: createBasicModules("Astrophysique de poche"),
    allowRemix: true
  },
  {
    id: 'm5',
    title: "React 19 & Concurrent Mode",
    description: "Préparez-vous au futur du développement frontend avec React 19.",
    author: "Hooks Ninja",
    price: "25.00 €",
    rating: 4.6,
    students: 900,
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=600",
    category: "Développement",
    progress: 0,
    modules: createBasicModules("React 19 & Concurrent Mode"),
    allowRemix: true
  },
  {
    id: 'm6',
    title: "Anglais pour Voyageurs",
    description: "Le vocabulaire essentiel pour survivre n'importe où dans le monde.",
    author: "Globe Talk",
    price: "12.00 €",
    rating: 4.5,
    students: 320,
    image: "https://images.unsplash.com/photo-1488646015482-84409964510e?auto=format&fit=crop&q=80&w=600",
    category: "Langues",
    progress: 0,
    modules: createBasicModules("Anglais pour Voyageurs"),
    allowRemix: true
  }
];

const MOCKUP_COURSES: Course[] = [
  {
    id: 'mock-1',
    title: "Introduction à l'Astrophysique",
    description: "Explorez les mystères de l'univers, des trous noirs aux galaxies lointaines.",
    category: "Science",
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=800",
    progress: 15,
    author: "Dr. Cosmos",
    workspace: "ws-1",
    allowRemix: true,
    collaborators: [],
    modules: [
      {
        id: 'm1',
        title: "Les Fondements de l'Espace",
        lessons: [
          {
            id: 'l1',
            title: "Le Big Bang et l'Origine",
            content: [
              { 
                id: 'b1', 
                type: 'text', 
                value: "### L'Aube du Temps\nLe Big Bang n'était pas une explosion *dans* l'espace, mais une expansion rapide de l'espace lui-même. Il y a environ 13,8 milliards d'années, tout l'univers était concentré dans un point d'une densité infinie, appelé singularité.\n\n**Visualisez l'expansion ci-dessous en Réalité Augmentée.**" 
              },
              {
                id: 'b2',
                type: 'image',
                value: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=1200'
              },
              {
                id: 'b-ar-1',
                type: 'ar',
                value: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'
              },
              {
                id: 'b3',
                type: 'quiz',
                value: {
                  question: "Quel est l'âge approximatif de l'univers ?",
                  options: ["10 milliards d'années", "13.8 milliards d'années", "4.5 milliards d'années"],
                  correctAnswer: 1
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'mock-2',
    title: "Maîtriser le Prompt Engineering",
    description: "Apprenez à communiquer efficacement avec les modèles de langage comme Gemini.",
    category: "AI",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
    progress: 0,
    author: "AI Expert",
    allowRemix: true,
    collaborators: [],
    modules: [
      {
        id: 'pm1',
        title: "Les Bases",
        lessons: [
          {
            id: 'pl1',
            title: "Le Framework Context-Task-Format",
            content: [
              {
                id: 'pb1',
                type: 'text', 
                value: "Pour obtenir le meilleur d'une IA, vous devez lui donner un contexte, une tâche précise, et le format de réponse souhaité."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'mock-3',
    title: "Design Minimaliste avec Tailwind",
    description: "Créez des interfaces modernes et épurées en utilisant la puissance de Tailwind CSS.",
    category: "Design",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800",
    progress: 45,
    author: "UI Master",
    allowRemix: false,
    collaborators: [],
    modules: [
      {
        id: 'dm1',
        title: "Principes du Design",
        lessons: [
          {
            id: 'dl1',
            title: "L'importance du vide (White Space)",
            content: [
              {
                id: 'db1',
                type: 'text',
                value: "Le vide n'est pas une absence de contenu, c'est un élément de design à part entière qui guide l'œil de l'utilisateur."
              }
            ]
          }
        ]
      }
    ]
  }
];

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export const CourseProvider = ({ children }: { children?: React.ReactNode }) => {
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('blackmind_courses');
    return saved ? JSON.parse(saved) : MOCKUP_COURSES;
  });
  
  const [marketplaceCourses, setMarketplaceCourses] = useState<Course[]>(MOCKUP_MARKETPLACE_COURSES);

  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = localStorage.getItem('blackmind_workspaces');
    return saved ? JSON.parse(saved) : MOCKUP_WORKSPACES;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('blackmind_user');
    return saved ? JSON.parse(saved) : null;
  });

  const { language, setLanguage, t } = useLanguage();

  const [accessibility, setAccessibility] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('blackmind_accessibility');
    return saved ? JSON.parse(saved) : DEFAULT_ACCESSIBILITY;
  });

  const [preferences, setPreferences] = useState<AppPreferences>(() => {
    const saved = localStorage.getItem('blackmind_preferences');
    return saved ? { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) } : DEFAULT_PREFERENCES;
  });

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);

  const [studyLog, setStudyLog] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('blackmind_study_log');
    return saved ? JSON.parse(saved) : {};
  });

  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>(() => {
    const saved = localStorage.getItem('blackmind_weekly_goals');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('blackmind_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('blackmind_study_log', JSON.stringify(studyLog));
  }, [studyLog]);

  useEffect(() => {
    localStorage.setItem('blackmind_weekly_goals', JSON.stringify(weeklyGoals));
  }, [weeklyGoals]);

  useEffect(() => {
    localStorage.setItem('blackmind_workspaces', JSON.stringify(workspaces));
  }, [workspaces]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('blackmind_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('blackmind_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('blackmind_accessibility', JSON.stringify(accessibility));
  }, [accessibility]);

  useEffect(() => {
    localStorage.setItem('blackmind_preferences', JSON.stringify(preferences));
  }, [preferences]);

  const updatePreferences = useCallback((prefs: Partial<AppPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...prefs,
      notifications: { ...prev.notifications, ...(prefs.notifications || {}) },
    }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  const updateAccessibility = useCallback((settings: Partial<AccessibilitySettings>) => {
    setAccessibility(prev => ({ ...prev, ...settings }));
  }, []);

  const resetAccessibility = useCallback(() => {
    setAccessibility(DEFAULT_ACCESSIBILITY);
  }, []);

  const login = useCallback(async (email?: string, password?: string) => {
    // Simulate API Delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real app, validate credentials here. 
    // For prototype, we log in as default user if email matches default, or create a mock session for any email
    const user: UserProfile = {
      id: 'user-1',
      name: 'Utilisateur',
      initials: (email ? email.substring(0, 2).toUpperCase() : 'ME'),
      color: 'bg-gemini-accent',
      email: email || 'user@example.com',
      subscription: 'free'
    };
    setCurrentUser(user);
  }, []);

  const signup = useCallback(async (name: string, email: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const user: UserProfile = {
      id: `user-${Math.random().toString(36).substr(2, 9)}`,
      name: name,
      initials: name.substring(0, 2).toUpperCase(),
      color: 'bg-indigo-600',
      email: email,
      subscription: 'free'
    };
    setCurrentUser(user);
  }, []);

    const loginWithGoogle = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const name = window.prompt("Nom d'utilisateur :", "Alexandre Dupont");
    if (!name) return; // Cancelled
    const user: UserProfile = {
      id: 'user-google-' + Math.random().toString(36).substr(2, 5),
      name: name,
      initials: name.substring(0,2).toUpperCase(),
      color: 'bg-gemini-dim',
      email: name.toLowerCase().replace(' ', '.') + '@gmail.com',
      subscription: 'free'
    };
    setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('blackmind_user');
  }, []);

  const upgradeSubscription = useCallback((tier: SubscriptionTier) => {
    setCurrentUser(prev => prev ? ({ ...prev, subscription: tier }) : null);
  }, []);

  const addCourse = useCallback((course: Course) => {
    setCourses(prev => {
      const exists = prev.find(c => c.id === course.id);
      if (exists) return prev.map(c => c.id === course.id ? course : c);
      return [course, ...prev];
    });
  }, []);

  const buyCourse = useCallback((course: Course) => {
    // Clone the course to the user's library
    const newCourse: Course = {
      ...course,
      id: `${course.id}-bought-${Date.now()}`, // Ensure unique ID
      progress: 0,
      isMarketplace: false, // It is now a user course
    };
    setCourses(prev => [newCourse, ...prev]);
    return newCourse;
  }, []);

  // Lists a course on the Marketplace: marks it for sale and mirrors it into
  // marketplaceCourses so it actually shows up on the Marketplace page.
  const sellCourse = useCallback((courseId: string, price: string) => {
    setCourses(prev => {
      const course = prev.find(c => c.id === courseId);
      if (!course) return prev;
      const listedCourse: Course = { ...course, price, isMarketplace: true, rating: course.rating ?? 5.0, students: course.students ?? 0 };
      setMarketplaceCourses(mp => {
        const exists = mp.find(c => c.id === courseId);
        return exists ? mp.map(c => (c.id === courseId ? listedCourse : c)) : [listedCourse, ...mp];
      });
      return prev.map(c => (c.id === courseId ? listedCourse : c));
    });
  }, []);

  const updateCourse = useCallback((updatedCourse: Course) => {
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    if (activeCourse?.id === updatedCourse.id) setActiveCourse(updatedCourse);
  }, [activeCourse]);

  const deleteCourse = useCallback((id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    if (activeCourse?.id === id) setActiveCourse(null);
  }, [activeCourse]);

  const shareCourse = useCallback((courseId: string, user: UserProfile) => {
    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        const collaborators = c.collaborators || [];
        if (collaborators.find(u => u.id === user.id)) return c;
        return { ...c, collaborators: [...collaborators, user] };
      }
      return c;
    }));
  }, []);

  const remixCourse = useCallback((courseId: string) => {
    if (!currentUser) return null;
    const original = courses.find(c => c.id === courseId);
    if (!original || !original.allowRemix) return null;

    const remixed: Course = {
      ...original,
      id: `remix-${Math.random().toString(36).substr(2, 9)}`,
      title: `${original.title} (Remix)`,
      progress: 0,
      author: currentUser.name,
      originalCourseId: original.id,
      collaborators: [],
      workspace: undefined
    };
    
    setCourses(prev => [remixed, ...prev]);
    return remixed;
  }, [courses, currentUser]);

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    setCurrentUser(prev => prev ? ({ ...prev, ...updates }) : null);
  }, []);

  const addWorkspace = useCallback((name: string, visibility: 'public' | 'private') => {
    if (!currentUser) return;
    const newWorkspace: Workspace = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      visibility,
      ownerId: currentUser.id,
      createdAt: new Date(),
      members: [
        { userId: currentUser.id, role: 'owner', joinedAt: new Date(), profile: currentUser }
      ]
    };
    setWorkspaces(prev => [...prev, newWorkspace]);
  }, [currentUser]);

  const deleteWorkspace = useCallback((id: string) => {
    setWorkspaces(prev => prev.filter(w => w.id !== id));
    // Un-assign courses that lived in this workspace rather than deleting
    // them — the workspace is just a collaboration grouping, not ownership.
    setCourses(prev => prev.map(c => c.workspace === id ? { ...c, workspace: undefined } : c));
  }, []);

  const sendInvitation = useCallback((workspaceId: string, email: string) => {
    const newInvitation: Invitation = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      workspaceId,
      role: 'editor',
      status: 'pending',
      sentAt: new Date()
    };
    setInvitations(prev => [...prev, newInvitation]);
  }, []);

  // Called whenever a lesson is viewed in LearnPage — the only real signal
  // of study activity this client-only app has, so it doubles as the source
  // for the daily activity chart, hours estimate, and streak.
  const logLessonActivity = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    setStudyLog(prev => ({ ...prev, [today]: (prev[today] || 0) + 1 }));
  }, []);

  const addWeeklyGoal = useCallback((title: string, target: number, unit: 'lessons' | 'minutes') => {
    const goal: WeeklyGoal = { id: Math.random().toString(36).substr(2, 9), title, target, unit };
    setWeeklyGoals(prev => [...prev, goal]);
  }, []);

  const removeWeeklyGoal = useCallback((id: string) => {
    setWeeklyGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  const getWorkspaceMembers = useCallback((workspaceId: string) => {
    const ws = workspaces.find(w => w.id === workspaceId);
    return ws ? ws.members : [];
  }, [workspaces]);

  return React.createElement(
    CourseContext.Provider,
    { value: { 
      courses, 
      marketplaceCourses,
      activeCourse, 
      language,
      setLanguage,
      accessibility,
      updateAccessibility,
      resetAccessibility,
      preferences,
      updatePreferences,
      resetPreferences,
      studyLog,
      weeklyGoals,
      logLessonActivity,
      addWeeklyGoal,
      removeWeeklyGoal,
      t,
      setActiveCourse, 
      addCourse, 
      updateCourse, 
      deleteCourse, 
      shareCourse,
      remixCourse,
      buyCourse,
      sellCourse,
      workspaces,
      invitations,
      currentUser,
      isAuthenticated: !!currentUser,
      login,
      signup,
      loginWithGoogle,
      logout,
      updateUserProfile,
      upgradeSubscription,
      addWorkspace,
      deleteWorkspace,
      sendInvitation,
      getWorkspaceMembers
    } },
    children
  );
};

export const useCourseContext = () => {
  const context = useContext(CourseContext);
  if (!context) throw new Error('useCourseContext must be used within a CourseProvider');
  return context;
};
