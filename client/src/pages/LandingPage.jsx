import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Layers,
  ListChecks,
  MessageSquareText,
  BookOpenCheck,
  LineChart,
  CheckCircle2,
  UploadCloud,
  Wand2,
  GraduationCap,
  Zap,
} from 'lucide-react';
import LandingNav from '../components/layout/LandingNav';
import LandingFooter from '../components/layout/LandingFooter';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-powered summarization',
    description:
      'Turn dense lecture notes and PDFs into clear short summaries, detailed breakdowns, or exam-ready revision notes.',
  },
  {
    icon: Layers,
    title: 'Smart flashcards',
    description:
      'Auto-generate question/answer flashcards from any material and study them with spaced repetition.',
  },
  {
    icon: ListChecks,
    title: 'Intelligent quizzes',
    description:
      'Practice with MCQs, true/false and short-answer questions generated from your own documents.',
  },
  {
    icon: MessageSquareText,
    title: 'Ask your notes',
    description:
      'Chat with your study material. Get grounded answers with page references, not hallucinations.',
  },
  {
    icon: BookOpenCheck,
    title: 'Exam-oriented revision',
    description:
      'Get likely exam topics, short-answer questions, definitions and formulas in focused revision sheets.',
  },
  {
    icon: LineChart,
    title: 'Study progress tracking',
    description:
      'Track notes, summaries, quiz scores and revision streaks in one calm dashboard.',
  },
];

const STEPS = [
  {
    icon: UploadCloud,
    title: 'Upload your notes',
    description: 'Drag in PDFs, DOCX, PPTX or TXT files — or paste text directly.',
  },
  {
    icon: Wand2,
    title: 'Let AI understand your content',
    description: 'Lumio extracts and reads the material, keeping page references.',
  },
  {
    icon: Sparkles,
    title: 'Generate learning material',
    description: 'Summaries, exam notes, flashcards and quizzes — in your preferred style.',
  },
  {
    icon: GraduationCap,
    title: 'Learn, practice and revise',
    description: 'Study flashcards, attempt quizzes and ask questions until it sticks.',
  },
];

function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-[560px]"
      style={{ perspective: 1000 }}
    >
      <div className="card overflow-hidden rounded-xl3 shadow-lift">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-line bg-surface-mute px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-success" />
          <div className="ml-3 flex-1 rounded-md bg-white px-2.5 py-1 text-2xs text-ink-soft">
            lumio.ai/dashboard
          </div>
        </div>
        {/* Mock dashboard */}
        <div className="flex bg-surface-mute p-4">
          <div className="hidden w-32 shrink-0 flex-col gap-1.5 pr-3 sm:flex">
            <div className="rounded-lg bg-accent-lavender px-2.5 py-2 text-2xs font-bold text-accent">Overview</div>
            <div className="rounded-lg px-2.5 py-2 text-2xs font-medium text-ink-soft">My Notes</div>
            <div className="rounded-lg px-2.5 py-2 text-2xs font-medium text-ink-soft">AI Summarizer</div>
            <div className="rounded-lg px-2.5 py-2 text-2xs font-medium text-ink-soft">Flashcards</div>
            <div className="rounded-lg px-2.5 py-2 text-2xs font-medium text-ink-soft">Quizzes</div>
            <div className="rounded-lg px-2.5 py-2 text-2xs font-medium text-ink-soft">Study Planner</div>
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: 'Notes', value: '24' },
                { label: 'Summaries', value: '36' },
                { label: 'Cards', value: '142' },
              ].map((s) => (
                <div key={s.label} className="card rounded-xl p-2.5">
                  <p className="text-2xs text-ink-soft">{s.label}</p>
                  <p className="text-base font-bold">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="card rounded-xl p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-2xs font-bold">Continue learning</p>
                <Badge>Week 6</Badge>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 rounded-lg bg-surface-mute p-2">
                  <span className="h-7 w-7 shrink-0 rounded-lg bg-accent/15 text-2xs font-bold text-accent flex items-center justify-center">EE</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-2xs font-semibold">Embedded Systems — Unit 4.pdf</p>
                    <div className="mt-1 h-1 rounded-full bg-line">
                      <div className="h-full w-3/5 rounded-full bg-accent" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-surface-mute p-2">
                  <span className="h-7 w-7 shrink-0 rounded-lg bg-success/15 text-2xs font-bold text-success flex items-center justify-center">DS</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-2xs font-semibold">Data Structures — Quiz 2</p>
                    <div className="mt-1 h-1 rounded-full bg-line">
                      <div className="h-full w-4/6 rounded-full bg-success" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-surface-mute p-2">
                  <span className="h-7 w-7 shrink-0 rounded-lg bg-amber-400/15 text-2xs font-bold text-amber-500 flex items-center justify-center">MA</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-2xs font-semibold">Linear Algebra — Revision sheet</p>
                    <div className="mt-1 h-1 rounded-full bg-line">
                      <div className="h-full w-2/6 rounded-full bg-amber-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card rounded-xl p-3">
              <p className="mb-2 text-2xs font-bold">Weekly study activity</p>
              <div className="flex items-end gap-1.5">
                {[40, 65, 30, 80, 55, 90, 70].map((h, i) => (
                  <div key={i} className="flex-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
                      className="rounded-md bg-gradient-to-t from-accent to-accent-soft"
                      style={{ minHeight: 8 }}
                    />
                    <p className="mt-1 text-center text-[9px] text-ink-soft">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Floating chips */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9 }}
        className="absolute -left-4 top-10 hidden rounded-xl border border-line bg-white px-3 py-2 shadow-soft sm:block dark:bg-ink-secondary"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-success" />
          <span className="text-2xs font-semibold">Summary generated</span>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.1 }}
        className="absolute -right-3 bottom-12 hidden rounded-xl border border-line bg-white px-3 py-2 shadow-soft sm:block dark:bg-ink-secondary"
      >
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-accent" />
          <span className="text-2xs font-semibold">12 flashcards ready</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-mute">
      <LandingNav
        onOpenMobileNav={() => setMobileOpen(true)}
        onCloseMobileNav={() => setMobileOpen(false)}
        mobileOpen={mobileOpen}
      />

      {/* Hero */}
      <section className="relative overflow-hidden pb-20 pt-28 sm:pt-36">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] opacity-70"
          style={{
            background:
              'radial-gradient(700px 380px at 70% 0%, rgb(239 237 255 / 0.9), transparent), radial-gradient(500px 300px at 20% 10%, rgb(169 156 251 / 0.16), transparent)',
          }}
        />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Badge className="mb-5">
              <Sparkles size={12} /> Your personal AI study companion
            </Badge>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Turn Your Notes{' '}
              <span className="bg-gradient-to-r from-accent to-accent-soft bg-clip-text text-transparent">
                Into Knowledge.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-soft sm:text-lg">
              Your personal AI learning assistant. Summarize notes, understand complex concepts,
              create flashcards, and prepare smarter for every exam.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register">
                <Button size="lg" icon={ArrowRight}>
                  Start Learning Free
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline">
                  Explore Features
                </Button>
              </a>
            </div>
            <div className="mt-7 flex items-center gap-6 text-xs text-ink-soft">
              <span className="font-semibold">PDF · DOCX · PPTX · TXT</span>
              <span>•</span>
              <span>Free to start</span>
            </div>
          </motion.div>
          <DashboardPreview />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-line bg-white py-20 dark:border-white/10 dark:bg-ink-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Everything you need to study smarter
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              One calm workspace that transforms messy lecture material into organized, interactive
              learning resources.
            </p>
          </motion.div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="card p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-lavender dark:bg-accent/20">
                  <f.icon size={22} className="text-accent" />
                </div>
                <h3 className="text-base font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              From notes to knowledge in four steps
            </h2>
          </motion.div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative card p-6"
              >
                <span className="absolute right-5 top-5 text-3xl font-extrabold text-line dark:text-white/10">
                  {i + 1}
                </span>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-lavender dark:bg-accent/20">
                  <s.icon size={22} className="text-accent" />
                </div>
                <h3 className="text-base font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About / trust */}
      <section id="about" className="bg-white py-20 dark:bg-ink-secondary">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Built for how students actually study
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
              Lumio AI was designed with engineering and university students in mind: deadlines, dense
              lecture slides, backlogs and last-minute revision. Every feature exists to compress the
              boring parts of studying — so the time you spend goes into actually learning. Your
              documents stay yours: summaries, flashcards and chats are private to your account.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-xl3 bg-gradient-to-br from-accent to-accent-soft px-8 py-14 text-center text-white shadow-glow sm:px-14"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                background:
                  'radial-gradient(400px 200px at 80% 20%, white, transparent), radial-gradient(300px 200px at 15% 80%, white, transparent)',
              }}
            />
            <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready to learn smarter?
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-sm text-white/85 sm:text-base">
              Join students who study with their own notes — organized, summarized and tested by AI.
            </p>
            <Link to="/register" className="relative mt-8 inline-block">
              <Button size="lg" className="!bg-white !text-accent hover:!bg-white/90" icon={ArrowRight}>
                Create your free account
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
