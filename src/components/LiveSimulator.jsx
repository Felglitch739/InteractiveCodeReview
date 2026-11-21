import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, RotateCcw, HardDrive, Cpu, Star, Send } from 'lucide-react'
import { INITIAL_MEMBERS, OFFICER_ROLES } from '../data/projectData'

const ROLE_MAP = {
  '1': 'Member',
  '2': 'President',
  '3': 'Vice President',
  '4': 'Secretary',
  '5': 'Treasurer',
}

function formatLine(name, role) {
  return `Name: ${name} | Role: ${role}`
}

const MENU_TEXT =
  '\n=====================================\n' +
  '     STUDENT CLUB MEMBER DIRECTORY\n' +
  '=====================================\n' +
  '1.) Add a member\n' +
  '2.) View member directory\n' +
  '3.) View officers\n' +
  '4.) View saved records\n' +
  '5.) Delete a member\n' +
  '6.) Update a member\'s role\n' +
  '7.) Exit'

const ROLE_MENU_TEXT =
  '\n1.) Member\n2.) President\n3.) Vice President\n4.) Secretary\n5.) Treasurer'

let nextUid = 100

export default function LiveSimulator() {
  const [members, setMembers] = useState(() => INITIAL_MEMBERS.map((m) => ({ ...m })))
  const [fileText, setFileText] = useState(
    () => INITIAL_MEMBERS.map((m) => formatLine(m.name, m.role)).join('\n') + '\n'
  )
  const [mode, setMode] = useState('menu') // menu | add_name | add_role | delete_choose | update_choose | update_role | exited
  const [tempName, setTempName] = useState('')
  const [tempPos, setTempPos] = useState(-1)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const [fileFlashing, setFileFlashing] = useState(false)
  const [vars, setVars] = useState({ choice: '""', position: '—', officer_count: '—' })
  const [explain, setExplain] = useState(
    'Startup loaded 5 records from directory.txt into member_list and member_roles. Pick an option below or type directly into the terminal.'
  )
  const [inputVal, setInputVal] = useState('')
  const [logs, setLogs] = useState([
    { id: 1, text: '[Startup] Loaded 5 saved records from directory.txt', tone: 'sys' },
    { id: 2, text: MENU_TEXT, tone: 'normal' },
  ])

  const termRef = useRef(null)

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight
    }
  }, [logs])

  const addLog = (text, tone = 'normal') => {
    setLogs((prev) => [...prev, { id: nextUid++, text, tone }])
  }

  const syncFile = (updatedList) => {
    const nextFile =
      updatedList.map((m) => formatLine(m.name, m.role)).join('\n') +
      (updatedList.length ? '\n' : '')
    setFileText(nextFile)
    setFileFlashing(true)
    setTimeout(() => setFileFlashing(false), 1100)
  }

  const resetAll = () => {
    const fresh = INITIAL_MEMBERS.map((m) => ({ ...m }))
    setMembers(fresh)
    setFileText(fresh.map((m) => formatLine(m.name, m.role)).join('\n') + '\n')
    setMode('menu')
    setTempName('')
    setTempPos(-1)
    setHighlightIdx(-1)
    setVars({ choice: '""', position: '—', officer_count: '—' })
    setExplain('Reset to the original 5 members from directory.txt.')
    setLogs([
      { id: nextUid++, text: '[Reset] Reloaded original 5 records from directory.txt', tone: 'sys' },
      { id: nextUid++, text: MENU_TEXT, tone: 'normal' },
    ])
  }

  const restartFromDisk = () => {
    const lines = fileText.split('\n').filter(Boolean)
    const reloaded = []
    lines.forEach((l) => {
      const p = l.split(' | Role: ')
      if (p.length === 2 && p[0].startsWith('Name: ')) {
        reloaded.push({ id: `r${nextUid++}`, name: p[0].slice(6), role: p[1] })
      }
    })
    setMembers(reloaded)
    setMode('menu')
    setHighlightIdx(-1)
    setVars({ choice: '""', position: '—', officer_count: '—' })
    setExplain(
      'Program restarted! The startup loop read directory.txt and restored your saved changes back into both lists.'
    )
    addLog('\n[Restart] Reading directory.txt at startup...', 'sys')
    addLog(MENU_TEXT, 'normal')
  }

  const promptLabel =
    mode === 'menu'
      ? 'Select an option:'
      : mode === 'add_name'
      ? 'Member name:'
      : mode === 'add_role' || mode === 'update_role'
      ? 'Select a role number:'
      : mode === 'delete_choose' || mode === 'update_choose'
      ? 'Enter a member number, or 0 to cancel:'
      : '(Exited)'

  const printDirectory = (list) => {
    addLog('\n========== MEMBER DIRECTORY ==========')
    if (list.length === 0) {
      addLog('The directory is empty.')
    } else {
      list.forEach((m, i) => addLog(`${i + 1}. ${formatLine(m.name, m.role)}`))
      addLog(`Total members: ${list.length}`)
    }
  }

  const handleCommand = (raw) => {
    if (mode === 'exited') return
    addLog(`${promptLabel} ${raw}`, 'input')

    if (mode === 'menu') {
      setVars((v) => ({ ...v, choice: `"${raw}"` }))
      setHighlightIdx(-1)

      if (raw === '1') {
        setMode('add_name')
        setExplain('Matched if choice == "1": now prompting for new_member_name with input().')
      } else if (raw === '2') {
        printDirectory(members)
        setExplain('Called show_directory(member_list, member_roles). The for loop printed each pair numbered from 1.')
        addLog(MENU_TEXT)
      } else if (raw === '3') {
        addLog('\n============= OFFICERS ==============')
        let count = 0
        members.forEach((m) => {
          if (OFFICER_ROLES.includes(m.role)) {
            count++
            addLog(formatLine(m.name, m.role), 'ok')
          }
        })
        if (count === 0) addLog('No officers found.')
        else addLog(`Total officers: ${count}`)
        setVars((v) => ({ ...v, choice: '"3"', officer_count: String(count) }))
        setExplain(`The for loop checked every role using if ... or ... and found ${count} officer(s).`)
        addLog(MENU_TEXT)
      } else if (raw === '4') {
        addLog('\n=========== SAVED RECORDS ===========')
        if (!fileText) addLog('The saved directory is empty.')
        else addLog(fileText.trimEnd(), 'sys')
        setExplain('Opened directory.txt in read mode ("r") and printed the entire file using read().')
        addLog(MENU_TEXT)
      } else if (raw === '5') {
        if (members.length === 0) {
          addLog('There are no members to delete.', 'err')
          setExplain('len(member_list) == 0 was True, so there is nobody to delete.')
          addLog(MENU_TEXT)
        } else {
          printDirectory(members)
          setMode('delete_choose')
          setVars((v) => ({ ...v, choice: '"5"', position: '-1' }))
          setExplain('Called choose_member(). Displayed the directory and initialized position = -1.')
        }
      } else if (raw === '6') {
        if (members.length === 0) {
          addLog('There are no members to update.', 'err')
          setExplain('len(member_list) == 0 was True, so there is nobody to update.')
          addLog(MENU_TEXT)
        } else {
          printDirectory(members)
          setMode('update_choose')
          setVars((v) => ({ ...v, choice: '"6"', position: '-1' }))
          setExplain('Called choose_member() to pick who gets a new role. position starts at -1.')
        }
      } else if (raw === '7') {
        addLog('Goodbye! Your records are saved in directory.txt.', 'ok')
        setMode('exited')
        setExplain('choice == "7" made while choice != "7" False, ending the program. Click "Re-run Program" to verify persistence!')
      } else {
        addLog('Invalid option. Please select a number from 1 to 7.', 'err')
        setExplain('Entered the else branch. Because we compare text instead of int(), invalid input never crashes Python.')
        addLog(MENU_TEXT)
      }
      return
    }

    if (mode === 'add_name') {
      setTempName(raw)
      setMode('add_role')
      addLog(ROLE_MENU_TEXT)
      setExplain(`Stored new_member_name = "${raw}" and called choose_role() to pick a role by number.`)
      return
    }

    if (mode === 'add_role') {
      const role = ROLE_MAP[raw]
      if (!role) {
        addLog('Invalid role. Please choose a number from 1 to 5.', 'err')
        addLog(ROLE_MENU_TEXT)
        setExplain('Invalid input inside choose_role(). role is still "", so the while loop asks again.')
      } else {
        const next = [...members, { id: `m${nextUid++}`, name: tempName, role }]
        setMembers(next)
        setHighlightIdx(next.length - 1)
        syncFile(next)
        addLog('Member added and saved!', 'ok')
        setMode('menu')
        setExplain(`Appended "${tempName}" and "${role}" at index [${next.length - 1}] in both lists and called save_directory().`)
        addLog(MENU_TEXT)
      }
      return
    }

    if (mode === 'delete_choose' || mode === 'update_choose') {
      if (raw === '0') {
        setVars((v) => ({ ...v, position: '-1' }))
        addLog(mode === 'delete_choose' ? 'Delete canceled.' : 'Update canceled.', 'sys')
        setMode('menu')
        setExplain('User entered "0". choose_member() returned -1, so if position != -1 was False and nothing changed.')
        addLog(MENU_TEXT)
        return
      }
      let found = -1
      members.forEach((_, i) => {
        if (raw === String(i + 1)) found = i
      })
      if (found === -1) {
        addLog('Invalid member number. Please try again.', 'err')
        setExplain(`No str(i + 1) matched "${raw}". position stays -1 so the while loop asks again.`)
      } else if (mode === 'delete_choose') {
        const target = members[found]
        const next = members.filter((_, i) => i !== found)
        setMembers(next)
        setVars((v) => ({ ...v, position: String(found) }))
        setHighlightIdx(-1)
        syncFile(next)
        addLog('Member deleted and file updated!', 'ok')
        setMode('menu')
        setExplain(
          `choose_member() returned index ${found} (${target.name}). Deleted index ${found} from both lists—watch how every item below shifted left—and rewrote directory.txt.`
        )
        addLog(MENU_TEXT)
      } else {
        setTempPos(found)
        setVars((v) => ({ ...v, position: String(found) }))
        setHighlightIdx(found)
        setMode('update_role')
        addLog(ROLE_MENU_TEXT)
        setExplain(`choose_member() returned index ${found} (${members[found].name}). Now calling choose_role().`)
      }
      return
    }

    if (mode === 'update_role') {
      const role = ROLE_MAP[raw]
      if (!role) {
        addLog('Invalid role. Please choose a number from 1 to 5.', 'err')
        addLog(ROLE_MENU_TEXT)
        setExplain('Invalid input inside choose_role(). Asking again.')
      } else {
        const next = members.map((m, i) => (i === tempPos ? { ...m, role } : m))
        setMembers(next)
        setHighlightIdx(tempPos)
        syncFile(next)
        addLog('Role updated and saved!', 'ok')
        setMode('menu')
        setExplain(`Replaced only member_roles[${tempPos}] with "${role}" while keeping "${members[tempPos].name}", then called save_directory().`)
        addLog(MENU_TEXT)
      }
    }
  }

  const quickButtons =
    mode === 'menu'
      ? [
          { label: '1. Add', val: '1' },
          { label: '2. View Directory', val: '2' },
          { label: '3. Officers', val: '3' },
          { label: '4. Saved File', val: '4' },
          { label: '5. Delete', val: '5' },
          { label: '6. Update Role', val: '6' },
          { label: '7. Exit', val: '7' },
        ]
      : mode === 'add_name'
      ? [
          { label: '"Sofia Rios"', val: 'Sofia Rios' },
          { label: '"Diego Vega"', val: 'Diego Vega' },
        ]
      : mode === 'add_role' || mode === 'update_role'
      ? [
          { label: '1. Member', val: '1' },
          { label: '2. President', val: '2' },
          { label: '3. Vice President', val: '3' },
          { label: '4. Secretary', val: '4' },
          { label: '5. Treasurer', val: '5' },
          { label: '9 (Invalid)', val: '9' },
        ]
      : mode === 'delete_choose' || mode === 'update_choose'
      ? [
          ...members.map((m, i) => ({ label: `#${i + 1} ${m.name.split(' ')[0]}`, val: String(i + 1) })),
          { label: '0 (Cancel)', val: '0' },
        ]
      : []

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1.5">
          <Terminal className="w-3.5 h-3.5" /> Module 03 · Live Execution Studio
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Live Python Simulator
        </h2>
        <p className="text-zinc-400 text-sm md:text-base mt-1 max-w-3xl">
          Run the actual program logic interactively. Watch <code className="text-emerald-300">member_list</code>,{' '}
          <code className="text-amber-300">member_roles</code>, and <code className="text-sky-300">directory.txt</code> animate in real time as you add, filter, update, or delete members.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Terminal */}
        <div className="lg:col-span-6 space-y-3">
          <div className="rounded-2xl border border-zinc-800 bg-[#0a0a0f] overflow-hidden shadow-2xl flex flex-col h-[520px]">
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
              </div>
              <span className="font-mono text-xs text-zinc-400">python student_club_directory.py</span>
              <button
                onClick={resetAll}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer transition"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            <div
              ref={termRef}
              className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap space-y-0.5"
            >
              {logs.map((entry) => (
                <div
                  key={entry.id}
                  className={
                    entry.tone === 'sys'
                      ? 'text-sky-400'
                      : entry.tone === 'ok'
                      ? 'text-emerald-400'
                      : entry.tone === 'err'
                      ? 'text-rose-400'
                      : entry.tone === 'input'
                      ? 'text-amber-300 font-semibold'
                      : 'text-zinc-300'
                  }
                >
                  {entry.text}
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (mode === 'exited') return
                const v = inputVal
                setInputVal('')
                handleCommand(v)
              }}
              className="flex items-center gap-2 p-2.5 bg-zinc-900/90 border-t border-zinc-800"
            >
              <span className="font-mono text-xs text-sky-400 shrink-0 hidden sm:inline">
                {promptLabel}
              </span>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={mode === 'exited'}
                placeholder={mode === 'exited' ? 'Program ended' : 'Type input & press Enter...'}
                className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-1.5 font-mono text-xs text-white disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={mode === 'exited'}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 cursor-pointer transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Quick Click Actions */}
          <div className="flex flex-wrap gap-2">
            {mode === 'exited' ? (
              <button
                onClick={restartFromDisk}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 cursor-pointer transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-run Program (Loads Saved directory.txt)
              </button>
            ) : (
              quickButtons.map((b) => (
                <button
                  key={b.label}
                  onClick={() => handleCommand(b.val)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 hover:bg-indigo-500/15 text-zinc-200 cursor-pointer transition"
                >
                  {b.label}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Animated Memory & File Inspector */}
        <div className="lg:col-span-6 space-y-4">
          {/* Parallel Lists Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Cpu className="w-4 h-4 text-indigo-400" /> Live Memory · Parallel Lists
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                len = {members.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(vars).map(([k, v]) => (
                <div
                  key={k}
                  className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-400"
                >
                  {k} = <span className="text-indigo-300 font-bold">{v}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <div className="col-span-2">Index i</div>
                <div className="col-span-5">member_list[i]</div>
                <div className="col-span-5">member_roles[i]</div>
              </div>

              <div className="space-y-1.5 min-h-[120px]">
                <AnimatePresence initial={false}>
                  {members.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 rounded-xl border border-dashed border-zinc-800 text-zinc-500 font-mono text-xs"
                    >
                      member_list = [] &nbsp;·&nbsp; member_roles = []
                    </motion.div>
                  ) : (
                    members.map((m, idx) => {
                      const isOff = OFFICER_ROLES.includes(m.role)
                      const active = idx === highlightIdx
                      return (
                        <motion.div
                          key={m.id}
                          layout
                          initial={{ opacity: 0, x: -24, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 30, scale: 0.92 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                          className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition ${
                            active
                              ? 'bg-indigo-500/15 border-indigo-400/70 shadow-md shadow-indigo-500/10'
                              : 'bg-zinc-950/70 border-zinc-800/80'
                          }`}
                        >
                          <div className="col-span-2 font-mono text-xs font-bold text-indigo-400 pl-1">
                            [{idx}]
                          </div>
                          <div className="col-span-5 text-xs font-semibold text-emerald-300 truncate">
                            {m.name}
                          </div>
                          <div className="col-span-5 flex items-center justify-between gap-1 text-xs font-semibold text-amber-300 truncate">
                            <span className="truncate">{m.role}</span>
                            {isOff && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30 shrink-0" />}
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Live directory.txt Card */}
          <motion.div
            animate={
              fileFlashing
                ? { borderColor: 'rgba(56, 189, 248, 0.85)', boxShadow: '0 0 24px rgba(56, 189, 248, 0.25)' }
                : { borderColor: 'rgba(39, 39, 42, 1)', boxShadow: '0 0 0 rgba(0,0,0,0)' }
            }
            transition={{ duration: 0.35 }}
            className="rounded-2xl border bg-zinc-900/60 p-5 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <HardDrive className="w-4 h-4 text-sky-400" /> directory.txt on Disk
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition ${
                  fileFlashing
                    ? 'bg-sky-500/25 border-sky-400 text-sky-200'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}
              >
                {fileFlashing ? 'save_directory() wrote ("w")' : 'Synced'}
              </span>
            </div>
            <pre className="p-3.5 rounded-xl bg-[#0a0a0f] border border-zinc-800/80 font-mono text-xs text-sky-200 whitespace-pre-wrap min-h-[70px]">
              {fileText || '(empty file)'}
            </pre>
          </motion.div>

          {/* What Just Happened */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              What Just Happened Under the Hood
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed">{explain}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
