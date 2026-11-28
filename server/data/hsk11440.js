// Questions transcribed from the user-supplied H11440.pdf; answers from H11440卷答案.doc;
// listening text from H11440卷听力材料.doc; recording H11440.wav supplied by the user, converted to 64 kbps mono MP3 with ffmpeg.
// Pictures are cut out of the booklet for now (see docs/h11440-test-portal.md).
const asset = name => `/hsk1/h11440/${name}.jpg`;
const letters = count => Array.from({ length: count }, (_, i) => ({ text: String.fromCharCode(65 + i) }));
const word = (text, pinyin) => ({ text, pinyin });
const trueFalse = [{ text: '✓ Matches' }, { text: '✕ Does not match' }];

const groups = [
  { id: 'l1', section: 'listening', title: 'Part 1 · Listen & match', instruction: 'Listen to each phrase twice. Does it match the picture?',
    example: '很高兴 (hěn gāoxìng, very happy) matches the smiling woman (✓). 看电影 (kàn diànyǐng, watch a film) does not match the man reading a newspaper (✕).',
    exampleImage: asset('l1-example'), exampleImageAlt: 'Illustrations: a smiling woman with a checkmark and a man reading a newspaper with a cross.',
    questions: [
      { number: 1, image: asset('l1-1'), options: trueFalse, correctIndex: 1, listeningText: '一岁', explanation: '一岁 means one year old, but the birthday candle is a 6.' },
      { number: 2, image: asset('l1-2'), options: trueFalse, correctIndex: 1, listeningText: '我的电脑', explanation: '我的电脑 means my computer, but the picture shows a mobile phone.' },
      { number: 3, image: asset('l1-3'), options: trueFalse, correctIndex: 1, listeningText: '在飞机上', explanation: '在飞机上 means on a plane, but the man is riding a bicycle.' },
      { number: 4, image: asset('l1-4'), options: trueFalse, correctIndex: 0, listeningText: '吃东西', explanation: '吃东西 means eat something; the woman is eating.' },
      { number: 5, image: asset('l1-5'), options: trueFalse, correctIndex: 0, listeningText: '桌子和椅子', explanation: '桌子和椅子 means a table and chairs; the picture shows a meeting table with chairs.' },
    ] },
  { id: 'l2', section: 'listening', title: 'Part 2 · Choose a picture', instruction: 'Listen to each sentence twice. Choose the matching picture: A, B, or C.',
    example: '这是我的书。 (Zhè shì wǒ de shū.) → A · These are my books. B shows a telephone; C shows apples.',
    exampleImage: asset('l2-example'), exampleImageAlt: 'Example illustrations: A books with a checkmark, B a telephone, C apples.',
    questions: [
      { number: 6, image: asset('l2-6'), options: letters(3), correctIndex: 1, listeningText: '看见了吗？在下面呢。', explanation: '“Can you see it? It’s down there.” B shows a finger pointing down.' },
      { number: 7, image: asset('l2-7'), options: letters(3), correctIndex: 0, listeningText: '李医生，那个人怎么样了？', explanation: '“Dr Li, how is that person?” A shows two doctors talking.' },
      { number: 8, image: asset('l2-8'), options: letters(3), correctIndex: 2, listeningText: '妈妈，再见。', explanation: '“Goodbye, Mum.” C shows a child waving goodbye at the door.' },
      { number: 9, image: asset('l2-9'), options: letters(3), correctIndex: 1, listeningText: '这是昨天买的电视。', explanation: '“This is the TV we bought yesterday.” B shows two people carrying a television.' },
      { number: 10, image: asset('l2-10'), options: letters(3), correctIndex: 2, listeningText: '小狗，多吃点儿。', explanation: '“Little dog, eat a bit more.” C shows a woman feeding her dog.' },
    ] },
  { id: 'l3', section: 'listening', title: 'Part 3 · Match the dialogues', instruction: 'Listen to each dialogue twice. Choose its picture from A–F. Picture C is used in the example.',
    image: asset('l3-pictures'), imageCaption: 'Choices A–F in the original paper order.',
    example: '女：你好！男：你好！很高兴认识你。 (Nǐ hǎo! Hěn gāoxìng rènshi nǐ.) → C · Two people greeting each other.',
    questions: [
      { number: 11, options: letters(6), correctIndex: 3, listeningText: '男：这个杯子怎么样？\n女：太大了，有小点儿的杯子吗？', explanation: '“How about this cup?” — “Too big.” D shows a man holding out a large cup.' },
      { number: 12, options: letters(6), correctIndex: 4, listeningText: '女：喂，你在做什么？\n男：我在睡觉呢。', explanation: '“What are you doing?” — “I’m sleeping.” E shows a man in bed on the phone.' },
      { number: 13, options: letters(6), correctIndex: 5, listeningText: '男：你会开车吗？\n女：不会，我想明年学。', explanation: '“Can you drive?” F shows a couple in a car.' },
      { number: 14, options: letters(6), correctIndex: 1, listeningText: '女：衣服很漂亮，谢谢。\n男：不客气。', explanation: '“The clothes are lovely, thank you.” B shows a woman admiring her new top in a mirror.' },
      { number: 15, options: letters(6), correctIndex: 0, listeningText: '男：什么时候去医院？\n女：现在三点，二十分钟后去。', explanation: '“It’s three now; we’ll go in twenty minutes.” A shows a woman checking her watch.' },
    ] },
  { id: 'l4', section: 'listening', title: 'Part 4 · Listen & answer', instruction: 'Listen to each short passage and question twice. Choose the best answer.',
    example: '下午我去商店，我想买一些水果。 (Xiàwǔ wǒ qù shāngdiàn, wǒ xiǎng mǎi yìxiē shuǐguǒ.)\n问：他下午去哪里？ (Tā xiàwǔ qù nǎlǐ?)\nA 商店 (shāngdiàn) ✓ · B 医院 (yīyuàn) · C 学校 (xuéxiào)\nAnswer: A · He is going to the shop to buy fruit.',
    questions: [
      { number: 16, options: [word('同学', 'tóngxué'), word('学生', 'xuésheng'), word('老师', 'lǎoshī')], correctIndex: 0, listeningText: '我中午和同学吃，不回家了。\n问：他中午和谁吃饭？', explanation: 'He is having lunch with a classmate: A.' },
      { number: 17, options: [word('很冷', 'hěn lěng'), word('很热', 'hěn rè'), word('下雨了', 'xiàyǔ le')], correctIndex: 0, listeningText: '今天太冷了，我想喝杯热水。\n问：天气怎么样？', explanation: 'It is too cold today: A.' },
      { number: 18, options: [word('饭店后面', 'fàndiàn hòumiàn'), word('学校前面', 'xuéxiào qiánmiàn'), word('学校后面', 'xuéxiào hòumiàn')], correctIndex: 2, listeningText: '那家商店在我们学校后面。\n问：商店在哪儿？', explanation: 'The shop is behind their school: C.' },
      { number: 19, options: [word('喝水', 'hē shuǐ'), word('吃米饭', 'chī mǐfàn'), word('打电话', 'dǎ diànhuà')], correctIndex: 2, listeningText: '你好，先生，这里不能打电话。\n问：这里不能做什么？', explanation: 'You can’t make phone calls here: C.' },
      { number: 20, options: [word('9:00', 'jiǔ diǎn'), word('10:00', 'shí diǎn'), word('11:00', 'shíyī diǎn')], correctIndex: 1, listeningText: '电影是上午十点的。\n问：电影是几点的？', explanation: 'The film is at ten in the morning: B.' },
    ] },
  { id: 'r1', section: 'reading', title: 'Part 1 · Words & pictures', instruction: 'Does the word match the picture? Choose matches or does not match.',
    example: '电视 (diànshì, television) does not match the laptop (✕). 飞机 (fēijī, airplane) matches the airplane (✓).',
    exampleImage: asset('r1-example'), exampleImageAlt: 'Illustrations: a laptop with a cross and an airplane with a checkmark.',
    questions: [
      { number: 21, text: '坐', pinyin: 'zuò', image: asset('r1-21'), options: trueFalse, correctIndex: 0, explanation: '坐 means sit; the man is sitting on a stool.' },
      { number: 22, text: '水', pinyin: 'shuǐ', image: asset('r1-22'), options: trueFalse, correctIndex: 0, explanation: '水 means water; the picture shows a glass of water.' },
      { number: 23, text: '看', pinyin: 'kàn', image: asset('r1-23'), options: trueFalse, correctIndex: 1, explanation: '看 means look, but the man has his eyes closed, listening on headphones.' },
      { number: 24, text: '热', pinyin: 'rè', image: asset('r1-24'), options: trueFalse, correctIndex: 1, explanation: '热 means hot, but the woman is wrapped up against the cold.' },
      { number: 25, text: '她们', pinyin: 'tāmen', image: asset('r1-25'), options: trueFalse, correctIndex: 0, explanation: '她们 means they (women); the picture shows three women.' },
    ] },
  { id: 'r2', section: 'reading', title: 'Part 2 · Match sentences to pictures', instruction: 'Choose the matching picture from A–F. Picture E is used in the example.',
    image: asset('r2-pictures'), imageCaption: 'Choices A–F in the original paper order. E is the worked example.',
    example: '我很喜欢这本书。 (Wǒ hěn xǐhuan zhè běn shū.) → E · I like this book very much.',
    questions: [
      { number: 26, text: '明天星期几？', pinyin: 'Míngtiān xīngqī jǐ?', options: letters(6), correctIndex: 3, explanation: '“What day is it tomorrow?” D shows a hand turning a desk calendar.' },
      { number: 27, text: '谢谢你请我喝茶。', pinyin: 'Xièxie nǐ qǐng wǒ hē chá.', options: letters(6), correctIndex: 2, explanation: '“Thank you for inviting me for tea.” C shows two people chatting over cups.' },
      { number: 28, text: '我的狗住在这儿。', pinyin: 'Wǒ de gǒu zhù zài zhèr.', options: letters(6), correctIndex: 5, explanation: '“My dog lives here.” F shows a dog in its kennel.' },
      { number: 29, text: '今天天气不好，下雨了。', pinyin: 'Jīntiān tiānqì bù hǎo, xiàyǔ le.', options: letters(6), correctIndex: 1, explanation: '“The weather is bad today; it’s raining.” B shows a man under an umbrella.' },
      { number: 30, text: '我们买些苹果怎么样？女儿爱吃。', pinyin: 'Wǒmen mǎi xiē píngguǒ zěnmeyàng? Nǚ’ér ài chī.', options: letters(6), correctIndex: 0, explanation: '“Shall we buy some apples? Our daughter loves them.” A shows a hand picking apples.' },
    ] },
  { id: 'r3', section: 'reading', title: 'Part 3 · Match questions & replies', instruction: 'Choose the reply that best completes each exchange. Reply F is used in the example.',
    example: '你喝水吗？ (Nǐ hē shuǐ ma?) → F · 好的，谢谢！ (Hǎo de, xièxie!)',
    choices: [word('是的。', 'Shìde.'), word('几本书。', 'Jǐ běn shū.'), word('6月5号。', 'Liù yuè wǔ hào.'), word('30多块。', 'Sānshí duō kuài.'), word('饭店。', 'Fàndiàn.'), word('好的，谢谢！', 'Hǎo de, xièxie!')],
    questions: [
      { number: 31, text: '你爸爸在哪儿工作？', pinyin: 'Nǐ bàba zài nǎr gōngzuò?', options: letters(6), correctIndex: 4, explanation: '“Where does your dad work?” — “At a hotel.” Choose E.' },
      { number: 32, text: '儿子，这里面是什么？', pinyin: 'Érzi, zhè lǐmiàn shì shénme?', options: letters(6), correctIndex: 1, explanation: '“Son, what’s in here?” — “A few books.” Choose B.' },
      { number: 33, text: '你喜欢猫吗？', pinyin: 'Nǐ xǐhuan māo ma?', options: letters(6), correctIndex: 0, explanation: '“Do you like cats?” — “Yes.” Choose A.' },
      { number: 34, text: '他哪天来北京？', pinyin: 'Tā nǎ tiān lái Běijīng?', options: letters(6), correctIndex: 2, explanation: '“Which day is he coming to Beijing?” — “5 June.” Choose C.' },
      { number: 35, text: '坐出租车去那儿多少钱？', pinyin: 'Zuò chūzūchē qù nàr duōshao qián?', options: letters(6), correctIndex: 3, explanation: '“How much is a taxi there?” — “Over 30 yuan.” Choose D.' },
    ] },
  { id: 'r4', section: 'reading', title: 'Part 4 · Fill in the missing word', instruction: 'Choose a word from A–F to fill each blank. Word D is used in the example.',
    example: '你叫什么（D）？ (Nǐ jiào shénme míngzi?) · D = 名字 (míngzi, name)',
    choices: [word('桌子', 'zhuōzi'), word('对不起', 'duìbuqǐ'), word('很', 'hěn'), word('名字', 'míngzi'), word('个', 'ge'), word('认识', 'rènshi')],
    questions: [
      { number: 36, text: '我们都（　）喜欢谢小姐。', pinyin: 'Wǒmen dōu ( ) xǐhuan Xiè xiǎojiě.', options: letters(6), correctIndex: 2, explanation: '“We all like Miss Xie very much.” 很 means very. Choose C.' },
      { number: 37, text: '我在中国（　）了不少朋友。', pinyin: 'Wǒ zài Zhōngguó ( ) le bù shǎo péngyou.', options: letters(6), correctIndex: 5, explanation: '“I got to know quite a few friends in China.” 认识 means get to know. Choose F.' },
      { number: 38, text: '菜做好了，在（　）上。', pinyin: 'Cài zuòhǎo le, zài ( ) shàng.', options: letters(6), correctIndex: 0, explanation: '“The food is ready; it’s on the table.” 桌子 means table. Choose A.' },
      { number: 39, text: '女：你是怎么学习汉语的？\n男：8（　）字：多听、多说、多读、多写。', pinyin: 'Nǚ: Nǐ shì zěnme xuéxí Hànyǔ de?\nNán: 8 ( ) zì: duō tīng, duō shuō, duō dú, duō xiě.', options: letters(6), correctIndex: 4, explanation: '“Eight characters: listen, speak, read and write a lot.” 个 is the measure word. Choose E.' },
      { number: 40, text: '男：（　），人太多，没听见你叫我。\n女：没关系。', pinyin: 'Nán: ( ), rén tài duō, méi tīngjiàn nǐ jiào wǒ.\nNǚ: Méiguānxi.', options: letters(6), correctIndex: 1, explanation: '“Sorry, there were too many people; I didn’t hear you call me.” — “It doesn’t matter.” Choose B.' },
    ] },
];

module.exports = { id: 'h11440', addedAt: '2026-11-28T23:43:00+05:45', code: 'H11440', title: 'HSK 1 · H11440', audioUrl: '/hsk1/h11440/listening.mp3', listeningSeconds: 900, transferSeconds: 180, readingSeconds: 1020,
  // Hidden from students until the cut-out pictures are replaced with new illustrations; staff can
  // preview and publish it under Manage tests.
  publishedByDefault: false, groups };
