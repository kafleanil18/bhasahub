// Questions transcribed from the user-supplied scan H11552.pdf (no text layer); listening text from
// the supplied listening script (its header says H11451, but every item matches this booklet);
// recording H11552.mp3 supplied by the user. No answer key was supplied: correctIndex values were
// worked out from the listening script, the pictures and the reading questions, and need checking
// against a printed key (see docs/h11552-test-portal.md).
const asset = name => `/hsk1/h11552/${name}.jpg`;
const letters = count => Array.from({ length: count }, (_, i) => ({ text: String.fromCharCode(65 + i) }));
const word = (text, pinyin) => ({ text, pinyin });
const trueFalse = [{ text: '✓ Matches' }, { text: '✕ Does not match' }];

const groups = [
  { id: 'l1', section: 'listening', title: 'Part 1 · Listen & match', instruction: 'Listen to each phrase twice. Does it match the picture?',
    example: '很高兴 (hěn gāoxìng, very happy) matches the smiling woman (✓). 看电影 (kàn diànyǐng, watch a film) does not match the man reading a newspaper (✕).',
    exampleImage: asset('l1-example'), exampleImageAlt: 'Illustrations: a smiling woman with a checkmark and a man reading a newspaper with a cross.',
    questions: [
      { number: 1, image: asset('l1-1'), options: trueFalse, correctIndex: 0, listeningText: '八点', explanation: '八点 means eight o’clock; the clock shows eight.' },
      { number: 2, image: asset('l1-2'), options: trueFalse, correctIndex: 0, listeningText: '我的杯子', explanation: '我的杯子 means my cup; a hand is holding a cup.' },
      { number: 3, image: asset('l1-3'), options: trueFalse, correctIndex: 1, listeningText: '开出租车', explanation: '开出租车 means drive a taxi, but the woman is riding a bicycle.' },
      { number: 4, image: asset('l1-4'), options: trueFalse, correctIndex: 1, listeningText: '请坐', explanation: '请坐 means please sit down, but the runner is crossing the finish line.' },
      { number: 5, image: asset('l1-5'), options: trueFalse, correctIndex: 1, listeningText: '在学校', explanation: '在学校 means at school, but the woman is choosing clothes in a shop.' },
    ] },
  { id: 'l2', section: 'listening', title: 'Part 2 · Choose a picture', instruction: 'Listen to each sentence twice. Choose the matching picture: A, B, or C.',
    example: '这是我的书。 (Zhè shì wǒ de shū.) → A · These are my books. B shows a telephone; C shows apples.',
    exampleImage: asset('l2-example'), exampleImageAlt: 'Example illustrations: A books with a checkmark, B a telephone, C apples.',
    questions: [
      { number: 6, image: asset('l2-6'), options: letters(3), correctIndex: 0, listeningText: '里面没有东西。', explanation: '“There’s nothing inside.” A shows an empty box.' },
      { number: 7, image: asset('l2-7'), options: letters(3), correctIndex: 0, listeningText: '你怎么这么高兴？', explanation: '“Why are you so happy?” A shows a man cheering.' },
      { number: 8, image: asset('l2-8'), options: letters(3), correctIndex: 2, listeningText: '女儿说，狗是她的好朋友。', explanation: '“My daughter says the dog is her good friend.” C shows a girl hugging a dog.' },
      { number: 9, image: asset('l2-9'), options: letters(3), correctIndex: 0, listeningText: '喂，你星期六能来吗？', explanation: '“Hello, can you come on Saturday?” A shows a man on the phone.' },
      { number: 10, image: asset('l2-10'), options: letters(3), correctIndex: 2, listeningText: '名字写在哪儿？', explanation: '“Where do I write my name?” C shows a hand writing on paper.' },
    ] },
  { id: 'l3', section: 'listening', title: 'Part 3 · Match the dialogues', instruction: 'Listen to each dialogue twice. Choose its picture from A–F. Picture C is used in the example.',
    image: asset('l3-pictures'), imageCaption: 'Choices A–F in the original paper order.',
    example: '女：你好！男：你好！很高兴认识你。 (Nǐ hǎo! Hěn gāoxìng rènshi nǐ.) → C · Two people greeting each other.',
    questions: [
      { number: 11, options: letters(6), correctIndex: 0, listeningText: '男：这是你的钱。\n女：好，谢谢。', explanation: '“Here is your money.” A shows a hand holding out banknotes.' },
      { number: 12, options: letters(6), correctIndex: 3, listeningText: '女：你会做中国菜，和谁学的？\n男：一个同学。', explanation: '“You can cook Chinese food; who taught you?” D shows a man cooking.' },
      { number: 13, options: letters(6), correctIndex: 4, listeningText: '男：你儿子是老师？\n女：不是，他在医院工作，是医生。', explanation: '“He works in a hospital; he’s a doctor.” E shows a doctor.' },
      { number: 14, options: letters(6), correctIndex: 1, listeningText: '女：张先生，再见！\n男：好，明天上午见。', explanation: '“Goodbye, Mr Zhang!” B shows a woman waving goodbye.' },
      { number: 15, options: letters(6), correctIndex: 5, listeningText: '男：你看电影吗？\n女：看，你的电脑里有什么电影？', explanation: '“What films are on your computer?” F shows two people looking at a laptop.' },
    ] },
  { id: 'l4', section: 'listening', title: 'Part 4 · Listen & answer', instruction: 'Listen to each short passage and question twice. Choose the best answer.',
    example: '下午我去商店，我想买一些水果。 (Xiàwǔ wǒ qù shāngdiàn, wǒ xiǎng mǎi yìxiē shuǐguǒ.)\n问：他下午去哪里？ (Tā xiàwǔ qù nǎlǐ?)\nA 商店 (shāngdiàn) ✓ · B 医院 (yīyuàn) · C 学校 (xuéxiào)\nAnswer: A · He is going to the shop to buy fruit.',
    questions: [
      { number: 16, options: [word('车里', 'chē li'), word('桌子上', 'zhuōzi shang'), word('电脑下面', 'diànnǎo xiàmiàn')], correctIndex: 1, listeningText: '桌子上有一本书。\n问：那本书在哪儿？', explanation: 'There is a book on the table: B.' },
      { number: 17, options: [word('6:50', 'liù diǎn wǔshí'), word('7:20', 'qī diǎn èrshí'), word('8:30', 'bā diǎn sānshí')], correctIndex: 1, listeningText: '现在7点，他20分钟后回来。\n问：他几点回来？', explanation: 'It is seven now and he will be back in 20 minutes, at 7:20: B.' },
      { number: 18, options: [word('很好', 'hěn hǎo'), word('下雨了', 'xiàyǔ le'), word('有点儿热', 'yǒu diǎnr rè')], correctIndex: 1, listeningText: '昨天天气不好，下的雨很大。\n问：昨天天气怎么样？', explanation: 'The weather was bad yesterday and it rained heavily: B.' },
      { number: 19, options: [word('菜', 'cài'), word('米饭', 'mǐfàn'), word('苹果', 'píngguǒ')], correctIndex: 2, listeningText: '我中午吃了一个苹果，没有吃饭。\n问：他中午吃了什么？', explanation: 'He ate an apple for lunch, not a meal: C.' },
      { number: 20, options: [word('回家', 'huí jiā'), word('打电话', 'dǎ diànhuà'), word('多住几天', 'duō zhù jǐ tiān')], correctIndex: 2, listeningText: '李小姐很喜欢这儿，他想多住几天。\n问：李小姐想怎么做？', explanation: 'Miss Li likes it here and wants to stay a few more days: C.' },
    ] },
  { id: 'r1', section: 'reading', title: 'Part 1 · Words & pictures', instruction: 'Does the word match the picture? Choose matches or does not match.',
    example: '电视 (diànshì, television) does not match the laptop (✕). 飞机 (fēijī, airplane) matches the airplane (✓).',
    exampleImage: asset('r1-example'), exampleImageAlt: 'Illustrations: a laptop with a cross and an airplane with a checkmark.',
    questions: [
      { number: 21, text: '热', pinyin: 'rè', image: asset('r1-21'), options: trueFalse, correctIndex: 0, explanation: '热 means hot; the woman is wiping sweat away with a towel.' },
      { number: 22, text: '椅子', pinyin: 'yǐzi', image: asset('r1-22'), options: trueFalse, correctIndex: 0, explanation: '椅子 means chair; the picture shows an office chair.' },
      { number: 23, text: '他', pinyin: 'tā', image: asset('r1-23'), options: trueFalse, correctIndex: 1, explanation: '他 means he, but the picture shows a woman.' },
      { number: 24, text: '睡觉', pinyin: 'shuìjiào', image: asset('r1-24'), options: trueFalse, correctIndex: 0, explanation: '睡觉 means sleep; the man is asleep at the table.' },
      { number: 25, text: '没关系', pinyin: 'méiguānxi', image: asset('r1-25'), options: trueFalse, correctIndex: 1, explanation: '没关系 means it doesn’t matter, but the two people are arguing and pointing.' },
    ] },
  { id: 'r2', section: 'reading', title: 'Part 2 · Match sentences to pictures', instruction: 'Choose the matching picture from A–F. Picture E is used in the example.',
    image: asset('r2-pictures'), imageCaption: 'Choices A–F in the original paper order. E is the worked example.',
    example: '我很喜欢这本书。 (Wǒ hěn xǐhuan zhè běn shū.) → E · I like this book very much.',
    questions: [
      { number: 26, text: '小猫，你不爱吃这个吗？', pinyin: 'Xiǎo māo, nǐ bú ài chī zhège ma?', options: letters(6), correctIndex: 0, explanation: '“Kitty, don’t you like this?” A shows a kitten beside its food bowl.' },
      { number: 27, text: '对不起，家里没茶了。喝水怎么样？', pinyin: 'Duìbuqǐ, jiā li méi chá le. Hē shuǐ zěnmeyàng?', options: letters(6), correctIndex: 2, explanation: '“Sorry, there’s no tea at home. How about water?” C shows a woman holding out a bottle of water.' },
      { number: 28, text: '我们都16岁了。', pinyin: 'Wǒmen dōu 16 suì le.', options: letters(6), correctIndex: 5, explanation: '“We are both 16 now.” F shows two girls with a 16 birthday cake.' },
      { number: 29, text: '谢谢你来医院看我。', pinyin: 'Xièxie nǐ lái yīyuàn kàn wǒ.', options: letters(6), correctIndex: 3, explanation: '“Thanks for visiting me in hospital.” D shows a visitor at a patient’s bedside.' },
      { number: 30, text: '这是我昨天买的电视。', pinyin: 'Zhè shì wǒ zuótiān mǎi de diànshì.', options: letters(6), correctIndex: 1, explanation: '“This is the TV I bought yesterday.” B shows a television.' },
    ] },
  { id: 'r3', section: 'reading', title: 'Part 3 · Match questions & replies', instruction: 'Choose the reply that best completes each exchange. Reply F is used in the example.',
    example: '你喝水吗？ (Nǐ hē shuǐ ma?) → F · 好的，谢谢！ (Hǎo de, xièxie!)',
    choices: [word('很冷。', 'Hěn lěng.'), word('坐飞机。', 'Zuò fēijī.'), word('40块。', 'Sìshí kuài.'), word('12月19号。', 'Shí’èr yuè shíjiǔ hào.'), word('我妈妈。', 'Wǒ māma.'), word('好的，谢谢！', 'Hǎo de, xièxie!')],
    questions: [
      { number: 31, text: '你们怎么去北京？', pinyin: 'Nǐmen zěnme qù Běijīng?', options: letters(6), correctIndex: 1, explanation: '“How are you going to Beijing?” — “By plane.” Choose B.' },
      { number: 32, text: '这些水果是谁买的？', pinyin: 'Zhèxiē shuǐguǒ shì shéi mǎi de?', options: letters(6), correctIndex: 4, explanation: '“Who bought this fruit?” — “My mum.” Choose E.' },
      { number: 33, text: '今天天气怎么样？', pinyin: 'Jīntiān tiānqì zěnmeyàng?', options: letters(6), correctIndex: 0, explanation: '“What’s the weather like today?” — “Very cold.” Choose A.' },
      { number: 34, text: '他什么时候回来？', pinyin: 'Tā shénme shíhou huílai?', options: letters(6), correctIndex: 3, explanation: '“When is he coming back?” — “19 December.” Choose D.' },
      { number: 35, text: '那个杯子多少钱？', pinyin: 'Nàge bēizi duōshao qián?', options: letters(6), correctIndex: 2, explanation: '“How much is that cup?” — “40 yuan.” Choose C.' },
    ] },
  { id: 'r4', section: 'reading', title: 'Part 4 · Fill in the missing word', instruction: 'Choose a word from A–F to fill each blank. Word D is used in the example.',
    example: '你叫什么（D）？ (Nǐ jiào shénme míngzi?) · D = 名字 (míngzi, name)',
    choices: [word('年', 'nián'), word('前面', 'qiánmiàn'), word('漂亮', 'piàoliang'), word('名字', 'míngzi'), word('个', 'ge'), word('读', 'dú')],
    questions: [
      { number: 36, text: '爸，哪（　）是你的学生？', pinyin: 'Bà, nǎ ( ) shì nǐ de xuésheng?', options: letters(6), correctIndex: 4, explanation: '“Dad, which one is your student?” 个 is the measure word. Choose E.' },
      { number: 37, text: '有人在（　）书，你听见了吗？', pinyin: 'Yǒu rén zài ( ) shū, nǐ tīngjiàn le ma?', options: letters(6), correctIndex: 5, explanation: '“Someone is reading aloud; can you hear it?” 读书 means read aloud. Choose F.' },
      { number: 38, text: '他学习汉语一（　）了，现在会写不少汉字。', pinyin: 'Tā xuéxí Hànyǔ yì ( ) le, xiànzài huì xiě bù shǎo Hànzì.', options: letters(6), correctIndex: 0, explanation: '“He has studied Chinese for a year and can write quite a few characters.” 年 means year. Choose A.' },
      { number: 39, text: '女：衣服很（　），谢谢。\n男：不客气。', pinyin: 'Nǚ: Yīfu hěn ( ), xièxie.\nNán: Búkèqi.', options: letters(6), correctIndex: 2, explanation: '“The clothes are lovely, thank you.” 漂亮 means pretty. Choose C.' },
      { number: 40, text: '男：这家饭店人太多了。\n女：我们去（　）那家。', pinyin: 'Nán: Zhè jiā fàndiàn rén tài duō le.\nNǚ: Wǒmen qù ( ) nà jiā.', options: letters(6), correctIndex: 1, explanation: '“This restaurant is too crowded.” — “Let’s go to the one ahead.” 前面 means in front. Choose B.' },
    ] },
];

module.exports = { id: 'h11552', addedAt: '2026-11-28T23:44:00+05:45', code: 'H11552', title: 'HSK 1 · H11552', audioUrl: '/hsk1/h11552/listening.mp3', listeningSeconds: 864, transferSeconds: 180, readingSeconds: 1020,
  // Hidden from students until the cut-out pictures are replaced with new illustrations; staff can
  // preview and publish it under Manage tests.
  publishedByDefault: false, groups };
