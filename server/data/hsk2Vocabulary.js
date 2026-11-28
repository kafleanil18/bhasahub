/* HSK 2 syllabus words from the HSK Standard Course 2 vocabulary index (lesson number in `lesson`),
   grouped into themed lessons like the HSK 1 course. Glosses are written for BhashaHub. */
const word = (word, pronunciation, meaning, lesson) => ({ word, pronunciation, meaning, lesson });

const lessons = [
  { title: 'Daily Routine & Health', words: [
    word('起床', 'qǐ chuáng', 'to get up', 2), word('早上', 'zǎo shang', 'morning', 2), word('晚上', 'wǎn shang', 'evening; night', 4),
    word('时间', 'shí jiān', 'time', 2), word('小时', 'xiǎo shí', 'hour', 7), word('每', 'měi', 'every; each', 2),
    word('休息', 'xiū xi', 'to rest', 2), word('忙', 'máng', 'busy', 2), word('生病', 'shēng bìng', 'to get sick', 2),
    word('身体', 'shēn tǐ', 'body; health', 2), word('药', 'yào', 'medicine', 2), word('跑步', 'pǎo bù', 'to run; to jog', 2),
    word('运动', 'yùn dòng', 'sport; to exercise', 1), word('上班', 'shàng bān', 'to go to work', 9), word('课', 'kè', 'class; lesson', 10),
    word('考试', 'kǎo shì', 'exam; to take an exam', 5), word('准备', 'zhǔn bèi', 'to prepare; to plan to', 5), word('开始', 'kāi shǐ', 'to begin', 4),
    word('已经', 'yǐ jīng', 'already', 4),
  ] },
  { title: 'Family & People', words: [
    word('哥哥', 'gē ge', 'older brother', 10), word('姐姐', 'jiě jie', 'older sister', 6), word('弟弟', 'dì di', 'younger brother', 12),
    word('妹妹', 'mèi mei', 'younger sister', 15), word('丈夫', 'zhàng fu', 'husband', 3), word('妻子', 'qī zi', 'wife', 12),
    word('孩子', 'hái zi', 'child', 11), word('男', 'nán', 'male', 11), word('女', 'nǚ', 'female', 11),
    word('大家', 'dà jiā', 'everybody', 15), word('服务员', 'fú wù yuán', 'waiter; attendant', 8), word('姓', 'xìng', 'to be surnamed; surname', 11),
    word('介绍', 'jiè shào', 'to introduce; to recommend', 4), word('生日', 'shēng rì', 'birthday', 4), word('快乐', 'kuài lè', 'happy', 4),
    word('它', 'tā', 'it', 1), word('眼睛', 'yǎn jing', 'eye', 1),
  ] },
  { title: 'Food, Shopping & Things', words: [
    word('鱼', 'yú', 'fish', 5), word('羊肉', 'yáng ròu', 'mutton; lamb', 6), word('面条', 'miàn tiáo', 'noodles', 6),
    word('鸡蛋', 'jī dàn', 'egg', 10), word('西瓜', 'xī guā', 'watermelon', 10), word('牛奶', 'niú nǎi', 'milk', 3),
    word('咖啡', 'kā fēi', 'coffee', 5), word('好吃', 'hǎo chī', 'delicious', 6), word('贵', 'guì', 'expensive', 8),
    word('便宜', 'pián yi', 'cheap', 11), word('件', 'jiàn', 'measure word for clothes and matters', 5), word('手表', 'shǒu biǎo', 'wristwatch', 3),
    word('报纸', 'bào zhǐ', 'newspaper', 3), word('手机', 'shǒu jī', 'mobile phone', 10), word('铅笔', 'qiān bǐ', 'pencil', 13),
    word('送', 'sòng', 'to give (as a gift); to deliver', 3), word('千', 'qiān', 'thousand', 3), word('百', 'bǎi', 'hundred', 14),
  ] },
  { title: 'Places & Travel', words: [
    word('旅游', 'lǚ yóu', 'to travel; tourism', 1), word('机场', 'jī chǎng', 'airport', 7), word('火车站', 'huǒ chē zhàn', 'railway station', 15),
    word('公共汽车', 'gōng gòng qì chē', 'bus', 7), word('宾馆', 'bīn guǎn', 'hotel', 13), word('公司', 'gōng sī', 'company', 7),
    word('教室', 'jiào shì', 'classroom', 7), word('房间', 'fáng jiān', 'room', 3), word('门', 'mén', 'door; gate', 6),
    word('路', 'lù', 'road; way', 7), word('票', 'piào', 'ticket', 15), word('远', 'yuǎn', 'far', 7),
    word('近', 'jìn', 'near', 12), word('离', 'lí', 'to be away from', 7), word('到', 'dào', 'to arrive; to reach', 7),
    word('走', 'zǒu', 'to walk; to leave', 7), word('进', 'jìn', 'to enter', 12), word('出', 'chū', 'to go out; to come out', 2),
    word('往', 'wǎng', 'towards', 13),
  ] },
  { title: 'Position, Color & Description', words: [
    word('左边', 'zuǒ bian', 'left side', 3), word('右边', 'yòu bian', 'right side', 11), word('旁边', 'páng biān', 'beside', 3),
    word('外', 'wài', 'outside', 6), word('颜色', 'yán sè', 'color', 3), word('红', 'hóng', 'red', 3),
    word('白', 'bái', 'white', 8), word('黑', 'hēi', 'black', 8), word('高', 'gāo', 'tall; high', 2),
    word('长', 'cháng', 'long', 4), word('新', 'xīn', 'new', 1), word('快', 'kuài', 'fast', 7),
    word('慢', 'màn', 'slow', 7), word('错', 'cuò', 'wrong', 9), word('第一', 'dì yī', 'first', 9),
    word('两', 'liǎng', 'two (before measure words)', 4), word('零', 'líng', 'zero', 12),
  ] },
  { title: 'Weather, Dates & Free Time', words: [
    word('晴', 'qíng', 'sunny; clear', 14), word('阴', 'yīn', 'cloudy; overcast', 15), word('雪', 'xuě', 'snow', 12),
    word('去年', 'qù nián', 'last year', 11), word('日', 'rì', 'day; date (written)', 15), word('唱歌', 'chàng gē', 'to sing', 11),
    word('跳舞', 'tiào wǔ', 'to dance', 9), word('游泳', 'yóu yǒng', 'to swim', 6), word('打篮球', 'dǎ lán qiú', 'to play basketball', 6),
    word('踢足球', 'tī zú qiú', 'to play football', 1), word('玩儿', 'wánr', 'to play; to have fun', 14), word('笑', 'xiào', 'to smile; to laugh', 13),
    word('说话', 'shuō huà', 'to speak; to talk', 11), word('洗', 'xǐ', 'to wash', 10), word('穿', 'chuān', 'to wear; to put on', 12),
  ] },
  { title: 'Thinking & Communicating', words: [
    word('觉得', 'jué de', 'to think; to feel', 1), word('知道', 'zhī dào', 'to know', 2), word('懂', 'dǒng', 'to understand', 9),
    word('希望', 'xī wàng', 'to hope', 9), word('告诉', 'gào su', 'to tell', 8), word('问', 'wèn', 'to ask', 4),
    word('问题', 'wèn tí', 'question; problem', 9), word('题', 'tí', 'question (on a test)', 9), word('意思', 'yì si', 'meaning', 5),
    word('事情', 'shì qing', 'matter; thing', 8), word('找', 'zhǎo', 'to look for', 8), word('等', 'děng', 'to wait', 8),
    word('让', 'ràng', 'to let; to ask (someone to do)', 8), word('帮助', 'bāng zhù', 'to help', 10), word('要', 'yào', 'to want to', 1),
    word('可能', 'kě néng', 'maybe; possibly', 11), word('可以', 'kě yǐ', 'not bad; okay', 5),
  ] },
  { title: 'Linking & Grammar Words', words: [
    word('吧', 'ba', 'particle for suggestions', 5), word('也', 'yě', 'also; too', 1), word('最', 'zuì', 'most', 1),
    word('真', 'zhēn', 'really', 3), word('还', 'hái', 'still; fairly', 5), word('就', 'jiù', 'then; just; as early as', 5),
    word('再', 'zài', 'again; then', 8), word('别', 'bié', 'don’t', 10), word('非常', 'fēi cháng', 'extremely', 4),
    word('正在', 'zhèng zài', 'in the middle of (doing)', 10), word('一起', 'yì qǐ', 'together', 1), word('一下', 'yí xià', 'briefly; a bit (after a verb)', 3),
    word('着', 'zhe', 'particle for a lasting state', 13), word('得', 'de', 'particle before a complement of degree', 12), word('给', 'gěi', 'to; for', 4),
    word('对', 'duì', 'to; towards', 5), word('从', 'cóng', 'from', 9), word('比', 'bǐ', 'than (in comparisons)', 11),
    word('次', 'cì', 'time (occurrence)', 14), word('为什么', 'wèi shén me', 'why', 1), word('因为', 'yīn wèi', 'because', 6),
    word('所以', 'suǒ yǐ', 'so; therefore', 6), word('虽然', 'suī rán', 'although', 14), word('但是', 'dàn shì', 'but', 14),
    word('完', 'wán', 'to finish', 9),
  ] },
];

module.exports = { key: 'bhashahub-hsk2-vocabulary-v1', lessons };
