import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Play } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import { timeAgo } from '../../utils/format';

/** Recently opened notes with progress-style affordance. */
export default function ContinueLearning({ notes, loading }) {
  if (loading) {
    return (
      <div className="card p-5">
        <p className="mb-4 h-4 w-32 animate-pulse rounded bg-line" />
        <div className="space-y-2.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-mute" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold">Continue Learning</h3>
        <Link to="/notes" className="text-xs font-semibold text-accent hover:underline">
          View all
        </Link>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nothing yet"
          description="Upload a lecture note and it will appear here so you can pick up where you left off."
          className="border-0 bg-transparent p-6"
        />
      ) : (
        <ul className="space-y-2.5">
          {notes.map((note) => (
            <li key={note._id}>
              <Link
                to={`/notes/${note._id}`}
                className="group flex items-center gap-3 rounded-xl border border-line bg-surface-mute/50 p-3 transition-all hover:border-accent/30 hover:bg-accent-lavender/40 dark:border-white/10 dark:bg-white/5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-2xs font-bold text-accent dark:bg-accent/20">
                  {note.subject?.slice(0, 2).toUpperCase() || 'GE'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{note.title}</p>
                  <p className="mt-0.5 truncate text-2xs text-ink-soft">
                    {note.subject} · updated {timeAgo(note.updatedAt)}
                  </p>
                </div>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors group-hover:bg-accent group-hover:text-white">
                  <Play size={11} fill="currentColor" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
