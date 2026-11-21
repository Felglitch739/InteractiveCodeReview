import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Copy, CornerDownLeft, Terminal, FileInput, Repeat, GitBranch, FileCode2, MessageSquareQuote, Lightbulb, Code2, Mic } from 'lucide-react'
import { CODE_BLOCKS, getCleanCodeString } from '../data/projectData'
import PythonLine from './PythonLine'

const FILTERS = [
  { id: 'all', label: 'All Code' },
  { id: 'functions', label: 'Functions (def)' },
  { id: 'file', label: 'File Loading' },
  { id: 'menu', label: 'Main Menu (while)' },
]

const TONE_BADGE = {
  indigo: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  sky: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
}

function BadgeIcon({ badge }) {
  if (badge.includes('Value-Returning')) return <CornerDownLeft className="w-3.5 h-3.5" />
  if (badge.includes('Void')) return <Terminal className="w-3.5 h-3.5" />
  if (badge.includes('Startup') || badge.includes('Menu')) return <FileInput className="w-3.5 h-3.5" />
  if (badge.includes('Loop')) return <Repeat className="w-3.5 h-3.5" />
  if (badge.includes('Project')) return <FileCode2 className="w-3.5 h-3.5" />
  return <GitBranch className="w-3.5 h-3.5" />
}

export default function CodeMapModule({ onAskTutor }) {
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState('format_member')
  const [copied, setCopied] = useState(false)

  const selectedBlock = CODE_BLOCKS.find((b) => b.id === selectedId) || CODE_BLOCKS[0]

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getCleanCodeString())
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  let runningLine = 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1.5">
            <Code2 className="w-3.5 h-3.5" /> Module 01 · Clean Source Explorer
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Interactive Code Map
          </h2>
          <p className="text-zinc-400 text-sm md:text-base mt-1 max-w-2xl">
            Full clean Python code with comments removed. Click any section to see what it does,
            why we designed it this way, and how to explain it out loud in class.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition cursor-pointer shrink-0 self-start md:self-auto"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied Clean Code!' : 'Copy Clean Python'}
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.id
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                active
                  ? 'text-white border-indigo-500/50 bg-indigo-500/20'
                  : 'text-zinc-400 border-zinc-800 bg-zinc-900/60 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Code Editor */}
        <div className="lg:col-span-7 rounded-2xl border border-zinc-800/90 bg-[#0d0d12] overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-400/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
            </div>
            <span className="font-mono text-xs text-zinc-400">student_club_directory.py</span>
            <span className="text-[11px] text-zinc-500">Click any block</span>
          </div>

          <div className="max-h-[680px] overflow-y-auto py-3 divide-y divide-zinc-900/80">
            {CODE_BLOCKS.map((block, bIdx) => {
              const isSelected = block.id === selectedId
              const isDimmed = filter !== 'all' && block.category !== filter
              const blockStartLine = runningLine
              runningLine += block.lines.length + (bIdx < CODE_BLOCKS.length - 1 ? 1 : 0)

              return (
                <div
                  key={block.id}
                  onClick={() => setSelectedId(block.id)}
                  className={`relative px-4 py-2.5 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-indigo-500/[0.12]'
                      : 'hover:bg-zinc-800/35'
                  } ${isDimmed ? 'opacity-25' : 'opacity-100'}`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeCodeIndicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.8)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}

                  <div className="mb-1.5 ml-10">
                    <span
                      className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-indigo-500 text-white'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {block.tag}
                    </span>
                  </div>

                  <div className="font-mono text-[12.5px] leading-relaxed overflow-x-auto">
                    {block.lines.map((line, lIdx) => (
                      <div key={lIdx} className="flex gap-4 whitespace-pre">
                        <span className="w-6 text-right text-zinc-600 select-none shrink-0">
                          {blockStartLine + lIdx}
                        </span>
                        <span>
                          <PythonLine line={line} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Animated Inspector */}
        <div className="lg:col-span-5 lg:sticky lg:top-28">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedBlock.id}
              initial={{ opacity: 0, y: 12, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.985 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-zinc-800 studio-card backdrop-blur-md p-6 space-y-5"
            >
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    TONE_BADGE[selectedBlock.tone]
                  }`}
                >
                  <BadgeIcon badge={selectedBlock.badge} /> {selectedBlock.badge}
                </span>
                <h3 className="text-xl font-bold text-white mt-3 font-mono">
                  {selectedBlock.title}
                </h3>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  What It Does
                </div>
                <p className="text-sm text-zinc-200 leading-relaxed">{selectedBlock.what}</p>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  <Lightbulb className="w-3.5 h-3.5" /> Why We Built It This Way
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{selectedBlock.why}</p>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-400">
                  <MessageSquareQuote className="w-3.5 h-3.5" /> Say It Out Loud (Presentation)
                </div>
                <div className="rounded-xl bg-sky-500/10 border border-sky-500/25 p-4 text-sm text-sky-100 leading-relaxed italic">
                  "{selectedBlock.script}"
                </div>
              </div>

              {onAskTutor && (
                <button
                  onClick={() =>
                    onAskTutor(
                      `Explain "${selectedBlock.title}" in simple CSCI 1380 terms and give me one quick question the professor might ask about it.`
                    )
                  }
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-200 cursor-pointer transition"
                >
                  <Mic className="w-3.5 h-3.5" /> Ask Voice Tutor About This Block
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
