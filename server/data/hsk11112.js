// Questions transcribed from the user-supplied H11112试题.pdf; answers from H11112答案.pdf;
// listening text from H11112听力文本.pdf; recording supplied by user.
// Sources, artwork prompts and checks: docs/h11112-test-portal.md and docs/h11112-artwork-prompts.json.
const asset = name => `/hsk1/h11112/${name}.jpg`;
const letters = count => Array.from({ length: count }, (_, i) => ({ text: String.fromCharCode(65 + i) }));
const word = (text, pinyin) => ({ text, pinyin });
const trueFalse = [{ text: '✓ Matches' }, { text: '✕ Does not match' }];

const groups = [
  { id: 'l1', section: 'listening', title: 'Part 1 · Listen & match', instruction: 'Listen to each phrase twice. Does it match the picture?',
    example: '很高兴 (hěn gāoxìng, very happy) matches the smiling woman (✓). 看电影 (kàn diànyǐng, watch a film) does not match the man reading a newspaper (✕).',
    exampleImage: asset('l1-example'), exampleImageAlt: 'Illustrations: a smiling woman with a checkmark and a man reading a newspaper with a cross.',
    questions: [
      { number: 1, image: asset('l1-1'), options: trueFalse, correctIndex: 1, listeningText: '打电话。', explanation: '打电话 means make a phone call, but he is holding a basketball.' },
      { number: 2, image: asset('l1-2'), options: trueFalse, correctIndex: 0, listeningText: '猫和狗。', explanation: '猫和狗 means a cat and a dog; the picture shows a puppy and a kitten.' },
      { number: 3, image: asset('l1-3'), options: trueFalse, correctIndex: 0, listeningText: '看不见。', explanation: '看不见 means cannot see; the man is blindfolded and feeling his way.' },
      { number: 4, image: asset('l1-4'), options: trueFalse, correctIndex: 1, listeningText: '吃米饭。', explanation: '吃米饭 means eat rice, but she is drinking from a cup.' },
      { number: 5, image: asset('l1-5'), options: trueFalse, correctIndex: 0, listeningText: '三个人。', explanation: '三个人 means three people; three friends sit on the sofa.' },
    ] },
  { id: 'l2', section: 'listening', title: 'Part 2 · Choose a picture', instruction: 'Listen to each sentence twice. Choose the matching picture: A, B, or C.',
    example: '这是我的书。 (Zhè shì wǒ de shū.) → A · These are my books. B shows a telephone; C shows apples.',
    exampleImage: asset('l2-example'), exampleImageAlt: 'Example illustrations: A books with a checkmark, B a telephone, C apples.',
    questions: [
      { number: 6, image: asset('l2-6'), options: letters(3), correctIndex: 1, listeningText: '你能听见我说话吗？', explanation: '“Can you hear me?” is said on the phone: B.' },
      { number: 7, image: asset('l2-7'), options: letters(3), correctIndex: 0, listeningText: '没关系，哪个字你不会读？', explanation: '“Which character can’t you read?” fits two people studying a book together: A.' },
      { number: 8, image: asset('l2-8'), options: letters(3), correctIndex: 2, listeningText: '出租车来了，再见。', explanation: '“The taxi is here, goodbye.” The woman waves beside a taxi: C.' },
      { number: 9, image: asset('l2-9'), options: letters(3), correctIndex: 1, listeningText: '在那儿，在学校后面。', explanation: '“Over there, behind the school.” He points into the distance: B.' },
      { number: 10, image: asset('l2-10'), options: letters(3), correctIndex: 2, listeningText: '他在里面学习呢。', explanation: '“He is studying inside.” The boy is doing homework: C.' },
    ] },
  { id: 'l3', section: 'listening', title: 'Part 3 · Match the dialogues', instruction: 'Listen to each dialogue twice. Choose its picture from A–F. Picture C is used in the example.',
    image: asset('l3-pictures'), imageCaption: 'Newly illustrated choices A–F in the original paper order.',
    example: '女：你好！男：你好！很高兴认识你。 (Nǐ hǎo! Hěn gāoxìng rènshi nǐ.) → C · Two people greeting each other.',
    questions: [
      { number: 11, options: letters(6), correctIndex: 0, listeningText: '男：这些书你都看了？\n女：看了一些。', explanation: '“Have you read all these books?” A shows a woman with a tall stack of books.' },
      { number: 12, options: letters(6), correctIndex: 1, listeningText: '女：你爱吃苹果吗？\n男：爱吃。这个苹果很大。', explanation: '“Do you like apples?” B shows a woman holding a big apple.' },
      { number: 13, options: letters(6), correctIndex: 5, listeningText: '男：谢谢你！\n女：不客气，请在这儿写你们的名字。', explanation: '“Please write your names here.” F shows a couple at an office desk with a form.' },
      { number: 14, options: letters(6), correctIndex: 3, listeningText: '女：椅子上的衣服是你的吗？\n男：不是。', explanation: '“Are the clothes on the chair yours?” D shows a jacket hanging on a chair.' },
      { number: 15, options: letters(6), correctIndex: 4, listeningText: '男：你女儿很漂亮，她多大了？\n女：一岁零一个月。', explanation: '“Your daughter is pretty; how old is she?” E shows a mother holding her baby girl.' },
    ] },
  { id: 'l4', section: 'listening', title: 'Part 4 · Listen & answer', instruction: 'Listen to each short passage and question twice. Choose the best answer.',
    example: '下午我去商店，我想买一些水果。 (Xiàwǔ wǒ qù shāngdiàn, wǒ xiǎng mǎi yìxiē shuǐguǒ.)\n问：他下午去哪里？ (Tā xiàwǔ qù nǎlǐ?)\nA 商店 (shāngdiàn) ✓ · B 医院 (yīyuàn) · C 学校 (xuéxiào)\nAnswer: A · He is going to the shop to buy fruit.',
    questions: [
      { number: 16, options: [word('7月2日', 'qī yuè èr rì'), word('昨天上午', 'zuótiān shàngwǔ'), word('一个多月前', 'yí ge duō yuè qián')], correctIndex: 2, listeningText: '我来北京一个多月了。\n问：他是什么时候来北京的？', explanation: 'He has been in Beijing for over a month, so he came more than a month ago: C.' },
      { number: 17, options: [word('打车', 'dǎ chē'), word('坐飞机', 'zuò fēijī'), word('坐火车', 'zuò huǒchē')], correctIndex: 1, listeningText: '听小王说，我们都坐飞机去。\n问：他们怎么去？', explanation: 'They are all going by plane: B.' },
      { number: 18, options: [word('朋友', 'péngyou'), word('学生', 'xuésheng'), word('汉语老师', 'Hànyǔ lǎoshī')], correctIndex: 0, listeningText: '中午有几个朋友来吃饭，你买什么东西了？\n问：中午谁来吃饭？', explanation: 'A few friends are coming for lunch: A.' },
      { number: 19, options: [word('很冷', 'hěn lěng'), word('下雨了', 'xiàyǔ le'), word('没电脑', 'méi diànnǎo')], correctIndex: 0, listeningText: '你喝热水吗？这儿太冷了。\n问：这儿怎么样？', explanation: 'It is too cold here: A.' },
      { number: 20, options: [word('6', 'liù'), word('8', 'bā'), word('9', 'jiǔ')], correctIndex: 2, listeningText: '我妈妈是医生，在医院工作九年了。\n问：他妈妈在医院工作多少年了？', explanation: 'His mother has worked at the hospital for nine years: C.' },
    ] },
  { id: 'r1', section: 'reading', title: 'Part 1 · Words & pictures', instruction: 'Does the word match the picture? Choose matches or does not match.',
    example: '电视 (diànshì, television) does not match the laptop (✕). 飞机 (fēijī, airplane) matches the airplane (✓).',
    exampleImage: asset('r1-example'), exampleImageAlt: 'Illustrations: a laptop with a cross and an airplane with a checkmark.',
    questions: [
      { number: 21, text: '坐', pinyin: 'zuò', image: asset('r1-21'), options: trueFalse, correctIndex: 0, explanation: '坐 means sit; the man is sitting cross-legged on the floor.' },
      { number: 22, text: '中午', pinyin: 'zhōngwǔ', image: asset('r1-22'), options: trueFalse, correctIndex: 1, explanation: '中午 means noon, but the alarm clock shows ten past ten.' },
      { number: 23, text: '对不起', pinyin: 'duìbuqǐ', image: asset('r1-23'), options: trueFalse, correctIndex: 1, explanation: '对不起 means sorry, but the man is giving a confident thumbs-up.' },
      { number: 24, text: '少', pinyin: 'shǎo', image: asset('r1-24'), options: trueFalse, correctIndex: 1, explanation: '少 means few, but the bowl is packed with many goldfish.' },
      { number: 25, text: '睡觉', pinyin: 'shuìjiào', image: asset('r1-25'), options: trueFalse, correctIndex: 0, explanation: '睡觉 means sleep; she is asleep with her head on the desk.' },
    ] },
  { id: 'r2', section: 'reading', title: 'Part 2 · Match sentences to pictures', instruction: 'Choose the matching picture from A–F. Picture E is used in the example.',
    image: asset('r2-pictures'), imageCaption: 'Newly illustrated choices A–F. E is the worked example.',
    example: '我很喜欢这本书。 (Wǒ hěn xǐhuan zhè běn shū.) → E · I like this book very much.',
    questions: [
      { number: 26, text: '爸，你在做什么菜？', pinyin: 'Bà, nǐ zài zuò shénme cài?', options: letters(6), correctIndex: 1, explanation: '“Dad, what dish are you cooking?” B shows a man chopping vegetables.' },
      { number: 27, text: '喂？你好，是张先生吗？', pinyin: 'Wéi? Nǐ hǎo, shì Zhāng xiānsheng ma?', options: letters(6), correctIndex: 3, explanation: '“Hello? Is that Mr Zhang?” D shows a woman on the phone.' },
      { number: 28, text: '那个杯子10块钱。', pinyin: 'Nàge bēizi shí kuài qián.', options: letters(6), correctIndex: 0, explanation: '“That cup costs 10 yuan.” A shows a red mug.' },
      { number: 29, text: '我开车去前面的饭馆儿。', pinyin: 'Wǒ kāi chē qù qiánmiàn de fànguǎnr.', options: letters(6), correctIndex: 2, explanation: '“I’m driving to the restaurant ahead.” C shows a man driving a car.' },
      { number: 30, text: '他在看电视。', pinyin: 'Tā zài kàn diànshì.', options: letters(6), correctIndex: 5, explanation: '“He is watching TV.” F shows a man on the sofa watching television.' },
    ] },
  { id: 'r3', section: 'reading', title: 'Part 3 · Match questions & replies', instruction: 'Choose the reply that best completes each exchange. Reply F is used in the example.',
    example: '你喝水吗？ (Nǐ hē shuǐ ma?) → F · 好的，谢谢！ (Hǎo de, xièxie!)',
    choices: [word('学校。', 'Xuéxiào.'), word('是。', 'Shì.'), word('我的同学。', 'Wǒ de tóngxué.'), word('她想家了。', 'Tā xiǎng jiā le.'), word('下午5:40。', 'Xiàwǔ wǔ diǎn sìshí.'), word('好的，谢谢！', 'Hǎo de, xièxie!')],
    questions: [
      { number: 31, text: '今天的电影是几点的？', pinyin: 'Jīntiān de diànyǐng shì jǐ diǎn de?', options: letters(6), correctIndex: 4, explanation: '“What time is today’s film?” — “5:40 pm.” Choose E.' },
      { number: 32, text: '你女儿住哪儿？', pinyin: 'Nǐ nǚ’ér zhù nǎr?', options: letters(6), correctIndex: 0, explanation: '“Where does your daughter live?” — “At school.” Choose A.' },
      { number: 33, text: '你下星期回中国？', pinyin: 'Nǐ xià xīngqī huí Zhōngguó?', options: letters(6), correctIndex: 1, explanation: '“You’re going back to China next week?” — “Yes.” Choose B.' },
      { number: 34, text: '那个人是谁？', pinyin: 'Nàge rén shì shéi?', options: letters(6), correctIndex: 2, explanation: '“Who is that person?” — “My classmate.” Choose C.' },
      { number: 35, text: '谢小姐怎么了？', pinyin: 'Xiè xiǎojiě zěnme le?', options: letters(6), correctIndex: 3, explanation: '“What’s wrong with Miss Xie?” — “She is homesick.” Choose D.' },
    ] },
  { id: 'r4', section: 'reading', title: 'Part 4 · Fill in the missing word', instruction: 'Choose a word from A–F to fill each blank. Word D is used in the example.',
    example: '你叫什么（D）？ (Nǐ jiào shénme míngzi?) · D = 名字 (míngzi, name)',
    choices: [word('杯', 'bēi'), word('好', 'hǎo'), word('去', 'qù'), word('名字', 'míngzi'), word('商店', 'shāngdiàn'), word('怎么样', 'zěnmeyàng')],
    questions: [
      { number: 36, text: '他是我儿子的（　）朋友，你不认识他？', pinyin: 'Tā shì wǒ érzi de ( ) péngyou, nǐ bú rènshi tā?', options: letters(6), correctIndex: 1, explanation: '“He is my son’s good friend; don’t you know him?” 好朋友 means good friend. Choose B.' },
      { number: 37, text: '桌子上有（　）茶。', pinyin: 'Zhuōzi shang yǒu ( ) chá.', options: letters(6), correctIndex: 0, explanation: '“There is a cup of tea on the table.” 杯 is the measure word for cups. Choose A.' },
      { number: 38, text: '明天天气（　）？', pinyin: 'Míngtiān tiānqì ( )?', options: letters(6), correctIndex: 5, explanation: '“What will the weather be like tomorrow?” 怎么样 asks how something is. Choose F.' },
      { number: 39, text: '女：李老师呢？\n男：她不在，她（　）火车站了。', pinyin: 'Nǚ: Lǐ lǎoshī ne?\nNán: Tā bú zài, tā ( ) huǒchēzhàn le.', options: letters(6), correctIndex: 2, explanation: '“She isn’t here; she has gone to the train station.” 去 means go. Choose C.' },
      { number: 40, text: '男：你现在在哪儿？\n女：我在（　），10分钟后回去。', pinyin: 'Nán: Nǐ xiànzài zài nǎr?\nNǚ: Wǒ zài ( ), shí fēnzhōng hòu huíqu.', options: letters(6), correctIndex: 4, explanation: '“I’m at the shop; I’ll be back in 10 minutes.” 商店 means shop. Choose E.' },
    ] },
];

module.exports = { id: 'h11112', code: 'H11112', title: 'HSK 1 · H11112', audioUrl: '/hsk1/h11112/listening.mp3', listeningSeconds: 922, transferSeconds: 180, readingSeconds: 1020,
  // Hidden from students until all new illustrations are in place; staff can preview and publish it.
  publishedByDefault: false, groups };
