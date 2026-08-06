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

/** The eight asset kinds the publishing console recognizes from a NotebookLM export batch. */
export type AssetRole =
  | 'audioOverview'
  | 'videoOverview'
  | 'slideDeck'
  | 'infographic'
  | 'report'
  | 'transcript'
  | 'flashcards'
  | 'quiz';

/** Where a published asset physically lives: the GitHub repo, or the Vercel Blob CDN. */
export type AssetDestination = 'repo' | 'blob';

export interface EpisodeAsset {
  name: string;
  size: number;
  url: string;
  dest: AssetDestination;
}

export interface Devotional {
  quote: string;
  quoteSource: string;
  verse: string;
  verseRef: string;
  reflection: string;
}

export interface EpisodeManifest {
  episodeId: string;
  episodeNumber?: number;
  title: string;
  subtitle: string;
  transcriptUrl?: string;
  heavyMedia: HeavyMedia;
  studySelector: StudyOption[];
  quizData: QuizQuestion[];
  flashcardData: Flashcard[];
  mindmapData: MindmapNode;

  /** Stable folder name under `episodes/`, frozen the first time the episode is published. */
  slug?: string;
  youtubeUrl?: string;
  published?: boolean;
  devotional?: Devotional;
  /** Assets published through the console's drop-zone flow, keyed by role. */
  assets?: Partial<Record<AssetRole, EpisodeAsset>>;
}
