// Pre-generated HD neural audio walkthroughs for all 19 Code Flow Lab scenarios.
// Static MP3 files live in public/audio/flows/<scenarioId>.mp3 (zero runtime API quota!).

export const FLOW_AUDIO_META = {
  'index-slice': {
    url: '/audio/flows/index-slice.mp3',
    script:
      'Watch how Python indexes a four-item list. Positive indices start at zero on the left, so items of zero grabs Pen. Negative indices count backward from the end, so items of negative one grabs Cup. Next, slicing from one to three copies Book and Lamp, stopping right before index three, while leaving the original list untouched with length four.',
  },
  'mutate-append-del': {
    url: '/audio/flows/mutate-append-del.mp3',
    script:
      'Lists are mutable, meaning you can change them in place. First, clubs of one replaces Math with AI. Next, append adds Chess to the end at index three. Watch closely on line four: deleting clubs of zero removes Code and shifts every remaining element one spot to the left, so AI moves into index zero and the length drops back to three.',
  },
  'range-len-sum': {
    url: '/audio/flows/range-len-sum.mp3',
    script:
      'Here we sum four scores using a for loop with range of len of scores, which generates indices zero, one, two, and three. Total starts at zero before the loop. On each turn, index i glides to the next box, reads scores of i, and adds it to total: eighty, then one seventy five, two forty five, and three thirty five. After the loop ends, we divide once to print the average, eighty three point seven five.',
  },
  'for-item-filter': {
    url: '/audio/flows/for-item-filter.mp3',
    script:
      'When you do not need the index number, you can loop directly with for t in temps. Python hands us each temperature one by one: sixty eight is below eighty, so it is skipped. Eighty two passes and increments warm to one. Seventy four is skipped, and ninety one increments warm to two. Outside the loop, Python prints Warm days: two.',
  },
  'while-counter': {
    url: '/audio/flows/while-counter.mp3',
    script:
      'A while loop checks its condition before every single turn. Count starts at one and total at zero. While count is less than or equal to three, we add count into total and add one to count. Notice the exit: count reaches four, four less than or equal to three becomes False, and the loop ends with count equal to four and total equal to six.',
  },
  'while-sentinel': {
    url: '/audio/flows/while-sentinel.mp3',
    script:
      'A sentinel loop keeps running until it sees a special stop value—here, zero. Starting at index zero, ten is not zero so we add it. Next, twenty five is not zero so total becomes thirty five. At index two we hit zero, the condition becomes False immediately, and ninety nine is never processed.',
  },
  'nested-grid': {
    url: '/audio/flows/nested-grid.mp3',
    script:
      'With nested loops, the inner loop finishes a complete cycle for every single turn of the outer loop. When row is zero, col runs through zero, one, and two. Then row advances to one, and col resets back to zero, one, and two—giving two rows times three columns, or six printed coordinate pairs.',
  },
  'break-continue': {
    url: '/audio/flows/break-continue.mp3',
    script:
      'Compare continue and break inside range one to six. One prints normally. At two, continue skips only the rest of that turn and jumps right back to the loop header for three. Three prints. At four, break exits the entire loop immediately, so neither four nor five ever prints, and execution resumes at After loop.',
  },
  'score-92': {
    url: '/audio/flows/score-92.mp3',
    script:
      'In an if, elif, else chain, Python checks conditions from top to bottom and runs only the first match. With score equal to ninety two, ninety two greater than or equal to ninety is True right away. Grade becomes A, and Python skips both elif and else completely before printing Grade: A.',
  },
  'score-81': {
    url: '/audio/flows/score-81.mp3',
    script:
      'With score equal to eighty one, the first check eighty one greater than or equal to ninety is False, so line three is skipped. Python moves down to elif: eighty one greater than or equal to eighty is True, sets grade to B, skips else, and prints Grade: B.',
  },
  'score-65': {
    url: '/audio/flows/score-65.mp3',
    script:
      'When score is sixty five, both the if check for ninety and the elif check for eighty evaluate to False. Because every condition above failed, Python falls into the else fallback, assigns grade to Review, and prints Grade: Review.',
  },
  'return-call': {
    url: '/audio/flows/return-call.mp3',
    script:
      'First, def registers apply_discount in Global memory without running its body yet. When line four calls apply_discount with one hundred and twenty, execution jumps into a temporary Local Frame, computes saved as twenty point zero, and returns eighty point zero. The Local Frame then disappears, and Global price stores eighty point zero.',
  },
  'local-shadowing': {
    url: '/audio/flows/local-shadowing.mp3',
    script:
      'Watch how local scope protects global variables. Global x starts at ten. Inside demo, assigning x equals five creates a separate local variable named x inside the Local Frame, printing Inside: five. Once demo finishes, that Local Frame vanishes, so outside the function global x is still ten.',
  },
  'file-append': {
    url: '/audio/flows/file-append.mp3',
    script:
      'Opening notes dot txt in w mode creates a fresh file and writes Day one followed by a newline, then closes it. Next, opening in a mode preserves Day one and appends Day two at the end. Finally, r mode reads both lines back as one string and prints Day one and Day two.',
  },
  'file-overwrite': {
    url: '/audio/flows/file-overwrite.mp3',
    script:
      'Be careful with write mode w. The first block writes Old line and saves the file. Opening notes dot txt in w mode a second time wipes Old line completely empty before writing New line. When we read the file back in r mode, only New line survives.',
  },
  'dict-ops': {
    url: '/audio/flows/dict-ops.mp3',
    script:
      'Dictionaries map unique keys to values instead of numeric positions. Starting with py at two and js at one, line two reads counts of py, adds one, and updates py to three. Line three assigns a brand-new key sql to four. Finally, we print three and four, and len of counts gives three pairs.',
  },
  'tuple-set': {
    url: '/audio/flows/tuple-set.mp3',
    script:
      'Tuples like point work with zero-based indexing—point of zero reads twelve—but tuples are immutable so their items cannot be reassigned. Next, converting a list with duplicate Ana entries into a set drops duplicates automatically. The set is unordered, has length two, and confirms Ana is in unique.',
  },
  'div-operators': {
    url: '/audio/flows/div-operators.mp3',
    script:
      'Python has three distinct division operators. With eleven slices and four people, single slash gives exact float division, two point seven five. Double slash gives whole-number floor division, two slices each. And percent modulo gives the remainder, three slices left over.',
  },
  'casting-strings': {
    url: '/audio/flows/casting-strings.mp3',
    script:
      'The plus operator depends entirely on data type. Because raw holds text twelve, raw plus text three concatenates into one two three. Calling int on raw converts it into the integer twelve, so num plus three adds mathematically to produce fifteen.',
  },
}
