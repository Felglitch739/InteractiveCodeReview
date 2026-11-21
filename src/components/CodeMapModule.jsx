import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Copy, Mic } from 'lucide-react'
import { CODE_BLOCKS, getCleanCodeString } from '../data/projectData'
import PythonLine from './PythonLine'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'functions', label: 'Functions' },
  { id: 'file', label: 'File Loading' },
  { id: 'menu', label: 'Main Loop' },
]

export default function CodeMapModule({ onAskTutor }) {
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState('format_member')
  const [copied, setCopied] = useState(false)

  const selectedBlock = CODE_BLOCKS.find((b) => b.id === selectedId) || CODE_BLOCKS[0]

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getCleanCodeString())
    } catch {
      // fallback silently
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  let runningLine = 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Clean Source Walkthrough
          </h2>
          <p className="text-sm text-ink-muted mt-1 max-w-xl">
            Click any block of <span className="font-mono text-ink">student_club_directory.py</span> to inspect how it works and how to explain it in class.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="neu-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer self-start sm:self-auto"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-ink-muted" />}
          <span>{copied ? 'Copied' : 'Copy Python'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.id
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                active ? 'neu-btn-primary' : 'neu-btn text-ink-2'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 code-well rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] text-xs text-zinc-400">
            <span className="font-mono text-zinc-200">student_club_directory.py</span>
            <span>Click any section</span>
          </div>

          <div className="max-h-[650px] overflow-y-auto py-2 divide-y divide-white/[0.05]">
            {CODE_BLOCKS.map((block, bIdx) => {
              const isSelected = block.id === selectedId
              const isDimmed = filter !== 'all' && block.category !== filter
              const blockStartLine = runningLine
              runningLine += block.lines.length + (bIdx < CODE_BLOCKS.length - 1 ? 1 : 0)

              return (
                <div
                  key={block.id}
                  onClick={() => setSelectedId(block.id)}
                  className={`relative px-4 py-2.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-white/[0.08]' : 'hover:bg-white/[0.035]'
                  } ${isDimmed ? 'opacity-25' : 'opacity-100'}`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeCodeBar"
                      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#60a5fa]"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}

                  <div className="mb-1 ml-10 text-[10.5px] font-mono tracking-wide text-zinc-400">
                    {block.tag}
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

        {/* Side Inspector */}
        <div className="lg:col-span-5 lg:sticky lg:top-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedBlock.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="neu-card rounded-2xl p-6 space-y-5"
            >
              <div className="space-y-1.5">
                <span className="inline-block px-2.5 py-1 rounded-lg neu-inset text-[11px] font-semibold text-ink-2">
                  {selectedBlock.badge}
                </span>
                <h3 className="text-lg font-semibold text-ink font-mono pt-1">
                  {selectedBlock.title}
                </h3>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  What it does
                </div>
                <p className="text-sm text-ink-2 leading-relaxed">{selectedBlock.what}</p>
              </div>

              <div className="pt-4 border-t neu-divider space-y-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  Design rationale
                </div>
                <p className="text-sm text-ink-2 leading-relaxed">{selectedBlock.why}</p>
              </div>

              <div className="pt-4 border-t neu-divider space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  How to explain it
                </div>
                <div className="neu-inset rounded-xl p-4 text-sm text-ink leading-relaxed">
                  “{selectedBlock.script}”
                </div>
              </div>

              {onAskTutor && (
                <button
                  onClick={() =>
                    onAskTutor(
                      `Explain "${selectedBlock.title}" simply and give me one quick question the professor might ask.`
                    )
                  }
                  className="neu-btn w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.8} />
                  <span>Ask Voice Tutor about this section</span>
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
