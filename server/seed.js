const mongoose = require('mongoose');
const Course = require('./models/Course');
const Lesson = require('./models/Lesson');
const Vocabulary = require('./models/Vocabulary');

const lessons = [
  {
    title: 'Greetings & People',
    words: [
      ['你好', 'nǐ hǎo', 'hello'],
      ['谢谢', 'xiè xie', 'thank you'],
      ['不客气', 'bú kè qi', "you're welcome"],
      ['再见', 'zài jiàn', 'goodbye'],
      ['对不起', 'duì bu qǐ', 'sorry'],
      ['没关系', 'méi guān xi', "it's okay / no problem"],
      ['请', 'qǐng', 'please'],
      ['喂', 'wèi', 'hello (on the phone)'],
      ['我', 'wǒ', 'I, me'],
      ['你', 'nǐ', 'you'],
      ['他', 'tā', 'he, him'],
      ['她', 'tā', 'she, her'],
      ['我们', 'wǒ men', 'we, us'],
      ['人', 'rén', 'person'],
      ['名字', 'míng zi', 'name'],
      ['朋友', 'péng you', 'friend'],
      ['老师', 'lǎo shī', 'teacher'],
      ['学生', 'xué sheng', 'student'],
      ['同学', 'tóng xué', 'classmate'],
      ['先生', 'xiān sheng', 'Mr., sir'],
      ['小姐', 'xiǎo jiě', 'Miss, young lady'],
      ['医生', 'yī shēng', 'doctor'],
    ],
  },
  {
    title: 'Numbers & Time',
    words: [
      ['一', 'yī', 'one'],
      ['二', 'èr', 'two'],
      ['三', 'sān', 'three'],
      ['四', 'sì', 'four'],
      ['五', 'wǔ', 'five'],
      ['六', 'liù', 'six'],
      ['七', 'qī', 'seven'],
      ['八', 'bā', 'eight'],
      ['九', 'jiǔ', 'nine'],
      ['十', 'shí', 'ten'],
      ['零', 'líng', 'zero'],
      ['岁', 'suì', 'years old'],
      ['号', 'hào', 'date, number'],
      ['月', 'yuè', 'month'],
      ['年', 'nián', 'year'],
      ['星期', 'xīng qī', 'week'],
      ['今天', 'jīn tiān', 'today'],
      ['明天', 'míng tiān', 'tomorrow'],
      ['昨天', 'zuó tiān', 'yesterday'],
      ['现在', 'xiàn zài', 'now'],
      ['时候', 'shí hou', 'time, moment'],
      ['点', 'diǎn', "o'clock"],
      ['分钟', 'fēn zhōng', 'minute'],
      ['上午', 'shàng wǔ', 'morning'],
      ['中午', 'zhōng wǔ', 'noon'],
      ['下午', 'xià wǔ', 'afternoon'],
    ],
  },
  {
    title: 'Family & Everyday Things',
    words: [
      ['爸爸', 'bà ba', 'dad'],
      ['妈妈', 'mā ma', 'mom'],
      ['儿子', 'ér zi', 'son'],
      ['女儿', 'nǚ ér', 'daughter'],
      ['家', 'jiā', 'home, family'],
      ['狗', 'gǒu', 'dog'],
      ['猫', 'māo', 'cat'],
      ['东西', 'dōng xi', 'thing, stuff'],
      ['书', 'shū', 'book'],
      ['桌子', 'zhuō zi', 'table'],
      ['椅子', 'yǐ zi', 'chair'],
      ['杯子', 'bēi zi', 'cup, glass'],
      ['衣服', 'yī fu', 'clothes'],
      ['电脑', 'diàn nǎo', 'computer'],
      ['电视', 'diàn shì', 'television'],
      ['电影', 'diàn yǐng', 'movie'],
      ['钱', 'qián', 'money'],
      ['字', 'zì', 'character, word'],
      ['汉语', 'Hàn yǔ', 'Chinese language'],
    ],
  },
  {
    title: 'Food & Drink',
    words: [
      ['吃', 'chī', 'to eat'],
      ['喝', 'hē', 'to drink'],
      ['米饭', 'mǐ fàn', 'cooked rice'],
      ['菜', 'cài', 'dish, vegetable'],
      ['水果', 'shuǐ guǒ', 'fruit'],
      ['苹果', 'píng guǒ', 'apple'],
      ['茶', 'chá', 'tea'],
      ['水', 'shuǐ', 'water'],
      ['饭店', 'fàn diàn', 'restaurant'],
    ],
  },
  {
    title: 'Places & Getting Around',
    words: [
      ['中国', 'Zhōng guó', 'China'],
      ['北京', 'Běi jīng', 'Beijing'],
      ['学校', 'xué xiào', 'school'],
      ['商店', 'shāng diàn', 'shop, store'],
      ['医院', 'yī yuàn', 'hospital'],
      ['火车站', 'huǒ chē zhàn', 'train station'],
      ['出租车', 'chū zū chē', 'taxi'],
      ['飞机', 'fēi jī', 'airplane'],
      ['这儿', 'zhèr', 'here'],
      ['那儿', 'nàr', 'there'],
      ['哪儿', 'nǎr', 'where'],
      ['上', 'shàng', 'up, on, above'],
      ['下', 'xià', 'down, under, below'],
      ['前面', 'qián miàn', 'front, ahead'],
      ['后面', 'hòu miàn', 'behind'],
      ['里', 'lǐ', 'inside'],
    ],
  },
  {
    title: 'Everyday Verbs',
    words: [
      ['是', 'shì', 'to be'],
      ['有', 'yǒu', 'to have'],
      ['在', 'zài', 'to be at, in'],
      ['看', 'kàn', 'to look, to watch'],
      ['看见', 'kàn jiàn', 'to see'],
      ['听', 'tīng', 'to listen'],
      ['说', 'shuō', 'to speak, to say'],
      ['读', 'dú', 'to read'],
      ['写', 'xiě', 'to write'],
      ['买', 'mǎi', 'to buy'],
      ['做', 'zuò', 'to do, to make'],
      ['坐', 'zuò', 'to sit, to take (transport)'],
      ['住', 'zhù', 'to live (somewhere)'],
      ['学习', 'xué xí', 'to study, to learn'],
      ['工作', 'gōng zuò', 'to work; job'],
      ['睡觉', 'shuì jiào', 'to sleep'],
      ['打电话', 'dǎ diàn huà', 'to make a phone call'],
      ['开', 'kāi', 'to open, to drive'],
      ['来', 'lái', 'to come'],
      ['去', 'qù', 'to go'],
      ['回', 'huí', 'to return'],
      ['想', 'xiǎng', 'to want, to think'],
      ['喜欢', 'xǐ huan', 'to like'],
      ['爱', 'ài', 'to love'],
      ['认识', 'rèn shi', 'to know (a person)'],
      ['会', 'huì', 'can (learned skill)'],
      ['能', 'néng', 'can, to be able to'],
      ['下雨', 'xià yǔ', 'to rain'],
    ],
  },
  {
    title: 'Question Words & Particles',
    words: [
      ['什么', 'shén me', 'what'],
      ['谁', 'shéi', 'who'],
      ['哪', 'nǎ', 'which'],
      ['几', 'jǐ', 'how many (small numbers)'],
      ['多少', 'duō shao', 'how much, how many'],
      ['怎么', 'zěn me', 'how'],
      ['怎么样', 'zěn me yàng', 'how about, how is it'],
      ['吗', 'ma', 'question particle'],
      ['呢', 'ne', 'particle (and you? / softener)'],
      ['的', 'de', 'possessive particle'],
      ['了', 'le', 'particle (completed action)'],
      ['不', 'bù', 'no, not'],
      ['没有', 'méi yǒu', 'to not have; did not'],
      ['和', 'hé', 'and, with'],
      ['都', 'dōu', 'all, both'],
      ['这', 'zhè', 'this'],
      ['那', 'nà', 'that'],
      ['个', 'gè', 'measure word (general)'],
      ['些', 'xiē', 'some, several'],
      ['本', 'běn', 'measure word for books'],
      ['块', 'kuài', 'yuan (money); piece'],
    ],
  },
  {
    title: 'Describing Things',
    words: [
      ['好', 'hǎo', 'good'],
      ['大', 'dà', 'big'],
      ['小', 'xiǎo', 'small'],
      ['多', 'duō', 'many, much'],
      ['少', 'shǎo', 'few, little'],
      ['冷', 'lěng', 'cold'],
      ['热', 'rè', 'hot'],
      ['高兴', 'gāo xìng', 'happy, glad'],
      ['漂亮', 'piào liang', 'pretty, beautiful'],
      ['很', 'hěn', 'very'],
      ['太', 'tài', 'too, excessively'],
      ['一点儿', 'yì diǎnr', 'a little bit'],
      ['天气', 'tiān qì', 'weather'],
    ],
  },
];

async function seed() {
  await mongoose.connect('mongodb://127.0.0.1:27017/language-lms');
  console.log('✅ Connected to MongoDB');

  const course = await Course.findOne({ language: 'chinese' });
  if (!course) {
    console.error('❌ No Chinese course found — create it first in the admin panel.');
    process.exit(1);
  }
  console.log(`📘 Found course: ${course.title}`);

  // Clean slate: remove existing lessons (and their words) for this course
  const oldLessons = await Lesson.find({ course: course._id });
  for (const l of oldLessons) {
    await Vocabulary.deleteMany({ lesson: l._id });
  }
  await Lesson.deleteMany({ course: course._id });
  console.log('🧹 Cleared old lessons for this course');

  let totalWords = 0;
  for (let i = 0; i < lessons.length; i++) {
    const lesson = await Lesson.create({
      course: course._id,
      title: lessons[i].title,
      order: i + 1,
      published: true,
    });
    const docs = lessons[i].words.map(([word, pronunciation, meaning], idx) => ({
      lesson: lesson._id,
      word,
      pronunciation,
      meaning,
      order: idx + 1,
    }));
    await Vocabulary.insertMany(docs);
    totalWords += docs.length;
    console.log(`  📖 Lesson ${i + 1}: ${lessons[i].title} — ${docs.length} words`);
  }

  console.log(`🎉 Done! ${lessons.length} lessons, ${totalWords} words seeded.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});