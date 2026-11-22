// Original CSCI 1380 Final Exam Review data covering Weeks 1-12
// All code outputs are verified against Python 3.

export const EXAM_STORAGE_KEY = 'csci1380_final_exam_review_v1'

export const EXAM_WEEKS = [
  {
    week: 1,
    shortTitle: 'Getting Started',
    title: 'Programming, Python & Running .py Files',
    summary: 'What programming is, where Python fits, and how to save and run a Python script.',
    labType: 'order-steps',
    topics: ['What programming is', 'Where Python fits', 'Saving & running a .py file'],
  },
  {
    week: 2,
    shortTitle: 'Variables & Types',
    title: 'Variables, Input/Output, Types & Conversions',
    summary: 'Storing values in variables, reading text with input(), and converting with int() or float().',
    labType: 'input-convert',
    topics: ['Variables & assignment', 'input() and print()', 'str, int, float conversions'],
  },
  {
    week: 3,
    shortTitle: 'Files (r, w, a)',
    title: 'Opening, Closing, Reading & Writing Files',
    summary: 'How open() behaves in read ("r"), write ("w"), and append ("a") modes, and why close() matters.',
    labType: 'file-mode',
    topics: ['open() & close()', 'Read mode "r"', 'Write "w" vs Append "a"'],
  },
  {
    week: 4,
    shortTitle: 'Booleans & if/else',
    title: 'Boolean Expressions, if & if/else',
    summary: 'Comparing values to True/False, checking boundary cases, and choosing between two branches.',
    labType: 'branch-boundary',
    topics: ['Boolean expressions', 'if statements', 'if/else & boundary cases'],
  },
  {
    week: 5,
    shortTitle: 'elif & Logic',
    title: 'elif, Nested Conditionals & Logical Operators',
    summary: 'Multi-branch classifications, nested if blocks, and combining conditions with and, or, not.',
    labType: 'elif-logic',
    topics: ['if / elif / else order', 'Nested conditionals', 'and, or, not'],
  },
  {
    week: 6,
    shortTitle: 'for, while & Lists',
    title: 'for Loops, while Loops & Looping Through Lists',
    summary: 'Stepping through sequences with range(len(...)), tracking indices, and updating while counters.',
    labType: 'loop-stepper',
    topics: ['for & range()', 'while loops', 'Traversing lists by index'],
  },
  {
    week: 7,
    shortTitle: 'Nested, break & continue',
    title: 'Nested Loops, break, continue & Loop Safety',
    summary: 'Comparing break vs continue, tracing nested loops, and spotting updates that prevent infinite loops.',
    labType: 'loop-variants',
    topics: ['Nested loops', 'break vs continue', 'Avoiding infinite loops'],
  },
  {
    week: 8,
    shortTitle: 'Midterm Mix (W1–6)',
    title: 'Optional Midterm Review (Weeks 1–6)',
    summary: 'Mixed practice reusing Weeks 1–6 topics—no new topic added. Great checkpoint before functions.',
    labType: 'midterm-mix',
    topics: ['Variables & types', 'Files (r, w, a)', 'Conditionals & loops'],
  },
  {
    week: 9,
    shortTitle: 'Defining Functions',
    title: 'Built-in & Custom Functions: def vs Calling',
    summary: 'Using built-in functions, writing your own with def, and understanding when code actually runs.',
    labType: 'def-vs-call',
    topics: ['Built-in functions', 'Defining with def', 'Calling functions & order'],
  },
  {
    week: 10,
    shortTitle: 'return & Scope',
    title: 'Value-Returning vs Void Functions, Parameters & Scope',
    summary: 'Comparing print with return, passing arguments to parameters, and following local variable scope.',
    labType: 'return-scope',
    topics: ['print vs return', 'Void vs value-returning', 'Parameters & local scope'],
  },
  {
    week: 11,
    shortTitle: 'Data Structures',
    title: 'Lists, Tuples, Sets, Dictionaries & Nested Data',
    summary: 'Choosing the right collection, accessing by index or key, handling duplicates, and reading nested values.',
    labType: 'structures-lab',
    topics: ['Lists & tuples', 'Sets (unique, unordered)', 'Dictionaries & nested data'],
  },
  {
    week: 12,
    shortTitle: 'Modular Programs',
    title: 'Integrating Functions, Data & Files in Modules',
    summary: 'Structuring Load → Edit → Save workflows and connecting modular design to the club directory project.',
    labType: 'module-flow',
    topics: ['Load → Edit → Save flow', 'Function contracts', 'Connection to club project'],
  },
]

// 24 original fixed-answer questions covering every subtopic across Weeks 1-7 & 9-12
export const EXAM_QUESTIONS = [
  // ---- WEEK 1 ----
  {
    id: 'w1-q1',
    week: 1,
    topic: 'Running a .py file',
    prompt: 'You just wrote a Python program in an editor and want to run it from the terminal. Which filename and command pair is valid?',
    code: '# File saved in your project folder\nprint("Ready to study!")',
    options: [
      'Save as study.txt and run python study.py',
      'Save as study.py and run python study.py',
      'Save as study.py and type run(study)',
      'Save as study.docx and run python study.docx',
    ],
    answer: 1,
    explain: 'Python source files use the .py extension, and you run them with the python command followed by the exact saved filename.',
  },
  {
    id: 'w1-q2',
    week: 1,
    topic: 'What programming & Python do',
    prompt: 'Why is Python commonly chosen for an introductory programming course?',
    code: 'name = "Alex"\nprint("Welcome,", name)',
    options: [
      'It only runs inside web browsers.',
      'It requires writing machine code in binary.',
      'It uses readable syntax to give step-by-step instructions the computer executes.',
      'It skips errors automatically without stopping.',
    ],
    answer: 2,
    explain: 'Programming means writing clear step-by-step instructions for a computer, and Python expresses those steps with clean, readable syntax.',
  },

  // ---- WEEK 2 ----
  {
    id: 'w2-q1',
    week: 2,
    topic: 'input() before int()',
    prompt: 'If the user types 4 and then 5, what does this program print?',
    code: 'a = input("First: ")\nb = input("Second: ")\nprint(a + b)',
    options: ['9', '45', '4 5', 'TypeError'],
    answer: 1,
    explain: 'input() always returns a string (str). Using + on two strings joins them into "45" instead of adding numbers.',
  },
  {
    id: 'w2-q2',
    week: 2,
    topic: 'Type conversion with int() and float()',
    prompt: 'What does this code print?',
    code: 'price = "12.5"\ncount = int("2")\nprint(float(price) * count)',
    options: ['12.512.5', '25', '25.0', 'Error'],
    answer: 2,
    explain: 'float("12.5") is 12.5 and int("2") is 2. Multiplying a float by an int produces a float: 25.0.',
  },

  // ---- WEEK 3 ----
  {
    id: 'w3-q1',
    week: 3,
    topic: 'File modes w vs a',
    prompt: 'scores.txt currently contains "10\\n20\\n". After this code runs, what is inside scores.txt?',
    code: 'f = open("scores.txt", "w")\nf.write("30\\n")\nf.close()',
    options: [
      '10, 20, and 30 on separate lines',
      'Only 30 on one line (old lines are erased)',
      'Only 10 and 20 (30 is ignored)',
      'An empty file',
    ],
    answer: 1,
    explain: 'Write mode ("w") replaces any existing content in the file. To keep "10" and "20" and add "30" at the end, you would use append mode ("a").',
  },
  {
    id: 'w3-q2',
    week: 3,
    topic: 'Reading & closing files',
    prompt: 'tasks.txt contains "Lab\\nQuiz\\n". What does this code print?',
    code: 'f = open("tasks.txt", "r")\nfirst = f.readline()\nf.close()\nprint(first)',
    options: [
      'Both Lab and Quiz',
      'Only Lab (the first line)',
      'Only Quiz (the last line)',
      'The number 2',
    ],
    answer: 1,
    explain: 'readline() reads just one line from the file. Calling close() releases the file once reading is finished.',
  },

  // ---- WEEK 4 ----
  {
    id: 'w4-q1',
    week: 4,
    topic: 'Boundary cases in if/else',
    prompt: 'What is printed when score is 70?',
    code: 'score = 70\nif score >= 70:\n    print("Pass")\nelse:\n    print("Retry")',
    options: ['Pass', 'Retry', 'Both Pass and Retry', 'Nothing'],
    answer: 0,
    explain: '70 >= 70 is True because >= means "greater than or equal to", so the if branch runs and prints Pass.',
  },
  {
    id: 'w4-q2',
    week: 4,
    topic: 'Boolean expressions',
    prompt: 'What does this code print?',
    code: 'seats = 12\nprint(seats == 10)\nprint(seats != 10)',
    options: ['True then False', 'False then True', 'True then True', '12 then 10'],
    answer: 1,
    explain: '12 == 10 evaluates to False, while 12 != 10 ("not equal to") evaluates to True.',
  },

  // ---- WEEK 5 ----
  {
    id: 'w5-q1',
    week: 5,
    topic: 'elif first-match order',
    prompt: 'What is printed when grade is 85?',
    code: 'grade = 85\nif grade >= 90:\n    print("A")\nelif grade >= 80:\n    print("B")\nelif grade >= 70:\n    print("C")\nelse:\n    print("D")',
    options: ['A', 'B', 'B and C', 'C'],
    answer: 1,
    explain: 'Python checks top to bottom and stops after the first True branch. 85 >= 90 is False, 85 >= 80 is True (prints B), and the rest are skipped.',
  },
  {
    id: 'w5-q2',
    week: 5,
    topic: 'Logical operators & nested if',
    prompt: 'What does this code print?',
    code: 'has_id = True\nage = 17\nif has_id and age >= 18:\n    print("Full access")\nelif has_id or age >= 18:\n    print("Guest pass")\nelse:\n    print("Denied")',
    options: ['Full access', 'Guest pass', 'Denied', 'Nothing'],
    answer: 1,
    explain: 'has_id and age >= 18 is False because 17 >= 18 is False. Next, has_id or age >= 18 is True because has_id is True, so it prints Guest pass.',
  },

  // ---- WEEK 6 ----
  {
    id: 'w6-q1',
    week: 6,
    topic: 'for loop & range(len())',
    prompt: 'What does this loop print?',
    code: 'colors = ["red", "blue", "green"]\nfor i in range(len(colors)):\n    print(i, colors[i])',
    options: [
      '1 red, 2 blue, 3 green',
      '0 red, 1 blue, 2 green',
      '0 red, 1 blue, 2 green, 3',
      'red, blue, green only',
    ],
    answer: 1,
    explain: 'len(colors) is 3, so range(3) produces 0, 1, and 2. Each index i pairs with colors[i].',
  },
  {
    id: 'w6-q2',
    week: 6,
    topic: 'while loop counter',
    prompt: 'What numbers are printed by this while loop?',
    code: 'n = 2\nwhile n <= 6:\n    print(n)\n    n = n + 2',
    options: ['2, 4', '2, 4, 6', '2, 4, 6, 8', '4, 6'],
    answer: 1,
    explain: 'n starts at 2 (<= 6), prints 2, becomes 4 (<= 6), prints 4, becomes 6 (<= 6), prints 6, then becomes 8 and the loop stops.',
  },

  // ---- WEEK 7 ----
  {
    id: 'w7-q1',
    week: 7,
    topic: 'break vs continue',
    prompt: 'What does this loop print?',
    code: 'for n in range(1, 6):\n    if n == 3:\n        continue\n    print(n)',
    options: ['1, 2', '1, 2, 4, 5', '1, 2, 3, 4, 5', '3'],
    answer: 1,
    explain: 'continue skips the rest of the current turn (skipping print(3)) and moves on to 4 and 5. break would have stopped at 2.',
  },
  {
    id: 'w7-q2',
    week: 7,
    topic: 'Nested loops & avoiding infinite loops',
    prompt: 'How many times does "tick" get printed?',
    code: 'for row in range(2):\n    for col in range(3):\n        print("tick")',
    options: ['2 times', '3 times', '5 times', '6 times'],
    answer: 3,
    explain: 'The outer loop runs 2 times, and for each outer turn the inner loop runs 3 times: 2 × 3 = 6 prints.',
  },
  {
    id: 'w7-q3',
    week: 7,
    topic: 'Infinite loop prevention',
    prompt: 'Why is this while loop an infinite loop, and how do you fix it?',
    code: 'count = 5\nwhile count > 0:\n    print(count)',
    options: [
      'Change > to ==',
      'Add count = count - 1 inside the loop so count eventually reaches 0',
      'Add count = count + 1 inside the loop',
      'Remove print(count)',
    ],
    answer: 1,
    explain: 'Because count never changes, 5 > 0 stays True forever. Subtracting 1 inside the loop moves count down to 0 so the loop ends.',
  },

  // ---- WEEK 9 ----
  {
    id: 'w9-q1',
    week: 9,
    topic: 'def vs calling a function',
    prompt: 'What is the exact order of lines printed by this program?',
    code: 'def cheer():\n    print("Go team!")\n\nprint("Start")\ncheer()\nprint("End")',
    options: [
      'Go team!, Start, End',
      'Start, Go team!, End',
      'Start, End, Go team!',
      'Start, End (cheer never runs)',
    ],
    answer: 1,
    explain: 'def cheer(): only defines the function. Python prints "Start" first, runs cheer() when called ("Go team!"), then prints "End".',
  },
  {
    id: 'w9-q2',
    week: 9,
    topic: 'Built-in vs custom functions',
    prompt: 'If you write def show_banner(): print("CSCI 1380") and never call show_banner(), what appears on screen?',
    code: 'def show_banner():\n    print("CSCI 1380")',
    options: ['CSCI 1380', 'show_banner', 'Nothing appears on screen', 'SyntaxError'],
    answer: 2,
    explain: 'Defining a function only stores its instructions. Its body runs only when you call show_banner().',
  },

  // ---- WEEK 10 ----
  {
    id: 'w10-q1',
    week: 10,
    topic: 'print vs return',
    prompt: 'What does this code print?',
    code: 'def add_tax(price):\n    print(price + 2)\n\ntotal = add_tax(10)\nprint(total)',
    options: ['12 then 12', '12 then None', 'None then 12', '10 then 12'],
    answer: 1,
    explain: 'add_tax prints 12, but it has no return statement (it is a void function), so total receives None.',
  },
  {
    id: 'w10-q2',
    week: 10,
    topic: 'Parameters & local scope',
    prompt: 'What does this code print?',
    code: 'points = 10\ndef boost(points):\n    points = points + 5\n    return points\n\nnew_points = boost(points)\nprint(points, new_points)',
    options: ['15 15', '10 15', '15 10', '10 10'],
    answer: 1,
    explain: 'Inside boost(), points is a local parameter. Changing it does not overwrite the outer points variable (10), while return sends 15 back to new_points.',
  },

  // ---- WEEK 11 ----
  {
    id: 'w11-q1',
    week: 11,
    topic: 'Dictionaries, lists & nested structures',
    prompt: 'What does this code print?',
    code: 'clubs = {\n    "robotics": ["Maya", "Omar"],\n    "art": ["Lia", "Noah"]\n}\nprint(clubs["robotics"][1])',
    options: ['Maya', 'Omar', 'Lia', 'robotics'],
    answer: 1,
    explain: 'clubs["robotics"] gets the list ["Maya", "Omar"], and [1] selects the second item (0-indexed), which is "Omar".',
  },
  {
    id: 'w11-q2',
    week: 11,
    topic: 'Sets & tuples',
    prompt: 'Which two statements about tuples and sets in Python are true?',
    code: 'coords = (4, 9)\ntags = {"py", "lab", "py"}\nprint(len(tags), coords[0])',
    options: [
      'len(tags) is 3 and tuples can be modified with append().',
      'len(tags) is 2 (sets remove duplicates), and coords[0] is 4 (tuples are immutable).',
      'Sets always keep items in sorted alphabetical order.',
      'Tuples use curly braces {} and sets use parentheses ().',
    ],
    answer: 1,
    explain: 'Sets store unique values (so {"py", "lab", "py"} has length 2 and no guaranteed order), while tuples use () and cannot be modified after creation.',
  },
  {
    id: 'w11-q3',
    week: 11,
    topic: 'Choosing the right data structure',
    prompt: 'You want to look up each student’s email address quickly using their student ID. Which structure fits best?',
    code: 'emails = {"S101": "mia@utrgv.edu", "S102": "leo@utrgv.edu"}',
    options: ['A set', 'A tuple', 'A dictionary', 'A single string'],
    answer: 2,
    explain: 'Dictionaries map unique keys (like student IDs) directly to values (like email addresses) for fast key-based lookup.',
  },

  // ---- WEEK 12 ----
  {
    id: 'w12-q1',
    week: 12,
    topic: 'Load → Edit → Save lifecycle',
    prompt: 'When building a persistent directory app that edits and saves records, what is the right order of operations?',
    code: '# Step A: save_directory(names, roles)\n# Step B: Load saved records into lists\n# Step C: Update or delete an item in the lists',
    options: [
      'Save → Edit → Load',
      'Load → Edit → Save',
      'Edit → Load → Save',
      'Save → Load → Edit',
    ],
    answer: 1,
    explain: 'You load saved records into memory first so older data is not lost, edit the in-memory lists, and then save the updated lists back to the file.',
  },
  {
    id: 'w12-q2',
    week: 12,
    topic: 'Modular design & function contracts',
    prompt: 'Why do we split a larger Python program into small focused functions (like choose_role, show_directory, and save_directory)?',
    code: 'role = choose_role()\nmember_roles[pos] = role\nsave_directory(member_list, member_roles)',
    options: [
      'Because Python refuses to run files longer than 20 lines.',
      'So each task is written once, reused in multiple places, and easier to test and explain.',
      'So variables inside functions become global automatically.',
      'To avoid using files altogether.',
    ],
    answer: 1,
    explain: 'Modular design breaks a program into clear, reusable pieces with known inputs and outputs—just like how choose_role() is reused by both Add and Update in our club directory.',
  },
]

// Week 8 (Midterm Review) reuses a curated 6-question mix from Weeks 1-6 (no new topic)
export const WEEK8_MIDTERM_IDS = ['w1-q1', 'w2-q1', 'w3-q1', 'w4-q1', 'w5-q1', 'w6-q1']

// Mixed Mock Exam (15 fixed questions covering every topic week 1-7 & 9-12)
export const MOCK_EXAM_IDS = [
  'w1-q1',
  'w2-q1',
  'w2-q2',
  'w3-q1',
  'w3-q2',
  'w4-q1',
  'w5-q1',
  'w5-q2',
  'w6-q1',
  'w7-q1',
  'w7-q3',
  'w9-q1',
  'w10-q1',
  'w10-q2',
  'w11-q1',
  'w11-q2',
  'w12-q1',
  'w12-q2',
]

export function getQuestionsForWeek(weekNum) {
  if (weekNum === 8) {
    return WEEK8_MIDTERM_IDS.map((id) => EXAM_QUESTIONS.find((q) => q.id === id)).filter(Boolean)
  }
  return EXAM_QUESTIONS.filter((q) => q.week === weekNum)
}

export function getMockExamQuestions() {
  return MOCK_EXAM_IDS.map((id) => EXAM_QUESTIONS.find((q) => q.id === id)).filter(Boolean)
}
