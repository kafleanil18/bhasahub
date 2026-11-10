// Questions transcribed from the user-supplied H11221.pdf; recording supplied by user.
// Cross-check sources and artwork prompts: docs/h11221-test-portal.md.
const asset = name => `/hsk1/h11221/${name}.jpg`;
const letters = count => Array.from({ length: count }, (_, i) => ({ text: String.fromCharCode(65 + i) }));
const word = (text, pinyin) => ({ text, pinyin });
const trueFalse = [{ text: '✓ Matches' }, { text: '✕ Does not match' }];

const groups = [
  { id: 'l1', section: 'listening', title: 'Part 1 · Listen & match', instruction: 'Listen to each phrase twice. Does it match the picture?',
    example: '很高兴 (hěn gāoxìng, very happy) matches the smiling woman (✓). 看电影 (kàn diànyǐng, watch a film) does not match the man reading a newspaper (✕).',
    exampleImage: asset('l1-example'), exampleImageAlt: 'New illustrations: a smiling woman with a checkmark and a man reading a newspaper with a cross.',
    questions: [
      { number: 1, image: asset('l1-1'), options: trueFalse, correctIndex: 1, listeningText: '再见。', explanation: 'The open-palm welcoming gesture does not match saying goodbye.' },
      { number: 2, image: asset('l1-2'), options: trueFalse, correctIndex: 0, listeningText: '很好。', explanation: 'The thumbs-up means very good.' },
      { number: 3, image: asset('l1-3'), options: trueFalse, correctIndex: 1, listeningText: '在下面。', explanation: 'She points up, not below.' },
      { number: 4, image: asset('l1-4'), options: trueFalse, correctIndex: 1, listeningText: '读书。', explanation: 'He holds a football rather than reading.' },
      { number: 5, image: asset('l1-5'), options: trueFalse, correctIndex: 0, listeningText: '一分钟。', explanation: 'One raised finger matches one minute.' },
    ] },
  { id: 'l2', section: 'listening', title: 'Part 2 · Choose a picture', instruction: 'Listen to each sentence twice. Choose the matching picture: A, B, or C.',
    example: '这是我的书。 (Zhè shì wǒ de shū.) → A · These are my books. B shows a telephone; C shows apples.',
    exampleImage: asset('l2-example'), exampleImageAlt: 'New example illustrations: A books with a checkmark, B a telephone, C apples.',
    questions: [
      { number: 6, image: asset('l2-6'), options: letters(3), correctIndex: 2, listeningText: '你看见了吗？在前面吗？', explanation: 'Looking ahead with binoculars: C.' },
      { number: 7, image: asset('l2-7'), options: letters(3), correctIndex: 2, listeningText: '他开车去那儿。', explanation: 'Driving there: C.' },
      { number: 8, image: asset('l2-8'), options: letters(3), correctIndex: 0, listeningText: '他们四个都是我的学生。', explanation: 'Four students: A.' },
      { number: 9, image: asset('l2-9'), options: letters(3), correctIndex: 1, listeningText: '你不高兴？怎么不说话？', explanation: 'The unhappy, quiet woman: B.' },
      { number: 10, image: asset('l2-10'), options: letters(3), correctIndex: 2, listeningText: '这后面是什么东西？', explanation: 'The object behind the frame: C.' },
    ] },
  { id: 'l3', section: 'listening', title: 'Part 3 · Match the dialogues', instruction: 'Listen to each dialogue twice. Choose its picture from A–F. Picture C is used in the example.',
    image: asset('l3-pictures'), imageCaption: 'Newly illustrated choices A–F in the original paper order.',
    example: '女：你好！男：你好！很高兴认识你。 (Nǐ hǎo! Hěn gāoxìng rènshi nǐ.) → C · Two people greeting each other.',
    questions: [
      { number: 11, options: letters(6), correctIndex: 5, listeningText: '男：你在哪儿呢？\n女：我在出租车上。', explanation: 'In a taxi: F.' },
      { number: 12, options: letters(6), correctIndex: 1, listeningText: '女：现在几点了？\n男：现在九点三十六。', explanation: 'Checking the time: B.' },
      { number: 13, options: letters(6), correctIndex: 4, listeningText: '男：你们什么时候买的电视？\n女：昨天下午。', explanation: 'Buying a television: E.' },
      { number: 14, options: letters(6), correctIndex: 3, listeningText: '女：你看见我的小猫了吗？\n男：在那儿。', explanation: 'Finding a kitten: D.' },
      { number: 15, options: letters(6), correctIndex: 0, listeningText: '男：你在想什么呢？\n女：我在想去北京后住哪儿。', explanation: 'Thinking about accommodation: A.' },
    ] },
  { id: 'l4', section: 'listening', title: 'Part 4 · Listen & answer', instruction: 'Listen to each short passage and question twice. Choose the best answer.',
    example: '下午我去商店，我想买一些水果。 (Xiàwǔ wǒ qù shāngdiàn, wǒ xiǎng mǎi yìxiē shuǐguǒ.)\n问：他下午去哪里？ (Tā xiàwǔ qù nǎlǐ?)\nA 商店 (shāngdiàn) ✓ · B 医院 (yīyuàn) · C 学校 (xuéxiào)\nAnswer: A · He is going to the shop to buy fruit.',
    questions: [
      { number: 16, options: [word('喝茶', 'hē chá'), word('看电影', 'kàn diànyǐng'), word('学习汉语', 'xuéxí Hànyǔ')], correctIndex: 2, listeningText: '我会说汉语，我喜欢学习汉语。\n问：他喜欢做什么？', explanation: 'He likes studying Chinese: C.' },
      { number: 17, options: [word('太小', 'tài xiǎo'), word('很漂亮', 'hěn piàoliang'), word('人很少', 'rén hěn shǎo')], correctIndex: 1, listeningText: '我们学校很漂亮。\n问：他们学校怎么样？', explanation: 'Their school is beautiful: B.' },
      { number: 18, options: [word('7个月', 'qī ge yuè'), word('7岁', 'qī suì'), word('8岁', 'bā suì')], correctIndex: 1, listeningText: '钱老师有一个七岁的儿子。\n问：钱老师的儿子今年多大了？', explanation: 'The son is seven years old: B.' },
      { number: 19, options: [word('同学', 'tóngxué'), word('老师', 'lǎoshī'), word('医生', 'yīshēng')], correctIndex: 0, listeningText: '妈，没关系，明天我和同学去买电脑。\n问：他和谁去买电脑？', explanation: 'He is going with a classmate: A.' },
      { number: 20, options: [word('中国', 'Zhōngguó'), word('饭馆儿', 'fànguǎnr'), word('火车站', 'huǒchēzhàn')], correctIndex: 0, listeningText: '她先生今天去中国，上午十点的飞机。\n问：她先生今天去哪儿？', explanation: 'Her husband is going to China: A.' },
    ] },
  { id: 'r1', section: 'reading', title: 'Part 1 · Words & pictures', instruction: 'Does the word match the picture? Choose matches or does not match.',
    example: '电视 (diànshì, television) does not match the laptop (✕). 飞机 (fēijī, airplane) matches the airplane (✓).',
    exampleImage: asset('r1-example'), exampleImageAlt: 'New illustrations: a laptop with a cross and an airplane with a checkmark.',
    questions: [
      { number: 21, text: '米饭', pinyin: 'mǐfàn', image: asset('r1-21'), options: trueFalse, correctIndex: 1, explanation: '米饭 means cooked rice, but the picture shows eggs.' },
      { number: 22, text: '写', pinyin: 'xiě', image: asset('r1-22'), options: trueFalse, correctIndex: 0, explanation: '写 means write; the hand is writing with a pen.' },
      { number: 23, text: '热', pinyin: 'rè', image: asset('r1-23'), options: trueFalse, correctIndex: 0, explanation: '热 means hot; the person is wiping away sweat.' },
      { number: 24, text: '水果', pinyin: 'shuǐguǒ', image: asset('r1-24'), options: trueFalse, correctIndex: 1, explanation: '水果 means fruit, but the picture shows a T-shirt.' },
      { number: 25, text: '听', pinyin: 'tīng', image: asset('r1-25'), options: trueFalse, correctIndex: 0, explanation: '听 means listen; she is listening through headphones.' },
    ] },
  { id: 'r2', section: 'reading', title: 'Part 2 · Match sentences to pictures', instruction: 'Choose the matching picture from A–F. Picture E is used in the example.',
    image: asset('r2-pictures'), imageCaption: 'Newly illustrated choices A–F. E is the worked example.',
    example: '我很喜欢这本书。 (Wǒ hěn xǐhuan zhè běn shū.) → E · I like this book very much.',
    questions: [
      { number: 26, text: '下雨了，你们冷吗？', pinyin: 'Xià yǔ le, nǐmen lěng ma?', options: letters(6), correctIndex: 0, explanation: '“It is raining. Are you cold?” A shows two people under an umbrella.' },
      { number: 27, text: '这个衣服多少钱呢？', pinyin: 'Zhège yīfu duōshao qián ne?', options: letters(6), correctIndex: 3, explanation: '“How much does this clothing cost?” D shows shoppers examining clothes.' },
      { number: 28, text: '这儿有椅子，请坐。', pinyin: 'Zhèr yǒu yǐzi, qǐng zuò.', options: letters(6), correctIndex: 1, explanation: '“Here is a chair; please sit.” B shows a woman offering a seat.' },
      { number: 29, text: '小谢，你的电话。', pinyin: 'Xiǎo Xiè, nǐ de diànhuà.', options: letters(6), correctIndex: 5, explanation: '“Xiao Xie, a phone call for you.” F shows someone offering a telephone handset.' },
      { number: 30, text: '她不爱吃这个菜。', pinyin: 'Tā bú ài chī zhège cài.', options: letters(6), correctIndex: 2, explanation: '“She does not like eating this dish.” C shows a child unhappy with the vegetables.' },
    ] },
  { id: 'r3', section: 'reading', title: 'Part 3 · Match questions & replies', instruction: 'Choose the reply that best completes each exchange. Reply F is used in the example.',
    example: '你喝水吗？ (Nǐ hē shuǐ ma?) → F · 好的，谢谢！ (Hǎo de, xièxie!)',
    choices: [word('我朋友的。', 'Wǒ péngyou de.'), word('北京。', 'Běijīng.'), word('桌子上。', 'Zhuōzi shang.'), word('星期日。', 'Xīngqīrì.'), word('中午有雨。', 'Zhōngwǔ yǒu yǔ.'), word('好的，谢谢！', 'Hǎo de, xièxie!')],
    questions: [
      { number: 31, text: '你哪天回家？', pinyin: 'Nǐ nǎ tiān huí jiā?', options: letters(6), correctIndex: 3, explanation: '“Which day are you going home?” — “Sunday.” Choose D.' },
      { number: 32, text: '你女儿在哪儿工作？', pinyin: 'Nǐ nǚ’ér zài nǎr gōngzuò?', options: letters(6), correctIndex: 1, explanation: '“Where does your daughter work?” — “Beijing.” Choose B.' },
      { number: 33, text: '爸，我的那块儿苹果呢？', pinyin: 'Bà, wǒ de nà kuàir píngguǒ ne?', options: letters(6), correctIndex: 2, explanation: '“Dad, where is my piece of apple?” — “On the table.” Choose C.' },
      { number: 34, text: '明天天气怎么样？', pinyin: 'Míngtiān tiānqì zěnmeyàng?', options: letters(6), correctIndex: 4, explanation: '“What is the weather like tomorrow?” — “Rain at noon.” Choose E.' },
      { number: 35, text: '那个小狗是谁的？', pinyin: 'Nàge xiǎo gǒu shì shéi de?', options: letters(6), correctIndex: 0, explanation: '“Whose puppy is that?” — “My friend’s.” Choose A.' },
    ] },
  { id: 'r4', section: 'reading', title: 'Part 4 · Fill in the missing word', instruction: 'Choose a word from A–F to fill each blank. Word D is used in the example.',
    example: '你叫什么（D）？ (Nǐ jiào shénme míngzi?) · D = 名字 (míngzi, name)',
    choices: [word('怎么', 'zěnme'), word('认识', 'rènshi'), word('请', 'qǐng'), word('名字', 'míngzi'), word('里', 'li'), word('睡觉', 'shuìjiào')],
    questions: [
      { number: 36, text: '对不起，这个字我不（　）。', pinyin: 'Duìbuqǐ, zhège zì wǒ bú ( ).', options: letters(6), correctIndex: 1, explanation: '“Sorry, I do not recognize this character.” 认识 means recognize. Choose B.' },
      { number: 37, text: '这个杯子（　）没有水。', pinyin: 'Zhège bēizi ( ) méiyǒu shuǐ.', options: letters(6), correctIndex: 4, explanation: '“There is no water in this cup.” 里 means inside. Choose E.' },
      { number: 38, text: '现在12:05了，我想去（　）。', pinyin: 'Xiànzài shí’èr diǎn líng wǔ fēn le, wǒ xiǎng qù ( ).', options: letters(6), correctIndex: 5, explanation: '“It is 12:05; I want to go to sleep.” 睡觉 means sleep. Choose F.' },
      { number: 39, text: '女：谢谢你（　）我吃饭。\n男：不客气。', pinyin: 'Nǚ: Xièxie nǐ ( ) wǒ chī fàn.\nNán: Bú kèqi.', options: letters(6), correctIndex: 2, explanation: '“Thank you for treating me to a meal.” 请 means invite or treat. Choose C.' },
      { number: 40, text: '男：打电话了吗？王小姐（　）说？\n女：她说下午能来。', pinyin: 'Nán: Dǎ diànhuà le ma? Wáng xiǎojiě ( ) shuō?\nNǚ: Tā shuō xiàwǔ néng lái.', options: letters(6), correctIndex: 0, explanation: '“Did you call? What did Miss Wang say?” 怎么说 asks what someone said. Choose A.' },
    ] },
];

module.exports = { id: 'h11221', code: 'H11221', title: 'HSK 1 · H11221', audioUrl: '/hsk1/h11221/listening.mp3', listeningSeconds: 929, transferSeconds: 180, readingSeconds: 1020, groups };
