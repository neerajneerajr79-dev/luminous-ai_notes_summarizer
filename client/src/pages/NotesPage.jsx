import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  Heart,
  UploadCloud,
  MoreHorizontal,
  Pencil,
  Trash2,
  Globe2,
  FolderOpen,
  Star,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { SkeletonList } from '../components/common/Skeleton';
import { formatBytes, shortDate } from '../utils/format';
import clsx from 'clsx';

const STATUS_TONES = { ready: 'success', processing: 'amber', failed: 'red', uploaded: 'gray' };

function FileTypeBadge({ type }) {
  const tone = { PDF: 'red', DOCX: 'accent', PPTX: 'amber', TXT: 'gray' };
  return <Badge tone={tone[type] || 'gray'}>{type}</Badge>;
}

function NoteMenu({ doc, onRename, onDelete, onFavorite, onClose }) {
  return (
    <div className="absolute right-3 top-3 z-10 w-40 rounded-xl border border-line bg-white p-1.5 shadow-lift dark:bg-ink-secondary">
      <button
        onClick={() => {
          onFavorite(doc);
          onClose();
        }}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-ink-soft hover:bg-surface-mute hover:text-ink"
      >
        <Heart size={14} className={doc.isFavorite ? 'fill-red-500 text-red-500' : ''} />
        {doc.isFavorite ? 'Remove favorite' : 'Add to favorites'}
      </button>
      <button
        onClick={() => {
          onRename(doc);
          onClose();
        }}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-ink-soft hover:bg-surface-mute hover:text-ink"
      >
        <Pencil size={14} /> Rename
      </button>
      <button
        onClick={() => {
          onDelete(doc);
          onClose();
        }}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50"
      >
        <Trash2 size={14} /> Delete
      </button>
    </div>
  );
}

export default function NotesPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [docs, setDocs] = useState(null);
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [subject, setSubject] = useState('all');
  const [sort, setSort] = useState('newest');
  const [favOnly, setFavOnly] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadDocs = async (opts = {}) => {
    const params = new URLSearchParams();
    if (opts.search !== undefined ? opts.search : search) params.set('search', opts.search !== undefined ? opts.search : search);
    if (subject !== 'all') params.set('subject', subject);
    if (sort) params.set('sort', sort);
    if (favOnly) params.set('favorite', 'true');
    try {
      const res = await api.get(`/documents?${params.toString()}`);
      setDocs(res.data.data.documents);
    } catch (err) {
      setDocs([]);
      toast(err.message, 'error');
    }
  };

  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, sort, favOnly]);

  const handleSearchDebounced = useMemo(() => {
    let t;
    return (value) => {
      setSearch(value);
      clearTimeout(t);
      t = setTimeout(() => loadDocs({ search: value }), 350);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, sort, favOnly]);

  const subjects = useMemo(() => {
    const set = new Set((docs || []).map((d) => d.subject).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [docs]);

  const doRename = async () => {
    if (!renameValue.trim()) return;
    setBusy(true);
    try {
      await api.patch(`/documents/${renameTarget._id}`, { title: renameValue.trim() });
      toast('Note renamed', 'success');
      setRenameTarget(null);
      loadDocs();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/documents/${deleteTarget._id}`);
      toast('Note deleted', 'success');
      setDeleteTarget(null);
      setDocs((d) => d?.filter((x) => x._id !== deleteTarget._id));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const doFavorite = async (doc) => {
    try {
      await api.patch(`/documents/${doc._id}`, { isFavorite: !doc.isFavorite });
      setDocs((d) => d?.map((x) => (x._id === doc._id ? { ...x, isFavorite: !doc.isFavorite } : x)));
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">My Notes</h1>
          <p className="text-xs text-ink-soft">{docs ? `${docs.length} notes in your library` : 'Loading...'}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden relative sm:block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              value={search}
              onChange={(e) => handleSearchDebounced(e.target.value)}
              placeholder="Filter notes..."
              className="input h-10 w-52 rounded-full pl-9 dark:bg-white/5"
            />
          </div>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="input h-10 w-36 rounded-full dark:bg-white/5" aria-label="Filter by subject">
            {subjects.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All subjects' : s}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input h-10 w-36 rounded-full dark:bg-white/5" aria-label="Sort notes">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A→Z</option>
            <option value="modified">Last modified</option>
          </select>
          <Button variant={favOnly ? 'secondary' : 'outline'} size="icon" onClick={() => setFavOnly(!favOnly)} className="h-10 w-10 !px-0" title="Show favorites only">
            <Heart size={16} className={favOnly ? 'fill-current' : ''} />
          </Button>
          <Button
            variant="secondary"
            icon={LayoutGrid}
            onClick={() => navigate('/summarizer')}
            className="hidden sm:inline-flex"
          >
            New upload
          </Button>
          <div className="flex overflow-hidden rounded-xl border border-line">
            <button
              onClick={() => setView('grid')}
              className={clsx('flex h-10 w-10 items-center justify-center transition-colors', view === 'grid' ? 'bg-accent text-white' : 'bg-white text-ink-soft hover:text-ink')}
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView('list')}
              className={clsx('flex h-10 w-10 items-center justify-center transition-colors', view === 'list' ? 'bg-accent text-white' : 'bg-white text-ink-soft hover:text-ink')}
              title="List view"
            >
              <ListIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {docs === null ? (
        <SkeletonList rows={4} />
      ) : docs.length === 0 ? (
        <EmptyState
          icon={UploadCloud}
          title={search || subject !== 'all' ? 'No notes match your filters' : 'Your notes library is empty'}
          description={
            search || subject !== 'all'
              ? 'Try clearing the search or switching the subject filter.'
              : 'Upload your first PDF, DOCX, PPTX or TXT file and Lumio will organize it here.'
          }
          action={
            <Link to="/summarizer">
              <Button icon={UploadCloud}>Upload notes</Button>
            </Link>
          }
        />
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <div key={doc._id} className="group relative card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileTypeBadge type={doc.fileType} />
                  <Badge tone="gray">{doc.subject}</Badge>
                </div>
                <button
                  onClick={() => setMenuOpenId(menuOpenId === doc._id ? null : doc._id)}
                  className="rounded-lg p-1 text-ink-soft opacity-0 transition-opacity hover:bg-surface-mute group-hover:opacity-100"
                  aria-label="Note actions"
                >
                  <MoreHorizontal size={17} />
                </button>
              </div>
              {menuOpenId === doc._id && (
                <NoteMenu doc={doc} onRename={(d) => setRenameTarget(d)} onDelete={(d) => setDeleteTarget(d)} onFavorite={doFavorite} onClose={() => setMenuOpenId(null)} />
              )}
              {doc.isFavorite && <Heart size={14} className="absolute right-3 top-3.5 fill-red-500 text-red-500 opacity-100" />}
              <Link to={`/notes/${doc._id}`} className="block" onClick={() => setMenuOpenId(null)}>
                <h3 className="line-clamp-2 font-bold leading-snug">{doc.title}</h3>
                <p className="mt-1 truncate text-2xs text-ink-soft">{doc.originalFileName}</p>
                <div className="mt-4 flex items-center justify-between">
                  <Badge tone={STATUS_TONES[doc.processingStatus]}>{doc.processingStatus}</Badge>
                  <span className="text-2xs text-ink-soft">{formatBytes(doc.fileSize)}</span>
                </div>
                <p className="mt-3 border-t border-line pt-3 text-2xs text-ink-soft dark:border-white/10">
                  Uploaded {shortDate(doc.createdAt)}
                </p>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-mute/60 text-left text-2xs uppercase tracking-wide text-ink-soft dark:border-white/10">
                <th className="px-5 py-3 font-bold">Title</th>
                <th className="hidden px-4 py-3 font-bold md:table-cell">File</th>
                <th className="hidden px-4 py-3 font-bold sm:table-cell">Subject</th>
                <th className="hidden px-4 py-3 font-bold lg:table-cell">Size</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="hidden px-4 py-3 font-bold md:table-cell">Modified</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc._id} className="group relative border-b border-line/70 last:border-0 hover:bg-surface-mute/50 dark:border-white/5">
                  <td className="px-5 py-3.5">
                    <Link to={`/notes/${doc._id}`} className="flex items-center gap-2.5 font-semibold hover:text-accent">
                      {doc.isFavorite && <Star size={13} className="fill-amber-400 text-amber-400" />}
                      <span className="line-clamp-1 max-w-[220px]">{doc.title}</span>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3.5 md:table-cell">
                    <FileTypeBadge type={doc.fileType} />
                  </td>
                  <td className="hidden px-4 py-3.5 text-xs text-ink-soft sm:table-cell">{doc.subject}</td>
                  <td className="hidden px-4 py-3.5 text-xs text-ink-soft lg:table-cell">{formatBytes(doc.fileSize)}</td>
                  <td className="px-4 py-3.5">
                    <Badge tone={STATUS_TONES[doc.processingStatus]}>{doc.processingStatus}</Badge>
                  </td>
                  <td className="hidden px-4 py-3.5 text-xs text-ink-soft md:table-cell">{shortDate(doc.updatedAt)}</td>
                  <td className="relative px-3 py-3.5 text-right">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === doc._id ? null : doc._id)}
                      className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-mute"
                      aria-label="Note actions"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {menuOpenId === doc._id && (
                      <NoteMenu doc={doc} onRename={(d) => setRenameTarget(d)} onDelete={(d) => setDeleteTarget(d)} onFavorite={doFavorite} onClose={() => setMenuOpenId(null)} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rename dialog */}
      <Modal open={Boolean(renameTarget)} onClose={() => setRenameTarget(null)} title="Rename note" maxWidth="max-w-sm">
        <Input
          label="Note title"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          placeholder="Enter a new title"
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setRenameTarget(null)} disabled={busy}>Cancel</Button>
          <Button onClick={doRename} loading={busy}>Save</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        loading={busy}
        title="Delete this note?"
        message={`"${deleteTarget?.title}" and its extracted text will be removed. Saved summaries and flashcards stay in your library.`}
      />
    </div>
  );
}
