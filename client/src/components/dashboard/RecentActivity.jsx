import React from 'react';
import { Sparkles, ListChecks, Layers, MessageSquareText } from 'lucide-react';
import { timeAgo } from '../../utils/format';

const TYPE_META = {
  summary: { icon: Sparkles, label: 'Summary generated', tone: 'bg-accent-lavender text-accent dark:bg-accent/20' },
  quiz: { icon: ListChecks, label: 'Quiz activity', tone: 'bg-emerald-50 text-success dark:bg-emerald-900/30' },
  flashcards: { icon: Layers, label: 'Flashcards', tone: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30' },
  chat: { icon: MessageSquareText, label: 'Asked Lumio', tone: 'bg-surface-mute text-ink-soft' },
};

export default function RecentActivity({ sessions }) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-bold">Recent Activity</h3>
      {sessions.length === 0 ? (
        <p className="py-8 text-center text-xs text-ink-soft">
          Your summaries, quizzes and study sessions will show up here.
        </p>
      ) : (
        <ul className="space-y-1">
          {sessions.map((s) => {
            const meta = TYPE_META[s.activityType] || TYPE_META.chat;
            return (
              <li key={s._id} className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-surface-mute dark:hover:bg-white/5">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.tone}`}>
                  <meta.icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{s.description}</p>
                  <p className="text-2xs text-ink-soft">
                    {meta.label} · {timeAgo(s.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
