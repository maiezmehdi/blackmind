
export type Language = 'fr' | 'en';

export type SubscriptionTier = 'free' | 'creator' | 'architect';

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
  color: string;
  email?: string;
  subscription: SubscriptionTier;
}

export interface AccessibilitySettings {
  // Profils Rapides
  dyslexiaMode: boolean;
  highContrast: boolean;
  simplifiedReading: boolean; // FALC styled
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  keyboardNav: boolean;
  audioReading: boolean; // Lecture audio
  adhdFocusMode: boolean; // Mode concentration TDAH

  // Personnalisation Avancée
  textSize: number; // 1 = 100%, 1.2 = 120%
  lineHeight: number; // 1.5 default
  letterSpacing: number; // 0 default
  reduceMotion: boolean;
  highlightLinks: boolean;
  fontFamily: 'default' | 'serif' | 'monospace' | 'dyslexic';
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  progress: number;
  author: string;
  workspace?: string; // ID de l'espace de travail associé
  modules: Module[];
  collaborators?: UserProfile[];
  allowRemix?: boolean; // Permet aux autres utilisateurs de cloner le cours
  originalCourseId?: string; // Référence au cours original si c'est un remix
  
  // Marketplace specific fields
  price?: string;
  rating?: number;
  students?: number;
  isMarketplace?: boolean;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  content: ContentBlock[];
}

export type BlockType = 'text' | 'image' | 'video' | 'quiz' | 'audio' | 'action' | 'exercise' | 'ar' | 'overview' | 'insight';

export interface ContentBlock {
  id: string;
  type: BlockType;
  value: any;
}

export interface QuizBlock {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

export interface WorkspaceMember {
  userId: string;
  role: WorkspaceRole;
  joinedAt: Date;
  profile: UserProfile; 
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  visibility: 'public' | 'private';
  members: WorkspaceMember[];
  ownerId: string;
  createdAt: Date;
}

export interface Invitation {
  id: string;
  email: string;
  workspaceId: string;
  role: WorkspaceRole;
  status: 'pending' | 'accepted' | 'rejected';
  sentAt: Date;
}
