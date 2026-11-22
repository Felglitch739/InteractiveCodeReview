import { checkRateLimit } from './_rateLimit.js'

const MODEL_CHAIN = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.5-flash']

const EXAM_SYSTEM_INSTRUCTION = `You are a calm, concise CSCI 1380 (Intro to Python) study tutor helping students review Weeks 1-12 for their final exam.
- Cover only Intro to Python basics: running .py files, variables, input()/int()/float(), files (r/w/a), booleans, if/elif/else, nested conditionals, logical operators (and/or/not), for/while loops, break/continue, built-in & custom functions, print vs return, parameters & local scope, lists, tuples, sets, dictionaries, and modular program design.
- Keep answers natural, clear, and concise (2 to 4 sentences).
- Reply in English by default, or Spanish if the student speaks or writes in Spanish.
- Never mention any specific student's final project code; keep examples general and beginner-friendly (no try/except, lambdas, classes, or list comprehensions).`

const PROJECT_SYSTEM_INSTRUCTION = `You are a friendly, concise CSCI 1380 Python study tutor helping three students (Jeremy Hernández, Sara Astorga, and Felix Martinez) understand and present their Final Project Prompt #8: "Student Club Member Directory".

Rules:
- Explain things in clear, simple, natural English (or Spanish if the student speaks/writes Spanish).
- Keep answers short and crisp (2-4 sentences) so they sound great when spoken aloud.
- Stick strictly to basic Python they learned in CSCI 1380 (lists, while, for, if/elif/else, functions, open/read/write/close, replace, split, string slicing [0:6] and [6:]). Never suggest advanced Python like try/except, list comprehensions, classes, or lambdas.
- If the student asks to be quizzed or to practice presenting, act like a supportive CSCI 1380 professor: ask ONE focused question about their code and give brief, encouraging feedback on their answer.
- Base every answer strictly on their exact code below:

def format_member(name, role):
    return "Name: " + name + " | Role: " + role

def show_directory(member_list, member_roles):
    print("\\n========== MEMBER DIRECTORY ==========")
    if len(member_list) == 0:
        print("The directory is empty.")
    else:
        for i in range(len(member_list)):
            print(str(i + 1) + ". " + format_member(member_list[i], member_roles[i]))
        print("Total members: " + str(len(member_list)))

def choose_role():
    role = ""
    while role == "":
        # 1 Member, 2 President, 3 Vice President, 4 Secretary, 5 Treasurer
        role_choice = input("Select a role number: ")
        ...
    return role

def choose_member(member_list, member_roles):
    show_directory(member_list, member_roles)
    position = -1
    member_choice = ""
    while position == -1 and member_choice != "0":
        member_choice = input("Enter a member number, or 0 to cancel: ")
        for i in range(len(member_list)):
            if member_choice == str(i + 1):
                position = i
        if position == -1 and member_choice != "0":
            print("Invalid member number. Please try again.")
    return position

def save_directory(member_list, member_roles):
    output_file = open("directory.txt", "w")
    for i in range(len(member_list)):
        output_file.write(format_member(member_list[i], member_roles[i]) + "\\n")
    output_file.close()

Startup creates directory.txt with mode "a", reads with "r" + readlines(), strips "\\n" with replace("\\n", ""), splits on " | Role: ", checks len(parts) == 2 and parts[0][0:6] == "Name: " and non-empty name/role, then appends parts[0][6:] to member_list and parts[1] to member_roles.
Main menu loops while choice != "7":
1 Add member (input name + choose_role + append both + save_directory)
2 View member directory (show_directory)
3 View officers (for loop + if role == President/Vice President/Secretary/Treasurer + officer_count)
4 View saved records (open "r" + read())
5 Delete member (choose_member -> if position != -1 -> del both lists + save_directory)
6 Update role (choose_member -> if position != -1 -> member_roles[position] = choose_role() + save_directory)
7 Exit
Sample directory.txt records:
0: Jeremy Hernández | President
1: Sara Astorga | Vice President
2: Felix Martinez | Treasurer
3: Juan Martinez | Member
4: Luis Barrera | Member`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!checkRateLimit(req, res, { bucket: 'tutor', maxPerIp: 20, maxGlobal: 160, windowMs: 10 * 60 * 1000 })) {
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' })
  }

  try {
    const { message, audioBase64, audioMimeType, history = [], scope = 'exam' } = req.body || {}
    const isAudio = Boolean(audioBase64)
    const activeInstruction = scope === 'project' ? PROJECT_SYSTEM_INSTRUCTION : EXAM_SYSTEM_INSTRUCTION

    if (!isAudio && (!message || typeof message !== 'string')) {
      return res.status(400).json({ error: 'Missing message or audio.' })
    }

    if (isAudio && (typeof audioBase64 !== 'string' || audioBase64.length > 2_800_000)) {
      return res.status(413).json({ error: 'Audio clip is too large. Keep voice clips under 30 seconds.' })
    }

    if (!isAudio && message.length > 1500) {
      return res.status(413).json({ error: 'Message is too long (max 1500 characters).' })
    }

    const rawMime = String(audioMimeType || 'audio/webm').split(';')[0]
    const cleanMime = rawMime.startsWith('audio/') ? rawMime : 'audio/webm'

    const userParts = isAudio
      ? [
          {
            inlineData: {
              mimeType: cleanMime,
              data: audioBase64,
            },
          },
          {
            text: 'Listen to the student speaking. Return ONLY valid JSON with two keys: "transcript" (exact words the student spoke) and "reply" (your helpful 2-4 sentence tutor answer in the same language they spoke). If the audio is silent or unclear, set transcript to "(unclear audio)" and reply politely asking them to try again.',
          },
        ]
      : [{ text: message }]

    const safeHistory = Array.isArray(history) ? history.slice(-10) : []
    const contents = [
      ...safeHistory.map((h) => ({
        role: h?.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(h?.text || '').slice(0, 800) }],
      })),
      { role: 'user', parts: userParts },
    ]

    let lastError = 'Gemini API unavailable.'

    for (const model of MODEL_CHAIN) {
      const generationConfig = {
        temperature: 0.4,
        maxOutputTokens: 420,
        ...(isAudio ? { responseMimeType: 'application/json' } : {}),
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          apiKey
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: activeInstruction }] },
            contents,
            generationConfig,
          }),
        }
      )

      const data = await response.json()
      if (response.ok) {
        const rawText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          'Sorry, I could not generate a response. Please try asking again.'

        if (isAudio) {
          try {
            const parsed = JSON.parse(rawText)
            return res.status(200).json({
              transcript: parsed.transcript || '(voice question)',
              reply: parsed.reply || rawText,
              model,
            })
          } catch {
            return res.status(200).json({
              transcript: '(voice message)',
              reply: rawText,
              model,
            })
          }
        }

        return res.status(200).json({ reply: rawText, model })
      }
      lastError = data?.error?.message || `HTTP ${response.status}`
    }

    return res.status(502).json({ error: lastError })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unexpected server error' })
  }
}
