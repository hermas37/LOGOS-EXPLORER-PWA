export interface HeavyMedia {
  spreadsheetUrl: string;
  infographicUrl: string;
  fullAudioUrl: string;
  coercedLoveAudioUrl: string;
}

export interface StudyOption {
  id: string;
  label: string;
  type: 'script' | 'slides' | 'audio' | 'quiz' | 'flashcards' | 'mindmap' | 'quotes';
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface Flashcard {
  term: string;
  definition: string;
}

export interface MindmapNode {
  name: string;
  children?: MindmapNode[];
}

export interface EpisodeManifest {
  episodeId: string;
  title: string;
  subtitle: string;
  heavyMedia: HeavyMedia;
  studySelector: StudyOption[];
  quizData: QuizQuestion[];
  flashcardData: Flashcard[];
  mindmapData: MindmapNode;
}
