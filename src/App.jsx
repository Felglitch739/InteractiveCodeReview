import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Moon, Sun } from 'lucide-react'
import CodeMapModule from './components/CodeMapModule'
import FileParserLab from './components/FileParserLab'
import LiveSimulator from './components/LiveSimulator'
import ChooseMemberTracer from './components/ChooseMemberTracer'
import QuizAndPresentation from './components/QuizAndPresentation'
import VoiceTutorDrawer from './components/VoiceTutorDrawer'

const TABS = [
  { id: 'code', label: 'Code' },
  { id: 'parser', label: 'File Parser' },
  { id: 'sim', label: 'Simulator' },
  { id: 'choose', label: 'choose_member' },
  { id: 'quiz', label: 'Quiz & Script' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('code')
  const [tutorOpen, setTutorOpen] = useState(false)
  const [queuedQuestion, setQueuedQuestion] = useState('')
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return localStorage.getItem('csci_theme') || 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('csci_theme', theme)
  }, [theme])

  const handleAskTutor = (question) => {
    setQueuedQuestion(question)
    setTutorOpen(true)
  }

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && tutorOpen) {
        setTutorOpen(false)
        return
      }
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tutorOpen) return
      const idx = Number(e.key) - 1
      if (idx >= 0 && idx < TABS.length) {
        setActiveTab(TABS[idx].id)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [tutorOpen])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimalist Soft-Neumorphic Header */}
      <header className="sticky top-0 z-40 neu-header backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3.5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold tracking-tight text-ink truncate">
                Student Club Member Directory
              </h1>
              <p className="text-xs text-ink-muted truncate">
                CSCI 1380 · Prompt 8 · Jeremy Hernández, Sara Astorga &amp; Felix Martinez
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label="Toggle color theme"
                className="neu-btn inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5" strokeWidth={1.8} />
                    <span className="hidden sm:inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5" strokeWidth={1.8} />
                    <span className="hidden sm:inline">Dark</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setTutorOpen(true)}
                className="neu-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5" strokeWidth={1.9} />
                <span>Voice Tutor</span>
              </button>
            </div>
          </div>

          {/* Recessed Neumorphic Tab Track */}
          <nav
            className="neu-inset p-1.5 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-fit"
            role="tablist"
          >
            {TABS.map((tab, idx) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={isActive}
                  className={`relative px-4 py-2 rounded-xl text-xs sm:text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    isActive ? 'text-ink font-semibold' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="neuActiveTab"
                      className="absolute inset-0 rounded-xl neu-card-sm"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-2">
                    <span className="font-mono text-[11px] opacity-60">{idx + 1}</span>
                    <span>{tab.label}</span>
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === 'code' && <CodeMapModule onAskTutor={handleAskTutor} />}
            {activeTab === 'parser' && <FileParserLab />}
            {activeTab === 'sim' && <LiveSimulator />}
            {activeTab === 'choose' && <ChooseMemberTracer />}
            {activeTab === 'quiz' && <QuizAndPresentation onAskTutor={handleAskTutor} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="py-6 px-4 text-center text-xs text-ink-muted">
        CSCI 1380 · Prompt 8 · Press 1–5 to switch views
      </footer>

      <VoiceTutorDrawer
        open={tutorOpen}
        onClose={() => setTutorOpen(false)}
        queuedQuestion={queuedQuestion}
        onClearQueued={() => setQueuedQuestion('')}
      />
    </div>
  )
}
