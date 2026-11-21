import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UploadCloud, Sparkles, Layers, ListChecks, FileText } from 'lucide-react';

const ACTIONS = [
  { to: '/summarizer', label: 'Upload new notes', description: 'PDF, DOCX, PPTX, TXT', icon: UploadCloud },
  { to: '/summarizer', label: 'Summarize content', description: '5 summary styles', icon: Sparkles },
  { to: '/flashcards', label: 'Create flashcards', description: 'Auto-generated Q&A', icon: Layers },
  { to: '/quizzes', label: 'Generate a quiz', description: 'Practice questions', icon: ListChecks },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ACTIONS.map((a, i) => (
        <motion.div
          key={a.label}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 * i }}
        >
          <Link
            to={a.to}
            className="card group flex h-full flex-col items-start gap-2.5 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lift"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-lavender text-accent transition-colors group-hover:bg-accent group-hover:text-white dark:bg-accent/20">
              <a.icon size={17} />
            </span>
            <div>
              <p className="text-xs font-bold">{a.label}</p>
              <p className="mt-0.5 text-2xs text-ink-soft">{a.description}</p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
