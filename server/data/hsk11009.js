// Questions transcribed from the user-supplied H11009试题.pdf; answers from H11009答案.pdf;
// listening text from H11009听力文本.pdf; recording "HSK1 - H11009.mp3" supplied by the user.
// Pictures are cut out of the booklet for now (see docs/h11009-test-portal.md).
const asset = name => `/hsk1/h11009/${name}.jpg`;
const letters = count => Array.from({ length: count }, (_, i) => ({ text: String.fromCharCode(65 + i) }));
const word = (text, pinyin) => ({ text, pinyin });
const trueFalse = [{ text: '✓ Matches' }, { text: '✕ Does not match' }];

const groups = [
  { id: 'l1', section: 'listening', title: 'Part 1 · Listen & match', instruction: 'Listen to each phrase twice. Does it match the picture?',
    example: '很高兴 (hěn gāoxìng, very happy) matches the smiling woman (✓). 看电影 (kàn diànyǐng, watch a film) does not match the man reading a newspaper (✕).',
    exampleImage: asset('l1-example'), exampleImageAlt: 'Illustrations: a smiling woman with a checkmark and a man reading a newspaper with a cross.',
    questions: [
      { number: 1, image: asset('l1-1'), options: trueFalse, correctIndex: 1, listeningText: '写名字', explanation: '写名字 means write a name, but the hand is holding chopsticks.' },
      { number: 2, image: asset('l1-2'), options: trueFalse, correctIndex: 1, listeningText: '一本书', explanation: '一本书 means one book, but the picture shows a whole stack of books.' },
      { number: 3, image: asset('l1-3'), options: trueFalse, correctIndex: 0, listeningText: '我的狗', explanation: '我的狗 means my dog; the girl is hugging her dog.' },
      { number: 4, image: asset('l1-4'), options: trueFalse, correctIndex: 1, listeningText: '学电脑', explanation: '学电脑 means learn computers, but he is using an abacus.' },
      { number: 5, image: asset('l1-5'), options: trueFalse, correctIndex: 0, listeningText: '中国人', explanation: '中国人 means Chinese person; the girl is waving Chinese flags.' },
    ] },
  { id: 'l2', section: 'listening', title: 'Part 2 · Choose a picture', instruction: 'Listen to each sentence twice. Choose the matching picture: A, B, or C.',
    example: '这是我的书。 (Zhè shì wǒ de shū.) → A · These are my books. B shows a telephone; C shows apples.',
    exampleImage: asset('l2-example'), exampleImageAlt: 'Example illustrations: A books with a checkmark, B a telephone, C apples.',
    questions: [
      { number: 6, image: asset('l2-6'), options: letters(3), correctIndex: 0, listeningText: '那儿有三个杯子。', explanation: '“There are three cups over there.” A shows the cups.' },
      { number: 7, image: asset('l2-7'), options: letters(3), correctIndex: 1, listeningText: '你喝水吗？', explanation: '“Would you like some water?” B shows a girl holding a bottle of water.' },
      { number: 8, image: asset('l2-8'), options: letters(3), correctIndex: 0, listeningText: '北京现在的天气很冷。', explanation: '“It is very cold in Beijing now.” A shows a woman in a hat and scarf.' },
      { number: 9, image: asset('l2-9'), options: letters(3), correctIndex: 2, listeningText: '王先生和我爸爸是好朋友。', explanation: '“Mr Wang and my dad are good friends.” C shows two men shaking hands.' },
      { number: 10, image: asset('l2-10'), options: letters(3), correctIndex: 1, listeningText: '你认识这个字吗？', explanation: '“Do you know this character?” B shows two people looking at writing on a page.' },
    ] },
  { id: 'l3', section: 'listening', title: 'Part 3 · Match the dialogues', instruction: 'Listen to each dialogue twice. Choose its picture from A–F. Picture C is used in the example.',
    image: asset('l3-pictures'), imageCaption: 'Choices A–F in the original paper order.',
    example: '女：你好！男：你好！很高兴认识你。 (Nǐ hǎo! Hěn gāoxìng rènshi nǐ.) → C · Two people greeting each other.',
    questions: [
      { number: 11, options: letters(6), correctIndex: 0, listeningText: '男：我喜欢吃这个菜。\n女：好，那我们多买一些。', explanation: '“I like eating this vegetable.” A shows a fresh green vegetable.' },
      { number: 12, options: letters(6), correctIndex: 1, listeningText: '女：现在几点了？\n男：现在是下午五点。', explanation: '“It is five in the afternoon.” B shows a man holding a clock at five.' },
      { number: 13, options: letters(6), correctIndex: 4, listeningText: '男：这个人是谁？\n女：她是我大学的同学。', explanation: '“Who is this?” — “My university classmate.” E shows a woman holding a photo.' },
      { number: 14, options: letters(6), correctIndex: 3, listeningText: '女：这上面没写吗？\n男：写了，你看，在这儿。', explanation: '“Isn’t it written on here?” D shows two people reading the label on a bottle.' },
      { number: 15, options: letters(6), correctIndex: 5, listeningText: '男：喂，你睡觉了吗？\n女：没呢，我在学习。', explanation: '“Are you asleep?” — “No, I’m studying.” F shows a woman on the phone at her desk.' },
    ] },
  { id: 'l4', section: 'listening', title: 'Part 4 · Listen & answer', instruction: 'Listen to each short passage and question twice. Choose the best answer.',
    example: '下午我去商店，我想买一些水果。 (Xiàwǔ wǒ qù shāngdiàn, wǒ xiǎng mǎi yìxiē shuǐguǒ.)\n问：他下午去哪里？ (Tā xiàwǔ qù nǎlǐ?)\nA 商店 (shāngdiàn) ✓ · B 医院 (yīyuàn) · C 学校 (xuéxiào)\nAnswer: A · He is going to the shop to buy fruit.',
    questions: [
      { number: 16, options: [word('学生', 'xuésheng'), word('老师', 'lǎoshī'), word('医生', 'yīshēng')], correctIndex: 2, listeningText: '这是我妈妈，她在医院工作。\n问：他妈妈是做什么的？', explanation: 'His mother works in a hospital, so she is a doctor: C.' },
      { number: 17, options: [word('开车', 'kāi chē'), word('坐飞机', 'zuò fēijī'), word('坐出租车', 'zuò chūzūchē')], correctIndex: 2, listeningText: '下雨了，我坐出租车回家。\n问：他怎么回家？', explanation: 'It is raining, so he takes a taxi home: C.' },
      { number: 18, options: [word('4个', 'sì ge'), word('6个', 'liù ge'), word('7分钟', 'qī fēnzhōng')], correctIndex: 0, listeningText: '我打了四个电话，不是三个。\n问：他打了几个电话？', explanation: 'He made four phone calls, not three: A.' },
      { number: 19, options: [word('很高兴', 'hěn gāoxìng'), word('很漂亮', 'hěn piàoliang'), word('爱说话', 'ài shuōhuà')], correctIndex: 1, listeningText: '女儿说我今天很漂亮，我很高兴。\n问：女儿说她今天怎么样？', explanation: 'Her daughter said she looks very pretty today: B.' },
      { number: 20, options: [word('饭馆儿', 'fànguǎnr'), word('茶馆儿', 'cháguǎnr'), word('火车站', 'huǒchēzhàn')], correctIndex: 2, listeningText: '李小姐去火车站了，你没看见她？\n问：李小姐去哪儿了？', explanation: 'Miss Li has gone to the train station: C.' },
    ] },
  { id: 'r1', section: 'reading', title: 'Part 1 · Words & pictures', instruction: 'Does the word match the picture? Choose matches or does not match.',
    example: '电视 (diànshì, television) does not match the laptop (✕). 飞机 (fēijī, airplane) matches the airplane (✓).',
    exampleImage: asset('r1-example'), exampleImageAlt: 'Illustrations: a laptop with a cross and an airplane with a checkmark.',
    questions: [
      { number: 21, text: '那里', pinyin: 'nàlǐ', image: asset('r1-21'), options: trueFalse, correctIndex: 0, explanation: '那里 means over there; the man is pointing into the distance.' },
      { number: 22, text: '苹果', pinyin: 'píngguǒ', image: asset('r1-22'), options: trueFalse, correctIndex: 1, explanation: '苹果 means apple, but the picture shows a watermelon.' },
      { number: 23, text: '听', pinyin: 'tīng', image: asset('r1-23'), options: trueFalse, correctIndex: 0, explanation: '听 means listen; the hand is cupped behind an ear.' },
      { number: 24, text: '桌子', pinyin: 'zhuōzi', image: asset('r1-24'), options: trueFalse, correctIndex: 1, explanation: '桌子 means table, but the picture shows a chair.' },
      { number: 25, text: '叫', pinyin: 'jiào', image: asset('r1-25'), options: trueFalse, correctIndex: 0, explanation: '叫 means call out; the girl is shouting through a megaphone.' },
    ] },
  { id: 'r2', section: 'reading', title: 'Part 2 · Match sentences to pictures', instruction: 'Choose the matching picture from A–F. Picture E is used in the example.',
    image: asset('r2-pictures'), imageCaption: 'Choices A–F in the original paper order. E is the worked example.',
    example: '我很喜欢这本书。 (Wǒ hěn xǐhuan zhè běn shū.) → E · I like this book very much.',
    questions: [
      { number: 26, text: '是他？他怎么住在这儿？', pinyin: 'Shì tā? Tā zěnme zhù zài zhèr?', options: letters(6), correctIndex: 1, explanation: '“It’s him? How come he lives here?” B shows a woman looking puzzled.' },
      { number: 27, text: '她中午请朋友吃饭。', pinyin: 'Tā zhōngwǔ qǐng péngyou chī fàn.', options: letters(6), correctIndex: 5, explanation: '“She is treating a friend to lunch.” F shows two people eating together.' },
      { number: 28, text: '再见，我们2011年7月见。', pinyin: 'Zàijiàn, wǒmen 2011 nián 7 yuè jiàn.', options: letters(6), correctIndex: 2, explanation: '“Goodbye, see you in July 2011.” C shows two people shaking hands.' },
      { number: 29, text: '我在前面，她在后面。', pinyin: 'Wǒ zài qiánmiàn, tā zài hòumiàn.', options: letters(6), correctIndex: 0, explanation: '“I’m in front, she’s behind.” A shows one person standing behind the other.' },
      { number: 30, text: '没关系，我的东西不多，很少。', pinyin: 'Méi guānxi, wǒ de dōngxi bù duō, hěn shǎo.', options: letters(6), correctIndex: 3, explanation: '“It’s fine, I don’t have many things.” D shows a woman resting beside a few boxes.' },
    ] },
  { id: 'r3', section: 'reading', title: 'Part 3 · Match questions & replies', instruction: 'Choose the reply that best completes each exchange. Reply F is used in the example.',
    example: '你喝水吗？ (Nǐ hē shuǐ ma?) → F · 好的，谢谢！ (Hǎo de, xièxie!)',
    choices: [word('太小了。', 'Tài xiǎo le.'), word('我不会。', 'Wǒ bú huì.'), word('不，下星期。', 'Bù, xià xīngqī.'), word('商店。', 'Shāngdiàn.'), word('90块。', 'Jiǔshí kuài.'), word('好的，谢谢！', 'Hǎo de, xièxie!')],
    questions: [
      { number: 31, text: '你明天来北京？', pinyin: 'Nǐ míngtiān lái Běijīng?', options: letters(6), correctIndex: 2, explanation: '“You’re coming to Beijing tomorrow?” — “No, next week.” Choose C.' },
      { number: 32, text: '那个椅子多少钱？', pinyin: 'Nàge yǐzi duōshao qián?', options: letters(6), correctIndex: 4, explanation: '“How much is that chair?” — “90 yuan.” Choose E.' },
      { number: 33, text: '“热”字怎么写？', pinyin: '“Rè” zì zěnme xiě?', options: letters(6), correctIndex: 1, explanation: '“How do you write the character 热?” — “I can’t.” Choose B.' },
      { number: 34, text: '你上午去哪儿了？', pinyin: 'Nǐ shàngwǔ qù nǎr le?', options: letters(6), correctIndex: 3, explanation: '“Where did you go this morning?” — “The shop.” Choose D.' },
      { number: 35, text: '这个衣服怎么样？', pinyin: 'Zhège yīfu zěnmeyàng?', options: letters(6), correctIndex: 0, explanation: '“How are these clothes?” — “Too small.” Choose A.' },
    ] },
  { id: 'r4', section: 'reading', title: 'Part 4 · Fill in the missing word', instruction: 'Choose a word from A–F to fill each blank. Word D is used in the example.',
    example: '你叫什么（D）？ (Nǐ jiào shénme míngzi?) · D = 名字 (míngzi, name)',
    choices: [word('哪', 'nǎ'), word('在', 'zài'), word('想', 'xiǎng'), word('名字', 'míngzi'), word('读', 'dú'), word('岁', 'suì')],
    questions: [
      { number: 36, text: '他儿子今年28（　），在学习汉语。', pinyin: 'Tā érzi jīnnián 28 ( ), zài xuéxí Hànyǔ.', options: letters(6), correctIndex: 5, explanation: '“His son is 28 years old this year and is studying Chinese.” 岁 counts years of age. Choose F.' },
      { number: 37, text: '对不起，我不（　）看电视，我能去看电影吗？', pinyin: 'Duìbuqǐ, wǒ bù ( ) kàn diànshì, wǒ néng qù kàn diànyǐng ma?', options: letters(6), correctIndex: 2, explanation: '“Sorry, I don’t want to watch TV; can I go and see a film?” 想 means want to. Choose C.' },
      { number: 38, text: '昨天的这个时候，我（　）飞机上。', pinyin: 'Zuótiān de zhège shíhou, wǒ ( ) fēijī shang.', options: letters(6), correctIndex: 1, explanation: '“At this time yesterday, I was on the plane.” 在 means be at. Choose B.' },
      { number: 39, text: '女：你喜欢（　）个猫？\n男：都喜欢。', pinyin: 'Nǚ: Nǐ xǐhuan ( ) ge māo?\nNán: Dōu xǐhuan.', options: letters(6), correctIndex: 0, explanation: '“Which cat do you like?” — “I like them all.” 哪 means which. Choose A.' },
      { number: 40, text: '男：这几个字怎么（　）？\n女：这是“米”“日”，这是“不客气”的“气”。', pinyin: 'Nán: Zhè jǐ ge zì zěnme ( )?\nNǚ: Zhè shì “mǐ” “rì”, zhè shì “bú kèqi” de “qì”.', options: letters(6), correctIndex: 4, explanation: '“How do you read these characters?” 读 means read aloud. Choose E.' },
    ] },
];

module.exports = { id: 'h11009', code: 'H11009', title: 'HSK 1 · H11009', audioUrl: '/hsk1/h11009/listening.mp3', listeningSeconds: 935, transferSeconds: 180, readingSeconds: 1020,
  // Hidden from students until the cut-out pictures are replaced with new illustrations; staff can
  // preview and publish it under Manage tests.
  publishedByDefault: false, groups };
