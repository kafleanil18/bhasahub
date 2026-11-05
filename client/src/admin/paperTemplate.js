const parts = [
  ['l1', 'Part 1 · Listen & match', 'Listen to each phrase twice. Does it match the picture?'],
  ['l2', 'Part 2 · Choose a picture', 'Listen to each sentence twice. Choose picture A, B, or C.'],
  ['l3', 'Part 3 · Match the dialogues', 'Listen to each dialogue twice. Choose its picture from A–F.'],
  ['l4', 'Part 4 · Listen & answer', 'Listen to each passage and question twice. Choose the best answer.'],
  ['r1', 'Part 1 · Words & pictures', 'Does the word match the picture?'],
  ['r2', 'Part 2 · Match sentences to pictures', 'Choose the picture from A–F that matches each sentence.'],
  ['r3', 'Part 3 · Questions & replies', 'Choose the reply from A–F that completes each exchange.'],
  ['r4', 'Part 4 · Fill in the missing word', 'Choose a word from A–F to fill each blank.'],
];
export function blankPaper() {
  return { title: '', code: '', audioUrl: '', listeningSeconds: 910, transferSeconds: 180, readingSeconds: 1020,
    groups: parts.map(([id, title, instruction], gi) => ({ id, section: gi < 4 ? 'listening' : 'reading', title, instruction, image: '', imageCaption: '', example: '',
      ...([6, 7].includes(gi) ? { choices: Array.from({ length: 6 }, () => ({ text: '', pinyin: '' })) } : {}),
      questions: Array.from({ length: 5 }, (_, qi) => ({ number: gi * 5 + qi + 1, text: '', pinyin: '', image: '', listeningText: '', explanation: '', correctIndex: null,
        options: (['l1','r1'].includes(id) ? ['✓ Matches', '✕ Does not match'] : ['l3','r2','r3','r4'].includes(id) ? ['A','B','C','D','E','F'] : ['A','B','C']).map(text => ({ text: id === 'l4' ? '' : text, pinyin: '' })),
      })),
    })),
  };
}
