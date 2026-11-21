import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquareText,
  Send,
  Loader2,
  Trash2,
  Copy,
  FileText,
  CornerDownLeft,
  BookOpen,
  ClipboardList,
  Scale,
  PenLine,
  ListPlus,
  History,
  PanelRight,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { MarkdownInline } from '../components/common/Markdown';
import Badge from '../components/common/Badge';
import clsx from 'clsx';
import { shortDate } from '../utils/format';

const SUGGESTIONS = [
  { icon: BookOpen, text: 'Explain the main topics in simple words' },
  { icon: ClipboardList, text: 'What are the important points I should remember?' },
  { icon: PenLine, text: 'Give me a short 5-mark answer for the key topic' },
  { icon: ListPlus, text: 'Generate 3 practice questions from this material' },
  { icon: Scale, text: 'Compare the two most important concepts' },
];

export default function AskLumioPage() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const documentId = searchParams.get('document') || '';

  const [docs, setDocs] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    api.get('/documents').then((res) => setDocs(res.data.data.documents.filter((d) => d.processingStatus === 'ready'))).catch(() => {});
    api.get('/ai/conversations').then((res) => setConversations(res.data.data.conversations)).catch(() => {});
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const loadConversation = async (conv) => {
    try {
      const res = await api.get(`/ai/conversations/${conv._id}`);
      setActiveConv(conv);
      setMessages(res.data.data.conversation.messages);
      if (res.data.data.conversation.documentId && res.data.data.conversation.documentId !== documentId) {
        setSearchParams({ document: res.data.data.conversation.documentId });
      }
      setActiveConv(res.data.data.conversation);
      setSidebarOpen(false);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    setInput('');
    setSending(true);
    setMessages((m) => [...m, { role: 'user', content: message }]);
    try {
      const res = await api.post('/ai/chat', {
        message,
        documentId: documentId || undefined,
        conversationId: activeConv?._id || undefined,
      });
      const convId = res.data.data.conversationId;
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: res.data.data.answer, sources: res.data.data.sources },
      ]);
      if (!conversations.some((c) => c._id === convId)) {
        api.get('/ai/conversations').then((r) => setConversations(r.data.data.conversations)).catch(() => {});
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `I could not answer that right now: ${err.message}` },
      ]);
    } finally {
      setSending(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput('');
  };

  const deleteConversation = async (conv) => {
    try {
      await api.delete(`/ai/conversations/${conv._id}`);
      setConversations((c) => c.filter((x) => x._id !== conv._id));
      if (activeConv?._id === conv._id) {
        setActiveConv(null);
        setMessages([]);
      }
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const selectedDoc = docs.find((d) => d._id === documentId);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-5 overflow-hidden">
      {/* Conversation history (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col rounded-2xl border border-line bg-white dark:bg-white/5 lg:flex">
        <div className="border-b border-line px-4 py-3.5 dark:border-white/10">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">History</p>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <p className="px-3 py-6 text-center text-2xs text-ink-soft">No conversations yet</p>
          ) : (
            conversations.map((c) => (
              <div
                key={c._id}
                className={clsx(
                  'group flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors',
                  activeConv?._id === c._id ? 'bg-accent-lavender dark:bg-accent/20' : 'hover:bg-surface-mute dark:hover:bg-white/10'
                )}
              >
                <button onClick={() => loadConversation(c)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-xs font-semibold">{c.title}</p>
                  <p className="text-2xs text-ink-soft">{shortDate(c.updatedAt)}</p>
                </button>
                <button
                  onClick={() => deleteConversation(c)}
                  className="rounded-lg p-1 text-red-400 opacity-0 hover:bg-red-50 group-hover:opacity-100"
                  title="Delete conversation"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Chat column */}
      <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-line bg-white dark:bg-white/5">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-3.5 dark:border-white/10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-1.5 text-ink-soft hover:bg-surface-mute lg:hidden"
            aria-label="Show history"
          >
            <History size={17} />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-lavender dark:bg-accent/20">
            <MessageSquareText size={17} className="text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Ask Lumio</p>
            <p className="truncate text-2xs text-ink-soft">
              {selectedDoc ? `Grounded in: ${selectedDoc.title}` : documentId ? 'Document unavailable' : 'General questions (select a document for grounded answers)'}
            </p>
          </div>
          {docs.length > 0 && (
            <select
              value={documentId}
              onChange={(e) => {
                if (e.target.value) setSearchParams({ document: e.target.value });
                else setSearchParams({});
                clearChat();
              }}
              className="input h-9 w-44 !py-1 text-xs dark:bg-white/5"
              aria-label="Grounding document"
            >
              <option value="">No document</option>
              {docs.map((d) => (
                <option key={d._id} value={d._id}>{d.title}</option>
              ))}
            </select>
          )}
          <Button variant="ghost" size="sm" icon={Trash2} onClick={clearChat} title="Clear chat" />
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <EmptyState
                icon={MessageSquareText}
                title="Ask anything about your material"
                description="Lumio searches your uploaded document first and answers from its actual content, with page references. It will tell you when the material doesn't cover something."
                className="border-0 bg-transparent"
              />
              <div className="mt-2 grid w-full max-w-md gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => send(s.text)}
                    className="flex items-center gap-2 rounded-xl border border-line bg-surface-mute/60 px-3 py-2.5 text-left text-2xs font-medium transition-all hover:border-accent/40 hover:bg-accent-lavender/40"
                  >
                    <s.icon size={13} className="shrink-0 text-accent" />
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} />
              ))}
              {sending && (
                <div className="flex gap-2.5">
                  <AssistantAvatar />
                  <div className="rounded-2xl bg-surface-mute px-4 py-3 dark:bg-white/10">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="h-2 w-2 animate-bounce rounded-full bg-accent-soft"
                          style={{ animationDelay: `${d * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-line p-4 dark:border-white/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Ask about your material… (Enter to send, Shift+Enter for new line)"
              className="input max-h-32 min-h-[42px] flex-1 resize-none text-[13px]"
              aria-label="Message"
            />
            <Button type="submit" loading={sending} disabled={!input.trim()} className="!h-[42px] !px-4">
              <Send size={15} />
            </Button>
          </form>
        </div>
      </div>

      {/* Mobile history drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-ink-secondary">
            <div className="border-b border-line px-4 py-4 dark:border-white/10">
              <p className="text-sm font-bold">Conversations</p>
            </div>
            <div className="space-y-1 p-2">
              {conversations.map((c) => (
                <button
                  key={c._id}
                  onClick={() => loadConversation(c)}
                  className="block w-full rounded-xl px-3 py-2.5 text-left hover:bg-surface-mute"
                >
                  <p className="truncate text-xs font-semibold">{c.title}</p>
                  <p className="text-2xs text-ink-soft">{shortDate(c.updatedAt)}</p>
                </button>
              ))}
              {conversations.length === 0 && (
                <p className="px-3 py-6 text-center text-2xs text-ink-soft">No conversations yet</p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function AssistantAvatar() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-soft text-white">
      <MessageSquareText size={13} />
    </div>
  );
}

function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false);
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-[13px] font-medium leading-relaxed text-white">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2.5">
      <AssistantAvatar />
      <div className="min-w-0 max-w-[85%]">
        <div className="rounded-2xl rounded-tl-md bg-surface-mute px-4 py-3 dark:bg-white/10">
          <MarkdownInline>{message.content}</MarkdownInline>
        </div>
        {message.sources?.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {message.sources.map((s, i) => (
              <Badge key={i} tone="gray">
                {s.page ? `page ${s.page}` : s.section || 'source'}
              </Badge>
            ))}
          </div>
        )}
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="mt-1 flex items-center gap-1 rounded-lg px-2 py-1 text-2xs font-semibold text-ink-soft hover:bg-surface-mute"
        >
          <Copy size={11} /> {copied ? 'Copied' : 'Copy answer'}
        </button>
      </div>
    </div>
  );
}
