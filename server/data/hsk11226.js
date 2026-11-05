// Transcribed from the user-supplied H11226 paper. Answer key: PDF page 14.
const asset = name => `/hsk1/h11226/color/${name}.jpg`;
const letters = count => Array.from({ length: count }, (_, i) => ({ text: String.fromCharCode(65 + i) }));
const trueFalse = [{ text: '✓ Matches' }, { text: '✕ Does not match' }];
const word = (text, pinyin) => ({ text, pinyin });
const groups = [
  { id: 'l1', section: 'listening', title: 'Part 1 · Listen & match', instruction: 'Listen to each phrase twice. Does it match the picture?', questions: [
    { number: 1, image: asset('l1-1'), options: trueFalse, correctIndex: 1, explanation: '喝茶 means “drink tea”; the picture shows someone eating an apple.' },
    { number: 2, image: asset('l1-2'), options: trueFalse, correctIndex: 1, explanation: '在下面 means “underneath”; the child is pointing upwards.' },
    { number: 3, image: asset('l1-3'), options: trueFalse, correctIndex: 1, explanation: '猫和狗 means “a cat and a dog”; the picture shows a cat and a fish.' },
    { number: 4, image: asset('l1-4'), options: trueFalse, correctIndex: 0, explanation: '很热 means “very hot” and matches the picture.' },
    { number: 5, image: asset('l1-5'), options: trueFalse, correctIndex: 0, explanation: '三个椅子 means “three chairs”, matching the picture.' },
  ] },
  { id: 'l2', section: 'listening', title: 'Part 2 · Choose a picture', instruction: 'Listen to each sentence twice. Choose the matching picture: A, B, or C.', questions: [
    { number: 6, image: asset('l2-6'), options: letters(3), correctIndex: 0, explanation: '对不起，我没听见。— “Sorry, I didn’t hear.” Picture A shows someone listening.' },
    { number: 7, image: asset('l2-7'), options: letters(3), correctIndex: 2, explanation: '这些衣服都太大了。— “These clothes are all too big.” Choose C.' },
    { number: 8, image: asset('l2-8'), options: letters(3), correctIndex: 2, explanation: '王先生在打电话。— “Mr Wang is making a phone call.” Choose C.' },
    { number: 9, image: asset('l2-9'), options: letters(3), correctIndex: 0, explanation: '我想睡觉了。— “I want to sleep.” Choose the yawning person in A.' },
    { number: 10, image: asset('l2-10'), options: letters(3), correctIndex: 1, explanation: '现在九点零五，二十分钟后见。— “It’s 9:05 now; see you in twenty minutes.” Choose B, the person checking the time.' },
  ] },
  { id: 'l3', section: 'listening', title: 'Part 3 · Match the dialogues', instruction: 'Listen to each dialogue twice. Choose its picture from A–F. Picture C is used in the example.', image: asset('listening-pictures'), example: '女：你好！男：你好！很高兴认识你。 → C', questions: [
    { number: 11, options: letters(6), correctIndex: 3, explanation: 'The child answers 我四岁, “I’m four years old.” Picture D.' },
    { number: 12, options: letters(6), correctIndex: 0, explanation: 'The speakers discuss reading a character: 这个字你会读吗？Picture A.' },
    { number: 13, options: letters(6), correctIndex: 4, explanation: 'They are going to the railway station: 去火车站，再见。Picture E.' },
    { number: 14, options: letters(6), correctIndex: 1, explanation: 'They discuss having no money and sixty yuan: 我有六十块。Picture B.' },
    { number: 15, options: letters(6), correctIndex: 5, explanation: 'A visitor asks whether the person is feeling better: 你好点儿了吗？Picture F.' },
  ] },
  { id: 'l4', section: 'listening', title: 'Part 4 · Listen & answer', instruction: 'Listen to each short passage and question twice. Choose the best answer.', questions: [
    { number: 16, options: [word('天气好','tiānqì hǎo'),word('能做饭','néng zuò fàn'),word('人不多','rén bù duō')], correctIndex: 2, explanation: '前面人少 means there are few people in front. Choose 人不多.' },
    { number: 17, options: [word('12:00',''),word('13:00',''),word('17:00','')], correctIndex: 1, explanation: '下午一点 is one o’clock in the afternoon: 13:00.' },
    { number: 18, options: [word('家里','jiā li'),word('饭馆儿','fànguǎnr'),word('电影院','diànyǐngyuàn')], correctIndex: 1, explanation: '我在饭馆儿吃饭呢。— “I’m eating at a restaurant.”' },
    { number: 19, options: [word('儿子的','érzi de'),word('女儿的','nǚ’ér de'),word('同学的','tóngxué de')], correctIndex: 2, explanation: '这本书是我同学的。— “This book belongs to my classmate.”' },
    { number: 20, options: [word('开车','kāi chē'),word('坐火车','zuò huǒchē'),word('坐出租车','zuò chūzūchē')], correctIndex: 0, explanation: '我们开车去学校。— “We’re driving to school.”' },
  ] },
  { id: 'r1', section: 'reading', title: 'Part 1 · Words & pictures', instruction: 'Does the word match the picture? Choose matches or does not match.', questions: [
    { number: 21, text: '写', pinyin: 'xiě', image: asset('r1-21'), options: trueFalse, correctIndex: 0, explanation: '写 means “write”; the picture shows writing.' },
    { number: 22, text: '学习', pinyin: 'xuéxí', image: asset('r1-22'), options: trueFalse, correctIndex: 1, explanation: '学习 means “study”; the person is sleeping.' },
    { number: 23, text: '他', pinyin: 'tā', image: asset('r1-23'), options: trueFalse, correctIndex: 0, explanation: '他 means “he”; the picture shows a man.' },
    { number: 24, text: '医生', pinyin: 'yīshēng', image: asset('r1-24'), options: trueFalse, correctIndex: 0, explanation: '医生 means “doctor”; the picture shows a doctor.' },
    { number: 25, text: '米饭', pinyin: 'mǐfàn', image: asset('r1-25'), options: trueFalse, correctIndex: 1, explanation: '米饭 means “cooked rice”; the picture shows eggs.' },
  ] },
  { id: 'r2', section: 'reading', title: 'Part 2 · Match sentences to pictures', instruction: 'Choose the matching picture from A–F. Picture E is used in the example.', image: asset('reading-pictures'), example: '我很喜欢这本书。 (Wǒ hěn xǐhuan zhè běn shū.) → E', questions: [
    { number: 26, text: '你看，中国在这儿。', pinyin: 'Nǐ kàn, Zhōngguó zài zhèr.', options: letters(6), correctIndex: 2, explanation: '“Look, China is here.” Picture C shows people looking at a globe.' },
    { number: 27, text: '天冷了，多喝点儿热水。', pinyin: 'Tiān lěng le, duō hē diǎnr rè shuǐ.', options: letters(6), correctIndex: 0, explanation: '“It’s cold; drink more hot water.” Picture A shows a person with a cup.' },
    { number: 28, text: '先生，里面请。', pinyin: 'Xiānsheng, lǐmiàn qǐng.', options: letters(6), correctIndex: 1, explanation: '“Sir, please come inside.” Picture B shows a welcoming gesture.' },
    { number: 29, text: '他们怎么不说话？', pinyin: 'Tāmen zěnme bù shuōhuà?', options: letters(6), correctIndex: 5, explanation: '“Why aren’t they talking?” Picture F shows two people facing away.' },
    { number: 30, text: '我今天买了很多你爱吃的菜。', pinyin: 'Wǒ jīntiān mǎile hěn duō nǐ ài chī de cài.', options: letters(6), correctIndex: 3, explanation: '“Today I bought lots of food you like.” Picture D shows groceries.' },
  ] },
  { id: 'r3', section: 'reading', title: 'Part 3 · Match questions & replies', instruction: 'Choose the reply that best completes each exchange. Reply F is used in the example.', example: '你喝水吗？ (Nǐ hē shuǐ ma?) → F · 好的，谢谢！', choices: [word('很漂亮。','Hěn piàoliang.'),word('明天下午。','Míngtiān xiàwǔ.'),word('我朋友的。','Wǒ péngyou de.'),word('没有。','Méiyǒu.'),word('在桌子上。','Zài zhuōzi shang.'),word('好的，谢谢！','Hǎode, xièxie!')], questions: [
    { number: 31, text: '那是谁的电脑？', pinyin: 'Nà shì shéi de diànnǎo?', options: letters(6), correctIndex: 2, explanation: '“Whose computer is that?” — 我朋友的, “My friend’s.”' },
    { number: 32, text: '爸爸睡觉了吗？', pinyin: 'Bàba shuìjiào le ma?', options: letters(6), correctIndex: 3, explanation: '“Has Dad gone to sleep?” — 没有, “No.”' },
    { number: 33, text: '学生们什么时候回来？', pinyin: 'Xuéshengmen shénme shíhou huílai?', options: letters(6), correctIndex: 1, explanation: '“When will the students return?” — 明天下午, “Tomorrow afternoon.”' },
    { number: 34, text: '这个杯子怎么样？', pinyin: 'Zhège bēizi zěnmeyàng?', options: letters(6), correctIndex: 0, explanation: '“How is this cup?” — 很漂亮, “Very pretty.”' },
    { number: 35, text: '昨天买的苹果呢？', pinyin: 'Zuótiān mǎi de píngguǒ ne?', options: letters(6), correctIndex: 4, explanation: '“Where are the apples bought yesterday?” — 在桌子上, “On the table.”' },
  ] },
  { id: 'r4', section: 'reading', title: 'Part 4 · Fill in the missing word', instruction: 'Choose a word from A–F to fill each blank. Word D is used in the example.', example: '你叫什么（D）？ (Nǐ jiào shénme míngzi?) · D = 名字', choices: [word('的','de'),word('怎么样','zěnmeyàng'),word('月','yuè'),word('名字','míngzi'),word('住','zhù'),word('东西','dōngxi')], questions: [
    { number: 36, text: '我今年8（　）去北京工作。', pinyin: 'Wǒ jīnnián bā ( ) qù Běijīng gōngzuò.', options: letters(6), correctIndex: 2, explanation: '8月 means “August”: I’m going to Beijing to work this August.' },
    { number: 37, text: '你现在（　）在学校里？', pinyin: 'Nǐ xiànzài ( ) zài xuéxiào lǐ?', options: letters(6), correctIndex: 4, explanation: '住在 means “live at/in”: Do you live at school now?' },
    { number: 38, text: '我上午看见你妈妈了，她在商店买（　）。', pinyin: 'Wǒ shàngwǔ kànjian nǐ māma le, tā zài shāngdiàn mǎi ( ).', options: letters(6), correctIndex: 5, explanation: '买东西 means “buy things”: Your mother was buying things at the shop.' },
    { number: 39, text: '女：你认识他吗？\n男：认识，他是我（　）汉语老师。', pinyin: 'Nǚ: Nǐ rènshi tā ma? Nán: Rènshi, tā shì wǒ ( ) Hànyǔ lǎoshī.', options: letters(6), correctIndex: 0, explanation: '我的汉语老师 means “my Chinese teacher”; 的 marks possession.' },
    { number: 40, text: '男：星期日去看电影（　）？\n女：好。', pinyin: 'Nán: Xīngqīrì qù kàn diànyǐng ( )? Nǚ: Hǎo.', options: letters(6), correctIndex: 1, explanation: '怎么样 asks “how about it?”: How about going to see a movie on Sunday?' },
  ] },
];
module.exports = { id: 'h11226', title: 'HSK 1 · H11226', audioUrl: '/hsk1/h11226/listening.m4a', listeningSeconds: 910, transferSeconds: 180, readingSeconds: 1020, groups };
