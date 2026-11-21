import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, CheckCircle2, XCircle, Mic, Users, HelpCircle, RotateCcw, Flame
} from 'lucide-react'
import { QUIZ_QUESTIONS, SPEAKER_SPLIT } from '../data/projectData'
import PythonLine from './PythonLine'

const CATEGORIES = ['All', 'Functions', 'File I/O', 'Loops & Lists', 'Edge Cases']

const SPEAKER_BADGE = {
  indigo: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
}

export default function QuizAndPresentation({ onAskTutor }) {
  const [category, setCategory] = useState('All')
  const [selected, setSelected] = useState({})
  const [openHints, setOpenHints] = useState({})
  const [streak, setStreak] = useState(0)

  const filtered =
    category === 'All'
      ? QUIZ_QUESTIONS
      : QUIZ_QUESTIONS.filter((q) => q.category === category)

  const correctCount = QUIZ_QUESTIONS.reduce(
    (acc, q) => acc + (selected[q.id] === q.answer ? 1 : 0),
    0
  )
  const pct = Math.round((correctCount / QUIZ_QUESTIONS.length) * 100)

  const handleSelect = (q, optIdx) => {
    const alreadyCorrect = selected[q.id] === q.answer
    setSelected((prev) => ({ ...prev, [q.id]: optIdx }))
    if (optIdx === q.answer) {
      if (!alreadyCorrect) setStreak((s) => s + 1)
    } else {
      setStreak(0)
    }
  }

  const resetQuiz = () => {
    setSelected({})
    setOpenHints({})
    setStreak(0)
  }

  return (
    <div className="space-y-10">
      {/* Quiz Section */}
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1.5">
              <Trophy className="w-3.5 h-3.5" /> Module 05 · zyBooks-Style Study Bank
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              12 Interactive Code Challenges
            </h2>
            <p className="text-zinc-400 text-sm md:text-base mt-1 max-w-3xl">
              Covers every function, loop, file mode, and edge case in your project. Filter by topic, use hints if stuck, or ask the Voice Tutor to walk you through any question.
            </p>
          </div>

          <button
            onClick={resetQuiz}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white cursor-pointer transition self-start md:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Progress
          </button>
        </div>

        {/* Mastery Progress Bar */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white">Team Mastery Progress</span>
              {streak >= 2 && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/35 text-amber-300"
                >
                  <Flame className="w-3.5 h-3.5" /> {streak} streak
                </motion.span>
              )}
            </div>
            <span className="px-3 py-0.5 rounded-full font-mono text-xs font-bold bg-emerald-500/15 border border-emerald-500/35 text-emerald-300">
              {correctCount} / {QUIZ_QUESTIONS.length} Mastered ({pct}%)
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ type: 'spring', stiffness: 180, damping: 24 }}
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = category === cat
            const count =
              cat === 'All'
                ? QUIZ_QUESTIONS.length
                : QUIZ_QUESTIONS.filter((q) => q.category === cat).length
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  active
                    ? 'bg-emerald-500/15 border-emerald-500/45 text-emerald-200'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {cat} <span className="opacity-60 font-mono ml-1">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Challenge Cards */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((item) => {
              const pick = selected[item.id]
              const isCorrect = pick === item.answer
              const showHint = !!openHints[item.id]

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300">
                        {item.category}
                      </span>
                      <div className="flex items-center gap-2">
                        {item.difficulty === 'Key Question' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Professor Favorite
                          </span>
                        )}
                        <button
                          onClick={() =>
                            setOpenHints((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-sky-300 cursor-pointer transition"
                        >
                          <HelpCircle className="w-3.5 h-3.5" /> {showHint ? 'Hide Hint' : 'Hint'}
                        </button>
                      </div>
                    </div>

                    <div className="text-sm font-bold text-white leading-snug">{item.q}</div>

                    {item.code && (
                      <div className="rounded-xl bg-[#0a0b0e] border border-zinc-800/90 px-3 py-2.5 font-mono text-[11.5px] leading-relaxed overflow-x-auto">
                        {item.code.split('\n').map((ln, idx) => (
                          <div key={idx} className="whitespace-pre">
                            <PythonLine line={ln} />
                          </div>
                        ))}
                      </div>
                    )}

                    <AnimatePresence>
                      {showHint && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/25 text-xs text-sky-200">
                            <strong>Hint:</strong> {item.hint}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-2">
                      {item.options.map((opt, oIdx) => {
                        const chosen = pick === oIdx
                        const right = chosen && oIdx === item.answer
                        const wrong = chosen && oIdx !== item.answer
                        return (
                          <button
                            key={oIdx}
                            onClick={() => handleSelect(item, oIdx)}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center justify-between gap-2 ${
                              right
                                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-semibold'
                                : wrong
                                ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                                : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/60'
                            }`}
                          >
                            <span>{opt}</span>
                            {right && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            {wrong && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {pick !== undefined && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl text-xs leading-relaxed border flex flex-col gap-2 ${
                        isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                      }`}
                    >
                      <span>
                        {isCorrect
                          ? item.explain
                          : 'Not quite—check the hint or ask the Voice Tutor to explain this step!'}
                      </span>
                      {!isCorrect && onAskTutor && (
                        <button
                          onClick={() => onAskTutor(`Can you explain this question simply: "${item.q}"`)}
                          className="self-start inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-300 hover:text-sky-200 cursor-pointer"
                        >
                          <Mic className="w-3 h-3" /> Ask Voice Tutor about this
                        </button>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Presentation Split */}
      <div className="space-y-5 pt-4 border-t border-zinc-800/80">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1.5">
            <Users className="w-3.5 h-3.5" /> Monday Presentation Plan
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Suggested 3-Person Speaking Split
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Each teammate covers one clear section (~90 seconds) with a ready-to-speak script in natural English.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {SPEAKER_SPLIT.map((sp) => (
            <div
              key={sp.name}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                    SPEAKER_BADGE[sp.tone]
                  }`}
                >
                  {sp.part}
                </span>
                <h3 className="text-lg font-bold text-white">{sp.name}</h3>
                <ul className="space-y-1.5 text-xs text-zinc-300 list-disc pl-4 leading-relaxed">
                  {sp.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-[#0a0b0e] border border-zinc-800 p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-400">
                    <Mic className="w-3 h-3" /> Spoken Script
                  </div>
                  {onAskTutor && (
                    <button
                      onClick={() =>
                        onAskTutor(
                          `Help ${sp.name} rehearse ${sp.part}. Ask one realistic professor question about their section.`
                        )
                      }
                      className="text-[10.5px] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer transition"
                    >
                      Rehearse with Tutor →
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-200 italic leading-relaxed">{sp.script}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
