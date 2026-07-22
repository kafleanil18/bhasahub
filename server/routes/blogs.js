const express = require('express');
const Blog = require('../models/Blog');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLog');

const router = express.Router();

const INITIAL_BLOGS = [
  {
    title: 'Mastering Mandarin Tones: Pitch Contours & Muscle Memory',
    category: 'Pronunciation',
    author: 'Lin Wei',
    published: true,
    image: '/images/blog_tones.jpg',
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
      <p>Isolated tones are easy in drills; real fluency happens when combining tones in pairs (e.g. 1st + 4th tone like <em>bāshì</em> or 3rd + 2nd tone like <em>jǐngchá</em>).</p>
      <blockquote>"Fluency is not about pronouncing every syllable perfectly in isolation, but about maintaining pitch rhythm across full clauses."</blockquote>
    `
  },
  {
    title: 'Devanagari vs. Pinyin: Comparative Phonetic Architecture',
    category: 'Nepali',
    author: 'Anil Karki',
    published: true,
    image: '/images/blog_devanagari.jpg',
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
    `
  },
  {
    title: 'Radicals Unlocked: 214 Keys to Reading Chinese Characters',
    category: 'Characters',
    author: 'Mei Ling',
    published: true,
    image: '/images/blog_radicals.jpg',
    body: `
      <p class="blog-lead">Chinese characters (汉字) are not random collections of strokes. Over 85% of characters are <strong>picto-phonetic compounds</strong> (形声字) consisting of a semantic radical and a phonetic component.</p>
      <h2>1. Common Semantic Radicals</h2>
      <ul>
        <li><strong>氵 (Water - 三点水):</strong> Appears in <em>海 (ocean), 河 (river), 洗 (wash)</em>.</li>
        <li><strong>亻 (Person - 单人旁):</strong> Appears in <em>你 (you), 他 (he), 休 (rest)</em>.</li>
        <li><strong>讠 (Speech - 言字旁):</strong> Appears in <em>说 (speak), 话 (words), 语 (language)</em>.</li>
      </ul>
    `
  },
  {
    title: 'HSK 3.0 Exam Roadmap: Vocabulary & Listening Tactics',
    category: 'HSK Prep',
    author: 'David Chen',
    published: true,
    image: '/images/blog_hsk.jpg',
    body: `
      <p class="blog-lead">The updated HSK 3.0 standard places stronger emphasis on practical communicative ability, handwriting recognition, and nuanced grammar structures.</p>
      <h2>1. Prioritize High-Frequency Collocations</h2>
      <p>Don't memorize isolated words in alphabetical lists. Learn verb + noun pairs and measure words together.</p>
    `
  },
  {
    title: 'The Secret to HSK Vocabulary: Contextual Chunks over Flashcards',
    category: 'HSK Prep',
    author: 'Mei Ling',
    published: true,
    image: '/images/blog_chunks.jpg',
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
    title: 'Demystifying Chinese Sentence Structure: The S-T-L-V-O Rule',
    category: 'Grammar',
    author: 'David Chen',
    published: true,
    image: '/images/blog_grammar.jpg',
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
    title: 'Chinese Character Evolution: From Oracle Bones to Modern Hanzi',
    category: 'Characters',
    author: 'Lin Wei',
    published: true,
    image: '/images/blog_oracle.jpg',
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
    title: 'Transitioning Off Pinyin: 4 Steps to Read Raw Chinese Texts',
    category: 'Language Tips',
    author: 'Anil Karki',
    published: true,
    image: '/images/blog_readpinyin.jpg',
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
    title: 'The Cultural Wisdom of Chengyu: 4-Character Chinese Idioms',
    category: 'Culture',
    author: 'Lin Wei',
    published: true,
    image: '/images/blog_chengyu.jpg',
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

async function ensureSeeded() {
  try {
    for (const b of INITIAL_BLOGS) {
      const existing = await Blog.findOne({ title: b.title });
      if (!existing) {
        await Blog.create(b);
      } else if (existing.image !== b.image) {
        existing.image = b.image;
        await existing.save();
      }
    }
  } catch (err) {
    console.error('Blog auto-seed error:', err);
  }
}

// GET /api/blogs — public: published posts, newest first
router.get('/', async (req, res) => {
  try {
    await ensureSeeded();
    const blogs = await Blog.find({ published: true }).sort({ createdAt: -1 });
    res.json(blogs);
  } catch {
    res.status(500).json({ error: 'Could not load blogs' });
  }
});

// GET /api/blogs/all — super admin only: all posts
router.get('/all', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    await ensureSeeded();
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch {
    res.status(500).json({ error: 'Could not load blogs' });
  }
});

// GET /api/blogs/:id — public: one post
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Post not found' });
    res.json(blog);
  } catch {
    res.status(500).json({ error: 'Could not load post' });
  }
});

// POST /api/blogs — super admin only: create blog
router.post('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const blogData = {
      ...req.body,
      published: req.body.published !== undefined ? req.body.published : true,
    };
    const blog = await Blog.create(blogData);
    logActivity(req, { action: 'create', resourceType: 'blog', resourceId: blog._id, label: blog.title });
    res.status(201).json(blog);
  } catch {
    res.status(500).json({ error: 'Could not create post' });
  }
});

// PUT /api/blogs/:id — super admin only: update blog
router.put('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!blog) return res.status(404).json({ error: 'Post not found' });
    logActivity(req, { action: 'update', resourceType: 'blog', resourceId: blog._id, label: blog.title });
    res.json(blog);
  } catch {
    res.status(500).json({ error: 'Could not update post' });
  }
});

// DELETE /api/blogs/:id — super admin only: delete blog
router.delete('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (blog) logActivity(req, { action: 'delete', resourceType: 'blog', resourceId: blog._id, label: blog.title });
    res.json({ message: 'Post deleted' });
  } catch {
    res.status(500).json({ error: 'Could not delete post' });
  }
});

module.exports = router;