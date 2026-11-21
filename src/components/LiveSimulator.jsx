import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Send } from 'lucide-react'
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
  const [mode, setMode] = useState('menu')
  const [tempName, setTempName] = useState('')
  const [tempPos, setTempPos] = useState(-1)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const [fileSavedNotice, setFileSavedNotice] = useState(false)
  const [vars, setVars] = useState({ choice: '""', position: '—', officer_count: '—' })
  const [explain, setExplain] = useState(
    'Startup loaded 5 records from directory.txt into member_list and member_roles. Select an option below or type directly into the console.'
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
    setFileSavedNotice(true)
    setTimeout(() => setFileSavedNotice(false), 1200)
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
    setExplain('Reset to the original 5 records from directory.txt.')
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
    setExplain('Program restarted and reloaded your saved changes from directory.txt.')
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
        setExplain('Entered choice == "1": prompting for new_member_name.')
      } else if (raw === '2') {
        printDirectory(members)
        setExplain('Called show_directory(member_list, member_roles).')
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
        setExplain(`Filtered the lists with if/or and counted ${count} officer(s).`)
        addLog(MENU_TEXT)
      } else if (raw === '4') {
        addLog('\n=========== SAVED RECORDS ===========')
        if (!fileText) addLog('The saved directory is empty.')
        else addLog(fileText.trimEnd(), 'sys')
        setExplain('Opened directory.txt in read mode ("r") and printed the full text with read().')
        addLog(MENU_TEXT)
      } else if (raw === '5') {
        if (members.length === 0) {
          addLog('There are no members to delete.', 'err')
          setExplain('len(member_list) == 0 was True.')
          addLog(MENU_TEXT)
        } else {
          printDirectory(members)
          setMode('delete_choose')
          setVars((v) => ({ ...v, choice: '"5"', position: '-1' }))
          setExplain('Called choose_member(). Initialized position = -1.')
        }
      } else if (raw === '6') {
        if (members.length === 0) {
          addLog('There are no members to update.', 'err')
          setExplain('len(member_list) == 0 was True.')
          addLog(MENU_TEXT)
        } else {
          printDirectory(members)
          setMode('update_choose')
          setVars((v) => ({ ...v, choice: '"6"', position: '-1' }))
          setExplain('Called choose_member() to pick a member to update.')
        }
      } else if (raw === '7') {
        addLog('Goodbye! Your records are saved in directory.txt.', 'ok')
        setMode('exited')
        setExplain('choice == "7" ended the while loop. Click Re-run to verify persistence.')
      } else {
        addLog('Invalid option. Please select a number from 1 to 7.', 'err')
        setExplain('Entered else branch—comparing strings prevents crashes on invalid text.')
        addLog(MENU_TEXT)
      }
      return
    }

    if (mode === 'add_name') {
      setTempName(raw)
      setMode('add_role')
      addLog(ROLE_MENU_TEXT)
      setExplain(`Stored new_member_name = "${raw}" and called choose_role().`)
      return
    }

    if (mode === 'add_role') {
      const role = ROLE_MAP[raw]
      if (!role) {
        addLog('Invalid role. Please choose a number from 1 to 5.', 'err')
        addLog(ROLE_MENU_TEXT)
        setExplain('Invalid choice inside choose_role(); role stays "" so the loop repeats.')
      } else {
        const next = [...members, { id: `m${nextUid++}`, name: tempName, role }]
        setMembers(next)
        setHighlightIdx(next.length - 1)
        syncFile(next)
        addLog('Member added and saved!', 'ok')
        setMode('menu')
        setExplain(`Appended "${tempName}" and "${role}" at index [${next.length - 1}] and called save_directory().`)
        addLog(MENU_TEXT)
      }
      return
    }

    if (mode === 'delete_choose' || mode === 'update_choose') {
      if (raw === '0') {
        setVars((v) => ({ ...v, position: '-1' }))
        addLog(mode === 'delete_choose' ? 'Delete canceled.' : 'Update canceled.', 'sys')
        setMode('menu')
        setExplain('Entered "0" → choose_member() returned -1, canceling safely.')
        addLog(MENU_TEXT)
        return
      }
      let found = -1
      members.forEach((_, i) => {
        if (raw === String(i + 1)) found = i
      })
      if (found === -1) {
        addLog('Invalid member number. Please try again.', 'err')
        setExplain(`No str(i + 1) matched "${raw}". Asking again.`)
      } else if (mode === 'delete_choose') {
        const target = members[found]
        const next = members.filter((_, i) => i !== found)
        setMembers(next)
        setVars((v) => ({ ...v, position: String(found) }))
        setHighlightIdx(-1)
        syncFile(next)
        addLog('Member deleted and file updated!', 'ok')
        setMode('menu')
        setExplain(`Deleted index ${found} (${target.name}) from both lists, shifted remaining items left, and saved.`)
        addLog(MENU_TEXT)
      } else {
        setTempPos(found)
        setVars((v) => ({ ...v, position: String(found) }))
        setHighlightIdx(found)
        setMode('update_role')
        addLog(ROLE_MENU_TEXT)
        setExplain(`Selected index ${found} (${members[found].name}). Calling choose_role().`)
      }
      return
    }

    if (mode === 'update_role') {
      const role = ROLE_MAP[raw]
      if (!role) {
        addLog('Invalid role. Please choose a number from 1 to 5.', 'err')
        addLog(ROLE_MENU_TEXT)
      } else {
        const next = members.map((m, i) => (i === tempPos ? { ...m, role } : m))
        setMembers(next)
        setHighlightIdx(tempPos)
        syncFile(next)
        addLog('Role updated and saved!', 'ok')
        setMode('menu')
        setExplain(`Updated member_roles[${tempPos}] to "${role}" and rewrote directory.txt.`)
        addLog(MENU_TEXT)
      }
    }
  }

  const quickButtons =
    mode === 'menu'
      ? [
          { label: '1. Add', val: '1' },
          { label: '2. Directory', val: '2' },
          { label: '3. Officers', val: '3' },
          { label: '4. Saved file', val: '4' },
          { label: '5. Delete', val: '5' },
          { label: '6. Update role', val: '6' },
          { label: '7. Exit', val: '7' },
        ]
      : mode === 'add_name'
      ? [
          { label: 'Sofia Rios', val: 'Sofia Rios' },
          { label: 'Diego Vega', val: 'Diego Vega' },
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
          ...members.map((m, i) => ({ label: `${i + 1}. ${m.name.split(' ')[0]}`, val: String(i + 1) })),
          { label: '0. Cancel', val: '0' },
        ]
      : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#161922]">
          Live Simulator
        </h2>
        <p className="text-sm text-[#647084] mt-1 max-w-2xl">
          Run the program interactively and watch <span className="font-mono text-[#161922]">member_list</span>,{' '}
          <span className="font-mono text-[#161922]">member_roles</span>, and{' '}
          <span className="font-mono text-[#161922]">directory.txt</span> update in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Console */}
        <div className="lg:col-span-6 space-y-3.5">
          <div className="code-well rounded-2xl overflow-hidden flex flex-col h-[500px]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="font-mono text-xs text-zinc-300">python student_club_directory.py</span>
              <button
                onClick={resetAll}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-white cursor-pointer transition"
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
                      ? 'text-sky-300'
                      : entry.tone === 'ok'
                      ? 'text-emerald-300'
                      : entry.tone === 'err'
                      ? 'text-rose-300'
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
              className="flex items-center gap-2 p-3 border-t border-white/[0.06] bg-black/25"
            >
              <span className="font-mono text-xs text-zinc-400 shrink-0 hidden sm:inline">
                {promptLabel}
              </span>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={mode === 'exited'}
                placeholder={mode === 'exited' ? 'Program ended' : 'Type input...'}
                className="flex-1 bg-white/[0.06] rounded-lg px-3 py-1.5 font-mono text-xs text-white focus:outline-none disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={mode === 'exited'}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-40 cursor-pointer transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          <div className="flex flex-wrap gap-2">
            {mode === 'exited' ? (
              <button
                onClick={restartFromDisk}
                className="neu-btn-dark inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-run Program (Loads directory.txt)
              </button>
            ) : (
              quickButtons.map((b) => (
                <button
                  key={b.label}
                  onClick={() => handleCommand(b.val)}
                  className="neu-btn px-3 py-1.5 rounded-xl text-xs font-medium text-[#161922] cursor-pointer"
                >
                  {b.label}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Memory & File Inspector */}
        <div className="lg:col-span-6 space-y-5">
          <div className="neu-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#161922]">Parallel Lists in Memory</h3>
              <span className="font-mono text-xs text-[#647084]">len = {members.length}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(vars).map(([k, v]) => (
                <div key={k} className="neu-inset px-2.5 py-1 rounded-lg font-mono text-xs text-[#475569]">
                  {k} = <span className="text-[#161922] font-semibold">{v}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-2 text-[11px] font-mono text-[#7a869a]">
                <div className="col-span-2">i</div>
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
                      className="neu-inset text-center py-8 rounded-xl text-[#7a869a] font-mono text-xs"
                    >
                      member_list = [] · member_roles = []
                    </motion.div>
                  ) : (
                    members.map((m, idx) => {
                      const isOff = OFFICER_ROLES.includes(m.role)
                      const active = idx === highlightIdx
                      return (
                        <motion.div
                          key={m.id}
                          layout
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 18 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          className={`grid grid-cols-12 gap-2 items-center px-3 py-2 rounded-xl text-xs transition ${
                            active ? 'neu-btn-dark' : 'neu-inset text-[#161922]'
                          }`}
                        >
                          <div className={`col-span-2 font-mono font-semibold ${active ? 'text-zinc-300' : 'text-[#647084]'}`}>
                            [{idx}]
                          </div>
                          <div className="col-span-5 font-medium truncate">{m.name}</div>
                          <div className="col-span-5 flex items-center justify-between gap-1 truncate">
                            <span className="truncate">{m.role}</span>
                            {isOff && (
                              <span className={`text-[10px] font-mono ${active ? 'text-zinc-300' : 'text-[#647084]'}`}>
                                officer
                              </span>
                            )}
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="neu-card rounded-2xl p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#161922] font-mono">directory.txt</h3>
              <span className="text-[11px] font-medium text-[#647084]">
                {fileSavedNotice ? 'Saved ("w")' : 'Synced'}
              </span>
            </div>
            <pre className="neu-inset p-3.5 rounded-xl font-mono text-xs text-[#2c3340] whitespace-pre-wrap min-h-[70px]">
              {fileText || '(empty file)'}
            </pre>
          </div>

          <div className="neu-inset rounded-2xl p-4 text-xs sm:text-sm text-[#475569]">
            {explain}
          </div>
        </div>
      </div>
    </div>
  )
}
