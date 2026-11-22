import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Mic, RotateCcw, ArrowRight } from 'lucide-react'
import { QUIZ_QUESTIONS } from '../data/projectData'
import PythonLine from './PythonLine'

const CATEGORIES = ['All', 'Functions', 'File I/O', 'Loops & Lists', 'Edge Cases']
const LETTERS = ['A', 'B', 'C', 'D']

export default function QuizAndPresentation({ onAskTutor }) {
  const [viewMode, setViewMode] = useState('quiz')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [finished, setFinished] = useState(false)
  const [answers, setAnswers] = useState({})
  const [openHints, setOpenHints] = useState({})
  const [category, setCategory] = useState('All')

  const total = QUIZ_QUESTIONS.length
  const currentQ = QUIZ_QUESTIONS[currentIdx]
  const currentPick = answers[currentQ.id]
  const currentAnswered = currentPick !== undefined
  const currentCorrect = currentPick === currentQ.answer

  const answeredCount = Object.keys(answers).length
  const correctCount = QUIZ_QUESTIONS.reduce(
    (acc, q) => acc + (answers[q.id] === q.answer ? 1 : 0),
    0
  )
  const pct = Math.round((correctCount / total) * 100)

  const handleAnswer = (q, optIdx) => {
    if (viewMode === 'quiz' && answers[q.id] !== undefined) return
    setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
  }

  const goNext = () => {
    if (currentIdx < total - 1) setCurrentIdx((i) => i + 1)
    else setFinished(true)
  }

  const retakeQuiz = () => {
    setAnswers({})
    setOpenHints({})
    setCurrentIdx(0)
    setFinished(false)
    setViewMode('quiz')
  }

  const filteredAll =
    category === 'All'
      ? QUIZ_QUESTIONS
      : QUIZ_QUESTIONS.filter((q) => q.category === category)

  const missed = QUIZ_QUESTIONS.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== q.answer
  )

  return (
    <div className="space-y-6" data-lock-tab-keys={viewMode === 'quiz' && !finished ? 'true' : undefined}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            {viewMode === 'quiz' ? 'Project Concept Check' : 'All 12 Project Questions'}
          </h2>
          <p className="text-sm text-ink-muted mt-1 max-w-xl">
            {viewMode === 'quiz'
              ? 'Test your understanding of the Student Club Member Directory code one question at a time.'
              : 'Browse all 12 project questions by topic.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="neu-inset p-1 rounded-xl inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('quiz')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                viewMode === 'quiz' ? 'neu-btn-primary' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Quiz
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                viewMode === 'all' ? 'neu-btn-primary' : 'text-ink-muted hover:text-ink'
              }`}
            >
              View all ({total})
            </button>
          </div>

          <button
            type="button"
            onClick={retakeQuiz}
            title="Restart quiz"
            aria-label="Restart quiz"
            className="neu-btn p-2 rounded-xl text-ink-2 hover:text-ink cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* One-by-One Quiz */}
      {viewMode === 'quiz' ? (
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="neu-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-semibold text-ink">
                {finished ? 'Completed' : `Question ${currentIdx + 1} of ${total}`}
              </span>
              <span className="font-mono text-ink-muted">
                {correctCount} / {answeredCount || total} correct
              </span>
            </div>

            <div className="grid grid-cols-12 gap-1.5">
              {QUIZ_QUESTIONS.map((q, idx) => {
                const ans = answers[q.id]
                const right = ans !== undefined && ans === q.answer
                const wrong = ans !== undefined && ans !== q.answer
                const now = !finished && idx === currentIdx
                return (
                  <div
                    key={q.id}
                    style={{
                      backgroundColor: right
                        ? '#16a34a'
                        : wrong
                        ? '#e11d48'
                        : now
                        ? 'var(--text-primary)'
                        : 'var(--divider)',
                    }}
                    className="h-1.5 rounded-full transition-colors"
                  />
                )
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!finished ? (
              <motion.div
                key={currentQ.id}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.2 }}
                className="neu-card rounded-2xl p-6 sm:p-7 space-y-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="neu-inset px-2.5 py-1 rounded-lg text-[11px] font-semibold text-ink-2">
                    {currentQ.category}
                  </span>

                  {!currentAnswered && (
                    <button
                      type="button"
                      onClick={() =>
                        setOpenHints((prev) => ({
                          ...prev,
                          [currentQ.id]: !prev[currentQ.id],
                        }))
                      }
                      className="neu-btn px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      {openHints[currentQ.id] ? 'Hide hint' : 'Show hint'}
                    </button>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-ink leading-snug">
                  {currentQ.q}
                </h3>

                {currentQ.code && (
                  <div className="code-well rounded-xl px-4 py-3 font-mono text-xs leading-relaxed overflow-x-auto max-w-full">
                    {currentQ.code.split('\n').map((ln, idx) => (
                      <div key={idx} className="whitespace-pre">
                        <PythonLine line={ln} />
                      </div>
                    ))}
                  </div>
                )}

                {openHints[currentQ.id] && !currentAnswered && (
                  <div className="neu-inset rounded-xl p-3.5 text-xs sm:text-sm text-ink-2">
                    <strong className="text-ink">Hint:</strong> {currentQ.hint}
                  </div>
                )}

                <div className="space-y-2.5">
                  {currentQ.options.map((opt, oIdx) => {
                    const isChosen = currentPick === oIdx
                    const isTrue = oIdx === currentQ.answer
                    const revealCorrect = currentAnswered && isTrue
                    const revealWrong = currentAnswered && isChosen && !isTrue

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        disabled={currentAnswered}
                        onClick={() => handleAnswer(currentQ, oIdx)}
                        className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium transition flex items-center justify-between gap-3 ${
                          revealCorrect
                            ? 'state-ok font-semibold'
                            : revealWrong
                            ? 'state-err'
                            : currentAnswered
                            ? 'neu-inset text-ink-muted opacity-65'
                            : 'neu-btn cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg font-mono text-xs font-semibold inline-flex items-center justify-center shrink-0 ${
                              revealCorrect
                                ? 'bg-emerald-600 text-white'
                                : revealWrong
                                ? 'bg-rose-600 text-white'
                                : 'neu-inset text-ink-2'
                            }`}
                          >
                            {LETTERS[oIdx]}
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </div>
                        {revealCorrect && <Check className="w-4 h-4 shrink-0" />}
                        {revealWrong && <X className="w-4 h-4 shrink-0" />}
                      </button>
                    )
                  })}
                </div>

                {currentAnswered && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 pt-1"
                  >
                    <div className={`rounded-xl p-4 text-sm space-y-1.5 ${currentCorrect ? 'state-ok' : 'state-err'}`}>
                      <div className="font-semibold">
                        {currentCorrect
                          ? 'Correct'
                          : `Correct answer: ${LETTERS[currentQ.answer]}) ${currentQ.options[currentQ.answer]}`}
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed opacity-95">
                        <strong>Why:</strong> {currentQ.explain}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {onAskTutor ? (
                        <button
                          type="button"
                          onClick={() =>
                            onAskTutor(
                              `Explain why the answer to "${currentQ.q}" is "${currentQ.options[currentQ.answer]}" simply.`
                            )
                          }
                          className="neu-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          <Mic className="w-3.5 h-3.5" /> Ask Voice Tutor
                        </button>
                      ) : (
                        <span />
                      )}

                      <button
                        type="button"
                        onClick={goNext}
                        className="neu-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer"
                      >
                        <span>{currentIdx < total - 1 ? 'Next question' : 'See results'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="neu-card rounded-2xl p-8 space-y-6 text-center"
              >
                <div className="space-y-1">
                  <div className="text-4xl font-semibold font-mono text-ink">
                    {correctCount} / {total}{' '}
                    <span className="text-xl text-ink-muted">({pct}%)</span>
                  </div>
                  <p className="text-sm text-ink-2">
                    {pct === 100
                      ? 'Every project question answered correctly.'
                      : 'Review any missed concepts below.'}
                  </p>
                </div>

                {missed.length > 0 && (
                  <div className="text-left space-y-2.5 pt-4 border-t neu-divider">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                      Missed Questions ({missed.length})
                    </div>
                    {missed.map((mq) => (
                      <div key={mq.id} className="neu-inset rounded-xl p-4 space-y-1">
                        <div className="text-xs font-semibold text-ink">{mq.q}</div>
                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          Answer: {mq.options[mq.answer]}
                        </div>
                        <div className="text-xs text-ink-2">{mq.explain}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={retakeQuiz}
                    className="neu-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Retake quiz
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('all')}
                    className="neu-btn px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    View all {total} questions
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* View All 12 */
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = category === cat
              const count =
                cat === 'All'
                  ? total
                  : QUIZ_QUESTIONS.filter((q) => q.category === cat).length
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                    active ? 'neu-btn-primary' : 'neu-btn text-ink-2'
                  }`}
                >
                  {cat} ({count})
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredAll.map((item) => {
              const pick = answers[item.id]
              const isAnswered = pick !== undefined
              const isCorrect = pick === item.answer
              const showHint = !!openHints[item.id]

              return (
                <div
                  key={item.id}
                  className="neu-card rounded-2xl p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="neu-inset px-2.5 py-0.5 rounded-md text-[10.5px] font-semibold text-ink-2">
                        {item.category}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenHints((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                        }
                        className="neu-btn px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer"
                      >
                        {showHint ? 'Hide hint' : 'Hint'}
                      </button>
                    </div>

                    <div className="text-sm font-semibold text-ink leading-snug">{item.q}</div>

                    {item.code && (
                      <div className="code-well rounded-xl px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed overflow-x-auto max-w-full">
                        {item.code.split('\n').map((ln, idx) => (
                          <div key={idx} className="whitespace-pre">
                            <PythonLine line={ln} />
                          </div>
                        ))}
                      </div>
                    )}

                    {showHint && (
                      <div className="neu-inset rounded-xl p-2.5 text-xs text-ink-2">
                        <strong className="text-ink">Hint:</strong> {item.hint}
                      </div>
                    )}

                    <div className="space-y-2">
                      {item.options.map((opt, oIdx) => {
                        const chosen = pick === oIdx
                        const revealRight = isAnswered && oIdx === item.answer
                        const revealWrong = chosen && oIdx !== item.answer
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => handleAnswer(item, oIdx)}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between gap-2 ${
                              revealRight
                                ? 'state-ok font-semibold'
                                : revealWrong
                                ? 'state-err'
                                : 'neu-btn'
                            }`}
                          >
                            <span>{opt}</span>
                            {revealRight && <Check className="w-3.5 h-3.5 shrink-0" />}
                            {revealWrong && <X className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {isAnswered && (
                    <div className={`rounded-xl p-3 text-xs space-y-1 ${isCorrect ? 'state-ok' : 'state-err'}`}>
                      {!isCorrect && (
                        <div className="font-semibold">
                          Correct: {item.options[item.answer]}
                        </div>
                      )}
                      <div>
                        <strong>Why:</strong> {item.explain}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
