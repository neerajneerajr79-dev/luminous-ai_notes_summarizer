import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Layers,
  Sparkles,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  X as XIcon,
  Type as TypeIcon,
  FileText,
  Trash2,
  Pencil,
  Check,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { Skeleton } from '../components/common/Skeleton';
import StudyCard from '../components/flashcards/StudyCard';
import Dropzone from '../components/summarizer/Dropzone';
import { uploadFile } from '../services/api';
import clsx from 'clsx';

const STUDY_MODES = [
  { id: 'all', label: 'All cards' },
  { id: 'difficult', label: 'Difficult cards' },
  { id: 'due', label: 'Due for revision' },
];

export default function FlashcardsPage() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [cards, setCards] = useState(null);
  const [decks, setDecks] = useState([]);
  const [activeDeck, setActiveDeck] = useState(searchParams.get('deck') || '');
  const [mode, setMode] = useState(searchParams.get('mode') || 'all');
  const [studying, setStudying] = useState(false);

  const [flipped, setFlipped] = useState(false);
  const [pos, setPos] = useState(0);
  const [order, setOrder] = useState([]);

  const [genOpen, setGenOpen] = useState(false);
  const [genSource, setGenSource] = useState('document'); // document | text
  const [docs, setDocs] = useState([]);
  const [genDoc, setGenDoc] = useState('');
  const [genText, setGenText] = useState('');
  const [genCount, setGenCount] = useState(10);
  const [deckName, setDeckName] = useState('');
  const [generating, setGenerating] = useState(false);

  const [editing, setEditing] = useState(null);
  const [editQ, setEditQ] = useState('');
  const [editA, setEditA] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDeck, mode]);

  useEffect(() => {
    api.get('/documents').then((res) => {
      const ready = res.data.data.documents.filter((d) => d.processingStatus === 'ready');
      setDocs(ready);
      if (ready.length > 0) setGenDoc(ready[0]._id);
    }).catch(() => {});
  }, []);

  const loadCards = async (opts = {}) => {
    const params = new URLSearchParams();
    const deck = opts.deck !== undefined ? opts.deck : activeDeck;
    const m = opts.mode !== undefined ? opts.mode : mode;
    if (deck) params.set('deck', deck);
    if (m === 'difficult') params.set('difficulty', 'hard');
    if (m === 'due') params.set('due', 'true');
    try {
      const res = await api.get(`/flashcards?${params.toString()}`);
      const list = res.data.data.flashcards;
      setCards(list);
      const uniqueDecks = [...new Set(list.map((c) => c.deckName))];
      setDecks(uniqueDecks);
      setOrder(list.map((_, i) => i));
      setPos(0);
      setFlipped(false);
    } catch (err) {
      setCards([]);
      toast(err.message, 'error');
    }
  };

  const startStudy = () => {
    if (!cards?.length) return;
    setOrder(cards.map((_, i) => i).sort(() => Math.random() - 0.5));
    setPos(0);
    setFlipped(false);
    setStudying(true);
  };

  const rate = async (difficulty) => {
    const card = cards[order[pos]];
    try {
      await api.post(`/flashcards/${card._id}/review`, { rating: difficulty });
      setCards((c) => c?.map((x) => (x._id === card._id ? { ...x, difficulty } : x)));
      if (pos + 1 < order.length) {
        setPos(pos + 1);
        setFlipped(false);
      } else {
        toast('Deck round complete — nice work!', 'success');
        setStudying(false);
        loadCards();
      }
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const payload = { count: genCount, deckName: deckName || undefined };
      if (genSource === 'document') payload.documentId = genDoc;
      else payload.rawText = genText;
      const res = await api.post('/flashcards/generate', payload);
      toast(`${res.data.data.created} flashcards created`, 'success');
      setGenOpen(false);
      setGenText('');
      setDeckName('');
      setActiveDeck(res.data.data.flashcards?.[0]?.deckName || '');
      setSearchParams({ deck: res.data.data.flashcards?.[0]?.deckName || '' });
    } catch (err) {
      toast(err.message, 'error', 8000);
    } finally {
      setGenerating(false);
    }
  };

  const handleFilesDropped = (files) => {
    const f = files?.[0];
    if (!f) return;
    const formData = new FormData();
    formData.append('file', f);
    formData.append('title', f.name.replace(/\.[^.]+$/, ''));
    setGenerating(true);
    uploadFile('/documents/upload', formData)
      .then((res) => {
        const doc = res.data.data.document;
        setGenDoc(doc._id);
        setDocs((d) => [doc, ...(d || [])]);
        toast('Document processed — generate flashcards below', 'success');
      })
      .catch((err) => toast(err.message, 'error', 7000))
      .finally(() => setGenerating(false));
  };

  const saveEdit = async () => {
    setBusy(true);
    try {
      await api.patch(`/flashcards/${editing._id}`, { question: editQ, answer: editA });
      setCards((c) => c?.map((x) => (x._id === editing._id ? { ...x, question: editQ, answer: editA } : x)));
      toast('Flashcard updated', 'success');
      setEditing(null);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/flashcards/${deleting._id}`);
      setCards((c) => c?.filter((x) => x._id !== deleting._id));
      toast('Flashcard deleted', 'success');
      setDeleting(null);
      setStudying(false);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const current = cards && order.length > 0 && pos < order.length ? cards[order[pos]] : null;

  return (
    <div className="space-y-6">
      {/* Deck selector */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Flashcards</h1>
          <p className="text-xs text-ink-soft">{cards ? `${cards.length} cards in view` : 'Loading...'}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {decks.length > 0 && (
            <select
              value={activeDeck}
              onChange={(e) => {
                setActiveDeck(e.target.value);
                setStudying(false);
                setSearchParams(e.target.value ? { deck: e.target.value } : {});
              }}
              className="input h-10 w-48 rounded-full dark:bg-white/5"
              aria-label="Deck"
            >
              <option value="">All decks</option>
              {decks.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
          <Button icon={Sparkles} onClick={() => setGenOpen(true)}>
            Generate flashcards
          </Button>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex w-full max-w-md overflow-hidden rounded-xl border border-line bg-white p-1 dark:bg-white/5">
        {STUDY_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id);
              setStudying(false);
              setSearchParams(m.id === 'due' ? { mode: 'due' } : {});
            }}
            className={clsx(
              'flex-1 rounded-lg py-2 text-xs font-bold transition-colors',
              mode === m.id ? 'bg-accent text-white shadow-soft' : 'text-ink-soft hover:text-ink'
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {cards === null ? (
        <div className="card p-10"><Skeleton className="mx-auto h-48 w-full max-w-xl" /></div>
      ) : cards.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={mode === 'due' ? 'Nothing due right now' : 'No flashcards yet'}
          description={
            mode === 'due'
              ? 'Cards return here on their review schedule. Generate more or check back tomorrow.'
              : 'Generate AI flashcards from an uploaded document or pasted text, then study them with spaced repetition.'
          }
          action={
            <Button icon={Sparkles} onClick={() => setGenOpen(true)}>
              Create flashcards
            </Button>
          }
        />
      ) : studying && current ? (
        /* Study mode */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" icon={XIcon} onClick={() => setStudying(false)}>
              End session
            </Button>
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${Math.round(((pos + 1) / order.length) * 100)}%` }}
              />
            </div>
          </div>

          <StudyCard
            card={current}
            flipped={flipped}
            onFlip={() => setFlipped(!flipped)}
            index={pos}
            total={order.length}
          />

          {flipped && (
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <Button onClick={() => rate('hard')} className="!bg-red-50 !text-red-600 hover:!bg-red-100">
                Difficult
              </Button>
              <Button onClick={() => rate('medium')} className="!bg-amber-50 !text-amber-600 hover:!bg-amber-100">
                Medium
              </Button>
              <Button onClick={() => rate('easy')} className="!bg-emerald-50 !text-success hover:!bg-emerald-100">
                Easy
              </Button>
            </div>
          )}

          <div className="flex justify-center gap-2">
            <Button variant="outline" icon={ChevronLeft} disabled={pos === 0} onClick={() => { setPos(pos - 1); setFlipped(false); }}>
              Prev
            </Button>
            <Button
              variant="outline"
              icon={Shuffle}
              onClick={() => setOrder([...order].sort(() => Math.random() - 0.5))}
              title="Shuffle"
            >
              Shuffle
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (pos + 1 < order.length) {
                  setPos(pos + 1);
                  setFlipped(false);
                }
              }}
              disabled={pos + 1 >= order.length}
            >
              Next <ChevronRight size={16} />
            </Button>
          </div>

          <div className="flex justify-center">
            <Button variant="ghost" size="sm" icon={Pencil} onClick={() => { setEditing(current); setEditQ(current.question); setEditA(current.answer); }}>
              Edit this card
            </Button>
            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleting(current)}>
              Delete
            </Button>
          </div>
        </div>
      ) : (
        /* Deck list view */
        <div>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">{activeDeck || 'All decks'}</p>
                <p className="text-2xs text-ink-soft">
                  {cards.filter((c) => c.difficulty === 'hard').length} difficult ·{' '}
                  {cards.filter((c) => new Date(c.nextReviewAt) <= new Date()).length} due
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" icon={Shuffle} onClick={startStudy}>
                  Shuffle
                </Button>
                <Button icon={ChevronRight} onClick={() => { setOrder(cards.map((_, i) => i)); setPos(0); setStudying(true); }}>
                  Study deck
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {cards.map((card) => (
              <div key={card._id} className="card group p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold">{truncateText(card.question, 100)}</p>
                    <p className="mt-1.5 text-2xs leading-relaxed text-ink-soft">{truncateText(card.answer, 140)}</p>
                  </div>
                  <Badge tone={card.difficulty === 'hard' ? 'red' : card.difficulty === 'easy' ? 'success' : 'amber'}>
                    {card.difficulty}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5 dark:border-white/10">
                  <p className="text-2xs text-ink-soft">
                    {card.deckName} · next review {new Date(card.nextReviewAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => { setEditing(card); setEditQ(card.question); setEditA(card.answer); }}
                      className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-mute"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleting(card)}
                      className="rounded-lg p-1.5 text-red-400 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate modal */}
      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="Generate flashcards" maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="flex overflow-hidden rounded-xl border border-line p-1">
            {[
              { id: 'document', label: 'From my document', icon: FileText },
              { id: 'text', label: 'Paste text', icon: TypeIcon },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setGenSource(t.id)}
                className={clsx(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold',
                  genSource === t.id ? 'bg-accent text-white' : 'text-ink-soft'
                )}
              >
                <t.icon size={13} /> {t.label}
              </button>
            ))}
          </div>

          {genSource === 'document' ? (
            docs.length === 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-ink-soft">No processed documents yet — drop a file below.</p>
                <Dropzone onFiles={handleFilesDropped} className="py-8" />
              </div>
            ) : (
              <select value={genDoc} onChange={(e) => setGenDoc(e.target.value)} className="input" aria-label="Document">
                {docs.map((d) => (
                  <option key={d._id} value={d._id}>{d.title}</option>
                ))}
              </select>
            )
          ) : (
            <textarea
              value={genText}
              onChange={(e) => setGenText(e.target.value)}
              rows={6}
              placeholder="Paste study material (min 200 characters) to generate flashcards from."
              className="input text-xs"
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="How many cards?"
              type="number"
              min={5}
              max={20}
              value={genCount}
              onChange={(e) => setGenCount(Number(e.target.value))}
            />
            <Input
              label="Deck name (optional)"
              placeholder="e.g. Chapter 4"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            loading={generating}
            disabled={genSource === 'document' ? !genDoc : genText.trim().length < 200}
            onClick={generate}
            icon={Sparkles}
          >
            {generating ? 'Generating…' : `Generate ${genCount} flashcards`}
          </Button>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit flashcard">
        <Input label="Question (front)" value={editQ} onChange={(e) => setEditQ(e.target.value)} />
        <div className="mt-3">
          <Input label="Answer (back)" value={editA} onChange={(e) => setEditA(e.target.value)} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          <Button onClick={saveEdit} loading={busy} icon={Check}>Save</Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete flashcard?" maxWidth="max-w-sm">
        <p className="mb-5 text-sm text-ink-soft">
          "{truncateText(deleting?.question || '', 80)}" will be permanently removed.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleting(null)} disabled={busy}>Cancel</Button>
          <Button variant="danger" onClick={doDelete} loading={busy}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

function truncateText(text, max) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
