import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Trophy,
  Target,
  RotateCcw,
  Flag,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Markdown from '../components/common/Markdown';
import { MarkdownInline } from '../components/common/Markdown';
import clsx from 'clsx';

/** Quiz runner: one question at a time, nav, progress bar, submit, then results. */
export default function QuizDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [pos, setPos] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [showExplanations, setShowExplanations] = useState(true);

  useEffect(() => {
    api
      .get(`/quizzes/${id}`)
      .then((res) => setQuiz(res.data.data.quiz))
      .catch(() => setNotFound(true));
  }, [id, retrying]);

  const question = quiz?.questions?.[pos];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz?.questions?.length || 0;
  const allAnswered = answeredCount === totalQuestions;

  const setAnswer = (value) => setAnswers((a) => ({ ...a, [pos]: value }));

  const submit = async () => {
    if (!allAnswered) {
      const missing = totalQuestions - answeredCount;
      if (!window.confirm(`${missing} question(s) unanswered. Submit anyway?`)) return;
    }
    setSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionIndex, given]) => ({
          questionIndex: Number(questionIndex),
          given: String(given),
        })),
      };
      const res = await api.post(`/quizzes/${id}/submit`, payload);
      setSubmitted(res.data.data.attempt);
      toast('Quiz submitted', 'success');
    } catch (err) {
      toast(err.message, 'error', 8000);
    } finally {
      setSubmitting(false);
    }
  };

  const retake = () => {
    setAnswers({});
    setPos(0);
    setSubmitted(null);
    setRetrying((r) => !r);
  };

  const scoreTone = useMemo(() => {
    if (!submitted) return '';
    return submitted.percentage >= 70 ? 'text-success' : submitted.percentage >= 40 ? 'text-amber-500' : 'text-red-500';
  }, [submitted]);

  if (notFound) {
    return (
      <div className="card p-10 text-center">
        <p className="font-bold">Quiz not found</p>
        <Link to="/quizzes" className="mt-3 inline-block text-xs font-semibold text-accent hover:underline">
          Back to Quizzes
        </Link>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="card p-8">
        <div className="mx-auto max-w-2xl space-y-3">
          <div className="h-8 w-2/3 animate-pulse rounded bg-surface-mute" />
          <div className="h-24 w-full animate-pulse rounded-xl bg-surface-mute" />
        </div>
      </div>
    );
  }

  /* ---- Results view ---- */
  if (submitted) {
    const correctCount = submitted.questionResults.filter((r) => r.correct).length;
    const weakTopics = submitted.weakTopics || [];
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <button onClick={() => navigate('/quizzes')} className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
          <ArrowLeft size={16} /> Quizzes
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card overflow-hidden p-8 text-center"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-lavender dark:bg-accent/20">
            <Trophy size={30} className="text-accent" />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-ink-soft">{quiz.title}</p>
          <p className={`mt-2 text-5xl font-extrabold tracking-tight ${scoreTone}`}>
            {submitted.percentage}%
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            {submitted.score} of {submitted.totalQuestions} correct
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            {submitted.percentage >= 80
              ? 'Excellent — your revision is paying off!'
              : submitted.percentage >= 50
                ? 'Decent — review the topics below.'
                : 'Keep practicing — work through each topic.'}
          </p>
          {weakTopics.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-bold text-ink-soft">Topics to improve</p>
              <div className="flex flex-wrap justify-center gap-2">
                {weakTopics.map((t) => (
                  <Badge key={t} tone="amber">{t}</Badge>
                ))}
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-center gap-2.5">
            <Button onClick={retake} icon={RotateCcw} variant="secondary">Retake quiz</Button>
            <Button variant="outline" onClick={() => navigate('/quizzes')}>Back to quizzes</Button>
          </div>
        </motion.div>

        {showExplanations && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold">Answer review</h3>
            {submitted.questionResults.map((r, i) => {
              const q = quiz.questions[r.questionIndex];
              return (
                <div
                  key={i}
                  className={clsx(
                    'card p-4',
                    r.correct ? 'border-success/30' : 'border-red-200 dark:border-red-900'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {r.correct ? (
                      <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-success" />
                    ) : (
                      <XCircle size={17} className="mt-0.5 shrink-0 text-red-500" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold leading-relaxed">
                        Q{i + 1}. {q.question}
                      </p>
                      <div className="mt-2 space-y-0.5 text-2xs">
                        <p className={r.correct ? 'text-success' : 'text-red-500'}>
                          Your answer: {r.given ? r.given : '— (skipped)'}
                        </p>
                        {!r.correct && <p className="text-success">Correct answer: {r.correctAnswer}</p>}
                      </div>
                      {r.explanation && (
                        <div className="mt-2 rounded-xl bg-surface-mute/70 p-3 dark:bg-white/5">
                          <MarkdownInline>{r.explanation}</MarkdownInline>
                        </div>
                      )}
                      {r.topic && <p className="mt-2 text-2xs text-ink-soft">Topic: {r.topic}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ---- Quiz runner view ---- */
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button onClick={() => navigate('/quizzes')} className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft size={16} /> Quizzes
      </button>

      <div className="card p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">{quiz.title}</p>
            <p className="mt-0.5 text-2xs text-ink-soft">
              {quiz.difficulty} difficulty · {totalQuestions} questions
            </p>
          </div>
          <Badge>{answeredCount}/{totalQuestions} answered</Badge>
        </div>

        {/* Progress bar */}
        <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${totalQuestions ? (answeredCount / totalQuestions) * 100 : 0}%` }}
          />
        </div>

        {question && (
          <div key={pos} className="min-h-[200px]">
            <p className="text-2xs font-bold text-ink-soft">Question {pos + 1} of {totalQuestions}</p>
            <h2 className="mt-2 text-base font-bold leading-relaxed">{question.question}</h2>

            <div className="mt-5 space-y-2.5">
              {question.type === 'mcq' &&
                question.options?.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswer(opt)}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all',
                      answers[pos] === opt
                        ? 'border-accent bg-accent-lavender/60 text-accent ring-1 ring-accent/30'
                        : 'border-line hover:border-accent/40 hover:bg-surface-mute'
                    )}
                  >
                    <span className={clsx('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-2xs font-bold', answers[pos] === opt ? 'border-accent bg-accent text-white' : 'border-line')}>
                      {answers[pos] === opt ? '✓' : String.fromCharCode(65 + question.options.indexOf(opt))}
                    </span>
                    {opt}
                  </button>
                ))}

              {question.type === 'truefalse' && (
                <div className="grid grid-cols-2 gap-2.5">
                  {['True', 'False'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAnswer(opt)}
                      className={clsx(
                        'rounded-xl border px-4 py-3 text-sm font-bold transition-all',
                        answers[pos] === opt
                          ? 'border-accent bg-accent text-white'
                          : 'border-line hover:border-accent/40 hover:bg-surface-mute'
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {question.type === 'short' && (
                <textarea
                  value={answers[pos] || ''}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={4}
                  placeholder="Type your answer..."
                  className="input text-xs"
                />
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-line pt-5 dark:border-white/10">
          <Button variant="outline" icon={ChevronLeft} disabled={pos === 0} onClick={() => setPos(pos - 1)}>
            Prev
          </Button>

          <div className="flex gap-1">
            {quiz.questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setPos(i)}
                className={clsx(
                  'h-2.5 w-2.5 rounded-full transition-all',
                  pos === i ? 'scale-125 bg-accent' : answers[i] !== undefined ? 'bg-accent/40' : 'bg-line'
                )}
                aria-label={`Go to question ${i + 1}`}
              />
            ))}
          </div>

          {pos < totalQuestions - 1 ? (
            <Button onClick={() => setPos(pos + 1)}>
              Next <ChevronRight size={16} />
            </Button>
          ) : (
            <Button icon={Flag} onClick={submit} loading={submitting}>
              Submit
            </Button>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <Button variant="outline" icon={Flag} onClick={submit} loading={submitting} disabled={answeredCount === 0}>
          Submit quiz now
        </Button>
      </div>
    </div>
  );
}
