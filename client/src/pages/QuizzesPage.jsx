import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ListChecks,
  Sparkles,
  Play,
  Trash2,
  Hash,
  Gauge,
  CircleCheck,
  FileText,
  Type as TypeIcon,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import clsx from 'clsx';
import { SkeletonList } from '../components/common/Skeleton';

const TYPES = [
  { id: 'mcq', label: 'Multiple choice' },
  { id: 'truefalse', label: 'True / False' },
  { id: 'short', label: 'Short answer' },
];

export default function QuizzesPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState(null);
  const [genOpen, setGenOpen] = useState(false);
  const [source, setSource] = useState('document');
  const [docs, setDocs] = useState([]);
  const [docId, setDocId] = useState('');
  const [rawText, setRawText] = useState('');
  const [title, setTitle] = useState('');
  const [count, setCount] = useState(8);
  const [difficulty, setDifficulty] = useState('medium');
  const [types, setTypes] = useState(['mcq', 'truefalse', 'short']);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get('/quizzes')
      .then((res) => setQuizzes(res.data.data.quizzes))
      .catch((err) => {
        setQuizzes([]);
        toast(err.message, 'error');
      });
    api
      .get('/documents')
      .then((res) => {
        const ready = res.data.data.documents.filter((d) => d.processingStatus === 'ready');
        setDocs(ready);
        if (ready.length) setDocId(ready[0]._id);
      })
      .catch(() => {});
  }, [toast]);

  const toggleType = (t) =>
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const generate = async () => {
    setGenerating(true);
    try {
      const payload = { count, difficulty, types: types.length ? types : ['mcq'] };
      if (source === 'document') payload.documentId = docId;
      else {
        payload.rawText = rawText;
        payload.title = title || 'Pasted quiz';
      }
      const res = await api.post('/quizzes/generate', payload);
      toast('Quiz generated — good luck!', 'success');
      setGenOpen(false);
      setRawText('');
      navigate(`/quizzes/${res.data.data.quiz._id}`);
    } catch (err) {
      toast(err.message, 'error', 8000);
    } finally {
      setGenerating(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/quizzes/${deleting._id}`);
      setQuizzes((q) => q?.filter((x) => x._id !== deleting._id));
      toast('Quiz deleted', 'success');
      setDeleting(null);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Quizzes</h1>
          <p className="text-xs text-ink-soft">Practice exams generated from your material</p>
        </div>
        <Button className="ml-auto" icon={Sparkles} onClick={() => setGenOpen(true)}>
          Generate quiz
        </Button>
      </div>

      {quizzes === null ? (
        <SkeletonList rows={3} />
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No quizzes yet"
          description="Generate a practice quiz from any uploaded document or pasted text. Questions can be MCQ, true/false, or short-answer."
          action={
            <Button icon={Sparkles} onClick={() => setGenOpen(true)}>
              Create your first quiz
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="card group p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge>{quiz.difficulty}</Badge>
                  <Badge tone="gray">{quiz.questions?.length || '—'} questions</Badge>
                </div>
                <button
                  onClick={() => setDeleting(quiz)}
                  className="rounded-lg p-1.5 text-red-400 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100"
                  title="Delete quiz"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <h3 className="mt-3 line-clamp-1 font-bold">{quiz.title}</h3>
              <p className="mt-0.5 text-2xs text-ink-soft">
                {quiz.fileName ? `${quiz.fileName} · ` : ''}created {new Date(quiz.createdAt).toLocaleDateString()}
              </p>
              <Link to={`/quizzes/${quiz._id}`} className="mt-4 block">
                <Button size="sm" icon={Play} className="w-full">
                  Start quiz
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Generate modal */}
      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="Generate a quiz" maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="flex overflow-hidden rounded-xl border border-line p-1">
            {[
              { id: 'document', label: 'From my document', icon: FileText },
              { id: 'text', label: 'Paste text', icon: TypeIcon },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSource(t.id)}
                className={clsx(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold',
                  source === t.id ? 'bg-accent text-white' : 'text-ink-soft'
                )}
              >
                <t.icon size={13} /> {t.label}
              </button>
            ))}
          </div>

          {source === 'document' ? (
            docs.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line p-4 text-center text-xs text-ink-soft">
                No processed documents yet — upload one first from the AI Summarizer.
              </p>
            ) : (
              <select value={docId} onChange={(e) => setDocId(e.target.value)} className="input" aria-label="Document">
                {docs.map((d) => (
                  <option key={d._id} value={d._id}>{d.title}</option>
                ))}
              </select>
            )
          ) : (
            <div className="space-y-3">
              <Input label="Quiz title (optional)" placeholder="e.g. Midterm practice" value={title} onChange={(e) => setTitle(e.target.value)} />
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={6}
                placeholder="Paste study material (min 300 characters recommended)."
                className="input text-xs"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="label"><Hash size={11} className="mr-1 inline" />Questions</span>
              <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="input">
                {[5, 8, 10, 12, 15, 20].map((n) => (
                  <option key={n} value={n}>{n} questions</option>
                ))}
              </select>
            </div>
            <div>
              <span className="label"><Gauge size={11} className="mr-1 inline" />Difficulty</span>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <span className="label">Question types</span>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleType(t.id)}
                  className={clsx(
                    'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all',
                    types.includes(t.id)
                      ? 'border-accent bg-accent text-white'
                      : 'border-line bg-white text-ink-soft hover:border-accent/40'
                  )}
                >
                  {types.includes(t.id) && <CircleCheck size={11} className="mr-1 inline" />}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            loading={generating}
            disabled={source === 'document' ? !docId : rawText.trim().length < 300}
            onClick={generate}
            icon={Sparkles}
          >
            {generating ? 'Writing questions…' : 'Generate quiz'}
          </Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete quiz?" maxWidth="max-w-sm">
        <p className="mb-5 text-sm text-ink-soft">"{deleting?.title}" and all its attempt history will be removed.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleting(null)} disabled={busy}>Cancel</Button>
          <Button variant="danger" onClick={doDelete} loading={busy}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
