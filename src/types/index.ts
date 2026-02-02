export type SpeakerType = 'teacher' | 'student' | 'unknown';

export interface Caption {
  id: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
  speaker?: SpeakerType;
  isEdited?: boolean;
  originalText?: string;
}

export interface Bookmark {
  id: string;
  timestamp: number;
  captions: Caption[];
  note?: string;
}

export interface VocabularyTerm {
  term: string;
  definition?: string;
}

export interface VocabularyTopic {
  id: string;
  name: string;
  terms: VocabularyTerm[];
  isCustom?: boolean;
}

export interface GeneratedNotes {
  summary: string;
  bulletPoints: string[];
  keyTerms: { term: string; definition: string }[];
  formulas: string[];
  bookmarks?: Bookmark[];
}

export interface AppSettings {
  darkMode: boolean;
  largeText: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  highContrast?: boolean;
  lineSpacing?: 'normal' | 'relaxed' | 'loose';
  fontFamily?: 'default' | 'dyslexic' | 'mono';
  teacherOnlyMode?: boolean;
}

export interface Session {
  id: string;
  code: string;
  hostId: string;
  createdAt: number;
  isActive: boolean;
}

export interface SessionMessage {
  type: 'caption' | 'clear' | 'settings' | 'bookmark';
  payload: Caption | AppSettings | Bookmark | null;
  timestamp: number;
}
