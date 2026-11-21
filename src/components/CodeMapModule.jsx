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
          <h2 className="text-2xl font-semibold tracking-tight text-[#161922]">
            Clean Source Walkthrough
          </h2>
          <p className="text-sm text-[#647084] mt-1 max-w-xl">
            Select any block of <span className="font-mono text-[#161922]">student_club_directory.py</span> to inspect how it works and how to explain it in class.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="neu-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-[#161922] cursor-pointer self-start sm:self-auto"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#15803d]" /> : <Copy className="w-3.5 h-3.5 text-[#647084]" />}
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition ${
                active ? 'neu-inset text-[#161922] font-semibold' : 'neu-btn text-[#647084]'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Code Well */}
        <div className="lg:col-span-7 code-well rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] text-xs text-zinc-400">
            <span className="font-mono text-zinc-300">student_club_directory.py</span>
            <span>Click any section</span>
          </div>

          <div className="max-h-[650px] overflow-y-auto py-2 divide-y divide-white/[0.04]">
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
                    isSelected ? 'bg-white/[0.07]' : 'hover:bg-white/[0.03]'
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

        {/* Minimalist Neumorphic Inspector */}
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
                <span className="inline-block px-2.5 py-1 rounded-lg neu-inset text-[11px] font-medium text-[#475569]">
                  {selectedBlock.badge}
                </span>
                <h3 className="text-lg font-semibold text-[#161922] font-mono pt-1">
                  {selectedBlock.title}
                </h3>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7a869a]">
                  What it does
                </div>
                <p className="text-sm text-[#2c3340] leading-relaxed">{selectedBlock.what}</p>
              </div>

              <div className="pt-4 border-t border-[#d7dde7] space-y-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7a869a]">
                  Design rationale
                </div>
                <p className="text-sm text-[#4a5568] leading-relaxed">{selectedBlock.why}</p>
              </div>

              <div className="pt-4 border-t border-[#d7dde7] space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7a869a]">
                  How to explain it
                </div>
                <div className="neu-inset rounded-xl p-4 text-sm text-[#1e2430] leading-relaxed">
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
                  className="neu-btn w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-[#161922] cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5 text-[#475569]" strokeWidth={1.8} />
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
