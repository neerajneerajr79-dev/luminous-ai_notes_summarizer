import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Trash2,
  Download,
  Star,
  X,
  Loader2,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import Markdown from '../components/common/Markdown';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { formatBytes, shortDate, downloadTextFile, truncate } from '../utils/format';

const TYPE_LABELS = { quick: 'Quick', detailed: 'Detailed', exam: 'Exam Prep', simple: 'Simple', revision: 'Revision' };

export default function NoteDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [summariesLoading, setSummariesLoading] = useState(true);
  const [openSummary, setOpenSummary] = useState(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [notes, setNotes] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  useEffect(() => {
    api
      .get(`/documents/${id}`)
      .then((res) => {
        setDoc(res.data.data.document);
        setNotes(res.data.data.document.extractedText ? '' : '');
      })
      .catch(() => setNotFound(true));
    api
      .get(`/summaries?documentId=${id}`)
      .then((res) => setSummaries(res.data.data.summaries))
      .catch(() => {})
      .finally(() => setSummariesLoading(false));
  }, [id]);

  const saveManualNotes = async () => {
    setNoteSaving(true);
    try {
      await api.patch(`/documents/${id}`, {});
      toast('Notes editor is read-only for extracted documents', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setNoteSaving(false);
    }
  };

  const doRename = async () => {
    if (!renameValue.trim()) return;
    try {
      await api.patch(`/documents/${id}`, { title: renameValue.trim() });
      setDoc((d) => ({ ...d, title: renameValue.trim() }));
      toast('Renamed', 'success');
      setRenaming(false);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const toggleFavorite = async () => {
    try {
      const updated = !doc.isFavorite;
      await api.patch(`/documents/${id}`, { isFavorite: updated });
      setDoc((d) => ({ ...d, isFavorite: updated }));
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const downloadFullText = () => {
    if (!doc?.extractedText) return;
    downloadTextFile(doc.extractedText, `${doc.title.replace(/[^\w-]+/g, '-') || 'document'}.txt`, 'text/plain');
  };

  const openFullSummary = async (summaryId) => {
    try {
      const res = await api.get(`/summaries/${summaryId}`);
      setOpenSummary(res.data.data.summary);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (notFound) {
    return (
      <div className="card p-10 text-center">
        <p className="font-bold">Document not found</p>
        <p className="mt-1 text-sm text-ink-soft">It may have been deleted.</p>
        <Link to="/notes" className="mt-4 inline-block text-xs font-semibold text-accent hover:underline">
          Back to My Notes
        </Link>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="card p-8">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-8 w-1/2 animate-pulse rounded-lg bg-surface-mute" />
          <div className="h-4 w-1/4 animate-pulse rounded bg-surface-mute" />
          <div className="h-40 w-full animate-pulse rounded-xl bg-surface-mute" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button
        onClick={() => navigate('/notes')}
        className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft size={16} /> My Notes
      </button>

      {/* Document header */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-lavender text-accent dark:bg-accent/20">
            <FileText size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight">{doc.title}</h1>
              <button onClick={toggleFavorite} className="rounded-lg p-1.5 hover:bg-surface-mute" title={doc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                <Star size={16} className={doc.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-ink-soft'} />
              </button>
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              {doc.originalFileName} · {formatBytes(doc.fileSize)} · uploaded {shortDate(doc.createdAt)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone={{ PDF: 'red', DOCX: 'accent', PPTX: 'amber', TXT: 'gray' }[doc.fileType]}>{doc.fileType}</Badge>
              <Badge tone="gray">{doc.subject}</Badge>
              <Badge tone={doc.processingStatus === 'ready' ? 'success' : doc.processingStatus === 'failed' ? 'red' : 'amber'}>
                {doc.processingStatus}
              </Badge>
              {doc.pageCount && <Badge tone="gray">{doc.pageCount} pages</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={Trash2} onClick={() => setRenaming(true)}>
              Rename
            </Button>
            <Button variant="outline" size="sm" icon={Download} onClick={downloadFullText} disabled={!doc.extractedText}>
              Raw text
            </Button>
          </div>
        </div>
      </div>

      {/* AI summaries for this document */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">
            <Sparkles size={14} className="mr-1 inline text-accent" />
            AI summaries of this document
          </h2>
          <Link to={`/summarizer?document=${doc._id}`} className="text-xs font-semibold text-accent hover:underline">
            Generate another →
          </Link>
        </div>

        {summariesLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-mute" />
            ))}
          </div>
        ) : summaries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white/60 p-8 text-center">
            <p className="text-sm font-semibold">No summaries yet</p>
            <p className="mt-1 text-xs text-ink-soft">Generate your first summary of this document.</p>
            <Link to={`/summarizer?document=${doc._id}`} className="mt-4 inline-block">
              <Button size="sm" variant="secondary" icon={Sparkles}>
                Summarize this document
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {summaries.map((s) => (
              <button
                key={s._id}
                onClick={() => openFullSummary(s._id)}
                className="card group p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="flex items-center gap-2">
                  <Badge>{TYPE_LABELS[s.summaryType] || s.summaryType}</Badge>
                </div>
                <p className="mt-2.5 font-bold leading-snug">{s.title}</p>
                <p className="mt-1 text-2xs text-ink-soft">Created {shortDate(s.createdAt)}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rename modal */}
      <Modal open={renaming} onClose={() => setRenaming(false)} title="Rename document" maxWidth="max-w-sm">
        <Input
          label="Title"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          placeholder="New title"
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setRenaming(false)}>Cancel</Button>
          <Button onClick={doRename}>Save</Button>
        </div>
      </Modal>

      {/* Full summary viewer */}
      <Modal
        open={Boolean(openSummary)}
        onClose={() => setOpenSummary(null)}
        title={openSummary?.title || 'Summary'}
        maxWidth="max-w-3xl"
      >
        {openSummary && (
          <>
            <div className="mb-4 flex items-center gap-2">
              <Badge>{TYPE_LABELS[openSummary.summaryType]}</Badge>
              <Button
                variant="ghost"
                size="sm"
                icon={Download}
                onClick={() => downloadTextFile(openSummary.content, `${(openSummary.title || 'summary').replace(/[^\w-]+/g, '-').slice(0, 50)}.md`)}
              >
                Export
              </Button>
            </div>
            <Markdown>{openSummary.content}</Markdown>
          </>
        )}
      </Modal>
    </div>
  );
}
