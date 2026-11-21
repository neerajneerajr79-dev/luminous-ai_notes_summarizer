import React, { useState } from 'react';
import {
  Copy,
  Download,
  RefreshCw,
  Save,
  Layers,
  ListChecks,
  MessageSquareText,
  Check,
  Loader2,
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Markdown from '../common/Markdown';
import { downloadTextFile, truncate } from '../../utils/format';
import { SUMMARY_OPTIONS } from './SummaryTypePicker';

/** Renders the generated summary content plus key-points / definitions / formulas panels. */
export default function SummaryRenderer({
  summary,
  onRegenerate,
  saving,
  saved,
  onSave,
  onGenerateFlashcards,
  busyFlashcards,
  onGenerateQuiz,
  busyQuiz,
}) {
  const [copied, setCopied] = useState(false);
  const meta = SUMMARY_OPTIONS.find((o) => o.id === summary.summaryType);
  const title = summary.title || 'Untitled summary';

  const copy = async () => {
    await navigator.clipboard.writeText(summary.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const hasExtras =
    summary.keyPoints?.length > 0 || summary.definitions?.length > 0 || summary.formulas?.length > 0;

  return (
    <div className="space-y-5">
      {hasExtras && (
        <div className="grid gap-3 sm:grid-cols-3">
          {summary.keyPoints?.length > 0 && (
            <div className="card p-4">
              <p className="mb-2 text-2xs font-bold uppercase tracking-widest text-ink-soft">Key points</p>
              <ul className="space-y-1.5">
                {summary.keyPoints.slice(0, 6).map((p, i) => (
                  <li key={i} className="text-2xs leading-relaxed text-ink-soft">• {truncate(p, 110)}</li>
                ))}
              </ul>
            </div>
          )}
          {summary.definitions?.length > 0 && (
            <div className="card p-4">
              <p className="mb-2 text-2xs font-bold uppercase tracking-widest text-ink-soft">Definitions</p>
              <ul className="space-y-1.5">
                {summary.definitions.slice(0, 5).map((d, i) => (
                  <li key={i} className="text-2xs leading-relaxed text-ink-soft">
                    <span className="font-bold text-ink">{truncate(d.term, 30)}:</span> {truncate(d.definition, 90)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {summary.formulas?.length > 0 && (
            <div className="card bg-gradient-to-br from-accent-lavender/60 to-white p-4 dark:from-accent/10 dark:to-transparent">
              <p className="mb-2 text-2xs font-bold uppercase tracking-widest text-ink-soft">Formulas</p>
              <ul className="space-y-2">
                {summary.formulas.slice(0, 6).map((f, i) => (
                  <li key={i} className="rounded-lg bg-white px-3 py-1.5 px-1 font-mono text-2xs shadow-soft dark:bg-white/10" style={{ padding: '6px 10px' }}>
                    {truncate(f, 80)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line bg-surface-mute/50 px-5 py-3.5 dark:border-white/10">
          <Badge>{meta?.title || 'Summary'}</Badge>
          <p className="min-w-0 flex-1 truncate text-xs font-semibold text-ink-soft" title={title}>
            {title}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={copy} icon={copied ? Check : Copy}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={Download}
              onClick={() => downloadTextFile(summary.content, `${title.replace(/[^\w-]+/g, '-').slice(0, 60) || 'lumio-summary'}.md`)}
            >
              Export
            </Button>
            {onRegenerate && (
              <Button variant="ghost" size="sm" icon={RefreshCw} onClick={onRegenerate}>
                Regenerate
              </Button>
            )}
            {onSave && (
              <Button
                variant="ghost"
                size="sm"
                icon={saved ? Check : Save}
                onClick={onSave}
                loading={saving}
                disabled={saved}
              >
                {saved ? 'Saved' : 'Save'}
              </Button>
            )}
          </div>
        </div>

        <article className="px-6 py-6">
          <Markdown>{summary.content}</Markdown>
        </article>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {onGenerateFlashcards && (
          <Button variant="secondary" icon={Layers} onClick={onGenerateFlashcards} loading={busyFlashcards}>
            Create flashcards
          </Button>
        )}
        {onGenerateQuiz && (
          <Button variant="secondary" icon={ListChecks} onClick={onGenerateQuiz} loading={busyQuiz}>
            Generate quiz
          </Button>
        )}
        <Button variant="outline" icon={MessageSquareText} onClick={() => (window.location.href = '/ask')}>
          Ask AI about this
        </Button>
      </div>
    </div>
  );
}
