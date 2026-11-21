import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText as FileTextIcon } from 'lucide-react';

export default function StatCard({ icon, label, value, to, accent = false, delay = 0 }) {
  const Icon = icon || FileTextIcon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Link
        to={to || '#'}
        className="card group block p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
      >
        <div className="flex items-start justify-between">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              accent ? 'bg-accent text-white' : 'bg-accent-lavender text-accent dark:bg-accent/20'
            }`}
          >
            <Icon size={19} />
          </div>
        </div>
        <p className="mt-4 text-2xl font-extrabold tracking-tight">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-ink-soft">{label}</p>
      </Link>
    </motion.div>
  );
}
