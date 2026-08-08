/** Shared front-matter handling for Dig Deeper markdown, used at staging time (Admin) and at render time (MarkdownRenderer). */

const FRONT_MATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function readField(yaml: string, field: string): string | undefined {
  const match = yaml.match(new RegExp(`^${field}:\\s*(.*)$`, 'm'));
  return match ? stripQuotes(match[1]) : undefined;
}

/** Strip an `epNN_` prefix and `_lang` suffix, turn dashes/underscores into spaces, capitalise the first letter. */
export function deriveTitleFromFilename(fileName: string): string {
  let base = fileName.replace(/\.[^.]+$/, '');
  base = base.replace(/^ep\d+_/i, '');
  base = base.replace(/_[a-z]{2}$/i, '');
  base = base.replace(/[-_]+/g, ' ').trim();
  if (!base) return fileName;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export interface ParsedDigDeeper {
  title: string;
  description: string;
  body: string;
}

/** A `---`-delimited block at the very start of the file, containing `title`/`description`. Falls back to a filename-derived title when absent. */
export function parseDigDeeperMarkdown(text: string, fileName: string): ParsedDigDeeper {
  const match = text.match(FRONT_MATTER_RE);
  if (!match) {
    return { title: deriveTitleFromFilename(fileName), description: '', body: text };
  }
  const yaml = match[1];
  const body = text.slice(match[0].length);
  return {
    title: readField(yaml, 'title') ?? deriveTitleFromFilename(fileName),
    description: readField(yaml, 'description') ?? '',
    body,
  };
}

/** Removes the leading front-matter block, if any, before the markdown is rendered. */
export function stripFrontMatter(text: string): string {
  const match = text.match(FRONT_MATTER_RE);
  return match ? text.slice(match[0].length) : text;
}
