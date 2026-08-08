/** The five asset kinds a language entry can carry. `audioOverview` is required for a language to be offered at all. */
export type AssetRole =
  | 'audioOverview'
  | 'slideDeck'
  | 'infographic'
  | 'flashcards'
  | 'digDeeper';

/** Every role except `digDeeper` holds exactly one file per language. */
export type SingleAssetRole = Exclude<AssetRole, 'digDeeper'>;

/** Where a published asset physically lives: the GitHub repo, or the Vercel Blob CDN. */
export type AssetDestination = 'repo' | 'blob';

export interface EpisodeAsset {
  name: string;
  size: number;
  url: string;
  dest: AssetDestination;
}

/** One further-reading document. `title`/`description` come from the file's YAML front-matter, or are derived from the filename when absent. */
export interface DigDeeperEntry {
  title: string;
  description: string;
  url: string;
}

export interface Devotional {
  quote: string;
  quoteSource: string;
  verse: string;
  verseRef: string;
  reflection: string;
}

/** `digDeeper` is the one multi-file role — an array that grows as documents are published, never overwritten. */
export interface LanguageAssets extends Partial<Record<SingleAssetRole, string>> {
  digDeeper?: DigDeeperEntry[];
}

export interface LanguageEntry {
  assets: LanguageAssets;
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
