/** The seven asset kinds a language entry can carry. `audioOverview` is required for a language to be offered at all. */
export type AssetRole =
  | 'audioOverview'
  | 'slideDeck'
  | 'infographic'
  | 'mindmap'
  | 'masterScript'
  | 'report'
  | 'flashcards';

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

export interface LanguageEntry {
  assets: Partial<Record<AssetRole, string>>;
  /** Hand-written, native-translation devotional. Null when this language hasn't written one yet. */
  devotional: Devotional | null;
}

export interface EpisodeManifest {
  episodeId: string;
  sequence: number;
  slug: string;
  title: string;
  subtitle: string;
  youtubeUrl: string | null;
  published: boolean;
  /** The language every other language's missing assets fall back to. */
  defaultLanguage: string;
  languages: Record<string, LanguageEntry>;
}

export interface Flashcard {
  front: string;
  back: string;
  note?: string;
}
