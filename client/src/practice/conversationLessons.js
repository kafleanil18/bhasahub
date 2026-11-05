const words = (items) => items.map(([chinese, pinyin, type, meaning]) => ({ chinese, pinyin, type, meaning }));
const turn = (speaker, chinese, pinyin, english) => ({ speaker, chinese, pinyin, english });
const exchange = (number, title, tone, ...turns) => ({ number, title, tone, turns });

export const bookLessons = [
  {
    id: 'lesson-4', number: '04', title: '她是我的汉语老师', subtitle: 'She is my Chinese teacher', topic: 'People & places',
    image: '/images/conversation-lesson-04.png', imageAlt: 'A teacher helping a student study in a bright classroom',
    caption: 'Learning together · 一起学习', kicker: 'PEOPLE AROUND YOU', heroTitle: 'Talk about people you know.',
    intro: 'Ask who someone is, where they are from, and whether they are a classmate or friend.',
    exchanges: [
      exchange('01', 'Introduce someone', 'hello', turn('A', '她是谁？', 'Tā shì shéi?', 'Who is she?'), turn('B', '她是我的汉语老师，她叫李月。', 'Tā shì wǒ de Hànyǔ lǎoshī, tā jiào Lǐ Yuè.', 'She is my Chinese teacher. Her name is Li Yue.')),
      exchange('02', 'Ask where someone is from', 'polite', turn('A', '你是哪国人？', 'Nǐ shì nǎ guó rén?', 'Which country are you from?'), turn('B', '我是美国人。你呢？', 'Wǒ shì Měiguó rén. Nǐ ne?', 'I’m American. What about you?'), turn('A', '我是中国人。', 'Wǒ shì Zhōngguó rén.', 'I’m Chinese.')),
      exchange('03', 'Talk about classmates', 'sorry', turn('A', '他是谁？', 'Tā shì shéi?', 'Who is he?'), turn('B', '他是我同学。', 'Tā shì wǒ tóngxué.', 'He is my classmate.'), turn('A', '她呢？她是你同学吗？', 'Tā ne? Tā shì nǐ tóngxué ma?', 'What about her? Is she your classmate?'), turn('B', '她不是我同学，她是我朋友。', 'Tā bú shì wǒ tóngxué, tā shì wǒ péngyou.', 'No, she isn’t. She is my friend.')),
    ],
    words: words([
      ['她', 'tā', 'pronoun', 'she; her'], ['谁', 'shéi', 'pronoun', 'who; whom'], ['的', 'de', 'particle', 'possessive or descriptive particle'], ['汉语', 'Hànyǔ', 'noun', 'Chinese language'], ['哪', 'nǎ', 'pronoun', 'which'], ['国', 'guó', 'noun', 'country; nation'], ['呢', 'ne', 'particle', 'used at the end of a question'], ['他', 'tā', 'pronoun', 'he; him'], ['同学', 'tóngxué', 'noun', 'classmate'], ['朋友', 'péngyou', 'noun', 'friend'], ['李月', 'Lǐ Yuè', 'name', 'Li Yue (a person’s name)'], ['美国', 'Měiguó', 'proper noun', 'the United States; America'], ['中国', 'Zhōngguó', 'proper noun', 'China'],
    ]),
  },
  {
    id: 'lesson-5', number: '05', title: '她女儿今年二十岁', subtitle: 'Her daughter is 20 this year', topic: 'Family & ages',
    image: '/images/conversation-lesson-05.png', imageAlt: 'A family of three sitting together at home',
    caption: 'A family moment · 家庭时光', kicker: 'FAMILY & AGES', heroTitle: 'Ask about someone’s family.',
    intro: 'Ask how many people are in a family and how old someone’s daughter is.',
    exchanges: [
      exchange('01', 'Ask about family size', 'hello', turn('A', '你家有几口人？', 'Nǐ jiā yǒu jǐ kǒu rén?', 'How many people are there in your family?'), turn('B', '我家有三口人。', 'Wǒ jiā yǒu sān kǒu rén.', 'There are three people in my family.')),
      exchange('02', 'Ask a child’s age', 'polite', turn('A', '你女儿几岁了？', 'Nǐ nǚ’ér jǐ suì le?', 'How old is your daughter?'), turn('B', '她今年四岁了。', 'Tā jīnnián sì suì le.', 'She is four years old.')),
      exchange('03', 'Ask about a family member', 'sorry', turn('A', '李老师多大了？她女儿呢？', 'Lǐ lǎoshī duō dà le? Tā nǚ’ér ne?', 'How old is Professor Li? What about her daughter?'), turn('B', '她今年五十岁了。她女儿今年二十岁。', 'Tā jīnnián wǔshí suì le. Tā nǚ’ér jīnnián èrshí suì.', 'She is 50 this year. Her daughter is 20.')),
    ],
    words: words([
      ['家', 'jiā', 'noun', 'family; home'], ['有', 'yǒu', 'verb', 'to have; there is'], ['口', 'kǒu', 'measure word', 'measure word for family members'], ['女儿', 'nǚ’ér', 'noun', 'daughter'], ['几', 'jǐ', 'pronoun', 'how many; how much'], ['岁', 'suì', 'measure word', 'year of age'], ['了', 'le', 'particle', 'marks a change or new situation'], ['今年', 'jīnnián', 'noun', 'this year'], ['多', 'duō', 'adverb', 'indicating degree or extent'], ['大', 'dà', 'adjective', 'old (of age); big'],
    ]),
  },
  {
    id: 'lesson-6', number: '06', title: '我会说汉语', subtitle: 'I can speak Chinese', topic: 'Skills & food',
    image: '/images/conversation-lesson-06.png', imageAlt: 'Two learners preparing a simple Chinese meal together',
    caption: 'Practice together · 一起练习', kicker: 'WHAT YOU CAN DO', heroTitle: 'Talk about what you can do.',
    intro: 'Practice talking about speaking Chinese, cooking Chinese food, and writing characters.',
    exchanges: [
      exchange('01', 'Talk about speaking Chinese', 'hello', turn('A', '你会说汉语吗？', 'Nǐ huì shuō Hànyǔ ma?', 'Can you speak Chinese?'), turn('B', '我会说汉语。', 'Wǒ huì shuō Hànyǔ.', 'Yes, I can.'), turn('A', '你妈妈会说汉语吗？', 'Nǐ māma huì shuō Hànyǔ ma?', 'Can your mother speak Chinese?'), turn('B', '她不会说。', 'Tā bú huì shuō.', 'She can’t.')),
      exchange('02', 'Talk about cooking', 'polite', turn('A', '中国菜好吃吗？', 'Zhōngguó cài hǎochī ma?', 'Is Chinese food delicious?'), turn('B', '中国菜很好吃。', 'Zhōngguó cài hěn hǎochī.', 'Chinese food is delicious.'), turn('A', '你会做中国菜吗？', 'Nǐ huì zuò Zhōngguó cài ma?', 'Can you cook Chinese food?'), turn('B', '我不会做。', 'Wǒ bú huì zuò.', 'I can’t cook it.')),
      exchange('03', 'Ask how to write a character', 'sorry', turn('A', '你会写汉字吗？', 'Nǐ huì xiě Hànzì ma?', 'Can you write Chinese characters?'), turn('B', '我会写。', 'Wǒ huì xiě.', 'Yes, I can.'), turn('A', '这个字怎么写？', 'Zhège zì zěnme xiě?', 'How do you write this character?'), turn('B', '对不起，这个字我会读，不会写。', 'Duìbuqǐ, zhège zì wǒ huì dú, bú huì xiě.', 'Sorry, I can read this character, but I don’t know how to write it.')),
    ],
    words: words([
      ['会', 'huì', 'modal verb', 'can; to be able to'], ['说', 'shuō', 'verb', 'to speak; to say'], ['妈妈', 'māma', 'noun', 'mother'], ['菜', 'cài', 'noun', 'dish; cuisine'], ['很', 'hěn', 'adverb', 'very; quite'], ['好吃', 'hǎochī', 'adjective', 'delicious; tasty'], ['做', 'zuò', 'verb', 'to make; to cook'], ['写', 'xiě', 'verb', 'to write'], ['汉字', 'Hànzì', 'noun', 'Chinese character'], ['字', 'zì', 'noun', 'character; word'], ['怎么', 'zěnme', 'pronoun', 'how'], ['读', 'dú', 'verb', 'to read'],
    ]),
  },
  {
    id: 'lesson-7', number: '07', title: '今天几号', subtitle: 'What’s the date today?', topic: 'Dates & plans',
    image: '/images/conversation-lesson-07.png', imageAlt: 'A student checking a calendar at a desk in a bright classroom',
    caption: 'Plan your day · 安排日程', kicker: 'DATES & PLANS', heroTitle: 'Ask about dates and plans.',
    intro: 'Ask the date, talk about yesterday and tomorrow, and make a simple school plan.',
    exchanges: [
      exchange('01', 'Ask today’s date', 'hello', turn('A', '请问，今天几号？今天星期几？', 'Qǐngwèn, jīntiān jǐ hào? Jīntiān xīngqī jǐ?', 'Excuse me, what’s the date today? What day is it?'), turn('B', '今天九月一号。星期三。', 'Jīntiān jiǔ yuè yī hào. Xīngqī sān.', 'It’s September 1st. It’s Wednesday.')),
      exchange('02', 'Talk about yesterday and tomorrow', 'polite', turn('A', '昨天是几月几号？明天呢？', 'Zuótiān shì jǐ yuè jǐ hào? Míngtiān ne?', 'What was the date yesterday? What about tomorrow?'), turn('B', '昨天是八月三十一号，星期二。明天是九月二号，星期四。', 'Zuótiān shì bā yuè sānshíyī hào, xīngqī èr. Míngtiān shì jiǔ yuè èr hào, xīngqī sì.', 'It was Tuesday, August 31st. Tomorrow is Thursday, September 2nd.')),
      exchange('03', 'Make a plan to study', 'sorry', turn('A', '明天星期六，你去学校吗？你去学校做什么？', 'Míngtiān xīngqī liù, nǐ qù xuéxiào ma? Nǐ qù xuéxiào zuò shénme?', 'Tomorrow is Saturday. Will you go to school? What will you do there?'), turn('B', '我去学校。我去学校看书。', 'Wǒ qù xuéxiào. Wǒ qù xuéxiào kàn shū.', 'Yes, I will. I’m going to school to do some reading.')),
    ],
    words: words([
      ['请', 'qǐng', 'verb', 'please (polite)'], ['问', 'wèn', 'verb', 'to ask; to inquire'], ['今天', 'jīntiān', 'noun', 'today'], ['号', 'hào', 'noun', 'number (for dates)'], ['月', 'yuè', 'noun', 'month'], ['星期', 'xīngqī', 'noun', 'week; day of the week'], ['昨天', 'zuótiān', 'noun', 'yesterday'], ['明天', 'míngtiān', 'noun', 'tomorrow'], ['去', 'qù', 'verb', 'to go'], ['学校', 'xuéxiào', 'noun', 'school'], ['看', 'kàn', 'verb', 'to look at; to read'], ['书', 'shū', 'noun', 'book'],
    ]),
  },
  {
    id: 'lesson-8', number: '08', title: '我想喝茶', subtitle: 'I’d like some tea', topic: 'Food & shopping',
    image: '/images/conversation-lesson-08.png', imageAlt: 'Two friends looking at a tea menu together in a traditional tea house',
    caption: 'Tea and a meal · 茶与米饭', kicker: 'FOOD & SHOPPING', heroTitle: 'Say what you’d like.',
    intro: 'Choose a drink or something to eat, then ask how much an item costs.',
    exchanges: [
      exchange('01', 'Choose a drink and food', 'hello', turn('A', '你想喝什么？你想吃什么？', 'Nǐ xiǎng hē shénme? Nǐ xiǎng chī shénme?', 'What would you like to drink? What would you like to eat?'), turn('B', '我想喝茶。我想吃米饭。', 'Wǒ xiǎng hē chá. Wǒ xiǎng chī mǐfàn.', 'I’d like some tea. I’d like rice.')),
      exchange('02', 'Say what you want to buy', 'polite', turn('A', '下午你想做什么？你想买什么？', 'Xiàwǔ nǐ xiǎng zuò shénme? Nǐ xiǎng mǎi shénme?', 'What would you like to do this afternoon? What do you want to buy?'), turn('B', '下午我想去商店。我想买一个杯子。', 'Xiàwǔ wǒ xiǎng qù shāngdiàn. Wǒ xiǎng mǎi yí ge bēizi.', 'I’d like to go shopping. I want to buy a cup.')),
      exchange('03', 'Ask the price', 'sorry', turn('A', '你好！这个杯子多少钱？那个杯子多少钱？', 'Nǐ hǎo! Zhège bēizi duōshao qián? Nàge bēizi duōshao qián?', 'Hello! How much is this cup? What about that one?'), turn('B', '二十八块。那个杯子十八块钱。', 'Èrshíbā kuài. Nàge bēizi shíbā kuài qián.', '28 yuan. That cup is 18 yuan.')),
    ],
    words: words([
      ['想', 'xiǎng', 'modal verb', 'to want; would like'], ['喝', 'hē', 'verb', 'to drink'], ['茶', 'chá', 'noun', 'tea'], ['吃', 'chī', 'verb', 'to eat'], ['米饭', 'mǐfàn', 'noun', 'cooked rice'], ['下午', 'xiàwǔ', 'noun', 'afternoon'], ['商店', 'shāngdiàn', 'noun', 'shop; store'], ['买', 'mǎi', 'verb', 'to buy'], ['个', 'gè', 'measure word', 'general measure word'], ['杯子', 'bēizi', 'noun', 'cup; glass'], ['这', 'zhè', 'pronoun', 'this'], ['多少', 'duōshao', 'pronoun', 'how many; how much'], ['钱', 'qián', 'noun', 'money'], ['块', 'kuài', 'measure word', 'unit of money (yuan)'], ['那', 'nà', 'pronoun', 'that'],
    ]),
  },
  {
    id: 'lesson-9', number: '09', title: '你儿子在哪儿工作', subtitle: 'Where does your son work?', topic: 'Places & work',
    image: '/images/conversation-lesson-09.png', imageAlt: 'A doctor speaking with a family member at a hospital',
    caption: 'People at work · 工作与生活', kicker: 'PLACES & WORK', heroTitle: 'Ask where people are.',
    intro: 'Find out where a pet is, where someone works, and whether a family member is at home.',
    exchanges: [
      exchange('01', 'Find a pet at home', 'hello', turn('A', '小猫在哪儿？小狗在哪儿？', 'Xiǎo māo zài nǎr? Xiǎo gǒu zài nǎr?', 'Where is the kitty? Where is the puppy?'), turn('B', '小猫在那儿。小狗在椅子下面。', 'Xiǎo māo zài nàr. Xiǎo gǒu zài yǐzi xiàmiàn.', 'The kitty is over there. The puppy is under the chair.')),
      exchange('02', 'Ask where someone works', 'polite', turn('A', '你在哪儿工作？你儿子在哪儿工作？', 'Nǐ zài nǎr gōngzuò? Nǐ érzi zài nǎr gōngzuò?', 'Where do you work? Where does your son work?'), turn('B', '我在学校工作。我儿子在医院工作，他是医生。', 'Wǒ zài xuéxiào gōngzuò. Wǒ érzi zài yīyuàn gōngzuò, tā shì yīshēng.', 'I work in a school. My son works in a hospital. He is a doctor.')),
      exchange('03', 'Ask if someone is at home', 'sorry', turn('A', '你爸爸在家吗？他在哪儿呢？', 'Nǐ bàba zài jiā ma? Tā zài nǎr ne?', 'Is your father at home? Where is he?'), turn('B', '不在家。他在医院。', 'Bú zài jiā. Tā zài yīyuàn.', 'No, he isn’t. He is in the hospital.')),
    ],
    words: words([
      ['小', 'xiǎo', 'adjective', 'small; little'], ['猫', 'māo', 'noun', 'cat'], ['在', 'zài', 'verb/preposition', 'to be in, on, or at'], ['哪儿', 'nǎr', 'pronoun', 'where'], ['狗', 'gǒu', 'noun', 'dog'], ['椅子', 'yǐzi', 'noun', 'chair'], ['下面', 'xiàmiàn', 'noun', 'under; below'], ['工作', 'gōngzuò', 'verb/noun', 'to work; job'], ['儿子', 'érzi', 'noun', 'son'], ['医院', 'yīyuàn', 'noun', 'hospital'], ['医生', 'yīshēng', 'noun', 'doctor'], ['爸爸', 'bàba', 'noun', 'father'],
    ]),
  },
  {
    id: 'lesson-10', number: '10', title: '我能坐这儿吗', subtitle: 'Can I sit here?', topic: 'Objects & places',
    image: '/images/conversation-lesson-10.png', imageAlt: 'A student asking permission to sit in an empty chair in a library',
    caption: 'Make yourself comfortable · 请坐', kicker: 'THINGS & PLACES', heroTitle: 'Ask where things are.',
    intro: 'Describe what’s on a desk, ask about people nearby, and politely ask to sit down.',
    exchanges: [
      exchange('01', 'Talk about a desk', 'hello', turn('A', '桌子上有什么？杯子在哪儿？', 'Zhuōzi shàng yǒu shénme? Bēizi zài nǎr?', 'What is on the desk? Where is the cup?'), turn('B', '桌子上有一个电脑和一本书。杯子在桌子里。', 'Zhuōzi shàng yǒu yí ge diànnǎo hé yì běn shū. Bēizi zài zhuōzi lǐ.', 'There is a computer and a book on the desk. The cup is in the desk.')),
      exchange('02', 'Describe people nearby', 'polite', turn('A', '前面那个人叫什么名字？后面那个人呢？他叫什么名字？', 'Qiánmiàn nàge rén jiào shénme míngzi? Hòumiàn nàge rén ne? Tā jiào shénme míngzi?', 'Who is the person in front? What’s her name? What about the person in back? What’s his name?'), turn('B', '她叫王芳，在医院工作。他叫谢朋，在商店工作。', 'Tā jiào Wáng Fāng, zài yīyuàn gōngzuò. Tā jiào Xiè Péng, zài shāngdiàn gōngzuò.', 'She is Wang Fang. She works in a hospital. He is Xie Peng. He works in a store.')),
      exchange('03', 'Ask permission to sit', 'sorry', turn('A', '这儿有人吗？我能坐这儿吗？', 'Zhèr yǒu rén ma? Wǒ néng zuò zhèr ma?', 'Is this seat taken? Can I sit here?'), turn('B', '没有。请坐。', 'Méiyǒu. Qǐng zuò.', 'No, it isn’t. Please sit down.')),
    ],
    words: words([
      ['桌子', 'zhuōzi', 'noun', 'desk; table'], ['上', 'shàng', 'noun', 'up; above'], ['电脑', 'diànnǎo', 'noun', 'computer'], ['和', 'hé', 'conjunction', 'and'], ['本', 'běn', 'measure word', 'measure word for books'], ['里', 'lǐ', 'noun', 'inside; interior'], ['前面', 'qiánmiàn', 'noun', 'front'], ['后面', 'hòumiàn', 'noun', 'back'], ['这儿', 'zhèr', 'pronoun', 'here'], ['没有', 'méiyǒu', 'adverb', 'there is not; do not have'], ['能', 'néng', 'modal verb', 'can; may'], ['坐', 'zuò', 'verb', 'to sit'], ['王芳', 'Wáng Fāng', 'name', 'Wang Fang (a person’s name)'], ['谢朋', 'Xiè Péng', 'name', 'Xie Peng (a person’s name)'],
    ]),
  },
  {
    id: 'lesson-11', number: '11', title: '现在几点', subtitle: 'What’s the time now?', topic: 'Time & plans',
    image: '/images/conversation-lesson-11.png', imageAlt: 'A family checking the time together at home',
    caption: 'Plan your day · 安排时间', kicker: 'TIME & PLANS', heroTitle: 'Talk about time and plans.',
    intro: 'Ask the time, plan a meal or a movie, and talk about a short trip to Beijing.',
    exchanges: [
      exchange('01', 'Ask the time and meal time', 'hello', turn('A', '现在几点？中午几点吃饭？', 'Xiànzài jǐ diǎn? Zhōngwǔ jǐ diǎn chīfàn?', 'What time is it now? When shall we have lunch?'), turn('B', '现在十点十分。十二点吃饭。', 'Xiànzài shí diǎn shí fēn. Shí’èr diǎn chīfàn.', 'It’s ten past ten. We’ll eat at twelve.')),
      exchange('02', 'Make plans for the evening', 'polite', turn('A', '爸爸什么时候回家？我们什么时候去看电影？', 'Bàba shénme shíhou huí jiā? Wǒmen shénme shíhou qù kàn diànyǐng?', 'When is Dad coming home? When are we going to see the movie?'), turn('B', '下午五点。六点半。', 'Xiàwǔ wǔ diǎn. Liù diǎn bàn.', 'At five in the afternoon. At half past six.')),
      exchange('03', 'Talk about a trip', 'sorry', turn('A', '我星期一去北京。你想在北京住几天？星期五前能回家吗？', 'Wǒ xīngqīyī qù Běijīng. Nǐ xiǎng zài Běijīng zhù jǐ tiān? Xīngqīwǔ qián néng huí jiā ma?', 'I’ll go to Beijing next Monday. How long will you stay? Can you come back before Friday?'), turn('B', '住三天。能。', 'Zhù sān tiān. Néng.', 'For three days. Yes, I can.')),
    ],
    words: words([
      ['现在', 'xiànzài', 'noun', 'now'], ['点', 'diǎn', 'measure word', 'o’clock'], ['分', 'fēn', 'measure word', 'minute'], ['中午', 'zhōngwǔ', 'noun', 'noon'], ['吃饭', 'chīfàn', 'verb', 'to eat a meal'], ['时候', 'shíhou', 'noun', 'time; moment'], ['回', 'huí', 'verb', 'to return; to come back'], ['我们', 'wǒmen', 'pronoun', 'we; us'], ['电影', 'diànyǐng', 'noun', 'film; movie'], ['住', 'zhù', 'verb', 'to live; to stay'], ['前', 'qián', 'noun', 'before; earlier than'], ['北京', 'Běijīng', 'proper noun', 'Beijing, capital of China'],
    ]),
  },
  {
    id: 'lesson-12', number: '12', title: '明天天气怎么样', subtitle: 'What will the weather be like tomorrow?', topic: 'Weather & health',
    image: '/images/conversation-lesson-12.png', imageAlt: 'A woman checking the cloudy, rainy weather outdoors',
    caption: 'Look up at the sky · 天气变化', kicker: 'WEATHER & HEALTH', heroTitle: 'Ask about the weather.',
    intro: 'Talk about hot and cold weather, whether it may rain, and how someone is feeling.',
    exchanges: [
      exchange('01', 'Compare yesterday and tomorrow', 'hello', turn('A', '昨天北京的天气怎么样？明天呢？明天天气怎么样？', 'Zuótiān Běijīng de tiānqì zěnmeyàng? Míngtiān ne? Míngtiān tiānqì zěnmeyàng?', 'How was the weather in Beijing yesterday? What about tomorrow?'), turn('B', '太热了。明天天气很好，不冷不热。', 'Tài rè le. Míngtiān tiānqì hěn hǎo, bù lěng bú rè.', 'It was too hot. Tomorrow will be fine, neither cold nor hot.')),
      exchange('02', 'Ask whether it will rain', 'polite', turn('A', '今天会下雨吗？王小姐今天会来吗？', 'Jīntiān huì xià yǔ ma? Wáng xiǎojiě jīntiān huì lái ma?', 'Will it rain today? Will Miss Wang come today?'), turn('B', '今天不会下雨。不会来，天气太冷了。', 'Jīntiān bú huì xià yǔ. Bú huì lái, tiānqì tài lěng le.', 'No, it won’t rain. She won’t come; it’s too cold.')),
      exchange('03', 'Talk with a doctor', 'sorry', turn('A', '你身体怎么样？你多吃些水果，多喝水。', 'Nǐ shēntǐ zěnmeyàng? Nǐ duō chī xiē shuǐguǒ, duō hē shuǐ.', 'How are you? Eat more fruit and drink more water.'), turn('B', '我身体不太好。天气太热了，不爱吃饭。谢谢你，医生。', 'Wǒ shēntǐ bú tài hǎo. Tiānqì tài rè le, bú ài chīfàn. Xièxie nǐ, yīshēng.', 'I’m not very well. It’s too hot and I have no appetite. Thank you, doctor.')),
    ],
    words: words([
      ['天气', 'tiānqì', 'noun', 'weather'], ['怎么样', 'zěnmeyàng', 'pronoun', 'how; in what way'], ['太……了', 'tài…le', 'pattern', 'too; extremely'], ['热', 'rè', 'adjective', 'hot'], ['冷', 'lěng', 'adjective', 'cold'], ['下雨', 'xià yǔ', 'verb', 'to rain'], ['下', 'xià', 'verb', 'to fall'], ['雨', 'yǔ', 'noun', 'rain'], ['小姐', 'xiǎojiě', 'noun', 'miss; young lady'], ['来', 'lái', 'verb', 'to come'], ['身体', 'shēntǐ', 'noun', 'body; health'], ['爱', 'ài', 'verb', 'to like; to love'], ['些', 'xiē', 'measure word', 'some; a few'], ['水果', 'shuǐguǒ', 'noun', 'fruit'], ['水', 'shuǐ', 'noun', 'water'], ['医生', 'yīshēng', 'noun', 'doctor'], ['王小姐', 'Wáng xiǎojiě', 'name', 'Miss Wang'],
    ]),
  },
  {
    id: 'lesson-13', number: '13', title: '他在学做中国菜呢', subtitle: 'He is learning to cook Chinese food', topic: 'Daily activities',
    image: '/images/conversation-lesson-13.png', imageAlt: 'A student learning to cook a Chinese vegetable dish with a chef',
    caption: 'Learning by doing · 动手学习', kicker: 'DAILY ACTIVITIES', heroTitle: 'Say what you’re doing.',
    intro: 'Talk about reading, sleeping, watching a film, learning to cook, and making a phone call.',
    exchanges: [
      exchange('01', 'Talk about what you’re doing', 'hello', turn('A', '喂，你在做什么呢？大卫也在看书吗？', 'Wèi, nǐ zài zuò shénme ne? Dàwèi yě zài kàn shū ma?', 'Hello, what are you doing? Is David reading too?'), turn('B', '我在看书呢。他没看书，他在学做中国菜呢。', 'Wǒ zài kàn shū ne. Tā méi kàn shū, tā zài xué zuò Zhōngguó cài ne.', 'I’m reading. No, he isn’t. He is learning to cook Chinese food.')),
      exchange('02', 'Talk about yesterday morning', 'polite', turn('A', '昨天上午你在做什么呢？你喜欢看电视吗？', 'Zuótiān shàngwǔ nǐ zài zuò shénme ne? Nǐ xǐhuan kàn diànshì ma?', 'What were you doing yesterday morning? Do you like watching TV?'), turn('B', '我在睡觉呢。我在家看电视呢。我不喜欢看电视，我喜欢看电影。', 'Wǒ zài shuìjiào ne. Wǒ zài jiā kàn diànshì ne. Wǒ bù xǐhuan kàn diànshì, wǒ xǐhuan kàn diànyǐng.', 'I was sleeping. I was watching TV at home. I don’t like TV; I like movies.')),
      exchange('03', 'Make a phone call', 'sorry', turn('A', '八二三零四一五五，这是李老师的电话吗？好，我现在给她打电话。', 'Bā èr sān líng sì yī wǔ wǔ, zhè shì Lǐ lǎoshī de diànhuà ma? Hǎo, wǒ xiànzài gěi tā dǎ diànhuà.', '82304155. Is this Ms. Li’s phone number? OK, I’ll call her right now.'), turn('B', '不是。她的电话是八二三零四一五六。她在工作呢，你下午打吧。', 'Bú shì. Tā de diànhuà shì bā èr sān líng sì yī wǔ wǔ liù. Tā zài gōngzuò ne, nǐ xiàwǔ dǎ ba.', 'No. Her number is 82304156. She is working. Call her in the afternoon.')),
    ],
    words: words([
      ['喂', 'wèi', 'interjection', 'hello (on the phone)'], ['也', 'yě', 'adverb', 'also; too'], ['学习', 'xuéxí', 'verb', 'to study; to learn'], ['大卫', 'Dàwèi', 'name', 'David'], ['上午', 'shàngwǔ', 'noun', 'morning; before noon'], ['睡觉', 'shuìjiào', 'verb', 'to sleep'], ['电视', 'diànshì', 'noun', 'television'], ['喜欢', 'xǐhuan', 'verb', 'to like'], ['给', 'gěi', 'preposition', 'to; for'], ['打电话', 'dǎ diànhuà', 'verb', 'to make a phone call'], ['吧', 'ba', 'particle', 'softens a suggestion or request'],
    ]),
  },
  {
    id: 'lesson-14', number: '14', title: '她买了不少衣服', subtitle: 'She has bought quite a few clothes', topic: 'Shopping & clothes',
    image: '/images/conversation-lesson-14.png', imageAlt: 'A woman shopping for apples and carrying shopping bags',
    caption: 'A day of shopping · 购物的一天', kicker: 'SHOPPING & CLOTHES', heroTitle: 'Talk about what you bought.',
    intro: 'Say where you went, what you bought, and ask when someone will return.',
    exchanges: [
      exchange('01', 'Talk about shopping', 'hello', turn('A', '昨天上午你去哪儿了？你买什么了？', 'Zuótiān shàngwǔ nǐ qù nǎr le? Nǐ mǎi shénme le?', 'Where did you go yesterday morning? What did you buy?'), turn('B', '我去商店买东西了。我买了一点儿苹果。', 'Wǒ qù shāngdiàn mǎi dōngxi le. Wǒ mǎi le yìdiǎnr píngguǒ.', 'I went shopping. I bought a few apples.')),
      exchange('02', 'Ask when someone will return', 'polite', turn('A', '你看见张先生了吗？他什么时候能回来？', 'Nǐ kànjiàn Zhāng xiānsheng le ma? Tā shénme shíhou néng huílái?', 'Have you seen Mr. Zhang? When can he come back?'), turn('B', '看见了，他去学开车了。四十分钟后回来。', 'Kànjiàn le, tā qù xué kāi chē le. Sìshí fēnzhōng hòu huílái.', 'Yes. He went to a driving lesson. He’ll be back in 40 minutes.')),
      exchange('03', 'Talk about new clothes', 'sorry', turn('A', '王芳的衣服太漂亮了！你买什么了？', 'Wáng Fāng de yīfu tài piàoliang le! Nǐ mǎi shénme le?', 'Wang Fang’s clothes are so pretty! What did you buy?'), turn('B', '是啊，她买了不少衣服。我没买，这些都是王芳的东西。', 'Shì a, tā mǎi le bù shǎo yīfu. Wǒ méi mǎi, zhèxiē dōu shì Wáng Fāng de dōngxi.', 'Yes, she bought quite a few clothes. I bought nothing; all these things are Wang Fang’s.')),
    ],
    words: words([
      ['东西', 'dōngxi', 'noun', 'thing; stuff'], ['一点儿', 'yìdiǎnr', 'measure word', 'a few; a little'], ['苹果', 'píngguǒ', 'noun', 'apple'], ['看见', 'kànjiàn', 'verb', 'to see'], ['先生', 'xiānsheng', 'noun', 'Mr.; sir'], ['开', 'kāi', 'verb', 'to drive; to open'], ['车', 'chē', 'noun', 'car; vehicle'], ['回来', 'huílái', 'verb', 'to come back'], ['分钟', 'fēnzhōng', 'noun', 'minute'], ['后', 'hòu', 'noun', 'after; later'], ['衣服', 'yīfu', 'noun', 'clothes'], ['漂亮', 'piàoliang', 'adjective', 'beautiful; pretty'], ['啊', 'a', 'particle', 'expresses confirmation or emphasis'], ['少', 'shǎo', 'adjective', 'few; little'], ['不少', 'bù shǎo', 'adjective', 'quite a few; many'], ['这些', 'zhèxiē', 'pronoun', 'these'], ['都', 'dōu', 'adverb', 'both; all'], ['张', 'Zhāng', 'family name', 'Zhang (a Chinese family name)'], ['王芳', 'Wáng Fāng', 'name', 'Wang Fang (a person’s name)'],
    ]),
  },
  {
    id: 'lesson-15', number: '15', title: '我是坐飞机来的', subtitle: 'I came here by air', topic: 'Travel & meeting people',
    image: '/images/conversation-lesson-15.png', imageAlt: 'A traveler arriving at an airport and greeting a friend',
    caption: 'A warm welcome · 欢迎到来', kicker: 'TRAVEL & MEETING PEOPLE', heroTitle: 'Talk about how you arrived.',
    intro: 'Ask when and where people met, how they travelled, and share a warm greeting.',
    exchanges: [
      exchange('01', 'Talk about when you met', 'hello', turn('A', '你和李小姐是什么时候认识的？你们在哪儿认识的？', 'Nǐ hé Lǐ xiǎojiě shì shénme shíhou rènshi de? Nǐmen zài nǎr rènshi de?', 'When did you and Miss Li first meet? Where did you meet each other?'), turn('B', '我们是二零一一年九月认识的。我们是在学校认识的，她是我的大学同学。', 'Wǒmen shì èr líng yī yī nián jiǔ yuè rènshi de. Wǒmen shì zài xuéxiào rènshi de, tā shì wǒ de dàxué tóngxué.', 'We met in September 2011. We met at our university. She was my classmate.')),
      exchange('02', 'Ask how someone came', 'polite', turn('A', '你们是怎么来饭店的？李先生呢？', 'Nǐmen shì zěnme lái fàndiàn de? Lǐ xiānsheng ne?', 'How did you come to the restaurant? What about Mr. Li?'), turn('B', '我们是坐出租车来的。他是和朋友一起开车来的。', 'Wǒmen shì zuò chūzūchē lái de. Tā shì hé péngyou yìqǐ kāi chē lái de.', 'We came by taxi. He drove here with a friend.')),
      exchange('03', 'Greet someone warmly', 'sorry', turn('A', '很高兴认识您！李小姐。听张先生说，您是坐飞机来北京的吗？', 'Hěn gāoxìng rènshi nín! Lǐ xiǎojiě. Tīng Zhāng xiānsheng shuō, nín shì zuò fēijī lái Běijīng de ma?', 'Nice to meet you, Miss Li! Mr. Zhang said you came to Beijing by plane, didn’t you?'), turn('B', '认识你我也很高兴！是的。', 'Rènshi nǐ wǒ yě hěn gāoxìng! Shì de.', 'Nice to meet you too! Yes, I did.')),
    ],
    words: words([
      ['认识', 'rènshi', 'verb', 'to meet; to know'], ['年', 'nián', 'noun', 'year'], ['大学', 'dàxué', 'noun', 'college; university'], ['饭店', 'fàndiàn', 'noun', 'restaurant; hotel'], ['出租车', 'chūzūchē', 'noun', 'taxi; cab'], ['一起', 'yìqǐ', 'adverb', 'together'], ['高兴', 'gāoxìng', 'adjective', 'glad; happy'], ['听', 'tīng', 'verb', 'to listen; to hear'], ['飞机', 'fēijī', 'noun', 'airplane'], ['李小姐', 'Lǐ xiǎojiě', 'name', 'Miss Li'], ['张先生', 'Zhāng xiānsheng', 'name', 'Mr. Zhang'], ['北京', 'Běijīng', 'proper noun', 'Beijing'],
    ]),
  },
];
