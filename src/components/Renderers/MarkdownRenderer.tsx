import React, { useEffect, useState } from 'react';
import { FileText, Loader2, AlertTriangle, X } from 'lucide-react';
import { toFetchUrl } from './assetUrl';
import { stripFrontMatter } from '../../lib/digDeeper';

interface MarkdownRendererProps {
  url: string;
  title: string;
  /** When provided, an X control renders next to the title — used by Dig Deeper to return to its entry list. */
  onClose?: () => void;
}

type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'list-item'; text: string; depth: number }
  | { type: 'blockquote'; text: string }
  | { type: 'paragraph'; text: string };

function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ').trim() });
      paragraph = [];
    }
  };

  for (const rawLine of lines) {
    if (rawLine.trim() === '') {
      flushParagraph();
      continue;
    }

    const headingMatch = rawLine.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      blocks.push({ type: 'heading', level: headingMatch[1].length as 1 | 2 | 3, text: headingMatch[2].trim() });
      continue;
    }

    const quoteMatch = rawLine.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      blocks.push({ type: 'blockquote', text: quoteMatch[1].trim() });
      continue;
    }

    const listMatch = rawLine.match(/^(\t*)[-*]\s+(.*)$/);
    if (listMatch) {
      flushParagraph();
      blocks.push({ type: 'list-item', text: listMatch[2].trim(), depth: listMatch[1].length });
      continue;
    }

    const tabMatch = rawLine.match(/^(\t+)(.*)$/);
    if (tabMatch && tabMatch[2].trim() !== '') {
      flushParagraph();
      blocks.push({ type: 'list-item', text: tabMatch[2].trim(), depth: tabMatch[1].length });
      continue;
    }

    paragraph.push(rawLine.trim());
  }
  flushParagraph();
  return blocks;
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      nodes.push(
        <strong key={`${keyPrefix}-${idx++}`} className="font-semibold text-slate-100">
          {match[1]}
        </strong>
      );
    } else if (match[2] !== undefined) {
      nodes.push(
        <em key={`${keyPrefix}-${idx++}`} className="italic text-slate-200">
          {match[2]}
        </em>
      );
    } else if (match[3] !== undefined) {
      nodes.push(
        <code key={`${keyPrefix}-${idx++}`} className="px-1 py-0.5 rounded bg-slate-800 text-amber-300 text-[0.9em] font-mono">
          {match[3]}
        </code>
      );
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function renderBlocks(blocks: Block[]): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === 'list-item') {
      const items: Extract<Block, { type: 'list-item' }>[] = [];
      while (i < blocks.length) {
        const next = blocks[i];
        if (next.type !== 'list-item') break;
        items.push(next);
        i++;
      }
      out.push(
        <ul key={`list-${i}`} className="space-y-1.5 my-3">
          {items.map((item, idx) => (
            <li
              key={idx}
              style={{ marginLeft: `${Math.min(item.depth, 4) * 1.25}rem` }}
              className="flex items-start gap-2 text-sm text-slate-300 leading-relaxed"
            >
              <span className="text-amber-500 mt-1.5 shrink-0 text-[8px]">●</span>
              <span>{renderInline(item.text, `li-${i}-${idx}`)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (block.type === 'heading') {
      const sizeClass = block.level === 1 ? 'text-lg' : block.level === 2 ? 'text-base' : 'text-sm';
      const headingContent = renderInline(block.text, `h-${i}`);
      out.push(
        block.level === 1 ? (
          <h1 key={i} className={`${sizeClass} font-display font-bold text-amber-100 mt-5 mb-2 first:mt-0`}>
            {headingContent}
          </h1>
        ) : block.level === 2 ? (
          <h2 key={i} className={`${sizeClass} font-display font-bold text-amber-100 mt-5 mb-2 first:mt-0`}>
            {headingContent}
          </h2>
        ) : (
          <h3 key={i} className={`${sizeClass} font-display font-bold text-amber-100 mt-5 mb-2 first:mt-0`}>
            {headingContent}
          </h3>
        )
      );
      i++;
      continue;
    }

    if (block.type === 'blockquote') {
      out.push(
        <blockquote key={i} className="border-l-2 border-[#d97706]/50 pl-3 py-1 my-3 text-slate-400 italic text-sm">
          {renderInline(block.text, `q-${i}`)}
        </blockquote>
      );
      i++;
      continue;
    }

    out.push(
      <p key={i} className="text-sm text-slate-300 leading-relaxed my-3">
        {renderInline(block.text, `p-${i}`)}
      </p>
    );
    i++;
  }
  return out;
}

export default function MarkdownRenderer({ url, title, onClose }: MarkdownRendererProps) {
  const [state, setState] = useState<{ status: 'loading' | 'error' | 'ready'; content: string; error?: string }>({
    status: 'loading',
    content: '',
  });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', content: '' });
    fetch(toFetchUrl(url))
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.text();
      })
      .then((text) => {
        if (!cancelled) setState({ status: 'ready', content: stripFrontMatter(text) });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', content: '', error: err instanceof Error ? err.message : String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-5 h-5 text-amber-500 shrink-0" />
          <h3 className="font-display text-lg font-semibold text-slate-100 truncate">{title}</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {state.status === 'loading' && (
        <div className="flex items-center justify-center gap-2 h-40 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading…</span>
        </div>
      )}

      {state.status === 'error' && (
        <div className="flex flex-col items-center justify-center gap-2 h-40 text-center text-slate-400">
          <AlertTriangle className="w-6 h-6 text-rose-400" />
          <p className="text-xs">Could not load this document.</p>
          <p className="text-[10px] font-mono text-slate-600">{state.error}</p>
        </div>
      )}

      {state.status === 'ready' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">{renderBlocks(parseBlocks(state.content))}</div>
      )}
    </div>
  );
}
