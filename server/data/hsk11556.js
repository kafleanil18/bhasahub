// Transcribed from the user-supplied H11556 PDF and recording.
// The PDF is a scanned 40-question paper and does not include a separate key;
// listening items below are keyed from the recording and reading items from the printed prompts.
const asset = name => `/hsk1/h11556/${name}.jpg`;
const letters = count => Array.from({ length: count }, (_, i) => ({ text: String.fromCharCode(65 + i) }));
const word = (text, pinyin) => ({ text, pinyin });
const trueFalse = [{ text: '✓ Matches' }, { text: '✕ Does not match' }];

const groups = [
  { id: 'l1', section: 'listening', title: 'Part 1 · Listen & match', instruction: 'Listen to each phrase twice. Does it match the picture?',
    example: '很高兴 (hěn gāoxìng, very happy) matches the smiling woman (✓). 看电影 (kàn diànyǐng, watch a film) does not match the man reading a newspaper (✕).',
    exampleImage: asset('l1-example'), exampleImageAlt: 'Illustrated examples: a smiling woman marked correct and a man reading a newspaper marked incorrect.',
    questions: [
      { number: 1, image: asset('l1-1'), options: trueFalse, correctIndex: 1, listeningText: '一杯水。', explanation: '一杯水 means “a glass of water”; the picture shows coins, not a glass of water.' },
      { number: 2, image: asset('l1-2'), options: trueFalse, correctIndex: 1, listeningText: '读书。', explanation: '读书 means “read a book”; the man is taking a photograph.' },
      { number: 3, image: asset('l1-3'), options: trueFalse, correctIndex: 0, listeningText: '七号。', explanation: '七号 means “number seven”; the player’s shirt shows number 7.' },
      { number: 4, image: asset('l1-4'), options: trueFalse, correctIndex: 0, listeningText: '在医院。', explanation: '在医院 means “at the hospital”; the picture shows a doctor examining a child.' },
      { number: 5, image: asset('l1-5'), options: trueFalse, correctIndex: 0, listeningText: '很多人。', explanation: '很多人 means “many people”; the picture shows a large group.' },
    ] },
  { id: 'l2', section: 'listening', title: 'Part 2 · Choose a picture', instruction: 'Listen to each sentence twice. Choose the matching picture: A, B, or C.',
    example: '这是我的书。 (Zhè shì wǒ de shū.) → A · The books match. B shows a telephone; C shows apples.',
    exampleImage: asset('l2-example'), exampleImageAlt: 'Illustrated example choices: A books marked correct, B a telephone, and C apples.',
    questions: [
      { number: 6, image: asset('l2-6'), options: letters(3), correctIndex: 0, listeningText: '先生，请喝茶。', explanation: '先生，请喝茶 means “Sir, please have some tea.” Picture A shows a cup being offered.' },
      { number: 7, image: asset('l2-7'), options: letters(3), correctIndex: 2, listeningText: '桌子上有你爱吃的水果。', explanation: '“There is fruit you like on the table.” Picture C shows sliced fruit.' },
      { number: 8, image: asset('l2-8'), options: letters(3), correctIndex: 2, listeningText: '对不起，我听不见。', explanation: '“Sorry, I can’t hear.” Picture C shows someone cupping a hand to their ear.' },
      { number: 9, image: asset('l2-9'), options: letters(3), correctIndex: 0, listeningText: '那个杯子是你的。', explanation: '“That cup is yours.” Picture A shows cups.' },
      { number: 10, image: asset('l2-10'), options: letters(3), correctIndex: 2, listeningText: '医生，我的猫怎么样了？', explanation: '“Doctor, how is my cat?” Picture C shows a woman holding a cat.' },
    ] },
  { id: 'l3', section: 'listening', title: 'Part 3 · Match the dialogues', instruction: 'Listen to each dialogue twice. Choose its picture from A–F. Picture C is used in the example.',
    image: asset('l3-pictures'), imageCaption: 'Illustrated picture choices A–F. Match each dialogue to a picture.',
    example: '女：你好！男：你好！很高兴认识你。 (Nǐ hǎo! Hěn gāoxìng rènshi nǐ.) → C · Two people greeting each other.',
    questions: [
      { number: 11, options: letters(6), correctIndex: 0, listeningText: '你看见我的衣服了吗？在椅子上呢。', explanation: '“Have you seen my clothes?” — “They’re on the chair.” Picture A shows clothing draped over a chair.' },
      { number: 12, options: letters(6), correctIndex: 1, listeningText: '这些苹果多少钱？九块八。', explanation: '“How much are these apples?” — “Nine yuan eighty.” Picture B shows apples on a scale.' },
      { number: 13, options: letters(6), correctIndex: 4, listeningText: '下雨了，你怎么回去？没关系，我去前面坐出租车。', explanation: '“It’s raining. How will you get back?” — “It’s OK. I’ll take a taxi up ahead.” Picture E shows a woman getting into a car in the rain.' },
      { number: 14, options: letters(6), correctIndex: 5, listeningText: '喂，你睡觉了吗？没有，我在看电视呢。', explanation: '“Hello, are you asleep?” — “No, I’m watching TV.” Picture F shows a man relaxing with a remote control.' },
      { number: 15, options: letters(6), correctIndex: 3, listeningText: '名字和电话都写在上面了。是的。', explanation: '“The name and phone number are both written on it.” Picture D shows someone handing over a note.' },
    ] },
  { id: 'l4', section: 'listening', title: 'Part 4 · Listen & answer', instruction: 'Listen to each short passage and question twice. Choose the best answer.',
    example: '下午我去商店，我想买一些水果。 (Xiàwǔ wǒ qù shāngdiàn, wǒ xiǎng mǎi yìxiē shuǐguǒ.)\n问：他下午去哪里？(Tā xiàwǔ qù nǎlǐ?)\nA 商店 (shāngdiàn) ✓ · B 医院 (yīyuàn) · C 学校 (xuéxiào)\nAnswer: A · He is going to the shop to buy fruit.',
    questions: [
      { number: 16, options: [word('14:40', ''), word('15:20', ''), word('16:20', '')], correctIndex: 1, listeningText: '现在三点。小王说，他二十分钟后来。问：小王几点来？', explanation: 'It is 3:00 now, and Xiao Wang will come in 20 minutes: 15:20. Choose B.' },
      { number: 17, options: [word('学汉语', 'xué Hànyǔ'), word('打电话', 'dǎ diànhuà'), word('看电影', 'kàn diànyǐng')], correctIndex: 0, listeningText: '我儿子今年十岁，很喜欢学汉语。问：他儿子喜欢做什么？', explanation: 'The son likes studying Chinese: 学汉语. Choose A.' },
      { number: 18, options: [word('开车', 'kāi chē'), word('坐飞机', 'zuò fēijī'), word('坐出租车', 'zuò chūzūchē')], correctIndex: 1, listeningText: '我下星期坐飞机去北京。问：他怎么去北京？', explanation: 'He will go to Beijing by plane: 坐飞机. Choose B.' },
      { number: 19, options: [word('太大', 'tài dà'), word('很漂亮', 'hěn piàoliang'), word('有点儿小', 'yǒudiǎnr xiǎo')], correctIndex: 1, listeningText: '这是你的电脑，很漂亮。问：那个电脑怎么样？', explanation: 'The computer is described as 很漂亮, “very beautiful”. Choose B.' },
      { number: 20, options: [word('李小姐', 'Lǐ xiǎojiě'), word('王医生', 'Wáng yīshēng'), word('李先生', 'Lǐ xiānsheng')], correctIndex: 2, listeningText: '我和李先生认识五年了。问：他和谁认识五年了？', explanation: 'The speaker and Mr. Li have known each other for five years. Choose C, 李先生.' },
    ] },
  { id: 'r1', section: 'reading', title: 'Part 1 · Words & pictures', instruction: 'Does the word match the picture? Choose matches or does not match.',
    example: '电视 (diànshì, television) does not match the laptop (✕). 飞机 (fēijī, airplane) matches the airplane (✓).',
    exampleImage: asset('r1-example'), exampleImageAlt: 'Illustrated examples: a laptop marked incorrect and an airplane marked correct.',
    questions: [
      { number: 21, text: '六', pinyin: 'liù', image: asset('r1-21'), options: trueFalse, correctIndex: 0, explanation: '六 means “six”; the picture shows six pieces of fruit.' },
      { number: 22, text: '冷', pinyin: 'lěng', image: asset('r1-22'), options: trueFalse, correctIndex: 0, explanation: '冷 means “cold”; the person is dressed warmly and shivering.' },
      { number: 23, text: '再见', pinyin: 'zàijiàn', image: asset('r1-23'), options: trueFalse, correctIndex: 1, explanation: '再见 means “goodbye”; the people are exchanging papers rather than saying goodbye.' },
      { number: 24, text: '狗', pinyin: 'gǒu', image: asset('r1-24'), options: trueFalse, correctIndex: 1, explanation: '狗 means “dog”; the picture shows a tiger.' },
      { number: 25, text: '不客气', pinyin: 'bú kèqi', image: asset('r1-25'), options: trueFalse, correctIndex: 1, explanation: '不客气 means “you’re welcome”; the picture shows people making a toast.' },
    ] },
  { id: 'r2', section: 'reading', title: 'Part 2 · Match sentences to pictures', instruction: 'Choose the matching picture from A–F. Picture E is used in the example.',
    image: asset('r2-pictures'), imageCaption: 'Illustrated picture choices A–F. E is the worked example.',
    example: '我很喜欢这本书。 (Wǒ hěn xǐhuan zhè běn shū.) → E · “I like this book very much.”', exampleImage: asset('r2-example'), exampleImageAlt: 'Illustrated example picture E: a woman reading a book.', exampleImageCompact: true,
    questions: [
      { number: 26, text: '老师，中国在哪儿？', pinyin: 'Lǎoshī, Zhōngguó zài nǎr?', options: letters(6), correctIndex: 0, explanation: '“Teacher, where is China?” Picture A shows a teacher looking at a globe with students.' },
      { number: 27, text: '米饭好了，叫爸爸来吃饭。', pinyin: 'Mǐfàn hǎo le, jiào bàba lái chī fàn.', options: letters(6), correctIndex: 1, explanation: '“The rice is ready; call Dad to eat.” Picture B shows someone preparing food.' },
      { number: 28, text: '我女儿不在家，她去看朋友了。', pinyin: 'Wǒ nǚ’ér bú zài jiā, tā qù kàn péngyou le.', options: letters(6), correctIndex: 2, explanation: '“My daughter isn’t home; she went to see a friend.” Picture C shows someone at the door.' },
      { number: 29, text: '这是小刘，他在医院工作。', pinyin: 'Zhè shì Xiǎo Liú, tā zài yīyuàn gōngzuò.', options: letters(6), correctIndex: 5, explanation: '“This is Xiao Liu; he works at a hospital.” Picture F shows Xiao Liu speaking with colleagues.' },
      { number: 30, text: '我中午去商店买了很多东西。', pinyin: 'Wǒ zhōngwǔ qù shāngdiàn mǎi le hěn duō dōngxi.', options: letters(6), correctIndex: 3, explanation: '“I went to the shop at noon and bought many things.” Picture D shows a woman carrying shopping bags.' },
    ] },
  { id: 'r3', section: 'reading', title: 'Part 3 · Match questions & replies', instruction: 'Choose the reply that best completes each exchange. Reply F is used in the example.',
    example: '你喝水吗？ (Nǐ hē shuǐ ma?) → F · 好的，谢谢！ (Hǎo de, xièxie!)',
    choices: [word('没有。', 'Méiyǒu.'), word('饭店。', 'Fàndiàn.'), word('下个月。', 'Xià ge yuè.'), word('会很热。', 'Huì hěn rè.'), word('我同学。', 'Wǒ tóngxué.'), word('好的，谢谢！', 'Hǎode, xièxie!')],
    questions: [
      { number: 31, text: '你想什么时候买车？', pinyin: 'Nǐ xiǎng shénme shíhou mǎi chē?', options: letters(6), correctIndex: 2, explanation: '“When do you want to buy a car?” — 下个月, “Next month.” Choose C.' },
      { number: 32, text: '我们现在去哪儿？', pinyin: 'Wǒmen xiànzài qù nǎr?', options: letters(6), correctIndex: 1, explanation: '“Where are we going now?” — 饭店, “The restaurant.” Choose B.' },
      { number: 33, text: '你昨天和谁去看的电影？', pinyin: 'Nǐ zuótiān hé shéi qù kàn de diànyǐng?', options: letters(6), correctIndex: 4, explanation: '“Who did you go to see the film with yesterday?” — 我同学, “My classmate.” Choose E.' },
      { number: 34, text: '儿子上午学习了吗？', pinyin: 'Érzi shàngwǔ xuéxí le ma?', options: letters(6), correctIndex: 0, explanation: '“Did your son study this morning?” — 没有, “No.” Choose A.' },
      { number: 35, text: '明天天气怎么样？', pinyin: 'Míngtiān tiānqì zěnmeyàng?', options: letters(6), correctIndex: 3, explanation: '“How will the weather be tomorrow?” — 会很热, “It will be very hot.” Choose D.' },
    ] },
  { id: 'r4', section: 'reading', title: 'Part 4 · Fill in the missing word', instruction: 'Choose a word from A–F to fill each blank. Word D is used in the example.',
    example: '你叫什么（D）？ (Nǐ jiào shénme míngzi?) · D = 名字 (míngzi, name)',
    choices: [word('住', 'zhù'), word('高兴', 'gāoxìng'), word('几', 'jǐ'), word('名字', 'míngzi'), word('学生', 'xuésheng'), word('写', 'xiě')],
    questions: [
      { number: 36, text: '这些汉字我会读，不会（　）。', pinyin: 'Zhèxiē Hànzì wǒ huì dú, bú huì ( ).', options: letters(6), correctIndex: 5, explanation: '“I can read these Chinese characters, but I can’t write them.” 写 means “write”. Choose F.' },
      { number: 37, text: '你今天能来，我太（　）了。', pinyin: 'Nǐ jīntiān néng lái, wǒ tài ( ) le.', options: letters(6), correctIndex: 1, explanation: '“You can come today; I’m so happy.” 高兴 means “happy”. Choose B.' },
      { number: 38, text: '我们学校不大，老师和（　）都很少。', pinyin: 'Wǒmen xuéxiào bú dà, lǎoshī hé ( ) dōu hěn shǎo.', options: letters(6), correctIndex: 4, explanation: '“Our school is small; there are few teachers and students.” 学生 means “student”. Choose E.' },
      { number: 39, text: '女：你（　）在这后面？\n男：是，有一年多了。', pinyin: 'Nǚ: Nǐ ( ) zài zhè hòumiàn?\nNán: Shì, yǒu yì nián duō le.', options: letters(6), correctIndex: 0, explanation: '“Do you live behind here?” — “Yes, for over a year.” 住 means “live”. Choose A.' },
      { number: 40, text: '男：这（　）个菜是谁做的？\n女：我妈妈。', pinyin: 'Nán: Zhè ( ) ge cài shì shéi zuò de?\nNǚ: Wǒ māma.', options: letters(6), correctIndex: 2, explanation: '这几个菜 means “these dishes”. 几 is used in the phrase. Choose C.' },
    ] },
];

module.exports = { id: 'h11556', code: 'H11556', title: 'HSK 1 · H11556', audioUrl: '/hsk1/h11556/listening.mp3', listeningSeconds: 875, transferSeconds: 180, readingSeconds: 1020, groups };
