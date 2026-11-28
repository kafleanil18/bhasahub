// Shared facts about the HSK mock tests.

// The one paper every signed-in student can take for free (FREE_PAPER_ID in server/routes/hsk1.js).
export const FREE_PAPER_ID = 'h11226';
export const FREE_PAPER_PATH = `/tests/${FREE_PAPER_ID}`;

// The HSK level number in a label such as "HSK 1 · Beginner" or "HSK 2", or null.
export function hskLevelNumber(text) {
  const match = /hsk\s*(\d)/i.exec(String(text || ''));
  return match ? Number(match[1]) : null;
}

// Practice papers have no level field. Real HSK paper codes start with H and the level (H11226 is an
// HSK 1 paper, H21329 an HSK 2 one); a paper whose code doesn't say is an HSK 1 paper, the only
// format the paper editor makes today.
export function paperLevel(paper) {
  const code = /^H(\d)\d{3,}/i.exec(String(paper?.code || paper?.id || ''));
  return code ? Number(code[1]) : 1;
}
