import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Code2, FileSearch, Terminal, Crosshair, Trophy, Mic } from 'lucide-react'
import CodeMapModule from './components/CodeMapModule'
import FileParserLab from './components/FileParserLab'
import LiveSimulator from './components/LiveSimulator'
import ChooseMemberTracer from './components/ChooseMemberTracer'
import QuizAndPresentation from './components/QuizAndPresentation'
import VoiceTutorDrawer from './components/VoiceTutorDrawer'

const TABS = [
  { id: 'code', label: 'Code Map', icon: Code2 },
  { id: 'parser', label: 'File Parser', icon: FileSearch },
  { id: 'sim', label: 'Live Simulator', icon: Terminal },
  { id: 'choose', label: 'choose_member', icon: Crosshair },
  { id: 'quiz', label: 'Challenges & Script', icon: Trophy },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('code')
  const [tutorOpen, setTutorOpen] = useState(false)
  const [queuedQuestion, setQueuedQuestion] = useState('')

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
      {/* Compact Glass Studio Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#0b0c0f]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3.5 pb-2.5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center font-mono font-bold text-sm text-emerald-400 shadow-inner shrink-0">
                &gt;_
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight truncate">
                  Student Club Member Directory
                </h1>
                <p className="text-[11.5px] text-zinc-400 truncate">
                  CSCI 1380 · Prompt #8 · Jeremy, Sara &amp; Felix
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden xl:flex items-center gap-1.5 mr-1">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-900/90 border border-zinc-800 text-zinc-300">
                  Jeremy Hernández
                </span>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-900/90 border border-zinc-800 text-zinc-300">
                  Sara Astorga
                </span>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-900/90 border border-zinc-800 text-zinc-300">
                  Felix Martinez
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setTutorOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 cursor-pointer transition"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                <Mic className="w-3.5 h-3.5" />
                <span>Voice Tutor</span>
              </motion.button>
            </div>
          </div>

          {/* Clean Single-Row Tab Bar (no ugly scrollbar) */}
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar" role="tablist">
            {TABS.map((tab, idx) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={isActive}
                  className={`relative px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-semibold whitespace-nowrap inline-flex items-center gap-1.5 transition cursor-pointer ${
                    isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavPill"
                      className="absolute inset-0 rounded-xl bg-zinc-800/90 border border-zinc-700/80 shadow-sm"
                      transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    <span
                      className={`w-4.5 h-4.5 rounded-md font-mono text-[10px] font-bold inline-flex items-center justify-center ${
                        isActive
                          ? 'bg-emerald-500 text-zinc-950'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <Icon className="w-3.5 h-3.5 hidden sm:inline" />
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-7">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {activeTab === 'code' && <CodeMapModule onAskTutor={handleAskTutor} />}
            {activeTab === 'parser' && <FileParserLab />}
            {activeTab === 'sim' && <LiveSimulator />}
            {activeTab === 'choose' && <ChooseMemberTracer />}
            {activeTab === 'quiz' && <QuizAndPresentation onAskTutor={handleAskTutor} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-zinc-900 py-5 px-4 text-center text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-center gap-2">
        <span>CSCI 1380 · Student Club Member Directory · Jeremy Hernández · Sara Astorga · Felix Martinez</span>
        <span className="hidden sm:inline text-zinc-700">·</span>
        <span className="font-mono text-[11px] text-zinc-600">Tip: Press keys 1–5 to switch modules</span>
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
