import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Sparkles, Layers, ListChecks, CalendarCheck2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import StatCard from '../components/dashboard/StatCard';
import QuickActions from '../components/dashboard/QuickActions';
import ContinueLearning from '../components/dashboard/ContinueLearning';
import RecentActivity from '../components/dashboard/RecentActivity';
import WeeklyChart from '../components/dashboard/WeeklyChart';
import { SkeletonCard, Skeleton } from '../components/common/Skeleton';
import { formatDate } from '../utils/format';

export default function DashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = React.useState(null);
  const [activity, setActivity] = React.useState(null);
  const [error, setError] = React.useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([api.get('/dashboard/stats'), api.get('/dashboard/activity')])
      .then(([statsRes, activityRes]) => {
        if (!alive) return;
        setStats(statsRes.data.data.stats);
        setActivity(activityRes.data.data.activity);
      })
      .catch((err) => {
        if (alive) {
          setError(err.message);
          toast(err.message, 'error');
        }
      });
    return () => {
      alive = false;
    };
  }, [toast]);

  if (error) {
    return (
      <div className="card border-red-200 p-8 text-center dark:border-red-900">
        <p className="font-semibold text-red-500">Could not load your dashboard</p>
        <p className="mt-1.5 text-sm text-ink-soft">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-xs font-semibold text-accent hover:underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats ? (
          <>
            <StatCard icon={FileText} label="Total notes" value={stats.totalNotes} to="/notes" accent delay={0} />
            <StatCard icon={Sparkles} label="Summaries generated" value={stats.summariesGenerated} to="/summarizer" delay={0.05} />
            <StatCard icon={Layers} label="Flashcards created" value={stats.flashcardsCreated} to="/flashcards" delay={0.1} />
            <StatCard icon={ListChecks} label="Study sessions" value={stats.studySessionsCompleted} to="/quizzes" delay={0.15} />
          </>
        ) : (
          [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
        )}
      </div>

      {/* Due flashcards banner */}
      {stats?.dueFlashcards > 0 && (
        <Link
          to="/flashcards?mode=due"
          className="flex items-center gap-3 rounded-2xl border border-accent/20 bg-gradient-to-r from-accent-lavender to-white px-5 py-4 transition-all hover:shadow-glow dark:border-accent/30 dark:from-accent/20 dark:to-transparent"
        >
          <CalendarCheck2 size={20} className="shrink-0 text-accent" />
          <p className="flex-1 text-sm">
            <span className="font-bold">{stats.dueFlashcards}</span>{' '}
            {stats.dueFlashcards === 1 ? 'flashcard is' : 'flashcards are'} due for revision today.
          </p>
          <span className="text-xs font-bold text-accent">Review now →</span>
        </Link>
      )}

      <QuickActions />

      <div className="grid gap-5 lg:grid-cols-2">
        <ContinueLearning notes={activity?.recentNotes || []} loading={!activity} />

        <div className="space-y-5">
          {activity ? (
            <>
              <WeeklyChart data={activity.weekly} />
              <RecentActivity sessions={activity.recentSessions} />
            </>
          ) : (
            <div className="card p-5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-4 h-44 w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
