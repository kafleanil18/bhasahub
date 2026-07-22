import { useState, useEffect } from 'react';

const API = window.API_BASE_URL + '/api';

const resolveImageUrl = (img) => {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  if (img.startsWith('/images/')) return img;
  const base = window.API_BASE_URL || '';
  return img.startsWith('/') ? `${base}${img}` : `${base}/${img}`;
};

// Rich default articles to ensure the blog always looks vibrant and full
const FALLBACK_BLOGS = [
  {
    _id: 'fb-1',
    title: 'Mastering Mandarin Tones: Pitch Contours & Muscle Memory',
    category: 'Pronunciation',
    author: 'Lin Wei',
    authorRole: 'Phonetics Researcher & Lead Educator',
    createdAt: '2026-03-14T10:00:00.000Z',
    readTimeMin: 5,
    likes: 42,
    image: '/images/blog_tones.jpg',
    excerpt: 'Tones aren’t just pitches—they are vocal shapes. Learn how pitch contours, body posture, and muscle memory simplify mastering the 4 tones.',
    body: `
      <p class="blog-lead">Tone accuracy is the single biggest hurdle for Mandarin learners, yet traditional methods treat tones as abstract musical notes rather than physical muscle movements. In this guide, we break down tone contours through visual mapping and vocal mechanics.</p>
      
      <h2>1. The Four Tone Contours Visualized</h2>
      <p>Mandarin uses a 5-level pitch scale (1 being lowest, 5 highest):</p>
      <ul>
        <li><strong>1st Tone (High Level - 55):</strong> High, steady, and elongated. Think of a doctor asking you to say "Ahhh".</li>
        <li><strong>2nd Tone (Rising - 35):</strong> Starts mid-level and rises sharply. Sounds like a surprised "What?!"</li>
        <li><strong>3rd Tone (Dipping - 214):</strong> Drops low before rising. The key is reaching your lowest vocal register first!</li>
        <li><strong>4th Tone (Falling - 51):</strong> Starts high and drops sharply. Like a firm, decisive command: "No!"</li>
      </ul>

      <div class="blog-callout">
        <span class="callout-icon">💡</span>
        <div>
          <strong>Pro Tip: Pitch Range vs. Vocal Strain</strong>
          <p>You don't need to sing or strain your neck. Maintain your natural vocal range and rely on vocal cord tension rather than volume.</p>
        </div>
      </div>

      <h2>2. Tone Pair Combinations: The Real Secret</h2>
      <p>Isolated tones are easy in drills; real fluency happens when combining tones in pairs (e.g. 1st + 4th tone like <em>bāshì</em> or 3rd + 2nd tone like <em>jǐngchá</em>). Practicing the 20 fundamental tone pairs builds subconscious muscle memory far faster than isolated character drills.</p>

      <blockquote>"Fluency is not about pronouncing every syllable perfectly in isolation, but about maintaining pitch rhythm across full clauses."</blockquote>

      <h2>3. Neutral Tones and Pitch Flow</h2>
      <p>Neutral tones (轻声 - qīngshēng) are light and brief. They adjust their pitch based on the preceding tone. Mastering neutral tones adds immediate natural cadence to your spoken Mandarin.</p>
    `
  },
  {
    _id: 'fb-2',
    title: 'Devanagari vs. Pinyin: Comparative Phonetic Architecture',
    category: 'Nepali',
    author: 'Anil Karki',
    authorRole: 'Linguistics Fellow',
    createdAt: '2026-02-28T14:30:00.000Z',
    readTimeMin: 7,
    likes: 68,
    image: '/images/blog_devanagari.jpg',
    excerpt: 'Comparing the phonetic structures of Devanagari script and Chinese Pinyin reveals surprising parallels in aspiration, nasalization, and vocalic points.',
    body: `
      <p class="blog-lead">For native speakers or learners familiar with Devanagari (used in Nepali and Hindi), learning Chinese phonetics through Pinyin presents unique structural overlaps that make acquisition faster.</p>

      <h2>1. Aspiration Pairs in Devanagari and Pinyin</h2>
      <p>In English, aspiration (puff of air) is rarely phonemic. But both Devanagari and Pinyin strictly differentiate aspirated vs. unaspirated consonants:</p>
      <ul>
        <li><strong>Unaspirated 'b' vs. Aspirated 'p':</strong> Parallel to Devanagari <em>ब (ba)</em> vs <em>फ (pha)</em>.</li>
        <li><strong>Unaspirated 'd' vs. Aspirated 't':</strong> Parallel to Devanagari <em>द (da)</em> vs <em>थ (tha)</em>.</li>
        <li><strong>Unaspirated 'g' vs. Aspirated 'k':</strong> Parallel to Devanagari <em>ग (ga)</em> vs <em>ख (kha)</em>.</li>
      </ul>

      <div class="blog-callout">
        <span class="callout-icon">🧠</span>
        <div>
          <strong>Linguistic Insight</strong>
          <p>Nepali speakers already have built-in throat and palatal awareness for retroflex sounds (ट, ठ, ड), making Chinese retroflex initials (zh, ch, sh, r) much intuitive to master.</p>
        </div>
      </div>

      <h2>2. Retroflex and Palatal Alignment</h2>
      <p>Pinyin's <em>zh, ch, sh</em> articulation closely mirrors the retroflex series in Devanagari where the tongue curls backward toward the roof of the mouth. Recognizing this alignment eliminates accent friction early in your learning journey.</p>
    `
  },
  {
    _id: 'fb-3',
    title: 'Radicals Unlocked: 214 Keys to Reading Chinese Characters',
    category: 'Characters',
    author: 'Mei Ling',
    authorRole: 'Sinology & Calligraphy Specialist',
    createdAt: '2026-02-15T09:15:00.000Z',
    readTimeMin: 6,
    likes: 89,
    image: '/images/blog_radicals.jpg',
    excerpt: 'Deconstruct complex Hanzi into semantic and phonetic building blocks. Master radicals to double your character recognition speed.',
    body: `
      <p class="blog-lead">Chinese characters (汉字) are not random collections of strokes. Over 85% of characters are <strong>picto-phonetic compounds</strong> (形声字) consisting of a semantic radical (hinting at meaning) and a phonetic component (hinting at pronunciation).</p>

      <h2>1. Common Semantic Radicals</h2>
      <p>Recognizing just 30 core radicals unlocks clue recognition for over 1,000 common characters:</p>
      <ul>
        <li><strong>氵 (Water - 三点水):</strong> Appears in <em>海 (ocean), 河 (river), 洗 (wash)</em>.</li>
        <li><strong>亻 (Person - 单人旁):</strong> Appears in <em>你 (you), 他 (he), 休 (rest)</em>.</li>
        <li><strong>⺘ (Hand - 提手旁):</strong> Appears in <em>打 (hit), 提 (lift), 找 (search)</em>.</li>
        <li><strong>讠 (Speech - 言字旁):</strong> Appears in <em>说 (speak), 话 (words), 语 (language)</em>.</li>
      </ul>

      <h2>2. How Phonetic Components Work</h2>
      <p>Take the phonetic component <strong>青 (qīng)</strong>. Characters containing 青 usually retain a similar pronunciation:</p>
      <ul>
        <li>清 (qīng) = 氵 (water) + 青 = Clear</li>
        <li>晴 (qíng) = 日 (sun) + 青 = Sunny</li>
        <li>请 (qǐng) = 讠 (speech) + 青 = Please</li>
        <li>情 (qíng) = 忄 (heart) + 青 = Emotion</li>
      </ul>

      <blockquote>"Once you see characters as logical Lego blocks rather than random stroke paintings, character retention triples."</blockquote>
    `
  },
  {
    _id: 'fb-4',
    title: 'HSK 3.0 Exam Roadmap: Vocabulary & Listening Tactics',
    category: 'HSK Prep',
    author: 'David Chen',
    authorRole: 'Senior HSK Evaluator',
    createdAt: '2026-01-20T11:00:00.000Z',
    readTimeMin: 8,
    likes: 104,
    image: '/images/blog_hsk.jpg',
    excerpt: 'Navigating the new HSK 3.0 band structure. Tactical guidance on SRS flashcards, listening comprehension traps, and timed mock tests.',
    body: `
      <p class="blog-lead">The updated HSK 3.0 standard places stronger emphasis on practical communicative ability, handwriting recognition, and nuanced grammar structures. Here is how to target your study time for maximum score efficiency.</p>

      <h2>1. Prioritize High-Frequency Collocations</h2>
      <p>Don't memorize isolated words in alphabetical lists. Learn <strong>verb + noun pairs</strong> and <strong>measure words</strong> together. For example, pair <em>提出 (tíchū)</em> with <em>意见 (yìjiàn - suggestions)</em> or <em>问题 (wèntí - questions)</em>.</p>

      <h2>2. Active Listening & Shadowing</h2>
      <p>Listening test passages often include distractor options that repeat exact words from the audio but alter the logic or negation. Focus on understanding clause connections like <em>虽然...但是... (Although... however...)</em> and <em>不仅...而且... (Not only... but also...)</em>.</p>
    `
  },
  {
    _id: 'fb-5',
    title: 'The Secret to HSK Vocabulary: Contextual Chunks over Flashcards',
    category: 'HSK Prep',
    author: 'Mei Ling',
    authorRole: 'Sinology & Calligraphy Specialist',
    createdAt: '2026-03-20T08:00:00.000Z',
    readTimeMin: 6,
    likes: 54,
    image: '/images/blog_chunks.jpg',
    excerpt: 'Why memorizing isolated word lists causes mind blanks during HSK exams, and how sentence chunking speeds up natural recall.',
    body: `
      <p class="blog-lead">Rote memorization of isolated vocabulary lists is the single biggest trap for HSK candidates. When taking reading and listening exams, isolated words fail because real Chinese relies heavily on <strong>fixed collocations (固定搭配)</strong> and <strong>grammatical rhythm</strong>.</p>

      <h2>1. Why Isolated Flashcards Fail</h2>
      <p>Memorizing <em>打 (dǎ - to hit)</em> without context leaves you confused when encountering <em>打电话 (make a call)</em>, <em>打折 (discount)</em>, or <em>打车 (hail a taxi)</em>. Learning in multi-word chunks prepares your brain for instant recognition during timed tests.</p>

      <div class="blog-callout">
        <span class="callout-icon">💡</span>
        <div>
          <strong>HSK Test Tactic</strong>
          <p>Pair every new verb with 2 high-frequency nouns. For example, when learning 提高 (tígāo - improve), always record: 提高水平 (improve level) and 提高效率 (improve efficiency).</p>
        </div>
      </div>

      <h2>2. Measure Words (量词) as Memory Anchors</h2>
      <p>Mandarin measure words act as natural category classifiers. Learning <em>一把椅子 (yì bǎ yǐzi - a chair)</em> and <em>一把伞 (yì bǎ sǎn - an umbrella)</em> reinforces that <em>把</em> connects to objects with handles.</p>
    `
  },
  {
    _id: 'fb-6',
    title: 'Demystifying Chinese Sentence Structure: The S-T-L-V-O Rule',
    category: 'Grammar',
    author: 'David Chen',
    authorRole: 'Senior HSK Evaluator',
    createdAt: '2026-03-28T12:00:00.000Z',
    readTimeMin: 7,
    likes: 76,
    image: '/images/blog_grammar.jpg',
    excerpt: 'Mandarin has no verb conjugations, but word order is everything. Master Subject-Time-Location-Action and never mess up sentence structure again.',
    body: `
      <p class="blog-lead">While Chinese has no verb conjugations, tense markers, or gendered nouns, many learners struggle with sentence structure. The master key to Mandarin syntax is the <strong>S-T-L-V-O rule</strong>: Subject + Time + Location + Verb + Object.</p>

      <h2>1. Breaking Down S-T-L-V-O</h2>
      <p>In English, we say "I ate dinner at a restaurant yesterday." In Chinese, time and location MUST precede the action:</p>
      <ul>
        <li><strong>Subject (主语):</strong> 我 (wǒ - I)</li>
        <li><strong>Time (时间):</strong> 昨天 (zuótiān - yesterday)</li>
        <li><strong>Location (地点):</strong> 在饭店 (zài fàndiàn - at restaurant)</li>
        <li><strong>Verb + Object (动宾):</strong> 吃晚餐 (chī wǎncān - ate dinner)</li>
      </ul>
      <p>Full sentence: <em>我昨天在饭店吃晚餐。</em></p>

      <h2>2. The Displaced Time Rule</h2>
      <p>Time words can appear either right before or right after the Subject, but NEVER at the end of a sentence!</p>

      <blockquote>"In Mandarin, when and where something happens sets the stage before the action takes place."</blockquote>
    `
  },
  {
    _id: 'fb-7',
    title: 'Chinese Character Evolution: From Oracle Bones to Modern Hanzi',
    category: 'Characters',
    author: 'Lin Wei',
    authorRole: 'Phonetics Researcher & Lead Educator',
    createdAt: '2026-04-02T15:30:00.000Z',
    readTimeMin: 6,
    likes: 91,
    image: '/images/blog_oracle.jpg',
    excerpt: 'Trace the 3,000-year transformation of Chinese pictograms from turtle shell carvings to modern simplified characters.',
    body: `
      <p class="blog-lead">Chinese characters (汉字) form the oldest continuously used writing system in the world. Understanding their historical evolution from bronze inscriptions to modern characters makes Hanzi far easier to remember.</p>

      <h2>1. Oracle Bone Script (甲骨文)</h2>
      <p>Dating back over 3,000 years to the Shang Dynasty, characters were carved into turtle shells and ox scapulae for divination. Pictograms like <em>日 (sun)</em> were drawn as circles with a central dot, and <em>月 (moon)</em> as a crescent.</p>

      <h2>2. The Five Main Character Types</h2>
      <ul>
        <li><strong>Pictograms (象形字):</strong> Direct visual depictions (e.g. 木 - tree, 山 - mountain).</li>
        <li><strong>Ideograms (指事字):</strong> Abstract concepts (e.g. 上 - above, 下 - below).</li>
        <li><strong>Compound Ideograms (会意字):</strong> Combining meanings (e.g. 日 + 月 = 明 bright).</li>
        <li><strong>Phono-Semantics (形声字):</strong> Radical for meaning + component for sound. Account for 85%+ of characters!</li>
      </ul>
    `
  },
  {
    _id: 'fb-8',
    title: 'Transitioning Off Pinyin: 4 Steps to Read Raw Chinese Texts',
    category: 'Language Tips',
    author: 'Anil Karki',
    authorRole: 'Linguistics Fellow',
    createdAt: '2026-04-10T09:00:00.000Z',
    readTimeMin: 5,
    likes: 63,
    image: '/images/blog_readpinyin.jpg',
    excerpt: 'Relying on Pinyin tone marks for too long slows down character reading. Here is a 4-step framework to transition to raw Hanzi reading.',
    body: `
      <p class="blog-lead">Pinyin is an indispensable phonetic bridge when starting Mandarin, but relying on tone marks over character texts creates visual dependency. Here is a proven strategy to transition to reading authentic Chinese.</p>

      <h2>1. Use Dual-Format Reading Material</h2>
      <p>Begin with graded readers that place Pinyin above Hanzi. Read through once with Pinyin, then cover the Pinyin line with an index card and re-read the characters aloud.</p>

      <h2>2. Focus on Top 300 Characters First</h2>
      <p>The top 300 Chinese characters account for approximately 65% of all written Mandarin in news and literature. Master these 300 characters until visual recognition is instant without Pinyin aids.</p>

      <div class="blog-callout">
        <span class="callout-icon">🚀</span>
        <div>
          <strong>Actionable Practice</strong>
          <p>Set your phone language or browser extension to display hover pinyin popups rather than full-page pinyin transcripts. Force your eyes to process Hanzi first!</p>
        </div>
      </div>
    `
  },
  {
    _id: 'fb-9',
    title: 'The Cultural Wisdom of Chengyu: 4-Character Chinese Idioms',
    category: 'Culture',
    author: 'Lin Wei',
    authorRole: 'Phonetics Researcher & Lead Educator',
    createdAt: '2026-04-15T11:20:00.000Z',
    readTimeMin: 6,
    likes: 112,
    image: '/images/blog_chengyu.jpg',
    excerpt: 'Four characters that tell a whole story. Discover popular Chengyu like 画蛇添足 (Hua She Tian Zu) and 井底之蛙 (Jing Di Zhi Wa).',
    body: `
      <p class="blog-lead">Chengyu (成语) are concise 4-character idioms derived from ancient Chinese fables, classical literature, and historical events. Using Chengyu demonstrates deep linguistic sophistication and cultural appreciation.</p>

      <h2>1. 画蛇添足 (Huà Shé Tiān Zú)</h2>
      <p><strong>Literal Meaning:</strong> Drawing a snake and adding feet.<br/>
      <strong>Figurative Meaning:</strong> To ruin something by adding unnecessary details or overdoing it.<br/>
      <strong>Origin Story:</strong> A story of a competition where a man finished drawing a snake first, but spent extra time adding feet to it, losing the contest.</p>

      <h2>2. 井底之蛙 (Jǐng Dǐ Zhī Wā)</h2>
      <p><strong>Literal Meaning:</strong> A frog at the bottom of a well.<br/>
      <strong>Figurative Meaning:</strong> A person with a narrow worldview who assumes their tiny experience is the whole universe.</p>

      <blockquote>"Mastering Chengyu is like unlocking secret cultural shortcuts—four characters express an entire moral story."</blockquote>
    `
  }
];

const CATEGORIES = ['All', 'Pronunciation', 'Characters', 'Nepali', 'HSK Prep', 'Grammar', 'Culture', 'Language Tips'];

function BlogPage({ onBack }) {
  const [blogs, setBlogs] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);

  // User interactive state
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('bhasahub_bookmarked_blogs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [likesMap, setLikesMap] = useState(() => {
    try {
      const saved = localStorage.getItem('bhasahub_blog_likes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [fontSize, setFontSize] = useState(17);
  const [toast, setToast] = useState(null);
  const [helpfulRating, setHelpfulRating] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Fetch live published blogs from database
  useEffect(() => {
    fetch(`${API}/blogs`)
      .then((res) => res.json())
      .then((data) => {
        const fetched = Array.isArray(data) ? data : [];
        if (fetched.length > 0) {
          setBlogs(fetched);
        } else {
          setBlogs(FALLBACK_BLOGS);
        }
        setLoading(false);
      })
      .catch(() => {
        setBlogs(FALLBACK_BLOGS);
        setLoading(false);
      });
  }, []);

  // Track scroll reading progress when in Reader View
  useEffect(() => {
    if (!active) return;
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setScrollProgress(currentProgress);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [active]);

  // Scroll to top when active post changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setHelpfulRating(null);
  }, [active]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const stripTags = (html) => (html || '').replace(/<[^>]+>/g, '');

  const getReadTime = (bodyText) => {
    const raw = stripTags(bodyText);
    const words = raw ? raw.split(/\s+/).length : 0;
    return Math.max(1, Math.ceil(words / 180));
  };

  const getCategory = (blog) => {
    if (blog.category) return blog.category;
    const text = `${blog.title} ${blog.body}`.toLowerCase();
    if (text.includes('pinyin') || text.includes('pronounce') || text.includes('tone')) return 'Pronunciation';
    if (text.includes('character') || text.includes('stroke') || text.includes('radical') || text.includes('write')) return 'Characters';
    if (text.includes('nepali') || text.includes('nepal') || text.includes('devanagari')) return 'Nepali';
    if (text.includes('hsk') || text.includes('exam') || text.includes('test')) return 'HSK Prep';
    if (text.includes('grammar') || text.includes('sentence') || text.includes('structure')) return 'Grammar';
    if (text.includes('culture') || text.includes('festival') || text.includes('tea') || text.includes('history')) return 'Culture';
    return 'Language Tips';
  };

  const getCategoryColor = (categoryName) => {
    switch (categoryName) {
      case 'Pronunciation': return { bg: 'rgba(46, 107, 87, 0.12)', border: '#2e6b57', color: '#2e6b57' };
      case 'Characters': return { bg: 'rgba(200, 54, 42, 0.12)', border: '#c8362a', color: '#c8362a' };
      case 'Nepali': return { bg: 'rgba(217, 119, 6, 0.12)', border: '#d97706', color: '#d97706' };
      case 'HSK Prep': return { bg: 'rgba(99, 102, 241, 0.12)', border: '#6366f1', color: '#4f46e5' };
      case 'Grammar': return { bg: 'rgba(2, 132, 199, 0.12)', border: '#0284c7', color: '#0284c7' };
      case 'Culture': return { bg: 'rgba(225, 29, 72, 0.12)', border: '#e11d48', color: '#e11d48' };
      default: return { bg: 'rgba(201, 154, 60, 0.12)', border: '#c99a3c', color: '#b48325' };
    }
  };

  const getInitials = (name) => {
    if (!name) return 'BH';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name[0].toUpperCase();
  };

  const toggleBookmark = (e, blogId) => {
    e.stopPropagation();
    let updated;
    if (bookmarkedIds.includes(blogId)) {
      updated = bookmarkedIds.filter((id) => id !== blogId);
      showToast('Removed from saved bookmarks');
    } else {
      updated = [...bookmarkedIds, blogId];
      showToast('Saved to bookmarks!');
    }
    setBookmarkedIds(updated);
    localStorage.setItem('bhasahub_bookmarked_blogs', JSON.stringify(updated));
  };

  const handleLike = (e, blogId, initialLikes = 0) => {
    e.stopPropagation();
    const currentAdd = likesMap[blogId] || 0;
    const newAdd = currentAdd + 1;
    const updatedMap = { ...likesMap, [blogId]: newAdd };
    setLikesMap(updatedMap);
    localStorage.setItem('bhasahub_blog_likes', JSON.stringify(updatedMap));
    showToast(`❤️ Liked article (${(initialLikes || 0) + newAdd} total)`);
  };

  const handleShare = (blog) => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast(`🔗 Link for "${blog?.title || 'Article'}" copied!`);
    } else {
      showToast('Share link: ' + url);
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
      showToast('✨ Thank you for subscribing to BhasaHub Insights!');
    }
  };

  // Filtering and Sorting logic
  const filteredBlogs = blogs.filter((b) => {
    const cat = getCategory(b);
    const matchesCategory = selectedCategory === 'All' || cat === selectedCategory;
    const matchesBookmark = !onlyBookmarks || bookmarkedIds.includes(b._id);

    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory && matchesBookmark;

    const titleMatch = (b.title || '').toLowerCase().includes(query);
    const bodyMatch = stripTags(b.body || '').toLowerCase().includes(query);
    const authorMatch = (b.author || '').toLowerCase().includes(query);
    const categoryMatch = cat.toLowerCase().includes(query);

    return matchesCategory && matchesBookmark && (titleMatch || bodyMatch || authorMatch || categoryMatch);
  });

  const sortedBlogs = [...filteredBlogs].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    if (sortBy === 'readTime') return getReadTime(b.body) - getReadTime(a.body);
    if (sortBy === 'popular') {
      const likesA = (a.likes || 0) + (likesMap[a._id] || 0);
      const likesB = (b.likes || 0) + (likesMap[b._id] || 0);
      return likesB - likesA;
    }
    return 0;
  });

  const featuredPost = sortedBlogs.length > 0 ? sortedBlogs[0] : null;
  const regularPosts = sortedBlogs.length > 1 ? sortedBlogs.slice(1) : [];

  // Count per category
  const getCategoryCount = (catName) => {
    if (catName === 'All') return blogs.length;
    return blogs.filter((b) => getCategory(b) === catName).length;
  };

  // -------------------------------------------------------------
  // ARTICLE READER VIEW
  // -------------------------------------------------------------
  if (active) {
    const category = getCategory(active);
    const catStyle = getCategoryColor(category);
    const readTime = active.readTimeMin || getReadTime(active.body);
    const authorInitials = getInitials(active.author);
    const isBookmarked = bookmarkedIds.includes(active._id);
    const currentLikes = (active.likes || 0) + (likesMap[active._id] || 0);

    const relatedArticles = blogs
      .filter((b) => b._id !== active._id && getCategory(b) === category)
      .slice(0, 2);

    return (
      <div className="blog-reader-page">
        {/* Top Reading Progress Bar */}
        <div className="blog-reading-progress-track">
          <div className="blog-reading-progress-bar" style={{ width: `${scrollProgress}%` }} />
        </div>

        {/* Floating Top Navigation Header */}
        <div className="blog-sticky-bar">
          <div className="container blog-sticky-content">
            <button className="blog-back-pill" onClick={() => setActive(null)}>
              ← Back to Insights
            </button>

            <div className="blog-sticky-actions">
              {/* Font Size Adjusters */}
              <div className="font-size-controls">
                <button
                  className="font-size-btn"
                  title="Decrease font size"
                  onClick={() => setFontSize((prev) => Math.max(14, prev - 1))}
                  disabled={fontSize <= 14}
                >
                  A-
                </button>
                <span className="font-size-indicator">{fontSize}px</span>
                <button
                  className="font-size-btn"
                  title="Increase font size"
                  onClick={() => setFontSize((prev) => Math.min(23, prev + 1))}
                  disabled={fontSize >= 23}
                >
                  A+
                </button>
              </div>

              {/* Bookmark Action */}
              <button
                className={`sticky-action-btn ${isBookmarked ? 'active' : ''}`}
                onClick={(e) => toggleBookmark(e, active._id)}
                title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Article'}
              >
                {isBookmarked ? '🔖 Saved' : '🔖 Save'}
              </button>

              {/* Like Action */}
              <button
                className="sticky-action-btn like-btn"
                onClick={(e) => handleLike(e, active._id, active.likes)}
                title="Appreciate this article"
              >
                ❤️ {currentLikes}
              </button>

              {/* Share Action */}
              <button className="sticky-action-btn" onClick={() => handleShare(active)} title="Share Article">
                ↗ Share
              </button>
            </div>
          </div>
        </div>

        <section className="blog-page-container container">
          {/* Toast Notification */}
          {toast && <div className="blog-toast">{toast}</div>}

          <div className="blog-reader-wrapper">
            {/* Article Meta Header */}
            <div className="blog-reader-header">
              <div className="blog-reader-tags">
                <span
                  className="blog-category-badge"
                  style={{
                    background: catStyle.bg,
                    borderColor: catStyle.border,
                    color: catStyle.color
                  }}
                >
                  {category}
                </span>
                <span className="blog-read-time-pill">⏱ {readTime} min read</span>
              </div>

              <h1 className="blog-reader-title">{active.title}</h1>

              {/* Author Info Card */}
              <div className="blog-reader-author-card">
                <div className="blog-meta-avatar-large">{authorInitials}</div>
                <div className="blog-meta-details-extended">
                  <span className="blog-meta-author-name">{active.author || 'BhasaHub Educator'}</span>
                  <span className="blog-meta-author-title">{active.authorRole || 'Language & Linguistics Specialist'}</span>
                  <span className="blog-meta-date-info">
                    Published on {new Date(active.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Banner Cover Image */}
            {active.image ? (
              <div className="blog-reader-hero-img-box">
                <img
                  src={resolveImageUrl(active.image)}
                  alt={active.title}
                  className="blog-reader-hero-img"
                />
              </div>
            ) : (
              <div className="blog-reader-hero-glyph">
                <div className="glyph-pattern">
                  <span>📖</span>
                  <p>BhasaHub Insights Series</p>
                </div>
              </div>
            )}

            {/* Main Article Body with Custom Font Size */}
            <article
              className="blog-reader-body"
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{ __html: active.body }}
            />

            {/* Interactive End-of-Article Section */}
            <div className="blog-reader-footer-actions">
              {/* Helpfulness Rating */}
              <div className="blog-helpful-card">
                <h3>Was this article helpful?</h3>
                {helpfulRating ? (
                  <p className="helpful-thanks-msg">✨ Thank you for your feedback!</p>
                ) : (
                  <div className="helpful-buttons">
                    <button className="helpful-btn" onClick={() => setHelpfulRating('yes')}>
                      👍 Helpful
                    </button>
                    <button className="helpful-btn" onClick={() => setHelpfulRating('no')}>
                      👎 Needs improvement
                    </button>
                  </div>
                )}
              </div>

              {/* Share & Bookmark Bar */}
              <div className="blog-share-row">
                <button
                  className={`blog-large-action-btn ${isBookmarked ? 'bookmarked' : ''}`}
                  onClick={(e) => toggleBookmark(e, active._id)}
                >
                  {isBookmarked ? '🔖 Article Saved in Bookmarks' : '🔖 Bookmark this Article'}
                </button>
                <button
                  className="blog-large-action-btn like-btn"
                  onClick={(e) => handleLike(e, active._id, active.likes)}
                >
                  ❤️ Appreciate ({currentLikes})
                </button>
                <button className="blog-large-action-btn" onClick={() => handleShare(active)}>
                  🔗 Share Link
                </button>
              </div>
            </div>

            {/* Author Bio Box */}
            <div className="blog-author-bio-card">
              <div className="blog-meta-avatar-large">{authorInitials}</div>
              <div>
                <h4 className="author-bio-name">{active.author || 'BhasaHub Editorial Team'}</h4>
                <p className="author-bio-text">
                  {active.authorRole || 'Dedicated to crafting high-yield language learning guides, phonetics breakdowns, and cultural deep dives for Mandarin and Devanagari scholars.'}
                </p>
              </div>
            </div>

            {/* Related Articles Section */}
            {relatedArticles.length > 0 && (
              <div className="related-articles-section">
                <h3 className="section-subheading">Related Articles in {category}</h3>
                <div className="related-grid">
                  {relatedArticles.map((rel) => {
                    const rCat = getCategory(rel);
                    const rStyle = getCategoryColor(rCat);
                    return (
                      <div key={rel._id} className="related-card" onClick={() => setActive(rel)}>
                        <div className="related-card-badge" style={{ background: rStyle.bg, color: rStyle.color }}>
                          {rCat}
                        </div>
                        <h4 className="related-card-title">{rel.title}</h4>
                        <p className="related-card-desc">{stripTags(rel.body).slice(0, 90)}…</p>
                        <span className="related-read-more">Read Story →</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // -------------------------------------------------------------
  // BLOG GRID & DISCOVERY MAIN VIEW
  // -------------------------------------------------------------
  return (
    <section className="blog-page-container container">
      {toast && <div className="blog-toast">{toast}</div>}

      {/* Top Header & Breadcrumb */}
      <div className="blog-header-top">
        <button className="back-btn" onClick={onBack}>
          ← Back to home
        </button>
        <span className="blog-badge-pill">✨ MODERN LANGUAGE PERSPECTIVES</span>
      </div>

      {/* Hero Title Section */}
      <div className="blog-hero-section">
        <h1 className="blog-hero-title">
          BhasaHub <span>Journal & Insights</span>
        </h1>
        <p className="blog-hero-subtitle">
          Master Mandarin phonetics, explore Devanagari linguistic connections, HSK 3.0 exam strategy, and Asian cultural heritage.
        </p>

        {/* Live Search & Sorting Control Bar */}
        <div className="blog-controls-bar">
          <div className="blog-search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="blog-search-input"
              placeholder="Search articles by title, keyword, category, or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                ✕
              </button>
            )}
          </div>

          <div className="blog-sort-box">
            <label htmlFor="blog-sort-select">Sort by:</label>
            <select
              id="blog-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="blog-sort-select"
            >
              <option value="newest">Latest Articles</option>
              <option value="popular">Most Popular</option>
              <option value="readTime">Longest Read</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="blog-categories-wrapper">
          <div className="blog-categories-scroll">
            {CATEGORIES.map((cat) => {
              const count = getCategoryCount(cat);
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  className={`category-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <span>{cat}</span>
                  <span className="category-pill-count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Bookmarks Toggle Pill */}
          <button
            className={`bookmark-toggle-pill ${onlyBookmarks ? 'active' : ''}`}
            onClick={() => setOnlyBookmarks(!onlyBookmarks)}
            title="Filter bookmarked articles"
          >
            🔖 Bookmarks ({bookmarkedIds.length})
          </button>
        </div>
      </div>

      {loading && (
        <div className="blog-loading-state">
          <div className="spinner-ring" />
          <p>Loading curated insights...</p>
        </div>
      )}

      {!loading && sortedBlogs.length === 0 && (
        <div className="blog-empty-state">
          <span className="empty-icon">🔎</span>
          <h3>No articles found</h3>
          <p>We couldn’t find any articles matching your search query or active category filters.</p>
          <button
            className="reset-filters-btn"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setOnlyBookmarks(false);
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {!loading && sortedBlogs.length > 0 && (
        <>
          {/* 1. Featured Banner Post */}
          {featuredPost && (
            <div className="featured-blog-card" onClick={() => setActive(featuredPost)}>
              <div className="featured-blog-media">
                {featuredPost.image ? (
                  <img
                    className="featured-blog-img"
                    src={resolveImageUrl(featuredPost.image)}
                    alt={featuredPost.title}
                  />
                ) : (
                  <div className="blog-card-glyph featured-glyph">
                    <span>✍️</span>
                    <span className="glyph-sub">Featured Story</span>
                  </div>
                )}
                <span className="featured-ribbon">🔥 FEATURED ARTICLE</span>
              </div>

              <div className="featured-blog-content">
                <div className="featured-meta-header">
                  <span
                    className="blog-category-badge"
                    style={getCategoryColor(getCategory(featuredPost))}
                  >
                    {getCategory(featuredPost)}
                  </span>
                  <span className="featured-read-time">
                    ⏱ {featuredPost.readTimeMin || getReadTime(featuredPost.body)} min read
                  </span>
                </div>

                <h2 className="featured-blog-title">{featuredPost.title}</h2>
                <p className="featured-blog-desc">
                  {stripTags(featuredPost.body).slice(0, 190)}…
                </p>

                <div className="blog-meta-flex">
                  <div className="blog-meta-avatar">{getInitials(featuredPost.author)}</div>
                  <div className="blog-meta-details">
                    <span className="blog-meta-author">{featuredPost.author || 'BhasaHub Educator'}</span>
                    <span className="blog-meta-date">
                      {new Date(featuredPost.createdAt || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="featured-card-actions">
                    <button
                      className={`card-bookmark-btn ${bookmarkedIds.includes(featuredPost._id) ? 'bookmarked' : ''}`}
                      onClick={(e) => toggleBookmark(e, featuredPost._id)}
                      title="Bookmark story"
                    >
                      {bookmarkedIds.includes(featuredPost._id) ? '🔖' : '🏷️'}
                    </button>
                    <span className="read-cta">Read Article →</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Regular Grid Posts */}
          {regularPosts.length > 0 && (
            <div className="blog-grid-section">
              <div className="blog-section-header">
                <h3 className="blog-grid-title">All Articles</h3>
                <span className="blog-results-counter">
                  Showing {regularPosts.length + 1} articles
                </span>
              </div>

              <div className="blog-grid">
                {regularPosts.map((b) => {
                  const preview = stripTags(b.body);
                  const category = getCategory(b);
                  const catStyle = getCategoryColor(category);
                  const readTime = b.readTimeMin || getReadTime(b.body);
                  const isBookmarked = bookmarkedIds.includes(b._id);
                  const likesCount = (b.likes || 0) + (likesMap[b._id] || 0);

                  return (
                    <div className="blog-card" key={b._id} onClick={() => setActive(b)}>
                      <div className="blog-card-img-wrapper">
                        {b.image ? (
                          <img
                            className="blog-card-img"
                            src={resolveImageUrl(b.image)}
                            alt={b.title}
                          />
                        ) : (
                          <div className="blog-card-glyph">
                            <span>📝</span>
                          </div>
                        )}
                        <span
                          className="blog-card-tag"
                          style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            color: catStyle.color,
                            borderColor: catStyle.border
                          }}
                        >
                          {category}
                        </span>

                        <button
                          className={`blog-card-bookmark-icon ${isBookmarked ? 'bookmarked' : ''}`}
                          onClick={(e) => toggleBookmark(e, b._id)}
                          title={isBookmarked ? 'Remove bookmark' : 'Save bookmark'}
                        >
                          {isBookmarked ? '🔖' : '📑'}
                        </button>
                      </div>

                      <div className="blog-card-body">
                        <div className="blog-card-top-info">
                          <span className="blog-card-date">
                            {new Date(b.createdAt || Date.now()).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="blog-card-readtime">⏱ {readTime} min</span>
                        </div>

                        <h4 className="blog-card-title">{b.title}</h4>
                        <p className="blog-card-desc">
                          {preview.slice(0, 110)}
                          {preview.length > 110 ? '…' : ''}
                        </p>

                        <div className="blog-card-footer">
                          <div className="blog-meta-flex">
                            <div className="blog-meta-avatar small">{getInitials(b.author)}</div>
                            <span className="blog-meta-author small">{b.author || 'Educator'}</span>
                          </div>

                          <div className="blog-card-stats">
                            <span className="stat-item" onClick={(e) => handleLike(e, b._id, b.likes)}>
                              ❤️ {likesCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Newsletter Subscription Footer Card */}
      <div className="blog-newsletter-card">
        <div className="newsletter-content">
          <span className="newsletter-badge">📬 BHASAHUB NEWSLETTER</span>
          <h2>Enhance Your Daily Language Mastery</h2>
          <p>Get weekly Mandarin grammar breakdowns, Devanagari root analysis, and HSK exam tips delivered to your inbox.</p>
        </div>

        {newsletterSubscribed ? (
          <div className="newsletter-success">
            <span>🎉</span>
            <p>You're subscribed! Check your inbox for our latest language guides.</p>
          </div>
        ) : (
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              required
              placeholder="Enter your email address..."
              className="newsletter-input"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
            />
            <button type="submit" className="newsletter-submit-btn">
              Subscribe Free
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default BlogPage;