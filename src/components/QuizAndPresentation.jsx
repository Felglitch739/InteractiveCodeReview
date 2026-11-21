import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Mic, RotateCcw, ArrowRight } from 'lucide-react'
import { QUIZ_QUESTIONS, SPEAKER_SPLIT } from '../data/projectData'
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
    <div className="space-y-12">
      {/* Quiz Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#161922]">
              {viewMode === 'quiz' ? 'Concept Check' : 'All 12 Questions'}
            </h2>
            <p className="text-sm text-[#647084] mt-1 max-w-xl">
              {viewMode === 'quiz'
                ? 'One question at a time. Every answer reveals the correct solution and explains why.'
                : 'Browse all 12 questions by topic to review before presenting.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="neu-inset p-1 rounded-xl inline-flex items-center gap-1">
              <button
                onClick={() => setViewMode('quiz')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                  viewMode === 'quiz' ? 'neu-card-sm text-[#161922] font-semibold' : 'text-[#647084]'
                }`}
              >
                Quiz
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                  viewMode === 'all' ? 'neu-card-sm text-[#161922] font-semibold' : 'text-[#647084]'
                }`}
              >
                View all ({total})
              </button>
            </div>

            <button
              onClick={retakeQuiz}
              title="Restart quiz"
              className="neu-btn p-2 rounded-xl text-[#647084] hover:text-[#161922] cursor-pointer"
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
                <span className="font-mono font-medium text-[#161922]">
                  {finished ? 'Completed' : `Question ${currentIdx + 1} of ${total}`}
                </span>
                <span className="font-mono text-[#647084]">
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
                      className={`h-1.5 rounded-full transition-colors ${
                        right
                          ? 'bg-[#15803d]'
                          : wrong
                          ? 'bg-[#be123c]'
                          : now
                          ? 'bg-[#181b22]'
                          : 'bg-[#cfd6e2]'
                      }`}
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
                    <span className="neu-inset px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#475569]">
                      {currentQ.category}
                    </span>

                    {!currentAnswered && (
                      <button
                        onClick={() =>
                          setOpenHints((prev) => ({
                            ...prev,
                            [currentQ.id]: !prev[currentQ.id],
                          }))
                        }
                        className="text-xs font-medium text-[#647084] hover:text-[#161922] cursor-pointer"
                      >
                        {openHints[currentQ.id] ? 'Hide hint' : 'Show hint'}
                      </button>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-[#161922] leading-snug">
                    {currentQ.q}
                  </h3>

                  {currentQ.code && (
                    <div className="code-well rounded-xl px-4 py-3 font-mono text-xs leading-relaxed overflow-x-auto">
                      {currentQ.code.split('\n').map((ln, idx) => (
                        <div key={idx} className="whitespace-pre">
                          <PythonLine line={ln} />
                        </div>
                      ))}
                    </div>
                  )}

                  {openHints[currentQ.id] && !currentAnswered && (
                    <div className="neu-inset rounded-xl p-3.5 text-xs sm:text-sm text-[#475569]">
                      <strong className="text-[#161922]">Hint:</strong> {currentQ.hint}
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
                          disabled={currentAnswered}
                          onClick={() => handleAnswer(currentQ, oIdx)}
                          className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium transition flex items-center justify-between gap-3 ${
                            revealCorrect
                              ? 'bg-[#e3f3e8] border border-[#a7d7b8] text-[#14532d] font-semibold'
                              : revealWrong
                              ? 'bg-[#fbe9ec] border border-[#f2c6ce] text-[#881337]'
                              : currentAnswered
                              ? 'neu-inset text-[#8793a6] opacity-70'
                              : 'neu-btn text-[#161922] cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-lg font-mono text-xs font-semibold inline-flex items-center justify-center shrink-0 ${
                                revealCorrect
                                  ? 'bg-[#15803d] text-white'
                                  : revealWrong
                                  ? 'bg-[#be123c] text-white'
                                  : 'neu-inset text-[#475569]'
                              }`}
                            >
                              {LETTERS[oIdx]}
                            </span>
                            <span className="leading-snug">{opt}</span>
                          </div>
                          {revealCorrect && <Check className="w-4 h-4 text-[#15803d] shrink-0" />}
                          {revealWrong && <X className="w-4 h-4 text-[#be123c] shrink-0" />}
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
                      <div className="neu-inset rounded-xl p-4 text-sm space-y-1.5">
                        <div className={`font-semibold ${currentCorrect ? 'text-[#15803d]' : 'text-[#9f1239]'}`}>
                          {currentCorrect
                            ? 'Correct'
                            : `Correct answer: ${LETTERS[currentQ.answer]}) ${currentQ.options[currentQ.answer]}`}
                        </div>
                        <p className="text-xs sm:text-sm text-[#2c3340] leading-relaxed">
                          <strong className="text-[#161922]">Why:</strong> {currentQ.explain}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        {onAskTutor ? (
                          <button
                            onClick={() =>
                              onAskTutor(
                                `Explain why the answer to "${currentQ.q}" is "${currentQ.options[currentQ.answer]}" simply.`
                              )
                            }
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#475569] hover:text-[#161922] cursor-pointer"
                          >
                            <Mic className="w-3.5 h-3.5" /> Ask Voice Tutor
                          </button>
                        ) : (
                          <span />
                        )}

                        <button
                          onClick={goNext}
                          className="neu-btn-dark inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium cursor-pointer"
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
                    <div className="text-4xl font-semibold font-mono text-[#161922]">
                      {correctCount} / {total}{' '}
                      <span className="text-xl text-[#647084]">({pct}%)</span>
                    </div>
                    <p className="text-sm text-[#526075]">
                      {pct === 100
                        ? 'Every question answered correctly.'
                        : 'Review any missed concepts below before Monday.'}
                    </p>
                  </div>

                  {missed.length > 0 && (
                    <div className="text-left space-y-2.5 pt-4 border-t border-[#d7dde7]">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7a869a]">
                        Missed Questions ({missed.length})
                      </div>
                      {missed.map((mq) => (
                        <div key={mq.id} className="neu-inset rounded-xl p-4 space-y-1">
                          <div className="text-xs font-semibold text-[#161922]">{mq.q}</div>
                          <div className="text-xs font-medium text-[#15803d]">
                            Answer: {mq.options[mq.answer]}
                          </div>
                          <div className="text-xs text-[#526075]">{mq.explain}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                    <button
                      onClick={retakeQuiz}
                      className="neu-btn-dark inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Retake quiz
                    </button>
                    <button
                      onClick={() => setViewMode('all')}
                      className="neu-btn px-4 py-2.5 rounded-xl text-xs font-medium text-[#161922] cursor-pointer"
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
                    onClick={() => setCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition ${
                      active ? 'neu-inset text-[#161922] font-semibold' : 'neu-btn text-[#647084]'
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
                        <span className="neu-inset px-2.5 py-0.5 rounded-md text-[10.5px] font-medium text-[#475569]">
                          {item.category}
                        </span>
                        <button
                          onClick={() =>
                            setOpenHints((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                          }
                          className="text-[11px] font-medium text-[#647084] hover:text-[#161922] cursor-pointer"
                        >
                          {showHint ? 'Hide hint' : 'Hint'}
                        </button>
                      </div>

                      <div className="text-sm font-semibold text-[#161922] leading-snug">{item.q}</div>

                      {item.code && (
                        <div className="code-well rounded-xl px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed overflow-x-auto">
                          {item.code.split('\n').map((ln, idx) => (
                            <div key={idx} className="whitespace-pre">
                              <PythonLine line={ln} />
                            </div>
                          ))}
                        </div>
                      )}

                      {showHint && (
                        <div className="neu-inset rounded-xl p-2.5 text-xs text-[#475569]">
                          <strong>Hint:</strong> {item.hint}
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
                              onClick={() => handleAnswer(item, oIdx)}
                              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between gap-2 ${
                                revealRight
                                  ? 'bg-[#e3f3e8] border border-[#a7d7b8] text-[#14532d] font-semibold'
                                  : revealWrong
                                  ? 'bg-[#fbe9ec] border border-[#f2c6ce] text-[#881337]'
                                  : 'neu-btn text-[#161922]'
                              }`}
                            >
                              <span>{opt}</span>
                              {revealRight && <Check className="w-3.5 h-3.5 text-[#15803d] shrink-0" />}
                              {revealWrong && <X className="w-3.5 h-3.5 text-[#be123c] shrink-0" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {isAnswered && (
                      <div className="neu-inset rounded-xl p-3 text-xs space-y-1 text-[#2c3340]">
                        {!isCorrect && (
                          <div className="font-semibold text-[#15803d]">
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

      {/* Speaking Split */}
      <div className="space-y-5 pt-8 border-t border-[#d7dde7]">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[#161922]">
            Presentation Split
          </h2>
          <p className="text-sm text-[#647084] mt-1">
            Suggested three-part breakdown (~90 seconds each) in plain English.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {SPEAKER_SPLIT.map((sp) => (
            <div
              key={sp.name}
              className="neu-card rounded-2xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <span className="inline-block neu-inset px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#475569]">
                  {sp.part}
                </span>
                <h3 className="text-base font-semibold text-[#161922]">{sp.name}</h3>
                <ul className="space-y-1.5 text-xs text-[#4a5568] list-disc pl-4 leading-relaxed">
                  {sp.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>

              <div className="neu-inset rounded-xl p-3.5 text-xs text-[#1e2430] leading-relaxed">
                {sp.script}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
