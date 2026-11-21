import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarRange,
  Plus,
  Circle,
  CircleCheck,
  Trash2,
  Layers,
  Sun,
  CalendarClock,
  CalendarCheck2,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import { SkeletonList } from '../components/common/Skeleton';
import { shortDate } from '../utils/format';
import clsx from 'clsx';
import { format } from 'date-fns';

export default function PlannerPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', subject: 'General', dueDate: '' });
  const [busy, setBusy] = useState(false);
  const [flashcardsDue, setFlashcardsDue] = useState(0);

  useEffect(() => {
    loadTasks();
    api
      .get('/flashcards?due=true')
      .then((res) => setFlashcardsDue(res.data.data.flashcards.length))
      .catch(() => {});
  }, []);

  const loadTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data.data.tasks);
    } catch (err) {
      setTasks([]);
      toast(err.message, 'error');
    }
  };

  const addTask = async () => {
    if (!form.title.trim()) {
      toast('Task title is required', 'warning');
      return;
    }
    setBusy(true);
    try {
      await api.post('/tasks', { ...form, dueDate: form.dueDate || null });
      toast('Task added', 'success');
      setAddOpen(false);
      setForm({ title: '', subject: 'General', dueDate: '' });
      loadTasks();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggleTask = async (task) => {
    try {
      await api.patch(`/tasks/${task._id}`, { completed: !task.completed });
      setTasks((t) =>
        t?.map((x) => (x._id === task._id ? { ...x, completed: !task.completed } : x))
      );
      if (!task.completed) toast('Task completed — great progress!', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const removeTask = async (task) => {
    try {
      await api.delete(`/tasks/${task._id}`);
      setTasks((t) => t?.filter((x) => x._id !== task._id));
      toast('Task removed', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const { today, upcoming, completed } = useMemo(() => {
    const list = tasks || [];
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday); endOfToday.setDate(endOfToday.getDate() + 1);
    const openTasks = list.filter((t) => !t.completed);
    return {
      today: openTasks.filter((t) => t.dueDate && new Date(t.dueDate) < endOfToday),
      upcoming: openTasks.filter((t) => !t.dueDate || new Date(t.dueDate) >= endOfToday),
      completed: list.filter((t) => t.completed),
    };
  }, [tasks]);

  const weeklyProgress = useMemo(() => {
    const all = tasks || [];
    const total = all.length;
    const done = all.filter((t) => t.completed).length;
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [tasks]);

  const subjects = useMemo(() => {
    const docs = new Set(['General']);
    (tasks || []).forEach((t) => t.subject && docs.add(t.subject));
    return [...docs];
  }, [tasks]);

  const TaskRow = ({ task }) => {
    const overdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
    return (
      <div className="group flex items-center gap-3 rounded-xl border border-line bg-white p-3.5 transition-all hover:shadow-soft dark:border-white/10 dark:bg-transparent">
        <button
          onClick={() => toggleTask(task)}
          className={clsx('shrink-0 rounded-full', task.completed ? 'text-success' : 'text-ink-soft hover:text-accent')}
          title={task.completed ? 'Mark as pending' : 'Mark as done'}
        >
          {task.completed ? <CircleCheck size={20} /> : <Circle size={20} className="opacity-60" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={clsx('text-xs font-bold', task.completed && 'text-ink-soft line-through')}>
            {task.title}
          </p>
          <p className="mt-0.5 flex items-center gap-2 text-2xs text-ink-soft">
            <Badge tone="gray">{task.subject}</Badge>
            {task.dueDate && (
              <span className={clsx(overdue && 'font-bold text-red-500')}>
                {overdue ? 'Overdue' : dueLabel(task.dueDate)}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => removeTask(task)}
          className="rounded-lg p-1.5 text-red-400 opacity-0 hover:bg-red-50 group-hover:opacity-100"
          title="Delete task"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Study Planner</h1>
          <p className="text-xs text-ink-soft">Keep your learning on schedule</p>
        </div>
        <Button className="ml-auto" icon={Plus} onClick={() => setAddOpen(true)}>
          Add task
        </Button>
      </div>

      {/* Progress + revision banner */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs font-bold text-ink-soft">Overall progress</p>
          <p className="mt-2 text-3xl font-extrabold">{weeklyProgress.pct}%</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${weeklyProgress.pct}%` }} />
          </div>
          <p className="mt-2 text-2xs text-ink-soft">
            {weeklyProgress.done} of {weeklyProgress.total} tasks completed
          </p>
        </div>

        <div className="card p-5">
          <p className="text-xs font-bold text-ink-soft">Today</p>
          <p className="mt-2 text-3xl font-extrabold">{today.length}</p>
          <p className="mt-2 text-2xs text-ink-soft">tasks due today or overdue</p>
        </div>

        <div className="card bg-gradient-to-br from-accent-lavender to-white p-5 dark:from-accent/15 dark:to-transparent">
          <div className="flex items-center gap-2">
            <Layers size={15} className="text-accent" />
            <p className="text-xs font-bold text-ink-soft">Flashcard revision</p>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-accent">{flashcardsDue}</p>
          <p className="mt-2 mb-3 text-2xs text-ink-soft">cards due for review today</p>
          {flashcardsDue > 0 ? (
            <a href="/flashcards?mode=due">
              <Button size="sm" variant="secondary">Review now →</Button>
            </a>
          ) : (
            <p className="text-2xs text-success font-semibold">All caught up!</p>
          )}
        </div>
      </div>

      {/* Task lists */}
      {tasks === null ? (
        <SkeletonList rows={4} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="Your planner is empty"
          description="Add study tasks with subjects and target dates to stay on top of coursework and revisions."
          action={
            <Button icon={Plus} onClick={() => setAddOpen(true)}>
              Add your first task
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <Section icon={Sun} title={`Today ( ${today.length} )`} tone="amber">
            {today.length ? today.map((t) => <TaskRow key={t._id} task={t} />) : <Muted text="Nothing due — enjoy the calm." />}
          </Section>
          <Section icon={CalendarClock} title={`Upcoming ( ${upcoming.length} )`}>
            {upcoming.length ? upcoming.map((t) => <TaskRow key={t._id} task={t} />) : <Muted text="No upcoming tasks." />}
          </Section>
          <Section icon={CalendarCheck2} title={`Completed ( ${completed.length} )`} tone="success">
            {completed.length ? completed.map((t) => <TaskRow key={t._id} task={t} />) : <Muted text="Complete tasks to build your streak." />}
          </Section>
        </div>
      )}

      {/* Add-task modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add study task">
        <div className="space-y-4">
          <Input
            label="Task"
            placeholder="e.g. Revise Unit 3 — Digital Electronics"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="label">Subject</span>
              <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input">
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="label">Target date</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <Button className="w-full" icon={Plus} loading={busy} onClick={addTask}>
            Add task
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Section({ icon: Icon, title, children, tone }) {
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={15} className={tone === 'amber' ? 'text-amber-500' : tone === 'success' ? 'text-success' : 'text-accent'} />
        <h3 className="text-xs font-bold">{title}</h3>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Muted({ text }) {
  return <p className="py-6 text-center text-2xs text-ink-soft">{text}</p>;
}

function dueLabel(d) {
  const due = new Date(d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((due.setHours(0, 0, 0, 0) - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return 'Overdue';
  return format(due, 'MMM d');
}
