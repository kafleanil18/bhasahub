import DOMPurify from 'dompurify';

function readQuestions(section) {
  const prompts = [...section.querySelectorAll(':scope > ol > li')];
  const answers = [...section.querySelectorAll(':scope > details > ol > li')];
  return prompts.map((prompt, index) => {
    const paragraphs = [...(answers[index]?.querySelectorAll(':scope > p') || [])];
    return {
      prompt: prompt.textContent.trim(),
      answer: paragraphs[0]?.textContent.trim() || '',
      explanation: paragraphs.slice(1).map(p => p.textContent.trim()).join(' '),
    };
  }).filter(question => question.prompt && question.answer);
}

export function parseGrammarContent(html = '') {
  const safeHtml = DOMPurify.sanitize(html);
  const doc = new DOMParser().parseFromString(safeHtml, 'text/html');
  const sections = [...doc.querySelectorAll('.grammar-point')];
  const points = sections.map((section, index) => {
    const heading = section.querySelector('h4')?.textContent.trim() || '';
    const separator = heading.indexOf(' · ');
    const paragraphs = [...section.querySelectorAll(':scope > p')];
    const practice = section.querySelector('.grammar-self-check');
    return {
      id: separator > -1 ? heading.slice(0, separator) : `point-${index}`,
      title: separator > -1 ? heading.slice(separator + 3) : heading,
      pattern: section.querySelector('.grammar-pattern')?.textContent.replace(/^Pattern:\s*/, '').trim() || '',
      explanation: paragraphs.filter(p => !p.classList.contains('grammar-pattern') && !p.textContent.startsWith('Common mistake:')).map(p => p.textContent.trim()).join('\n\n'),
      mistake: paragraphs.find(p => p.textContent.startsWith('Common mistake:'))?.textContent.replace(/^Common mistake:\s*/, '').trim() || '',
      examples: [...section.querySelectorAll(':scope > blockquote')].map(quote => {
        const rows = [...quote.querySelectorAll('p')];
        return { chinese: rows[0]?.textContent.trim() || '', pinyin: rows[1]?.textContent.trim() || '', english: rows[2]?.textContent.trim() || '' };
      }).filter(example => example.chinese && example.english),
      questions: practice ? readQuestions(practice) : [],
    };
  });
  const objective = [...doc.body.children].find(node => node.tagName === 'P' && node.textContent.startsWith('Learning objective:'))?.textContent.replace(/^Learning objective:\s*/, '').trim() || '';
  const reviews = [...doc.querySelectorAll('.grammar-self-check')].filter(section => !section.closest('.grammar-point')).map(section => ({
    title: section.querySelector('h4')?.textContent.trim() || 'Review',
    instructions: section.querySelector(':scope > p')?.textContent.trim() || '',
    questions: readQuestions(section),
  }));
  // Unknown or teacher-customized formats keep their complete sanitized original view.
  const supported = points.length > 0 && points.every(point => point.title && point.pattern && point.explanation && point.examples.length);
  return { safeHtml, points: supported ? points : [], reviews, objective, meta: doc.querySelector('.grammar-course-meta')?.textContent.trim() || '' };
}

export function sentenceCharacters(text) {
  return Array.from(text).filter(character => !/[\s。，？！、；：,.?!;:“”‘’「」『』（）()[\]【】]/u.test(character));
}

export function shuffledTiles(characters) {
  const tiles = characters.map((text, id) => ({ id, text }));
  for (let index = tiles.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [tiles[index], tiles[other]] = [tiles[other], tiles[index]];
  }
  if (tiles.length > 1 && tiles.every((tile, index) => tile.id === index)) tiles.push(tiles.shift());
  return tiles;
}
