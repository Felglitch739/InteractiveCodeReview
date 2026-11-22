const KEYWORDS = new Set([
  'def', 'return', 'if', 'elif', 'else', 'for', 'in', 'while',
  'and', 'or', 'not', 'del', 'break', 'continue', 'True', 'False', 'None',
])
const BUILTINS = new Set([
  'print', 'input', 'len', 'range', 'str', 'int', 'float', 'bool',
  'open', 'list', 'tuple', 'set', 'dict', 'type', 'round', 'sum', 'min', 'max',
])
const FUNCS = new Set([
  'format_member', 'show_directory', 'choose_role', 'choose_member', 'save_directory',
  'apply_discount', 'calc_average', 'demo',
])

export default function PythonLine({ line }) {
  const trimmed = line.trim()
  if (trimmed.startsWith('#')) {
    return <span className="text-zinc-500 italic">{line}</span>
  }

  const parts = []
  let i = 0
  let key = 0

  while (i < line.length) {
    if (line[i] === '"' || line[i] === "'") {
      const q = line[i]
      let j = i + 1
      while (j < line.length) {
        if (line[j] === '\\' && j + 1 < line.length) j += 2
        else if (line[j] === q) {
          j++
          break
        } else j++
      }
      parts.push(
        <span key={key++} className="text-emerald-300">
          {line.slice(i, j)}
        </span>
      )
      i = j
    } else {
      let j = i
      while (j < line.length && line[j] !== '"' && line[j] !== "'") j++
      const chunk = line.slice(i, j)
      const tokens = chunk.split(/(\b[A-Za-z_][A-Za-z0-9_]*\b|-?\b\d+\b)/g)
      tokens.forEach((tok) => {
        if (!tok) return
        if (KEYWORDS.has(tok)) {
          parts.push(<span key={key++} className="text-violet-400 font-semibold">{tok}</span>)
        } else if (BUILTINS.has(tok)) {
          parts.push(<span key={key++} className="text-amber-300">{tok}</span>)
        } else if (FUNCS.has(tok)) {
          parts.push(<span key={key++} className="text-sky-300 font-medium">{tok}</span>)
        } else if (/^-?\d+$/.test(tok)) {
          parts.push(<span key={key++} className="text-rose-400">{tok}</span>)
        } else {
          parts.push(<span key={key++} className="text-zinc-200">{tok}</span>)
        }
      })
      i = j
    }
  }

  return <>{parts.length ? parts : ' '}</>
}
