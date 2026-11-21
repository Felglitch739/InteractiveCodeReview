const MODEL_CHAIN = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.5-flash']

const SYSTEM_INSTRUCTION = `You are a friendly, concise CSCI 1380 Python study tutor helping three students (Jeremy Hernández, Sara Astorga, and Felix Martinez) understand and present their Final Project Prompt #8: "Student Club Member Directory".

Rules:
- Explain things in clear, simple, natural English (or Spanish if the student speaks Spanish).
- Keep answers short and crisp (2-5 sentences) so they sound great when spoken aloud.
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

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' })
  }

  try {
    const { message, history = [] } = req.body || {}
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing message.' })
    }

    const contents = [
      ...history.slice(-10).map((h) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.text }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ]

    let lastError = 'Gemini API unavailable.'

    for (const model of MODEL_CHAIN) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents,
            generationConfig: { temperature: 0.4, maxOutputTokens: 360 },
          }),
        }
      )

      const data = await response.json()
      if (response.ok) {
        const reply =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          'Sorry, I could not generate a response. Please try asking again.'
        return res.status(200).json({ reply, model })
      }
      lastError = data?.error?.message || `HTTP ${response.status}`
    }

    return res.status(502).json({ error: lastError })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unexpected server error' })
  }
}
