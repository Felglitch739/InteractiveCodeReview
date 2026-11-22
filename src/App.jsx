import { useEffect, useState } from 'react'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import { Mic, Moon, Sun, Lock } from 'lucide-react'
import CodeMapModule from './components/CodeMapModule'
import FileParserLab from './components/FileParserLab'
import LiveSimulator from './components/LiveSimulator'
import ChooseMemberTracer from './components/ChooseMemberTracer'
import QuizAndPresentation from './components/QuizAndPresentation'
import FinalExamReview from './components/exam/FinalExamReview'
import VoiceTutorDrawer from './components/VoiceTutorDrawer'
import TeamAccessGate, { isTeamUnlocked } from './components/TeamAccessGate'

const TEAM_TABS = [
  { id: 'code', label: 'Code' },
  { id: 'parser', label: 'File Parser' },
  { id: 'sim', label: 'Simulator' },
  { id: 'choose', label: 'choose_member' },
  { id: 'quiz', label: 'Project Quiz' },
  { id: 'exam', label: 'Final Exam Review' },
]

function detectTeamPortal() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname.toLowerCase()
  const path = window.location.pathname.toLowerCase()
  return (
    host.startsWith('team.') ||
    host.startsWith('club.') ||
    path === '/team' ||
    path.startsWith('/team/') ||
    path === '/project' ||
    path.startsWith('/project/')
  )
}

export default function App() {
  const [isTeamPortal, setIsTeamPortal] = useState(detectTeamPortal)
  const [teamUnlocked, setTeamUnlocked] = useState(isTeamUnlocked)
  const [activeTab, setActiveTab] = useState(() => (detectTeamPortal() ? 'code' : 'exam'))
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

  useEffect(() => {
    const onPopState = () => {
      const nextIsTeam = detectTeamPortal()
      setIsTeamPortal(nextIsTeam)
      setActiveTab(nextIsTeam ? 'code' : 'exam')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const switchTab = (tabId) => {
    setActiveTab(tabId)
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }

  const handleAskTutor = (question) => {
    setQueuedQuestion(question)
    setTutorOpen(true)
  }

  const goBackToPublic = () => {
    if (window.location.hostname.startsWith('team.') || window.location.hostname.startsWith('club.')) {
      const baseHost = window.location.hostname.replace(/^(team|club)\./, '')
      window.location.href = `${window.location.protocol}//${baseHost}/`
      return
    }
    window.history.pushState({}, '', '/')
    setIsTeamPortal(false)
    setActiveTab('exam')
  }

  const lockTeamPortal = () => {
    sessionStorage.removeItem('csci1380_team_unlocked_v1')
    setTeamUnlocked(false)
    setTutorOpen(false)
  }

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && tutorOpen) {
        setTutorOpen(false)
        return
      }
      if (!isTeamPortal || !teamUnlocked) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tutorOpen) return
      if (document.querySelector('[data-lock-tab-keys="true"]')) return

      const idx = Number(e.key) - 1
      if (idx >= 0 && idx < TEAM_TABS.length) {
        setActiveTab(TEAM_TABS[idx].id)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [tutorOpen, isTeamPortal, teamUnlocked])

  const showTeamWorkspace = isTeamPortal && teamUnlocked
  const tutorScope = showTeamWorkspace && activeTab !== 'exam' ? 'project' : 'exam'

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col overflow-x-clip">
        {/* Minimalist Soft-Neumorphic Header */}
        <header className="sticky top-0 z-40 neu-header backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3.5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold tracking-tight text-ink truncate">
                  {showTeamWorkspace
                    ? 'Student Club Member Directory'
                    : 'CSCI 1380 · Final Exam Review'}
                </h1>
                <p className="text-xs text-ink-muted truncate">
                  {showTeamWorkspace
                    ? 'Private Team Portal · Jeremy Hernández, Sara Astorga & Felix Martinez'
                    : 'Intro to Python · Code Flows, Interactive Labs & Mock Exam'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {showTeamWorkspace && (
                  <button
                    type="button"
                    onClick={lockTeamPortal}
                    title="Lock team portal"
                    className="neu-btn inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" strokeWidth={1.8} />
                    <span className="hidden sm:inline">Lock</span>
                  </button>
                )}

                <button
                  type="button"
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

                {(!isTeamPortal || teamUnlocked) && (
                  <button
                    type="button"
                    onClick={() => setTutorOpen(true)}
                    className="neu-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" strokeWidth={1.9} />
                    <span>Voice Tutor</span>
                  </button>
                )}
              </div>
            </div>

            {/* Project tabs appear ONLY in unlocked private Team Portal (/team or team.* subdomain) */}
            {showTeamWorkspace && (
              <nav
                className="neu-inset p-1.5 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-fit max-w-full"
                role="tablist"
              >
                {TEAM_TABS.map((tab, idx) => {
                  const isActive = activeTab === tab.id
                  const showDividerBefore = idx === 5
                  return (
                    <div key={tab.id} className="inline-flex items-center gap-1 shrink-0">
                      {showDividerBefore && (
                        <span
                          aria-hidden="true"
                          style={{ backgroundColor: 'var(--divider)' }}
                          className="w-px h-5 mx-1 shrink-0"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => switchTab(tab.id)}
                        role="tab"
                        aria-selected={isActive}
                        className={`relative px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
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
                        <span className="relative z-10 inline-flex items-center gap-1.5">
                          <span className="font-mono text-[11px] opacity-60">{idx + 1}</span>
                          <span>{tab.label}</span>
                        </span>
                      </button>
                    </div>
                  )
                })}
              </nav>
            )}
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
          {isTeamPortal && !teamUnlocked ? (
            <TeamAccessGate
              onUnlocked={() => {
                setTeamUnlocked(true)
                setActiveTab('code')
              }}
              onBackToPublic={goBackToPublic}
            />
          ) : !showTeamWorkspace ? (
            <FinalExamReview onAskTutor={handleAskTutor} />
          ) : (
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
                {activeTab === 'exam' && (
                  <FinalExamReview
                    onAskTutor={handleAskTutor}
                    onOpenProjectTab={(tabId) => switchTab(tabId)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        <footer className="py-6 px-4 text-center text-xs text-ink-muted">
          {showTeamWorkspace
            ? 'CSCI 1380 · Private Team Portal · Press 1–6 to switch views'
            : 'CSCI 1380 · Intro to Python Final Exam Review · Interactive Practice Guide'}
        </footer>

        {(!isTeamPortal || teamUnlocked) && (
          <VoiceTutorDrawer
            open={tutorOpen}
            onClose={() => setTutorOpen(false)}
            queuedQuestion={queuedQuestion}
            onClearQueued={() => setQueuedQuestion('')}
            scope={tutorScope}
          />
        )}
      </div>
    </MotionConfig>
  )
}
