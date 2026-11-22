import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUp, ArrowDown, Check, RotateCcw, SkipBack, SkipForward,
  ArrowRight, Play, Pause, Lock
} from 'lucide-react'
import PythonLine from '../PythonLine'
import { EXAM_WEEKS, getQuestionsForWeek } from '../../data/finalExamData'

function CodeBlock({ code, activeLine = -1 }) {
  return (
    <div className="code-well rounded-xl px-4 py-3 font-mono text-xs leading-relaxed overflow-x-auto max-w-full">
      {code.split('\n').map((ln, i) => (
        <div
          key={i}
          className={`flex gap-3 whitespace-pre rounded px-1.5 -mx-1.5 transition-colors ${
            i === activeLine ? 'bg-white/12' : ''
          }`}
        >
          <span className="w-4 text-right text-zinc-500 select-none shrink-0">{i + 1}</span>
          <span>
            <PythonLine line={ln} />
          </span>
        </div>
      ))}
    </div>
  )
}

/* ==================== WEEK 1: Animated Step Ordering + Visual Pipeline ==================== */
const W1_CORRECT = [
  { id: 'open', stage: 'Editor', text: 'Open your code editor and write the Python instructions.' },
  { id: 'save', stage: 'File (.py)', text: 'Save the file with a .py extension (for example, hello.py).' },
  { id: 'term', stage: 'Terminal', text: 'Open a terminal in the folder where the file is saved.' },
  { id: 'run', stage: 'Execute', text: 'Run the file with python hello.py (or py -3 hello.py).' },
  { id: 'read', stage: 'Output', text: 'Read the printed output or fix any error message shown.' },
]
const W1_INITIAL = [W1_CORRECT[2], W1_CORRECT[0], W1_CORRECT[3], W1_CORRECT[1], W1_CORRECT[4]]

function Week1OrderLab({ onComplete }) {
  const [items, setItems] = useState(W1_INITIAL)
  const [checked, setChecked] = useState(null)

  const move = (idx, dir) => {
    const nextIdx = idx + dir
    if (nextIdx < 0 || nextIdx >= items.length) return
    const copy = [...items]
    const [picked] = copy.splice(idx, 1)
    copy.splice(nextIdx, 0, picked)
    setItems(copy)
    setChecked(null)
  }

  const verify = () => {
    const ok = items.every((it, idx) => it.id === W1_CORRECT[idx].id)
    setChecked(ok)
    if (ok) onComplete?.()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-2">
        Reorder the cards to build the full <span className="font-mono text-ink">.py</span> workflow from writing code to reading output.
      </p>

      {/* Live Visual Pipeline Preview */}
      <div className="neu-inset rounded-xl p-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {items.map((it, idx) => {
          const rightSpot = checked !== null && it.id === W1_CORRECT[idx].id
          return (
            <div key={it.id} className="inline-flex items-center gap-1.5 shrink-0">
              <span
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition ${
                  checked === null
                    ? 'neu-card-sm text-ink'
                    : rightSpot
                    ? 'state-ok'
                    : 'state-err'
                }`}
              >
                {idx + 1}. {it.stage}
              </span>
              {idx < items.length - 1 && <ArrowRight className="w-3 h-3 text-ink-muted shrink-0" />}
            </div>
          )
        })}
      </div>

      <ol className="space-y-2">
        {items.map((item, idx) => (
          <motion.li
            key={item.id}
            layout
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="neu-inset rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-xs font-semibold text-ink-muted w-5 shrink-0">
                {idx + 1}.
              </span>
              <span className="text-ink">{item.text}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                aria-label={`Move step ${idx + 1} up`}
                className="neu-btn p-1.5 rounded-lg disabled:opacity-35 cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                disabled={idx === items.length - 1}
                aria-label={`Move step ${idx + 1} down`}
                className="neu-btn p-1.5 rounded-lg disabled:opacity-35 cursor-pointer"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={verify} className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer">
          Check order
        </button>
        <button
          type="button"
          onClick={() => { setItems(W1_INITIAL); setChecked(null) }}
          className="neu-btn inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {checked !== null && (
        <div className={`rounded-xl p-3.5 text-xs sm:text-sm ${checked ? 'state-ok' : 'state-err'}`}>
          {checked
            ? 'Correct! Editor → save as .py → open terminal in that folder → run python hello.py → read output.'
            : 'Some steps are out of order (highlighted above). Remember to write and save the .py file before running it.'}
        </div>
      )}
    </div>
  )
}

/* ==================== WEEK 2: Visual Memory Boxes (input() vs int()) ==================== */
const W2_PAIRS = [
  { a: '4', b: '5' },
  { a: '12', b: '8' },
  { a: '10', b: '3' },
]

function Week2InputLab({ onComplete }) {
  const [pairIdx, setPairIdx] = useState(0)
  const [converted, setConverted] = useState(false)
  const { a, b } = W2_PAIRS[pairIdx]
  const rawResult = a + b
  const numResult = Number(a) + Number(b)

  const code = converted
    ? `a = int(input("First: "))   # user types ${a}\nb = int(input("Second: "))  # user types ${b}\nprint(a + b)`
    : `a = input("First: ")        # user types ${a}\nb = input("Second: ")       # user types ${b}\nprint(a + b)`

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-2">
        Switch between raw <span className="font-mono text-ink">input()</span> and <span className="font-mono text-ink">int(input())</span> to watch how the exact same <span className="font-mono text-ink">+</span> operator behaves differently on <span className="font-mono">str</span> vs <span className="font-mono">int</span>.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {W2_PAIRS.map((p, i) => (
          <button
            key={`${p.a}-${p.b}`}
            type="button"
            onClick={() => setPairIdx(i)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold cursor-pointer ${
              pairIdx === i ? 'neu-btn-primary' : 'neu-btn'
            }`}
          >
            "{p.a}" &amp; "{p.b}"
          </button>
        ))}

        <button
          type="button"
          onClick={() => {
            setConverted((c) => !c)
            onComplete?.()
          }}
          className="neu-btn px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
        >
          {converted ? 'Use raw input() (str)' : 'Convert with int()'}
        </button>
      </div>

      <CodeBlock code={code} />

      {/* Visual Memory Box Flow */}
      <div className="neu-inset rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-7 gap-3 items-center text-center font-mono">
        <motion.div layout className="sm:col-span-2 neu-card-sm rounded-xl p-3 space-y-1">
          <div className="text-[10.5px] text-ink-muted">variable a ({converted ? 'int' : 'str'})</div>
          <div className="text-base font-semibold text-ink">{converted ? a : `"${a}"`}</div>
        </motion.div>

        <div className="sm:col-span-1 flex flex-col items-center justify-center">
          <span className="text-base font-bold text-ink">+</span>
          <span className="text-[10px] text-ink-muted">{converted ? 'add' : 'join'}</span>
        </div>

        <motion.div layout className="sm:col-span-2 neu-card-sm rounded-xl p-3 space-y-1">
          <div className="text-[10.5px] text-ink-muted">variable b ({converted ? 'int' : 'str'})</div>
          <div className="text-base font-semibold text-ink">{converted ? b : `"${b}"`}</div>
        </motion.div>

        <motion.div
          key={`${converted}-${a}-${b}`}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="sm:col-span-2 neu-btn-primary rounded-xl p-3 space-y-1"
        >
          <div className="text-[10.5px] opacity-75">print(a + b)</div>
          <div className="text-lg font-bold">{converted ? numResult : `"${rawResult}"`}</div>
        </motion.div>
      </div>

      <p className="text-xs text-ink-muted">
        {converted
          ? `int() converts "${a}" and "${b}" into numbers, so + adds them to print ${numResult}.`
          : `input() always returns text (str). Using + on two strings joins them into "${rawResult}".`}
      </p>
    </div>
  )
}

/* ==================== WEEK 3: Visual Disk File Diff (r / w / a) ==================== */
const W3_LINES = ['Math', 'Python']

function Week3FileModeLab({ onComplete }) {
  const [mode, setMode] = useState('r')

  const meta = {
    r: {
      badge: 'Read only — file unchanged',
      code: 'f = open("notes.txt", "r")\ntext = f.read()\nf.close()\nprint(text)',
      stdout: 'Math\nPython',
      note: 'Read mode ("r") opens an existing file without changing its contents.',
    },
    w: {
      badge: 'Overwrite — erases old lines',
      code: 'f = open("notes.txt", "w")\nf.write("Physics\\n")\nf.close()',
      stdout: '(nothing printed to console)',
      note: 'Write mode ("w") clears previous lines and writes only the new content.',
    },
    a: {
      badge: 'Append — keeps old lines + adds at end',
      code: 'f = open("notes.txt", "a")\nf.write("Physics\\n")\nf.close()',
      stdout: '(nothing printed to console)',
      note: 'Append mode ("a") preserves existing data and adds "Physics" on a new line at the bottom.',
    },
  }[mode]

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-2">
        Select a mode to watch how <span className="font-mono text-ink">open("notes.txt", mode)</span> transforms the simulated file on disk.
      </p>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'r', label: '"r" · Read' },
          { id: 'w', label: '"w" · Write (Replace)' },
          { id: 'a', label: '"a" · Append' },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => { setMode(m.id); onComplete?.() }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              mode === m.id ? 'neu-btn-primary' : 'neu-btn'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <CodeBlock code={meta.code} />

      <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-stretch">
        <div className="md:col-span-4 neu-inset rounded-xl p-4 space-y-2">
          <div className="text-[11px] font-mono text-ink-muted">Before · notes.txt</div>
          <div className="space-y-1 font-mono text-xs">
            {W3_LINES.map((ln) => (
              <div
                key={ln}
                className={`px-2.5 py-1.5 rounded-lg neu-card-sm text-ink transition ${
                  mode === 'w' ? 'line-through opacity-45' : ''
                }`}
              >
                {ln}
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-3 flex flex-col items-center justify-center gap-1.5 py-2 text-center">
          <span className="px-3 py-1 rounded-full neu-card-sm font-mono text-xs font-semibold text-ink">
            mode "{mode}"
          </span>
          <ArrowRight className="w-4 h-4 text-ink-muted hidden md:block" />
          <span className="text-[11px] text-ink-muted px-1">{meta.badge}</span>
        </div>

        <div className="md:col-span-4 neu-inset rounded-xl p-4 space-y-2">
          <div className="text-[11px] font-mono text-ink-muted">After · notes.txt</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-1 font-mono text-xs"
            >
              {mode !== 'w' &&
                W3_LINES.map((ln) => (
                  <div key={ln} className="px-2.5 py-1.5 rounded-lg neu-card-sm text-ink">
                    {ln}
                  </div>
                ))}
              {(mode === 'w' || mode === 'a') && (
                <div className="px-2.5 py-1.5 rounded-lg state-ok font-semibold">
                  Physics  (new)
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="neu-inset rounded-xl p-3.5 text-xs text-ink-2 space-y-1">
        <div><strong className="text-ink">Console output:</strong> <span className="font-mono">{meta.stdout.replace(/\n/g, ' ↵ ')}</span></div>
        <div>{meta.note}</div>
      </div>
    </div>
  )
}

/* ==================== WEEK 4: Interactive Slider + Live Flowchart ==================== */
function Week4BranchLab({ onComplete }) {
  const [score, setScore] = useState(70)
  const passes = score >= 70

  const updateScore = (val) => {
    setScore(val)
    onComplete?.()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-2">
        Drag the slider across the <span className="font-mono text-ink">69 ↔ 70</span> boundary (or click a preset) to watch the decision flowchart flip branches live.
      </p>

      {/* Interactive Slider + Boundary Presets */}
      <div className="neu-inset rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="w4-score-slider" className="font-mono text-xs font-semibold text-ink">
            score = {score}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[55, 69, 70, 71, 92].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => updateScore(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold cursor-pointer ${
                  score === s ? 'neu-btn-primary' : 'neu-btn'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <input
          id="w4-score-slider"
          type="range"
          min={40}
          max={100}
          value={score}
          onChange={(e) => updateScore(Number(e.target.value))}
          className="w-full accent-[#181b22] dark:accent-[#eef1f6] cursor-pointer"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <CodeBlock
          code={`score = ${score}\nif score >= 70:\n    print("Pass")\nelse:\n    print("Retry")`}
          activeLine={passes ? 2 : 4}
        />

        {/* Visual Decision Flowchart */}
        <div className="neu-inset rounded-xl p-4 space-y-3 text-center font-mono text-xs">
          <div className="inline-block px-4 py-2 rounded-xl neu-card-sm font-semibold text-ink">
            {score} &gt;= 70 ? → <span className={passes ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{passes ? 'True' : 'False'}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <motion.div
              animate={{ scale: passes ? 1.02 : 0.96, opacity: passes ? 1 : 0.42 }}
              className={`rounded-xl p-3 space-y-1 ${passes ? 'state-ok font-semibold' : 'neu-card-sm text-ink-muted'}`}
            >
              <div className="text-[10px] uppercase">True (if)</div>
              <div className="text-sm">print("Pass")</div>
            </motion.div>

            <motion.div
              animate={{ scale: !passes ? 1.02 : 0.96, opacity: !passes ? 1 : 0.42 }}
              className={`rounded-xl p-3 space-y-1 ${!passes ? 'state-err font-semibold' : 'neu-card-sm text-ink-muted'}`}
            >
              <div className="text-[10px] uppercase">False (else)</div>
              <div className="text-sm">print("Retry")</div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ==================== WEEK 5: Waterfall elif Ladder + Logic Gate Switchboard ==================== */
function Week5ElifLab({ onComplete }) {
  const [grade, setGrade] = useState(84)
  const [extraCredit, setExtraCredit] = useState(true)
  const [boolA, setBoolA] = useState(true)
  const [boolB, setBoolB] = useState(false)

  const checks = [
    { label: 'if grade >= 90:', cond: grade >= 90, out: 'A' },
    { label: 'elif grade >= 80:', cond: grade >= 80, out: extraCredit ? 'B (with bonus)' : 'B' },
    { label: 'elif grade >= 70:', cond: grade >= 70, out: 'C' },
    { label: 'else:', cond: true, out: 'Review needed' },
  ]
  const matchedIdx = checks.findIndex((c) => c.cond)
  const finalOut = checks[matchedIdx].out

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-sm text-ink-2">
          Slide <span className="font-mono text-ink">grade</span> to watch Python stop at the <strong className="text-ink">first matching branch</strong> and skip everything below it.
        </p>

        <div className="neu-inset rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="w5-grade-slider" className="font-mono text-xs font-semibold text-ink">
              grade = {grade}
            </label>
            <button
              type="button"
              onClick={() => { setExtraCredit((e) => !e); onComplete?.() }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold cursor-pointer ${
                extraCredit ? 'neu-btn-primary' : 'neu-btn'
              }`}
            >
              extra_credit = {extraCredit ? 'True' : 'False'}
            </button>
          </div>
          <input
            id="w5-grade-slider"
            type="range"
            min={55}
            max={100}
            value={grade}
            onChange={(e) => { setGrade(Number(e.target.value)); onComplete?.() }}
            className="w-full accent-[#181b22] dark:accent-[#eef1f6] cursor-pointer"
          />
        </div>

        <div className="space-y-1.5">
          {checks.map((c, idx) => {
            const status =
              idx < matchedIdx
                ? 'Checked → False'
                : idx === matchedIdx
                ? `Matched → prints "${finalOut}"`
                : 'Skipped'
            return (
              <div
                key={c.label}
                className={`rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-xs transition ${
                  idx === matchedIdx
                    ? 'state-ok font-semibold'
                    : idx > matchedIdx
                    ? 'neu-inset text-ink-muted opacity-50'
                    : 'neu-inset text-ink-2'
                }`}
              >
                <span>{c.label}</span>
                <span>{status}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Interactive Boolean Gate Switchboard */}
      <div className="pt-4 border-t neu-divider space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-ink">Logical Operator Switchboard</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setBoolA((v) => !v); onComplete?.() }}
              className={`px-3 py-1 rounded-lg font-mono text-xs font-semibold cursor-pointer ${
                boolA ? 'neu-btn-primary' : 'neu-btn'
              }`}
            >
              A = {boolA ? 'True' : 'False'}
            </button>
            <button
              type="button"
              onClick={() => { setBoolB((v) => !v); onComplete?.() }}
              className={`px-3 py-1 rounded-lg font-mono text-xs font-semibold cursor-pointer ${
                boolB ? 'neu-btn-primary' : 'neu-btn'
              }`}
            >
              B = {boolB ? 'True' : 'False'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 font-mono text-xs text-center">
          <div className={`rounded-xl p-2.5 ${boolA && boolB ? 'state-ok font-semibold' : 'neu-inset text-ink-muted'}`}>
            <div>A and B</div>
            <div className="text-sm mt-0.5">{boolA && boolB ? 'True' : 'False'}</div>
          </div>
          <div className={`rounded-xl p-2.5 ${boolA || boolB ? 'state-ok font-semibold' : 'neu-inset text-ink-muted'}`}>
            <div>A or B</div>
            <div className="text-sm mt-0.5">{boolA || boolB ? 'True' : 'False'}</div>
          </div>
          <div className={`rounded-xl p-2.5 ${!boolA ? 'state-ok font-semibold' : 'neu-inset text-ink-muted'}`}>
            <div>not A</div>
            <div className="text-sm mt-0.5">{!boolA ? 'True' : 'False'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ==================== WEEK 6: Visual Indexed List Ribbon with Gliding Pointer ==================== */
const W6_ITEMS = ['pen', 'book', 'bag', 'lamp']
const W6_WHILE = [2, 4, 6]

function Week6LoopStepper({ onComplete }) {
  const [kind, setKind] = useState('for')
  const [step, setStep] = useState(0)
  const [auto, setAuto] = useState(false)

  const maxSteps = kind === 'for' ? W6_ITEMS.length : W6_WHILE.length

  useEffect(() => {
    if (!auto) return
    const t = setInterval(() => {
      setStep((s) => {
        if (s >= maxSteps - 1) {
          setAuto(false)
          return s
        }
        return s + 1
      })
    }, 900)
    return () => clearInterval(t)
  }, [auto, maxSteps])

  const outputs =
    kind === 'for'
      ? W6_ITEMS.slice(0, step + 1).map((v, i) => `${i}: ${v}`)
      : W6_WHILE.slice(0, step + 1).map((v) => String(v))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-2">
          Watch the pointer glide across each index and build the output line by line.
        </p>
        <div className="neu-inset p-1 rounded-xl inline-flex gap-1">
          <button
            type="button"
            onClick={() => { setAuto(false); setKind('for'); setStep(0) }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
              kind === 'for' ? 'neu-btn-primary' : 'text-ink-muted'
            }`}
          >
            for + list
          </button>
          <button
            type="button"
            onClick={() => { setAuto(false); setKind('while'); setStep(0) }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
              kind === 'while' ? 'neu-btn-primary' : 'text-ink-muted'
            }`}
          >
            while counter
          </button>
        </div>
      </div>

      <CodeBlock
        code={
          kind === 'for'
            ? 'items = ["pen", "book", "bag", "lamp"]\nfor i in range(len(items)):\n    print(str(i) + ": " + items[i])'
            : 'n = 2\nwhile n <= 6:\n    print(n)\n    n = n + 2'
        }
        activeLine={kind === 'for' ? 2 : 2}
      />

      {/* Visual Indexed Ribbon */}
      {kind === 'for' ? (
        <div className="grid grid-cols-4 gap-2.5 font-mono text-center">
          {W6_ITEMS.map((item, i) => {
            const isNow = i === step
            return (
              <div
                key={item}
                className={`relative rounded-xl p-3 transition ${
                  isNow ? 'neu-btn-primary' : i < step ? 'neu-card-sm text-ink' : 'neu-inset text-ink-muted'
                }`}
              >
                <div className="text-[10px] opacity-70">i = {i}</div>
                <div className="text-xs sm:text-sm font-semibold mt-0.5">"{item}"</div>
                {isNow && (
                  <motion.div
                    layoutId="w6IndexPtr"
                    className="mt-1.5 text-[10px] font-bold tracking-wider uppercase opacity-90"
                  >
                    active
                  </motion.div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 font-mono text-center">
          {W6_WHILE.map((val, i) => {
            const isNow = i === step
            return (
              <div
                key={val}
                className={`rounded-xl p-3 ${
                  isNow ? 'neu-btn-primary' : i < step ? 'neu-card-sm text-ink' : 'neu-inset text-ink-muted'
                }`}
              >
                <div className="text-[10px] opacity-70">n &lt;= 6 (True)</div>
                <div className="text-sm font-semibold mt-0.5">n = {val}</div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => { setAuto(false); setStep((s) => Math.max(0, s - 1)) }}
          className="neu-btn inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 cursor-pointer"
        >
          <SkipBack className="w-3.5 h-3.5" /> Prev
        </button>
        <button
          type="button"
          onClick={() => {
            if (!auto && step === maxSteps - 1) setStep(0)
            setAuto((a) => !a)
            onComplete?.()
          }}
          className="neu-btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
        >
          {auto ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {auto ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          disabled={step >= maxSteps - 1}
          onClick={() => { setAuto(false); setStep((s) => Math.min(maxSteps - 1, s + 1)); onComplete?.() }}
          className="neu-btn inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 cursor-pointer"
        >
          Next <SkipForward className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => { setAuto(false); setStep(0) }}
          className="neu-btn p-1.5 rounded-xl text-ink-muted cursor-pointer"
          aria-label="Reset loop"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="neu-inset rounded-xl p-3.5 font-mono text-xs space-y-1">
        <div className="text-ink-muted">Printed output so far:</div>
        <div className="text-ink font-semibold whitespace-pre-line">{outputs.join('\n')}</div>
      </div>
    </div>
  )
}

/* ==================== WEEK 7: Visual Track (break vs continue) + 2D Nested Loop Grid ==================== */
function Week7VariantsLab({ onComplete }) {
  const [variant, setVariant] = useState('break')
  const [gridStep, setGridStep] = useState(0)
  const [fixChoice, setFixChoice] = useState(null)

  const nums = [1, 2, 3, 4, 5]
  const curRow = Math.floor(gridStep / 3)
  const curCol = gridStep % 3

  return (
    <div className="space-y-5">
      {/* Break vs Continue Visual Track */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-ink-2">
            Compare how <span className="font-mono text-ink">break</span> vs <span className="font-mono text-ink">continue</span> affects <span className="font-mono text-ink">range(1, 6)</span> when <span className="font-mono text-ink">n == 3</span>.
          </p>
          <div className="neu-inset p-1 rounded-xl inline-flex gap-1">
            <button
              type="button"
              onClick={() => { setVariant('break'); onComplete?.() }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                variant === 'break' ? 'neu-btn-primary' : 'text-ink-muted'
              }`}
            >
              break
            </button>
            <button
              type="button"
              onClick={() => { setVariant('continue'); onComplete?.() }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                variant === 'continue' ? 'neu-btn-primary' : 'text-ink-muted'
              }`}
            >
              continue
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 font-mono text-center text-xs">
          {nums.map((n) => {
            const printed = variant === 'break' ? n < 3 : n !== 3
            const trigger = n === 3
            return (
              <div
                key={n}
                className={`rounded-xl p-2.5 transition ${
                  trigger
                    ? 'state-err font-semibold'
                    : printed
                    ? 'state-ok font-semibold'
                    : 'neu-inset text-ink-muted opacity-45'
                }`}
              >
                <div className="text-sm">{n}</div>
                <div className="text-[10px] mt-0.5">
                  {trigger ? variant : printed ? 'prints' : 'never runs'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Interactive 2D Nested Loop Grid */}
      <div className="pt-4 border-t neu-divider space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold text-ink">
            Nested Loop Grid: <span className="font-mono">for row in range(2): for col in range(3):</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { setGridStep((s) => (s + 1) % 6); onComplete?.() }}
              className="neu-btn-primary px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Step ({gridStep + 1}/6)
            </button>
            <button
              type="button"
              onClick={() => setGridStep(0)}
              className="neu-btn p-1.5 rounded-lg text-ink-muted cursor-pointer"
              aria-label="Reset grid"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 font-mono text-xs text-center">
          {[0, 1, 2, 3, 4, 5].map((cell) => {
            const r = Math.floor(cell / 3)
            const c = cell % 3
            const isActive = cell === gridStep
            const visited = cell < gridStep
            return (
              <button
                key={cell}
                type="button"
                onClick={() => { setGridStep(cell); onComplete?.() }}
                className={`rounded-xl py-2.5 px-2 cursor-pointer transition ${
                  isActive
                    ? 'neu-btn-primary font-semibold'
                    : visited
                    ? 'neu-card-sm text-ink'
                    : 'neu-inset text-ink-muted'
                }`}
              >
                row={r}, col={c}
              </button>
            )
          })}
        </div>
        <p className="text-[11.5px] text-ink-muted">
          Active cell: <span className="font-mono text-ink">(row={curRow}, col={curCol})</span> — 2 outer turns × 3 inner turns = 6 total prints.
        </p>
      </div>

      {/* Infinite Loop Fix */}
      <div className="pt-4 border-t neu-divider space-y-2.5">
        <div className="text-xs font-semibold text-ink">
          Stop an infinite loop: <span className="font-mono">count = 5; while count &gt; 0:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'dec', label: 'count = count - 1', ok: true },
            { id: 'inc', label: 'count = count + 1', ok: false },
            { id: 'same', label: 'count = 5', ok: false },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => { setFixChoice(opt); if (opt.ok) onComplete?.() }}
              className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-semibold cursor-pointer ${
                fixChoice?.id === opt.id ? (opt.ok ? 'state-ok' : 'state-err') : 'neu-btn'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {fixChoice && (
          <div className={`rounded-xl p-3 text-xs ${fixChoice.ok ? 'state-ok' : 'state-err'}`}>
            {fixChoice.ok
              ? 'Correct! Subtracting 1 moves count toward 0 so count > 0 eventually becomes False.'
              : 'That keeps count > 0 True forever. You must update count toward the stop condition.'}
          </div>
        )}
      </div>
    </div>
  )
}

/* ==================== WEEK 8: 6-Week Readiness Radar ==================== */
function Week8MidtermBanner({ onJumpWeek, progress }) {
  const weeks1to6 = EXAM_WEEKS.filter((w) => w.week <= 6)
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-2">
        Optional midterm checkpoint reusing <strong className="text-ink">Weeks 1–6</strong> (no new topic added). See your readiness per week below or jump directly to any lab.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {weeks1to6.map((w) => {
          const qs = getQuestionsForWeek(w.week)
          const right = qs.filter((q) => progress?.practiceAnswers?.[q.id] === q.answer).length
          const pct = Math.round((right / qs.length) * 100)
          return (
            <button
              key={w.week}
              type="button"
              onClick={() => onJumpWeek?.(w.week)}
              className="neu-btn rounded-xl p-3 text-left space-y-2 cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink">W{w.week} · {w.shortTitle}</span>
                <span className="font-mono text-ink-muted">{right}/{qs.length}</span>
              </div>
              <div className="neu-inset h-1.5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${pct}%`, backgroundColor: 'var(--text-primary)' }}
                  className="h-full rounded-full transition-all"
                />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ==================== WEEK 9: Visual Execution Pointer & Function Shelf ==================== */
const W9_STEPS = [
  { lineIdx: 0, stored: true, desc: 'def greet(): stores the blueprint on the Function Shelf. Nothing is printed yet.', out: '(empty)' },
  { lineIdx: 3, stored: true, desc: 'Python runs top-level print("Start") first.', out: 'Start' },
  { lineIdx: 4, stored: true, calling: true, desc: 'Calling greet() jumps into the saved blueprint and prints "Hello from Python!".', out: 'Start\nHello from Python!' },
  { lineIdx: 5, stored: true, desc: 'Execution returns and prints "Done".', out: 'Start\nHello from Python!\nDone' },
]

function Week9DefVsCallLab({ onComplete }) {
  const [idx, setIdx] = useState(0)
  const cur = W9_STEPS[idx]

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-2">
        Step through execution to see how <span className="font-mono text-ink">def</span> stores a function without running it until the call occurs.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        <div className="md:col-span-7">
          <CodeBlock
            code={'def greet():\n    print("Hello from Python!")\n\nprint("Start")\ngreet()\nprint("Done")'}
            activeLine={cur.lineIdx}
          />
        </div>

        <div className="md:col-span-5 space-y-2.5 text-xs font-mono">
          <div className={`rounded-xl p-3.5 transition ${cur.calling ? 'state-ok font-semibold' : 'neu-inset'}`}>
            <div className="text-[10.5px] uppercase opacity-70 mb-1">Function Shelf</div>
            <div>greet() {cur.calling ? '← running now!' : 'stored in memory'}</div>
          </div>
          <div className="neu-inset rounded-xl p-3.5 space-y-1">
            <div className="text-[10.5px] uppercase text-ink-muted">Console Output</div>
            <pre className="font-semibold text-ink whitespace-pre-wrap">{cur.out}</pre>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={idx === 0}
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          className="neu-btn inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 cursor-pointer"
        >
          <SkipBack className="w-3.5 h-3.5" /> Prev
        </button>
        <button
          type="button"
          disabled={idx === W9_STEPS.length - 1}
          onClick={() => { setIdx((i) => Math.min(W9_STEPS.length - 1, i + 1)); onComplete?.() }}
          className="neu-btn-primary inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 cursor-pointer"
        >
          Next step <SkipForward className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs text-ink-2 ml-1">{cur.desc}</span>
      </div>
    </div>
  )
}

/* ==================== WEEK 10: Global Frame vs Local Function Frame ==================== */
function Week10ReturnScopeLab({ onComplete }) {
  const [mode, setMode] = useState('return')

  const code =
    mode === 'return'
      ? 'bonus = 2\ndef double_val(x):\n    bonus = 10   # local variable\n    return x * 2\n\nresult = double_val(4)\nprint(result, bonus)'
      : 'bonus = 2\ndef double_val(x):\n    bonus = 10   # local variable\n    print(x * 2)\n\nresult = double_val(4)\nprint(result, bonus)'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-2">
          Compare <span className="font-mono text-ink">return</span> vs <span className="font-mono text-ink">print</span> across Global and Local scope frames.
        </p>
        <div className="neu-inset p-1 rounded-xl inline-flex gap-1">
          <button
            type="button"
            onClick={() => { setMode('return'); onComplete?.() }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
              mode === 'return' ? 'neu-btn-primary' : 'text-ink-muted'
            }`}
          >
            return (value)
          </button>
          <button
            type="button"
            onClick={() => { setMode('print'); onComplete?.() }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
              mode === 'print' ? 'neu-btn-primary' : 'text-ink-muted'
            }`}
          >
            print (void)
          </button>
        </div>
      </div>

      <CodeBlock code={code} activeLine={3} />

      {/* Visual Scope Frames */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        <div className="neu-inset rounded-xl p-4 space-y-2">
          <div className="text-[10.5px] uppercase text-ink-muted font-semibold">Global Frame (Outside)</div>
          <div className="flex justify-between neu-card-sm rounded-lg px-3 py-2">
            <span>bonus</span>
            <span className="font-semibold text-ink">2  (untouched)</span>
          </div>
          <div className={`flex justify-between rounded-lg px-3 py-2 font-semibold ${mode === 'return' ? 'state-ok' : 'state-err'}`}>
            <span>result</span>
            <span>{mode === 'return' ? '8  (received via return)' : 'None  (no return!)'}</span>
          </div>
        </div>

        <div className="neu-inset rounded-xl p-4 space-y-2">
          <div className="text-[10.5px] uppercase text-ink-muted font-semibold">Local Frame · double_val(4)</div>
          <div className="flex justify-between neu-card-sm rounded-lg px-3 py-2">
            <span>x (parameter)</span>
            <span className="font-semibold text-ink">4</span>
          </div>
          <div className="flex justify-between neu-card-sm rounded-lg px-3 py-2">
            <span>bonus (local only)</span>
            <span className="font-semibold text-ink">10  (disappears on exit)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ==================== WEEK 11: Visual Collection Workbench ==================== */
const W11_CLUBS = { robotics: ['Maya', 'Omar'], art: ['Lia', 'Noah'] }

function Week11StructuresLab({ onComplete }) {
  const [kind, setKind] = useState('dict')
  const [dictKey, setDictKey] = useState('robotics')
  const [nestedIdx, setNestedIdx] = useState(1)

  const activeList = W11_CLUBS[dictKey]
  const activeVal = activeList[nestedIdx] || activeList[0]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'list', label: 'List [ ]' },
          { id: 'tuple', label: 'Tuple ( )' },
          { id: 'set', label: 'Set { }' },
          { id: 'dict', label: 'Dictionary {k: v}' },
        ].map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => { setKind(s.id); onComplete?.() }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
              kind === s.id ? 'neu-btn-primary' : 'neu-btn'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {kind === 'list' && (
        <div className="space-y-3">
          <CodeBlock code={'scores = [88, 92, 88]\nscores[1] = 95\nprint(scores[1], len(scores))'} />
          <div className="grid grid-cols-3 gap-2 font-mono text-xs text-center">
            {[88, 95, 88].map((v, i) => (
              <div key={i} className={`rounded-xl p-3 ${i === 1 ? 'state-ok font-semibold' : 'neu-inset'}`}>
                <div className="text-[10px] opacity-70">[{i}]</div>
                <div className="text-sm">{v}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-muted">Ordered and mutable—duplicates are allowed and items can be changed by index.</p>
        </div>
      )}

      {kind === 'tuple' && (
        <div className="space-y-3">
          <CodeBlock code={'room = ("Building E", 204)\nprint(room[0], room[1])'} />
          <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
            <div className="neu-inset rounded-xl p-3 flex items-center justify-between">
              <span>[0] "Building E"</span>
              <Lock className="w-3.5 h-3.5 text-ink-muted" />
            </div>
            <div className="neu-inset rounded-xl p-3 flex items-center justify-between">
              <span>[1] 204</span>
              <Lock className="w-3.5 h-3.5 text-ink-muted" />
            </div>
          </div>
          <p className="text-xs text-ink-muted">Immutable—supports index lookup like a list, but reassigning <span className="font-mono">room[0]</span> raises a TypeError.</p>
        </div>
      )}

      {kind === 'set' && (
        <div className="space-y-3">
          <CodeBlock code={'topics = {"loops", "files", "loops"}\nprint(len(topics), "files" in topics)'} />
          <div className="neu-inset rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="neu-card-sm px-3 py-1.5 rounded-full text-ink font-semibold">"loops"</span>
              <span className="neu-card-sm px-3 py-1.5 rounded-full text-ink font-semibold">"files"</span>
              <span className="px-2.5 py-1 rounded-full state-err line-through opacity-75">"loops" (duplicate removed)</span>
            </div>
            <span className="font-semibold text-ink">len = 2 · Unordered</span>
          </div>
          <p className="text-xs text-ink-muted">Sets keep only unique items and do not guarantee order—always test with <span className="font-mono">len()</span> or <span className="font-mono">in</span>, never by index or print order.</p>
        </div>
      )}

      {kind === 'dict' && (
        <div className="space-y-3">
          <CodeBlock
            code={`clubs = {\n    "robotics": ["Maya", "Omar"],\n    "art": ["Lia", "Noah"]\n}\nprint(clubs["${dictKey}"][${nestedIdx}])`}
          />
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {Object.keys(W11_CLUBS).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => { setDictKey(k); onComplete?.() }}
                className={`px-3 py-1.5 rounded-xl font-semibold cursor-pointer ${
                  dictKey === k ? 'neu-btn-primary' : 'neu-btn'
                }`}
              >
                key: "{k}"
              </button>
            ))}
            {[0, 1].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => { setNestedIdx(idx); onComplete?.() }}
                className={`px-3 py-1.5 rounded-xl font-semibold cursor-pointer ${
                  nestedIdx === idx ? 'neu-btn-primary' : 'neu-btn'
                }`}
              >
                index [{idx}]
              </button>
            ))}
          </div>
          <div className="neu-inset rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
            <span className="text-ink-2">
              clubs["{dictKey}"] → [{activeList.map((n) => `"${n}"`).join(', ')}] → [{nestedIdx}]
            </span>
            <span className="state-ok px-3 py-1 rounded-lg font-semibold">"{activeVal}"</span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ==================== WEEK 12: System Diagram + Load -> Edit -> Save ==================== */
const W12_CORRECT = [
  'Load saved records from file into lists',
  'Edit data in memory (add, update, delete)',
  'Save current lists back to the file',
]
const W12_START = [W12_CORRECT[2], W12_CORRECT[0], W12_CORRECT[1]]

function Week12ModuleFlowLab({ onComplete, onOpenProjectTab }) {
  const [steps, setSteps] = useState(W12_START)
  const [checked, setChecked] = useState(null)

  const move = (idx, dir) => {
    const target = idx + dir
    if (target < 0 || target >= steps.length) return
    const copy = [...steps]
    const [picked] = copy.splice(idx, 1)
    copy.splice(target, 0, picked)
    setSteps(copy)
    setChecked(null)
  }

  const verify = () => {
    const ok = steps.every((s, i) => s === W12_CORRECT[i])
    setChecked(ok)
    if (ok) onComplete?.()
  }

  return (
    <div className="space-y-4">
      <div className="neu-inset rounded-xl p-3.5 flex flex-wrap items-center justify-center gap-2 font-mono text-xs">
        <span className="neu-card-sm px-3 py-1.5 rounded-lg text-ink font-semibold">Disk File (.txt)</span>
        <ArrowRight className="w-3.5 h-3.5 text-ink-muted" />
        <span className="neu-card-sm px-3 py-1.5 rounded-lg text-ink font-semibold">In-Memory Lists</span>
        <ArrowRight className="w-3.5 h-3.5 text-ink-muted" />
        <span className="neu-card-sm px-3 py-1.5 rounded-lg text-ink font-semibold">Reusable Functions</span>
      </div>

      <ol className="space-y-2">
        {steps.map((s, idx) => (
          <motion.li
            key={s}
            layout
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="neu-inset rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm"
          >
            <span className="text-ink">
              <span className="font-mono text-ink-muted mr-2">{idx + 1}.</span>
              {s}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => move(idx, -1)}
                aria-label={`Move step ${idx + 1} up`}
                className="neu-btn p-1.5 rounded-lg disabled:opacity-35 cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={idx === steps.length - 1}
                onClick={() => move(idx, 1)}
                aria-label={`Move step ${idx + 1} down`}
                className="neu-btn p-1.5 rounded-lg disabled:opacity-35 cursor-pointer"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={verify} className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer">
          Check lifecycle
        </button>
        <button
          type="button"
          onClick={() => { setSteps(W12_START); setChecked(null) }}
          className="neu-btn px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
        >
          Reset
        </button>
      </div>

      {checked !== null && (
        <div className={`rounded-xl p-3 text-xs ${checked ? 'state-ok' : 'state-err'}`}>
          {checked
            ? 'Correct! Load → Edit → Save ensures old records stay intact whenever the file is rewritten.'
            : 'Remember: loading must come first before editing or saving.'}
        </div>
      )}

      <div className="pt-3 border-t neu-divider space-y-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          {onOpenProjectTab ? 'Function Contracts in Student Club Member Directory' : 'Example Function Contracts in a Modular Program'}
        </div>
        {onOpenProjectTab ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
            <div className="neu-inset rounded-xl p-3">
              <div className="text-ink font-semibold">format_member(name, role)</div>
              <div className="text-ink-muted mt-0.5">Returns formatted line (str)</div>
            </div>
            <div className="neu-inset rounded-xl p-3">
              <div className="text-ink font-semibold">choose_role()</div>
              <div className="text-ink-muted mt-0.5">Returns valid role string (str)</div>
            </div>
            <div className="neu-inset rounded-xl p-3">
              <div className="text-ink font-semibold">choose_member(names, roles)</div>
              <div className="text-ink-muted mt-0.5">Returns index (int) or -1</div>
            </div>
            <div className="neu-inset rounded-xl p-3">
              <div className="text-ink font-semibold">save_directory(names, roles)</div>
              <div className="text-ink-muted mt-0.5">Writes file, returns None (void)</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
            <div className="neu-inset rounded-xl p-3">
              <div className="text-ink font-semibold">format_record(title, status)</div>
              <div className="text-ink-muted mt-0.5">Returns one formatted line (str)</div>
            </div>
            <div className="neu-inset rounded-xl p-3">
              <div className="text-ink font-semibold">choose_option()</div>
              <div className="text-ink-muted mt-0.5">Validates input, returns choice (str)</div>
            </div>
            <div className="neu-inset rounded-xl p-3">
              <div className="text-ink font-semibold">find_item_index(items)</div>
              <div className="text-ink-muted mt-0.5">Returns 0-based index (int) or -1</div>
            </div>
            <div className="neu-inset rounded-xl p-3">
              <div className="text-ink font-semibold">save_all(filename, items)</div>
              <div className="text-ink-muted mt-0.5">Writes file in "w" mode, returns None</div>
            </div>
          </div>
        )}
        {onOpenProjectTab && (
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenProjectTab('code')}
              className="neu-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Open Project Code Map <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onOpenProjectTab('parser')}
              className="neu-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Project Extension: replace() &amp; split() Parser <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function WeekInteractiveLab({ labType, onComplete, onJumpWeek, onOpenProjectTab, progress }) {
  switch (labType) {
    case 'order-steps':
      return <Week1OrderLab onComplete={onComplete} />
    case 'input-convert':
      return <Week2InputLab onComplete={onComplete} />
    case 'file-mode':
      return <Week3FileModeLab onComplete={onComplete} />
    case 'branch-boundary':
      return <Week4BranchLab onComplete={onComplete} />
    case 'elif-logic':
      return <Week5ElifLab onComplete={onComplete} />
    case 'loop-stepper':
      return <Week6LoopStepper onComplete={onComplete} />
    case 'loop-variants':
      return <Week7VariantsLab onComplete={onComplete} />
    case 'midterm-mix':
      return <Week8MidtermBanner onJumpWeek={onJumpWeek} progress={progress} />
    case 'def-vs-call':
      return <Week9DefVsCallLab onComplete={onComplete} />
    case 'return-scope':
      return <Week10ReturnScopeLab onComplete={onComplete} />
    case 'structures-lab':
      return <Week11StructuresLab onComplete={onComplete} />
    case 'module-flow':
      return <Week12ModuleFlowLab onComplete={onComplete} onOpenProjectTab={onOpenProjectTab} />
    default:
      return null
  }
}
