import { useEffect, useState } from 'react';
import { useInitialLoad } from '../navigation/pageLoad';

// The editable text of the About pages. A super admin edits these in Admin > About pages; the server
// stores only the fields that differ from these defaults (see server/routes/aboutPages.js), so new
// fields and default wording changes reach every page that hasn't overridden them.
// Each field: [key, label, default text, multiline].
export const ABOUT_PAGES = {
  'xiao-ao': {
    label: 'About Xiao Ao',
    path: '/about',
    hideable: true,
    groups: [
      ['Introduction', [
        ['eyebrow', 'Eyebrow', 'About us'],
        ['title', 'Page title', 'About Xiao Ao'],
        ['lead', 'Introduction', 'Xiao Ao makes Chinese simple to start and steady to keep up: guided HSK courses, a practice studio for sounds, characters and listening, timed mock tests, and live classes with a teacher, all in one place.', true],
        ['motto', 'Motto', 'Small steps. Real conversations.'],
      ]],
      ['How we teach', [
        ['howTitle', 'Section title', 'How we teach'],
        ['principle1Title', 'First card title', 'Small steps, every day'],
        ['principle1Text', 'First card text', 'Short lessons and quick practice rounds fit into a busy day. A daily reminder helps you keep going, and is skipped once you’ve practised.', true],
        ['principle2Title', 'Second card title', 'Real sounds from the start'],
        ['principle2Text', 'Second card text', 'Words, tones and conversations come with audio, much of it recorded by our teachers, so you hear Mandarin the way it’s spoken.', true],
        ['principle3Title', 'Third card title', 'Practice that matches the exam'],
        ['principle3Text', 'Third card text', 'Courses follow the HSK levels in order, and timed mock tests show how you’d do on the day, section by section.', true],
      ]],
      ['Learning roadmap', [
        ['roadmapTitle', 'Section title', 'Chinese learning roadmap'],
        ['roadmapIntro', 'Introduction', 'Start with sounds or jump to the stage that matches what you can already do. Each stage links to its HSK course and the practice tools that train it.', true],
      ]],
      ['What you’ll find here', [
        ['offerTitle', 'Section title', 'What you’ll find here'],
        ['offerCourses', 'HSK courses', 'Lessons that follow the HSK levels, each word with characters, pinyin, meaning and audio.', true],
        ['offerStudio', 'Practice studio', 'Nine practice tools for pinyin, tones, characters, listening, sentences, numbers and conversation.', true],
        ['offerTests', 'HSK mock tests', 'Timed papers with a listening and reading breakdown. One HSK 1 paper is free with an account.', true],
        ['offerLive', 'Live classes', 'Learn with a teacher alongside your courses. Message us and we’ll tell you about upcoming classes.', true],
      ]],
      ['Team', [
        ['teamTitle', 'Section title', 'Meet the team'],
        ['teamIntro', 'Introduction', 'The teachers behind the lessons, recordings and live classes.', true],
      ]],
      ['Closing', [
        ['ctaTitle', 'Title', 'Start learning with us'],
        ['ctaText', 'Text', 'Try the pinyin chart without an account, or look through the courses.', true],
      ]],
    ],
  },
  hsk: {
    label: 'About HSK',
    path: '/about-hsk',
    hideable: false,
    groups: [
      ['Introduction', [
        ['title', 'Page title', 'What is the HSK?'],
        ['lead', 'Introduction', 'The HSK is the official international Mandarin proficiency exam. Universities, scholarship programmes and employers use it to see what you can do in Chinese.', true],
      ]],
      ['Levels', [
        ['levelsTitle', 'Section title', 'Pick a level'],
        ['levelsIntro', 'Introduction', 'Compare the vocabulary, test length and pass mark for each level.', true],
      ]],
      ['Exam', [
        ['examTitle', 'Section title', 'What’s in the exam'],
        ['examIntro', 'Introduction', 'HSK 1–6 all test listening and reading. Writing starts at HSK 3.', true],
      ]],
      ['Scoring and booking', [
        ['scoringTitle', 'Scoring section title', 'How you pass'],
        ['bookingTitle', 'Booking section title', 'From booking to results'],
      ]],
      ['HSK 3.0', [
        ['updateTitle', 'Section title', 'HSK 3.0'],
        ['updateText', 'First paragraph', 'The new standard expands the HSK from six levels to nine and adds speaking and translation. The advanced HSK 7–9 exam is already running. Check which version your test centre uses.', true],
        ['updateNote', 'Second paragraph', 'The vocabulary target at the highest level rises from 5,000 to 11,092 words.', true],
      ]],
      ['Questions and closing', [
        ['faqTitle', 'FAQ section title', 'Learning Chinese with Xiao Ao'],
        ['ctaTitle', 'Closing title', 'Try a timed mock test'],
        ['ctaText', 'Closing text', 'Get a feel for the exam and see which sections you need to practise.', true],
      ]],
    ],
  },
};

export const aboutFields = slug => ABOUT_PAGES[slug].groups.flatMap(([, fields]) => fields);

// The page's text: saved overrides on top of the defaults.
export function aboutText(slug, overrides = {}) {
  return Object.fromEntries(aboutFields(slug).map(([key, , fallback]) => [key, typeof overrides[key] === 'string' && overrides[key].trim() ? overrides[key] : fallback]));
}

const authHeaders = () => { const token = localStorage.getItem('token'); return token ? { Authorization: `Bearer ${token}` } : {}; };

export async function fetchAboutPage(slug) {
  const response = await fetch(`${window.API_BASE_URL}/api/about-pages/${slug}`, { headers: authHeaders() });
  if (response.status === 404) return { slug, visible: false, hidden: true, content: {} };
  if (!response.ok) throw new Error('Could not load this page.');
  return response.json();
}

// Loads a page's saved text for the public page. If the server can't be reached, the defaults show,
// except for a page that can be hidden, which stays hidden until the server says otherwise.
export function useAboutPage(slug) {
  const [state, setState] = useState({ loading: true, visible: !ABOUT_PAGES[slug].hideable, content: {} });
  useInitialLoad(state.loading, 'Loading…');
  useEffect(() => {
    let active = true;
    fetchAboutPage(slug)
      .then(page => { if (active) setState({ loading: false, visible: page.visible !== false, content: page.content || {} }); })
      .catch(() => { if (active) setState(previous => ({ ...previous, loading: false })); });
    return () => { active = false; };
  }, [slug]);
  return { ...state, text: aboutText(slug, state.content) };
}
