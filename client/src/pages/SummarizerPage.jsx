import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  X,
  XCircle,
  MessageSquareText,
  Loader2,
  FileUp,
  Type as TypeIcon,
  Trash2,
} from 'lucide-react';
import api, { uploadFile } from '../services/api';
import { useToast } from '../context/ToastContext';
import Dropzone from '../components/summarizer/Dropzone';
import SummaryTypePicker, { SUMMARY_OPTIONS } from '../components/summarizer/SummaryTypePicker';
import SummaryRenderer from '../components/summarizer/SummaryRenderer';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import {
  formatBytes,
  truncate,
  downloadTextFile,
} from '../utils/format';
import clsx from 'clsx';

const STAGES = ['Uploading file…', 'Extracting text…', 'Reading content…', 'Writing summary…'];

export default function SummarizerPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const documentIdParam = searchParams.get('document');

  const [mode, setMode] = useState(documentIdParam ? 'document' : 'file'); // file | text | document
  const [docs, setDocs] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(documentIdParam || '');
  const [rawText, setRawText] = useState('');
  const [textTitle, setTextTitle] = useState('');

  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(-1);
  const [processingError, setProcessingError] = useState('');

  const [summaryType, setSummaryType] = useState('quick');
  const [summary, setSummary] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyFlashcards, setBusyFlashcards] = useState(false);
  const [busyQuiz, setBusyQuiz] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load the user's documents for the "from library" mode.
  useEffect(() => {
    if (docs !== null) return;
    api
      .get('/documents')
      .then((res) => setDocs(res.data.data.documents.filter((d) => d.processingStatus === 'ready')))
      .catch((err) => {
        setDocs([]);
        toast(err.message, 'error');
      });
  }, [docs, toast]);

  // Foreground stage rotation during generation.
  useEffect(() => {
    if (!generating) {
      setStageIndex(-1);
      return undefined;
    }
    let i = 0;
    setStageIndex(0);
    const t = setInterval(() => {
      i = Math.min(i + 1, STAGES.length - 1);
      setStageIndex(i);
    }, 2200);
    return () => clearInterval(t);
  }, [generating]);

  const handleFiles = (files) => {
    const f = files?.[0];
    if (!f) return;
    if (f.size > 15 * 1024 * 1024) {
      toast('File is larger than 15 MB', 'error');
      return;
    }
    setFile(f);
    setProcessingError('');
    setSummary(null);
    setSavedId(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', f);
    if (!rawText) formData.append('title', f.name.replace(/\.[^.]+$/, ''));
    setStageIndex(0);

    uploadFile('/documents/upload', formData, { onProgress: setUploadProgress })
      .then((res) => {
        const doc = res.data.data.document;
        setStageIndex(1);
        // Extraction is complete when the response arrives (status ready).
        toast('Document processed successfully', 'success');
        setSelectedDoc(doc._id);
        setSearchParams({ document: doc._id });
        setMode('document');
        setFile({ ...f, name: f.name, size: f.size, uploaded: true, docId: doc._id });
        setDocs((d) => [doc, ...(d || [])]);
      })
      .catch((err) => {
        setProcessingError(err.message);
        setStageIndex(-1);
        toast(err.message, 'error', 7000);
      });
  };

  const canGenerate =
    (mode === 'file' && file?.uploaded) ||
    (mode === 'document' && selectedDoc) ||
    (mode === 'text' && rawText.trim().length > 200);

  const generate = async (type) => {
    setSummary(null);
    setSavedId(null);
    setGenerating(true);
    try {
      const payload = { summaryType: type };
      if (mode === 'document' || mode === 'file') {
        payload.documentId = selectedDoc;
      } else {
        payload.rawText = rawText;
        payload.title = textTitle || 'Pasted text';
      }
      const res = await api.post('/summaries/generate', payload);
      setSummary(res.data.data.summary);
    } catch (err) {
      toast(err.message, 'error', 8000);
    } finally {
      setGenerating(false);
    }
  };

  const saveSummary = () => {
    // Generated summaries are persisted in MongoDB by the generate endpoint;
    // this action confirms it with the user.
    setSaving(true);
    setTimeout(() => {
      setSavedId(summary?._id || true);
      toast('Summary is saved in your library (Library → My Notes keeps the source document)', 'success');
      setSaving(false);
    }, 350);
  };

  const createFlashcards = async () => {
    setBusyFlashcards(true);
    try {
      const res = await api.post('/flashcards/generate', {
        summaryId: summary._id,
        deckName: summary.title || 'From summary',
        count: 10,
      });
      const created = res.data.data.created;
      toast(`${created} flashcards created from this summary`, 'success');
      navigate(`/flashcards?deck=${encodeURIComponent(res.data.data.flashcards[0]?.deckName || '')}`);
    } catch (err) {
      toast(err.message, 'error', 8000);
    } finally {
      setBusyFlashcards(false);
    }
  };

  const createQuiz = async () => {
    setBusyQuiz(true);
    try {
      const payload = { count: 8, difficulty: 'medium' };
      if (selectedDoc) {
        payload.documentId = selectedDoc;
      } else if (summary) {
        payload.rawText = summary.content;
        payload.title = summary.title;
      }
      const res = await api.post('/quizzes/generate', payload);
      toast('Quiz generated — good luck!', 'success');
      navigate(`/quizzes/${res.data.data.quiz._id}`);
    } catch (err) {
      toast(err.message, 'error', 8000);
    } finally {
      setBusyQuiz(false);
    }
  };

  const goToAsk = () => {
    const q = selectedDoc ? `?document=${selectedDoc}` : '';
    navigate(`/ask${q}`);
  };

  // Deletes a document from the "From my notes" list (also releases it if selected).
  const handleDeleteDoc = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/documents/${deleteTarget._id}`);
      const wasSelected = selectedDoc === deleteTarget._id;
      setDocs((list) => list?.filter((d) => d._id !== deleteTarget._id) || []);
      if (wasSelected) {
        setSelectedDoc('');
        setSearchParams({});
        setSummary(null);
      }
      if (file?.docId === deleteTarget._id) setFile(null);
      toast(`"${deleteTarget.title}" deleted`, 'success');
      setDeleteTarget(null);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const modeTabs = [
    { id: 'file', label: 'Upload file', icon: FileUp },
    { id: 'text', label: 'Paste text', icon: TypeIcon },
    { id: 'document', label: 'From my notes', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">AI Summarizer</h1>
        <p className="text-xs text-ink-soft">
          Extract the essence of your study material — choose how deep you want to go.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex w-full max-w-md overflow-hidden rounded-xl border border-line bg-white p-1 dark:bg-white/5">
        {modeTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setMode(t.id);
              setFile(null);
              setSummary(null);
              setProcessingError('');
              setSearchParams({});
            }}
            className={clsx(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-colors',
              mode === t.id ? 'bg-accent text-white shadow-soft' : 'text-ink-soft hover:text-ink'
            )}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Source input */}
      <div className="card p-5">
        {mode === 'file' && (
          <div className="space-y-4">
            {!file || file.uploaded === true ? null : (
              <FileProgress file={file} progress={uploadProgress} />
            )}
            {!file && (
              <>
                <Dropzone onFiles={handleFiles} />
                {processingError && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900 dark:bg-red-950/30">
                    <XCircle size={15} className="mt-0.5 shrink-0" />
                    <span>{processingError}</span>
                  </div>
                )}
              </>
            )}
            {file && file.uploaded && (
              <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-emerald-50 p-3.5 dark:border-emerald-900 dark:bg-emerald-950/30">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-success dark:bg-white/10">
                  <FileText size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{file.name}</p>
                  <p className="text-2xs text-success">Processed & ready for AI</p>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setSearchParams({});
                  }}
                  className="rounded-lg p-1.5 text-ink-soft hover:bg-white/60"
                  aria-label="Remove file"
                >
                  <X size={15} />
                </button>
              </div>
            )}
          </div>
        )}

        {mode === 'text' && (
          <div className="space-y-3">
            <input
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
              placeholder="Title (optional) — e.g. Chapter 4 notes"
              className="input text-xs"
            />
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste your study material here. At least 200 characters is recommended for a good summary."
              rows={9}
              className="input resize-y text-xs leading-relaxed"
            />
            <p className="text-2xs text-ink-soft">
              {rawText.trim().length} characters · {rawText.trim().split(/\s+/).filter(Boolean).length} words
            </p>
          </div>
        )}

        {mode === 'document' && (
          <div className="relative">
            {docs === null ? (
              <div className="h-12 animate-pulse rounded-xl bg-surface-mute" />
            ) : docs.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No processed notes yet"
                description="Upload a document first — then pick it here to summarize."
                action={
                  <Button variant="secondary" onClick={() => setMode('file')}>
                    Upload a file
                  </Button>
                }
                className="border-0 bg-transparent"
              />
            ) : (
              <div className="grid max-h-72 gap-2 overflow-y-auto pr-1">
                {docs.map((d) => (
                  <div
                    key={d._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedDoc(d._id);
                      setSummary(null);
                      setSearchParams({ document: d._id });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedDoc(d._id);
                        setSummary(null);
                        setSearchParams({ document: d._id });
                      }
                    }}
                    className={clsx(
                      'group flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all',
                      selectedDoc === d._id
                        ? 'border-accent bg-accent-lavender/60 ring-1 ring-accent/30'
                        : 'border-line hover:border-accent/30 hover:bg-surface-mute'
                    )}
                  >
                    <Badge tone={{ PDF: 'red', DOCX: 'accent', PPTX: 'amber', TXT: 'gray' }[d.fileType]}>
                      {d.fileType}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold">{d.title}</p>
                      <p className="truncate text-2xs text-ink-soft">
                        {d.subject} · {formatBytes(d.fileSize)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(d);
                      }}
                      className="shrink-0 rounded-lg p-1.5 text-ink-soft opacity-0 transition-all hover:bg-red-50 hover:text-red-500 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-red-950/40"
                      aria-label={`Delete ${d.title}`}
                      title="Delete this note"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary type + generate */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">Choose summary style</h2>
        </div>
        <SummaryTypePicker value={summaryType} onChange={setSummaryType} disabled={generating} />
        <div className="mt-4">
          <Button
            size="lg"
            disabled={!canGenerate}
            loading={generating}
            icon={generating ? undefined : null}
            onClick={() => generate(summaryType)}
            className="min-w-56"
          >
            {generating ? STAGES[stageIndex] : `Generate ${SUMMARY_OPTIONS.find((o) => o.id === summaryType)?.title}`}
          </Button>
          {mode === 'text' && !canGenerate && (
            <p className="mt-2 text-2xs text-ink-soft">Paste at least 200 characters of text to enable generation.</p>
          )}
          {mode === 'file' && !canGenerate && !generating && (
            <p className="mt-2 text-2xs text-ink-soft">Upload a document first — processing happens on the server.</p>
          )}
        </div>
      </div>

      {/* Output */}
      {generating && (
        <GeneratorSkeleton />
      )}
      {!generating && summary && (
        <SummaryRenderer
          summary={summary}
          saving={saving}
          saved={Boolean(savedId)}
          onSave={saveSummary}
          onGenerateFlashcards={createFlashcards}
          busyFlashcards={busyFlashcards}
          onGenerateQuiz={createQuiz}
          busyQuiz={busyQuiz}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteDoc}
        loading={deleting}
        title="Delete this note?"
        message={`"${deleteTarget?.title}" will be removed from your library. Summaries, flashcards and quizzes already generated from it stay safe.`}
      />
    </div>
  );
}

function FileProgress({ file, progress }) {
  return (
    <div className="rounded-xl border border-line bg-surface-mute/60 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <FileText size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold">{file.name}</p>
          <p className="text-2xs text-ink-soft">{formatBytes(file.size)}</p>
        </div>
        <span className="text-2xs font-bold text-accent">{Math.min(progress, 100)}%</span>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}

function GeneratorSkeleton() {
  return (
    <div className="card space-y-4 p-6">
      <div className="flex items-center gap-2.5 text-xs font-bold text-accent">
        <Loader2 size={15} className="animate-spin" />
        Lumio is reading your material…
      </div>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-1/3 animate-pulse rounded-full bg-surface-mute" />
          <div className="h-3 w-full animate-pulse rounded-full bg-surface-mute" />
          <div className="h-3 w-5/6 animate-pulse rounded-full bg-surface-mute" />
        </div>
      ))}
    </div>
  );
}
