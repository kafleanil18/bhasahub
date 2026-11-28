// Questions transcribed from the user-supplied H11332.pdf; answers from H11332答案.pdf;
// listening text from H11332听力材料.pdf; recording H11332.wma supplied by the user (converted to MP3).
// Pictures are cut out of the booklet for now (see docs/h11332-test-portal.md).
const asset = name => `/hsk1/h11332/${name}.jpg`;
const letters = count => Array.from({ length: count }, (_, i) => ({ text: String.fromCharCode(65 + i) }));
const word = (text, pinyin) => ({ text, pinyin });
const trueFalse = [{ text: '✓ Matches' }, { text: '✕ Does not match' }];

const groups = [
  { id: 'l1', section: 'listening', title: 'Part 1 · Listen & match', instruction: 'Listen to each phrase twice. Does it match the picture?',
    example: '很高兴 (hěn gāoxìng, very happy) matches the smiling woman (✓). 看电影 (kàn diànyǐng, watch a film) does not match the man reading a newspaper (✕).',
    exampleImage: asset('l1-example'), exampleImageAlt: 'Illustrations: a smiling woman with a checkmark and a man reading a newspaper with a cross.',
    questions: [
      { number: 1, image: asset('l1-1'), options: trueFalse, correctIndex: 0, listeningText: '我的猫', explanation: '我的猫 means my cat; the girl is holding her cat.' },
      { number: 2, image: asset('l1-2'), options: trueFalse, correctIndex: 0, listeningText: '很大', explanation: '很大 means very big; she is pulling out the waist of trousers that are far too big.' },
      { number: 3, image: asset('l1-3'), options: trueFalse, correctIndex: 1, listeningText: '四个人', explanation: '四个人 means four people, but only three friends are in the picture.' },
      { number: 4, image: asset('l1-4'), options: trueFalse, correctIndex: 1, listeningText: '没关系', explanation: '没关系 means it doesn’t matter, but the man is giving the woman flowers.' },
      { number: 5, image: asset('l1-5'), options: trueFalse, correctIndex: 0, listeningText: '买衣服', explanation: '买衣服 means buy clothes; the man is choosing a shirt from a rail.' },
    ] },
  { id: 'l2', section: 'listening', title: 'Part 2 · Choose a picture', instruction: 'Listen to each sentence twice. Choose the matching picture: A, B, or C.',
    example: '这是我的书。 (Zhè shì wǒ de shū.) → A · These are my books. B shows a telephone; C shows apples.',
    exampleImage: asset('l2-example'), exampleImageAlt: 'Example illustrations: A books with a checkmark, B a telephone, C apples.',
    questions: [
      { number: 6, image: asset('l2-6'), options: letters(3), correctIndex: 2, listeningText: '我爸爸会做中国菜。', explanation: '“My dad can cook Chinese food.” C shows a man cooking.' },
      { number: 7, image: asset('l2-7'), options: letters(3), correctIndex: 0, listeningText: '你的小飞机能飞吗？', explanation: '“Can your little plane fly?” A shows a hand holding a toy plane.' },
      { number: 8, image: asset('l2-8'), options: letters(3), correctIndex: 1, listeningText: '十二点了，我去睡觉了。', explanation: '“It’s twelve o’clock, I’m going to bed.” B shows a woman yawning.' },
      { number: 9, image: asset('l2-9'), options: letters(3), correctIndex: 2, listeningText: '她们在说什么？', explanation: '“What are they talking about?” C shows two girls whispering at their desks.' },
      { number: 10, image: asset('l2-10'), options: letters(3), correctIndex: 1, listeningText: '这是你爱吃的苹果。', explanation: '“These are the apples you love.” B shows a bowl of apples.' },
    ] },
  { id: 'l3', section: 'listening', title: 'Part 3 · Match the dialogues', instruction: 'Listen to each dialogue twice. Choose its picture from A–F. Picture C is used in the example.',
    image: asset('l3-pictures'), imageCaption: 'Choices A–F in the original paper order.',
    example: '女：你好！男：你好！很高兴认识你。 (Nǐ hǎo! Hěn gāoxìng rènshi nǐ.) → C · Two people greeting each other.',
    questions: [
      { number: 11, options: letters(6), correctIndex: 0, listeningText: '男：这个字谁会读？\n女：老师，我会。', explanation: '“Who can read this character?” — “Teacher, I can.” A shows a girl raising her hand.' },
      { number: 12, options: letters(6), correctIndex: 5, listeningText: '女：天气冷，来，喝杯热茶。\n男：好的，谢谢你。', explanation: '“It’s cold; have a cup of hot tea.” F shows a man drinking tea.' },
      { number: 13, options: letters(6), correctIndex: 3, listeningText: '男：你去商店了？\n女：是，我买了很多东西。', explanation: '“I bought lots of things.” D shows a woman with shopping bags.' },
      { number: 14, options: letters(6), correctIndex: 4, listeningText: '女：你儿子今年几岁了？\n男：七岁了。', explanation: '“How old is your son?” E shows a father hugging his son.' },
      { number: 15, options: letters(6), correctIndex: 1, listeningText: '男：你在上面看见北京了吗？\n女：看见了，在这儿。', explanation: '“Can you see Beijing on it?” B shows a girl looking at a globe.' },
    ] },
  { id: 'l4', section: 'listening', title: 'Part 4 · Listen & answer', instruction: 'Listen to each short passage and question twice. Choose the best answer.',
    example: '下午我去商店，我想买一些水果。 (Xiàwǔ wǒ qù shāngdiàn, wǒ xiǎng mǎi yìxiē shuǐguǒ.)\n问：他下午去哪里？ (Tā xiàwǔ qù nǎlǐ?)\nA 商店 (shāngdiàn) ✓ · B 医院 (yīyuàn) · C 学校 (xuéxiào)\nAnswer: A · He is going to the shop to buy fruit.',
    questions: [
      { number: 16, options: [word('明天', 'míngtiān'), word('8天后', 'bā tiān hòu'), word('下星期', 'xià xīngqī')], correctIndex: 0, listeningText: '我明天去中国，下个月六号回来。\n问：他哪天去中国？', explanation: 'He is going to China tomorrow: A.' },
      { number: 17, options: [word('李先生', 'Lǐ xiānsheng'), word('李医生', 'Lǐ yīshēng'), word('李老师', 'Lǐ lǎoshī')], correctIndex: 0, listeningText: '这些东西都是李先生的。\n问：那些东西是谁的？', explanation: 'All these things belong to Mr Li: A.' },
      { number: 18, options: [word('没电脑', 'méi diànnǎo'), word('很漂亮', 'hěn piàoliang'), word('学生多', 'xuésheng duō')], correctIndex: 1, listeningText: '小高，你们学校太漂亮了！\n问：小高的学校怎么样？', explanation: 'Xiao Gao’s school is really beautiful: B.' },
      { number: 19, options: [word('饭店', 'fàndiàn'), word('朋友家', 'péngyou jiā'), word('书店后面', 'shūdiàn hòumiàn')], correctIndex: 2, listeningText: '我住在这个书店的后面。\n问：他住在哪儿？', explanation: 'He lives behind this bookshop: C.' },
      { number: 20, options: [word('做米饭', 'zuò mǐfàn'), word('不爱吃', 'bú ài chī'), word('回家吃饭', 'huí jiā chī fàn')], correctIndex: 2, listeningText: '女儿打电话说，她中午回家吃饭。\n问：女儿说什么？', explanation: 'His daughter called to say she is coming home for lunch: C.' },
    ] },
  { id: 'r1', section: 'reading', title: 'Part 1 · Words & pictures', instruction: 'Does the word match the picture? Choose matches or does not match.',
    example: '电视 (diànshì, television) does not match the laptop (✕). 飞机 (fēijī, airplane) matches the airplane (✓).',
    exampleImage: asset('r1-example'), exampleImageAlt: 'Illustrations: a laptop with a cross and an airplane with a checkmark.',
    questions: [
      { number: 21, text: '椅子', pinyin: 'yǐzi', image: asset('r1-21'), options: trueFalse, correctIndex: 0, explanation: '椅子 means chair; the picture shows an armchair.' },
      { number: 22, text: '想', pinyin: 'xiǎng', image: asset('r1-22'), options: trueFalse, correctIndex: 0, explanation: '想 means think; the woman is deep in thought.' },
      { number: 23, text: '中午', pinyin: 'zhōngwǔ', image: asset('r1-23'), options: trueFalse, correctIndex: 1, explanation: '中午 means noon, but the alarm clock shows a different time.' },
      { number: 24, text: '少', pinyin: 'shǎo', image: asset('r1-24'), options: trueFalse, correctIndex: 1, explanation: '少 means few, but the basket is full of fruit.' },
      { number: 25, text: '学习', pinyin: 'xuéxí', image: asset('r1-25'), options: trueFalse, correctIndex: 1, explanation: '学习 means study, but the man is asleep in bed.' },
    ] },
  { id: 'r2', section: 'reading', title: 'Part 2 · Match sentences to pictures', instruction: 'Choose the matching picture from A–F. Picture E is used in the example.',
    image: asset('r2-pictures'), imageCaption: 'Choices A–F in the original paper order. E is the worked example.',
    example: '我很喜欢这本书。 (Wǒ hěn xǐhuan zhè běn shū.) → E · I like this book very much.',
    questions: [
      { number: 26, text: '王小姐学会开车了。', pinyin: 'Wáng xiǎojiě xuéhuì kāi chē le.', options: letters(6), correctIndex: 3, explanation: '“Miss Wang has learned to drive.” D shows a woman at the wheel of a car.' },
      { number: 27, text: '我有个同学是医生。', pinyin: 'Wǒ yǒu ge tóngxué shì yīshēng.', options: letters(6), correctIndex: 1, explanation: '“One of my classmates is a doctor.” B shows a doctor with a clipboard.' },
      { number: 28, text: '你想看什么电视？', pinyin: 'Nǐ xiǎng kàn shénme diànshì?', options: letters(6), correctIndex: 5, explanation: '“What do you want to watch on TV?” F shows a woman on the sofa facing a TV.' },
      { number: 29, text: '请在这儿写你的名字。', pinyin: 'Qǐng zài zhèr xiě nǐ de míngzi.', options: letters(6), correctIndex: 0, explanation: '“Please write your name here.” A shows two people at a desk with a form.' },
      { number: 30, text: '喂，我和爸爸在饭店呢。', pinyin: 'Wéi, wǒ hé bàba zài fàndiàn ne.', options: letters(6), correctIndex: 2, explanation: '“Hello, I’m at the restaurant with Dad.” C shows a man on the phone.' },
    ] },
  { id: 'r3', section: 'reading', title: 'Part 3 · Match questions & replies', instruction: 'Choose the reply that best completes each exchange. Reply F is used in the example.',
    example: '你喝水吗？ (Nǐ hē shuǐ ma?) → F · 好的，谢谢！ (Hǎo de, xièxie!)',
    choices: [word('医院。', 'Yīyuàn.'), word('是的。', 'Shìde.'), word('15分钟前。', 'Shíwǔ fēnzhōng qián.'), word('我朋友的。', 'Wǒ péngyou de.'), word('19块。', 'Shíjiǔ kuài.'), word('好的，谢谢！', 'Hǎo de, xièxie!')],
    questions: [
      { number: 31, text: '你是什么时候来的？', pinyin: 'Nǐ shì shénme shíhou lái de?', options: letters(6), correctIndex: 2, explanation: '“When did you arrive?” — “15 minutes ago.” Choose C.' },
      { number: 32, text: '北京现在下雨了吗？', pinyin: 'Běijīng xiànzài xiàyǔ le ma?', options: letters(6), correctIndex: 1, explanation: '“Is it raining in Beijing now?” — “Yes.” Choose B.' },
      { number: 33, text: '这个杯子多少钱？', pinyin: 'Zhège bēizi duōshao qián?', options: letters(6), correctIndex: 4, explanation: '“How much is this cup?” — “19 yuan.” Choose E.' },
      { number: 34, text: '那个小狗是谁的？', pinyin: 'Nàge xiǎo gǒu shì shéi de?', options: letters(6), correctIndex: 3, explanation: '“Whose is that puppy?” — “My friend’s.” Choose D.' },
      { number: 35, text: '你昨天上午去哪儿了？', pinyin: 'Nǐ zuótiān shàngwǔ qù nǎr le?', options: letters(6), correctIndex: 0, explanation: '“Where did you go yesterday morning?” — “The hospital.” Choose A.' },
    ] },
  { id: 'r4', section: 'reading', title: 'Part 4 · Fill in the missing word', instruction: 'Choose a word from A–F to fill each blank. Word D is used in the example.',
    example: '你叫什么（D）？ (Nǐ jiào shénme míngzi?) · D = 名字 (míngzi, name)',
    choices: [word('听', 'tīng'), word('电影', 'diànyǐng'), word('小', 'xiǎo'), word('名字', 'míngzi'), word('怎么', 'zěnme'), word('一点儿', 'yìdiǎnr')],
    questions: [
      { number: 36, text: '这个桌子太（　）了。', pinyin: 'Zhège zhuōzi tài ( ) le.', options: letters(6), correctIndex: 2, explanation: '“This table is too small.” 小 means small. Choose C.' },
      { number: 37, text: '对不起，我没有（　）见。', pinyin: 'Duìbuqǐ, wǒ méiyǒu ( ) jiàn.', options: letters(6), correctIndex: 0, explanation: '“Sorry, I didn’t hear.” 听见 means hear. Choose A.' },
      { number: 38, text: '我来中国工作三个月了，会说（　）汉语。', pinyin: 'Wǒ lái Zhōngguó gōngzuò sān ge yuè le, huì shuō ( ) Hànyǔ.', options: letters(6), correctIndex: 5, explanation: '“I’ve worked in China for three months and can speak a little Chinese.” 一点儿 means a little. Choose F.' },
      { number: 39, text: '女：谢谢你请我看（　），再见。\n男：不客气，再见。', pinyin: 'Nǚ: Xièxie nǐ qǐng wǒ kàn ( ), zàijiàn.\nNán: Búkèqi, zàijiàn.', options: letters(6), correctIndex: 1, explanation: '“Thanks for taking me to the film.” 看电影 means see a film. Choose B.' },
      { number: 40, text: '男：我们（　）去那儿？\n女：坐出租车。', pinyin: 'Nán: Wǒmen ( ) qù nàr?\nNǚ: Zuò chūzūchē.', options: letters(6), correctIndex: 4, explanation: '“How do we get there?” — “By taxi.” 怎么 means how. Choose E.' },
    ] },
];

// Recording still to be converted to MP3 (no ffmpeg on this machine), so the paper also needs its audio before it goes live.
module.exports = { id: 'h11332', code: 'H11332', title: 'HSK 1 · H11332', audioUrl: '/hsk1/h11332/listening.mp3', listeningSeconds: 900, transferSeconds: 180, readingSeconds: 1020,
  // Hidden from students until the cut-out pictures are replaced with new illustrations; staff can
  // preview and publish it under Manage tests.
  publishedByDefault: false, groups };
