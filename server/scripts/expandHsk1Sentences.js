// Add 1,000 original beginner sentences using curated, grammatically compatible
// subjects, activities, and objects. Existing IDs and content are preserved.
// Run normally to rebuild the expansion; --check verifies it without writing.
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '../data/hsk1Sentences.json');
const catalog = JSON.parse(fs.readFileSync(file, 'utf8'));
const original = catalog.sentences.slice(0, 300);
const topics = catalog.topics.slice(0, 20);
if (original.length !== 300 || topics.length !== 20) throw new Error('The original 300-sentence bank is required.');
const lexicon = {};
for (const sentence of original) sentence.tokens.forEach((token, index) => { lexicon[token] = sentence.tokenPinyin[index]; });
Object.assign(lexicon, {
  一: ['yī'], 二: ['èr'], 台: ['tái'], 不: ['bù'], 打: ['dǎ'], 电话: ['diàn', 'huà'], 住: ['zhù'], 能: ['néng'],
  星期三: ['xīng', 'qī', 'sān'], 星期四: ['xīng', 'qī', 'sì'], 星期天: ['xīng', 'qī', 'tiān'],
});
const P = [
  { t: '我', en: 'I', obj: 'me', possessive: 'my', be: 'am' },
  { t: '你', en: 'you', obj: 'you', possessive: 'your', be: 'are' },
  { t: '他', en: 'he', obj: 'him', possessive: 'his', be: 'is', third: true },
  { t: '她', en: 'she', obj: 'her', possessive: 'her', be: 'is', third: true },
  { t: '我们', en: 'we', obj: 'us', possessive: 'our', be: 'are' },
  { t: '他们', en: 'they', obj: 'them', possessive: 'their', be: 'are' },
];
const single = P.slice(0, 4);
const words = value => value.trim().split(/\s+/);
const cap = value => value[0].toUpperCase() + value.slice(1);
const conjugate = (verb, subject) => !subject.third ? verb : ({ have: 'has', do: 'does', go: 'goes', study: 'studies' }[verb] || `${verb}${/(?:s|x|ch|sh|o)$/.test(verb) ? 'es' : 's'}`);
const say = (subject, verb, rest) => `${subject.en} ${conjugate(verb, subject)} ${rest}`.trim();
const ask = (subject, verb, rest) => `${subject.third ? 'does' : 'do'} ${subject.en} ${verb} ${rest}?`;
const negative = (subject, verb, rest) => `${subject.en} ${subject.third ? 'does' : 'do'} not ${verb} ${rest}`;
const sentence = (tokens, english, acceptedOrders) => ({ tokens: words(tokens), english: cap(english.replace(/[. ]+$/, '')) + (english.endsWith('?') ? '' : '.'), ...(acceptedOrders ? { acceptedOrders: acceptedOrders.map(words) } : {}) });
function matrix(left, right, build) {
  const result = [];
  for (let offset = 0; offset < right.length; offset++) {
    for (let index = 0; index < left.length; index++) result.push(build(left[index], right[(index + offset) % right.length], index, offset));
  }
  return result.flat();
}
const places = [
  { t: '家', en: 'home', at: 'at home' }, { t: '学校', en: 'school', at: 'at school' },
  { t: '商店', en: 'the shop', at: 'at the shop' }, { t: '饭店', en: 'the restaurant', at: 'at the restaurant' },
  { t: '医院', en: 'the hospital', at: 'at the hospital' }, { t: '北京', en: 'Beijing', at: 'in Beijing' },
];
const times = [
  { t: '今天', en: 'today' }, { t: '明天', en: 'tomorrow' }, { t: '上午', en: 'in the morning' },
  { t: '下午', en: 'in the afternoon' }, { t: '星期六', en: 'on Saturday' }, { t: '星期日', en: 'on Sunday' },
];
const items = [
  { t: '书', en: 'books', unit: '本' }, { t: '杯子', en: 'cups', unit: '个' },
  { t: '苹果', en: 'apples', unit: '个' }, { t: '电脑', en: 'computers', unit: '台' },
  { t: '衣服', en: 'pieces of clothing', unit: '件' }, { t: '椅子', en: 'chairs', unit: '把' },
];
const numbers = [{ t: '两', en: 'two' }, { t: '三', en: 'three' }, { t: '五', en: 'five' }, { t: '六', en: 'six' }, { t: '八', en: 'eight' }, { t: '十', en: 'ten' }];
const ages = [{ t: '三', en: 'three' }, { t: '五', en: 'five' }, { t: '六', en: 'six' }, { t: '八', en: 'eight' }, { t: '十', en: 'ten' }, { t: '十二', en: 'twelve' }];
const study = [
  { t: '学习 汉语', v: 'study', rest: 'Chinese', ing: 'studying Chinese' },
  { t: '写 汉字', v: 'write', rest: 'Chinese characters', ing: 'writing Chinese characters' },
  { t: '看 书', v: 'read', rest: 'books', ing: 'reading books' },
  { t: '读 这 本 书', v: 'read', rest: 'this book aloud', ing: 'reading this book aloud' },
  { t: '写 名字', v: 'write', rest: 'names', ing: 'writing names' },
  { t: '听 老师 说话', v: 'listen', rest: 'to the teacher speaking', ing: 'listening to the teacher speaking' },
];
const activities = [
  { t: '看 书', v: 'read', rest: 'books', ing: 'reading books' },
  { t: '看 电视', v: 'watch', rest: 'television', ing: 'watching television' },
  { t: '吃 饭', v: 'eat', rest: 'a meal', ing: 'eating a meal' },
  { t: '喝 茶', v: 'drink', rest: 'tea', ing: 'drinking tea' },
  { t: '学习 汉语', v: 'study', rest: 'Chinese', ing: 'studying Chinese' },
  { t: '写 汉字', v: 'write', rest: 'Chinese characters', ing: 'writing Chinese characters' },
];
const sentences = [...original];
const seen = new Set(original.map(row => row.chinese));
function addTopic(id, title, explanation, candidates) {
  const topicId = `more-${id}`;
  const added = [];
  for (const candidate of candidates) {
    const chinese = candidate.tokens.join('') + (candidate.english.endsWith('?') ? '？' : '。');
    if (seen.has(chinese)) continue;
    if (candidate.tokens.length < 3) throw new Error(`Too few tiles: ${chinese}`);
    if (candidate.tokens[1] === '和') {
      const alternative = [candidate.tokens[2], '和', candidate.tokens[0], ...candidate.tokens.slice(3)];
      candidate.acceptedOrders = [...(candidate.acceptedOrders || []), alternative];
    }
    const tokenPinyin = candidate.tokens.map(token => {
      if (!lexicon[token]) throw new Error(`Missing word reading: ${token}`);
      return [...lexicon[token]];
    });
    candidate.tokens.forEach((token, index) => {
      const next = tokenPinyin[index + 1]?.[0] || '';
      if (token === '不') tokenPinyin[index] = [/[àèìòùǜ]/.test(next) ? 'bú' : 'bù'];
      if (token === '一' && next) tokenPinyin[index] = [/[àèìòùǜ]/.test(next) || candidate.tokens[index + 1] === '个' ? 'yí' : 'yì'];
    });
    const proper = new Set(['中国', '中国人', '北京', '小王', '小李', '小张', '汉语', '汉字']);
    const plain = value => value.normalize('NFD').replace(/\p{M}/gu, '');
    const pinyin = cap(tokenPinyin.map((readings, index) => {
      const word = readings.map((reading, n) => `${n && /^[aeo]/.test(plain(reading)) ? "'" : ''}${reading}`).join('');
      return proper.has(candidate.tokens[index]) ? cap(word) : word;
    }).join(' ')) + (candidate.english.endsWith('?') ? '?' : '.');
    const number = sentences.length + added.length + 1;
    added.push({ id: `hsk1-${String(number).padStart(3, '0')}`, number, topicId, ...candidate, chinese, pinyin, explanation, tokenPinyin });
    seen.add(chinese);
    if (added.length === 25) break;
  }
  if (added.length !== 25) throw new Error(`${title}: expected 25 unique new sentences, found ${added.length}`);
  topics.push({ id: topicId, title, explanation });
  sentences.push(...added);
}

const roles = [{ t: '学生', en: 'a student' }, { t: '老师', en: 'a teacher' }, { t: '医生', en: 'a doctor' }, { t: '中国人', en: 'Chinese' }];
addTopic('identity', 'Talking about who people are', 'Use 是 before a noun or identity. Put 不 before 是; add 吗 at the end to ask a yes-or-no question.', matrix(single, roles, (p, role) => [
  sentence(`${p.t} 不 是 ${role.t}`, `${p.en} ${p.be} not ${role.en}`),
  ...(p.en === 'I' ? [] : [sentence(`${p.t} 是 ${role.t} 吗`, `${p.be} ${p.en} ${role.en}?`)]),
  sentence(`${p.t} 的 朋友 是 ${role.t}`, `${p.possessive} friend is ${role.en}`),
]));
const knownPeople = [{ t: '小王', en: 'Xiao Wang' }, { t: '小李', en: 'Xiao Li' }, { t: '小张', en: 'Xiao Zhang' }, { t: '我 的 老师', en: 'my teacher' }, { t: '你 的 朋友', en: 'your friend' }, { t: '这 个 学生', en: 'this student' }];
addTopic('meeting', 'People you know', 'Place 认识 before the person you know. Use 不认识 for not knowing someone, and add 吗 for a question.', matrix(P, knownPeople, (p, person, i, offset) => p.en === 'I' || (i + offset) % 2
  ? sentence(`${p.t} 不 认识 ${person.t}`, negative(p, 'know', person.en))
  : sentence(`${p.t} 认识 ${person.t} 吗`, ask(p, 'know', person.en))));
const relatives = [{ t: '我 妈妈', en: 'my mother' }, { t: '我 爸爸', en: 'my father' }, { t: '你 妈妈', en: 'your mother' }, { t: '你 爸爸', en: 'your father' }, { t: '他 女儿', en: 'his daughter' }, { t: '她 儿子', en: 'her son' }];
addTopic('family-places', 'Where your family is', 'Put a person before 在 and the place after it. Do not add 是 before 在.', matrix(relatives, places, (relative, place) => sentence(`${relative.t} 在 ${place.t}`, `${relative.en} is ${place.at}`)));
const children = [{ t: '我 儿子', en: 'my son' }, { t: '我 女儿', en: 'my daughter' }, { t: '你 儿子', en: 'your son' }, { t: '你 女儿', en: 'your daughter' }, { t: '他 女儿', en: 'his daughter' }, { t: '她 儿子', en: 'her son' }];
addTopic('children-ages', 'Talking about children\'s ages', 'State age directly with number + 岁. 今年 goes before the age; 是 is not needed.', matrix(children, ages, (child, age) => sentence(`${child.t} 今年 ${age.t} 岁`, `${child.en} is ${age.en} years old this year`)));
addTopic('having-things', 'Things people have', 'Use 有 before a possession. Use 没有, rather than 不有, to say someone does not have it.', matrix(P, items, (p, item, i, offset) => (i + offset) % 2
  ? sentence(`${p.t} 没有 ${item.t}`, negative(p, 'have', item.en))
  : sentence(`${p.t} 有 ${numbers[(i + offset) % numbers.length].t} ${item.unit} ${item.t}`, say(p, 'have', `${numbers[(i + offset) % numbers.length].en} ${item.en}`))));
addTopic('book-counts', 'Counting books and cups', 'Put the number before the measure word and noun. Use 本 with books and 个 with cups.', matrix(P, numbers, (p, n, i, offset) => sentence(`${p.t} 有 ${n.t} ${offset % 2 ? '个 杯子' : '本 书'}`, say(p, 'have', `${n.en} ${offset % 2 ? 'cups' : 'books'}`))));
const specificItems = [{ t: '这 本 书', en: 'this book' }, { t: '那 本 书', en: 'that book' }, { t: '这 个 杯子', en: 'this cup' }, { t: '那 个 杯子', en: 'that cup' }, { t: '这 件 衣服', en: 'this piece of clothing' }, { t: '那 个 电脑', en: 'that computer' }];
addTopic('ownership', 'Checking whose things they are', 'Put the owner before 的. After 是, owner + 的 can stand alone to mean that the thing belongs to that person.', matrix(specificItems, P, (item, owner) => sentence(`${item.t} 是 ${owner.t} 的 吗`, `is ${item.en} ${owner.possessive === 'my' ? 'mine' : owner.possessive === 'your' ? 'yours' : owner.possessive === 'her' ? 'hers' : owner.possessive === 'our' ? 'ours' : owner.possessive === 'their' ? 'theirs' : 'his'}?`)));
const surfaces = [{ t: '桌子 上', en: 'on the table' }, { t: '桌子 下', en: 'under the table' }, { t: '椅子 上', en: 'on the chair' }, { t: '椅子 下', en: 'under the chair' }, { t: '这儿', en: 'here' }, { t: '那儿', en: 'there' }];
addTopic('object-locations', 'Finding everyday objects', 'Use object + 在 + location. 上 and 下 follow 桌子 or 椅子 to say on or under it.', matrix(specificItems, surfaces, (item, place) => sentence(`${item.t} 在 ${place.t}`, `${item.en} is ${place.en}`)));
const pets = [{ t: '我 的 猫', en: 'my cat' }, { t: '我 的 狗', en: 'my dog' }, { t: '你 的 猫', en: 'your cat' }, { t: '你 的 狗', en: 'your dog' }, { t: '这 只 猫', en: 'this cat' }, { t: '那 只 狗', en: 'that dog' }];
addTopic('pets', 'Cats and dogs at home', 'Use 在 to locate an animal, and add 吗 to check whether it is in that place.', matrix(pets, surfaces, (pet, place, i, offset) => sentence(`${pet.t} 在 ${place.t}${(i + offset) % 2 ? ' 吗' : ''}`, (i + offset) % 2 ? `is ${pet.en} ${place.en}?` : `${pet.en} is ${place.en}`)));
addTopic('workplaces', 'Where people work', 'For an action at a place, put 在 + place before the action verb 工作.', matrix(P.slice(1), places, (p, place) => sentence(`${p.t} 在 ${place.t} 工作 吗`, ask(p, 'work', place.at))));
const studyPlaces = [places[0], places[1], places[5]];
addTopic('study-places', 'Studying in different places', 'Use subject + 在 + place + study activity. The location comes before the verb.', matrix(P, study, (p, activity, i, offset) => {
  const place = studyPlaces[(i + offset) % studyPlaces.length];
  return sentence(`${p.t} 在 ${place.t} ${activity.t}`, `${say(p, activity.v, activity.rest)} ${place.at}`);
}));
const skills = [study[1], study[3], { t: '说 汉语', v: 'speak', rest: 'Chinese' }, { t: '做 米饭', v: 'cook', rest: 'rice' }, { t: '读 这 个 字', v: 'read', rest: 'this character aloud' }, { t: '写 我 的 名字', v: 'write', rest: 'my name' }];
addTopic('learned-skills', 'Skills you have learned', 'Use 会 before a learned skill. Put 不 before 会 to say someone cannot do it.', matrix(P, skills, (p, skill, i, offset) => sentence(`${p.t}${(i + offset) % 2 ? ' 不' : ''} 会 ${skill.t}`, `${p.en} ${(i + offset) % 2 ? 'cannot' : 'can'} ${skill.v} ${skill.rest}`)));
addTopic('study-now', 'Reading and writing now', '在 before an action describes something happening now. 现在 normally goes before 在.', matrix(P, study, (p, activity) => sentence(`${p.t} 现在 在 ${activity.t}`, `${p.en} ${p.be} ${activity.ing} now`)));
addTopic('study-plans', 'When you will study', 'Put the time before 想 and the action. The same time can also go before the subject.', matrix(P, study, (p, activity, i, offset) => {
  const time = times[(i + offset) % times.length];
  return sentence(`${p.t} ${time.t} 想 ${activity.t}`, `${p.en} would like to ${activity.v} ${activity.rest} ${time.en}`, [`${time.t} ${p.t} 想 ${activity.t}`, `${p.t} 想 ${time.t} ${activity.t}`]);
}));
const mealTimes = [{ t: '今天 中午', en: 'at noon today' }, { t: '今天 下午', en: 'this afternoon' }, { t: '明天 中午', en: 'at noon tomorrow' }, { t: '明天 上午', en: 'tomorrow morning' }, { t: '星期六', en: 'on Saturday' }, { t: '星期日', en: 'on Sunday' }];
addTopic('meal-times', 'Planning your meals', 'Put the time before 在 + place, then the action 吃饭.', matrix(P, mealTimes, (p, time, i, offset) => {
  const place = [places[0], places[3], places[1]][(i + offset) % 3];
  return sentence(`${p.t} ${time.t} 在 ${place.t} 吃 饭`, `${p.en} will eat ${place.at} ${time.en}`, [`${time.t} ${p.t} 在 ${place.t} 吃 饭`]);
}));
const foods = [{ t: '吃 苹果', en: 'eating apples' }, { t: '吃 米饭', en: 'eating rice' }, { t: '吃 菜', en: 'eating vegetables' }, { t: '吃 水果', en: 'eating fruit' }, { t: '做 饭', en: 'cooking' }, { t: '在 家 吃 饭', en: 'eating at home' }];
addTopic('food-preferences', 'Food you enjoy', 'Place 喜欢 before a food or activity. Add 吗 to ask whether someone likes it.', matrix(P.slice(1), foods, (p, food) => sentence(`${p.t} 喜欢 ${food.t} 吗`, ask(p, 'like', food.en))));
const drinkActions = [{ t: '喝 水', en: 'drinking water' }, { t: '喝 茶', en: 'drinking tea' }, { t: '在 家 喝 茶', en: 'drinking tea at home' }, { t: '在 家 喝 水', en: 'drinking water at home' }, { t: '上午 喝 茶', en: 'drinking tea in the morning' }, { t: '下午 喝 茶', en: 'drinking tea in the afternoon' }];
addTopic('drink-preferences', 'How you like your drinks', '喜欢 can be followed by an activity, including a time or place for that activity.', matrix(P, drinkActions, (p, drink, i, offset) => (i + offset) % 2
  ? sentence(`${p.t} 不 喜欢 ${drink.t}`, negative(p, 'like', drink.en))
  : sentence(`${p.t} 喜欢 ${drink.t}`, say(p, 'like', drink.en))));
const drinkAmounts = [{ t: '两 杯 水', en: 'two glasses of water' }, { t: '三 杯 水', en: 'three glasses of water' }, { t: '五 杯 水', en: 'five glasses of water' }, { t: '两 杯 茶', en: 'two cups of tea' }, { t: '三 杯 茶', en: 'three cups of tea' }, { t: '五 杯 茶', en: 'five cups of tea' }];
addTopic('ordering-drinks', 'Ordering drinks', 'Put 要 before number + 杯 + drink. 杯 is the measure word for a glass or cup of a drink.', matrix(P, drinkAmounts, (p, drink) => sentence(`${p.t} 要 ${drink.t}`, say(p, 'want', drink.en))));
addTopic('shopping', 'Shopping for everyday things', 'Put 想 before 买 to express a wish to buy something. The quantity and measure word come before the item.', matrix(P, items, (p, item, i, offset) => {
  const n = numbers[(i + offset) % numbers.length];
  return sentence(`${p.t} 想 买 ${n.t} ${item.unit} ${item.t}`, `${p.en} would like to buy ${n.en} ${item.en}`);
}));
const prices = [{ t: '两', en: 'two' }, { t: '三', en: 'three' }, { t: '五', en: 'five' }, { t: '六', en: 'six' }, { t: '八', en: 'eight' }, { t: '十', en: 'ten' }];
addTopic('prices', 'Checking prices', 'A price can directly follow the item. Put the number before 块钱; use 吗 at the end to check the price.', matrix(specificItems, prices, (item, price) => sentence(`${item.t} ${price.t} 块 钱 吗`, `does ${item.en} cost ${price.en} yuan?`)));
const clothes = [{ t: '我 的 衣服', en: 'my clothes' }, { t: '你 的 衣服', en: 'your clothes' }, { t: '他 的 衣服', en: 'his clothes' }, { t: '她 的 衣服', en: 'her clothes' }, { t: '这 件 衣服', en: 'this piece of clothing', singular: true }, { t: '那 件 衣服', en: 'that piece of clothing', singular: true }];
const qualities = [{ t: '很 大', en: 'very big' }, { t: '很 小', en: 'very small' }, { t: '很 漂亮', en: 'very pretty' }, { t: '不 大', en: 'not big' }, { t: '不 小', en: 'not small' }, { t: '不 漂亮', en: 'not pretty' }];
addTopic('clothes', 'Describing clothes', 'Use 很 or 不 directly before the adjective. Do not put 是 before an ordinary adjective description.', matrix(clothes, qualities, (item, quality) => sentence(`${item.t} ${quality.t}`, `${item.en} ${item.singular ? 'is' : 'are'} ${quality.en}`)));
addTopic('describing-objects', 'Describing everyday objects', 'An adjective can describe a thing directly. Use 很 for a simple description or 不 to make it negative.', matrix(specificItems, qualities, (item, quality) => sentence(`${item.t} ${quality.t}`, `${item.en} is ${quality.en}`)));
const weatherTimes = [{ t: '今天', en: 'today', be: 'is' }, { t: '昨天', en: 'yesterday', be: 'was' }, { t: '明天', en: 'tomorrow', be: 'will be' }, { t: '今天 上午', en: 'this morning', be: 'is' }, { t: '今天 下午', en: 'this afternoon', be: 'is' }, { t: '明天 上午', en: 'tomorrow morning', be: 'will be' }];
const weather = [{ t: '很 冷', en: 'very cold' }, { t: '很 热', en: 'very hot' }, { t: '不 冷', en: 'not cold' }, { t: '不 热', en: 'not hot' }, { t: '天气 很 好', en: 'good', weather: true }, { t: '天气 不 好', en: 'bad', weather: true }];
addTopic('weather', 'Weather through the day', 'Put the day or time first, then describe the temperature or 天气. A description uses 很 or 不 before an adjective.', matrix(weatherTimes, weather, (time, description) => {
  const futureNegative = time.be === 'will be' && description.en.startsWith('not ');
  const verb = futureNegative ? 'will not be' : time.be;
  const adjective = futureNegative ? description.en.slice(4) : description.en;
  return sentence(`${time.t} ${description.t}`, `${description.weather ? 'the weather' : 'it'} ${verb} ${adjective} ${time.en}`);
}));
const days = [{ t: '星期一', en: 'on Monday' }, { t: '星期二', en: 'on Tuesday' }, { t: '星期三', en: 'on Wednesday' }, { t: '星期四', en: 'on Thursday' }, { t: '星期五', en: 'on Friday' }, { t: '星期天', en: 'on Sunday' }];
addTopic('weekdays', 'A week of plans', 'Put the weekday before 去 + destination. The weekday may also go before the subject.', matrix(P, places, (p, place, i, offset) => {
  const day = days[(i + offset) % days.length];
  const action = place.t === '家' ? '回 家' : `去 ${place.t}`;
  const destination = place.t === '家' ? 'home' : `to ${place.en}`;
  return sentence(`${p.t} ${day.t} ${action}`, `${p.en} will go ${destination} ${day.en}`, [`${day.t} ${p.t} ${action}`]);
}));
addTopic('tomorrow', 'What you want to do tomorrow', 'Use 明天 before 想 and the planned activity. 想 + action expresses what someone would like to do.', matrix(P, activities, (p, activity) => sentence(`${p.t} 明天 想 ${activity.t}`, `${p.en} would like to ${activity.v} ${activity.rest} tomorrow`, [`明天 ${p.t} 想 ${activity.t}`, `${p.t} 想 明天 ${activity.t}`])));
const clock = [{ t: '七 点', en: "at seven o'clock" }, { t: '八 点', en: "at eight o'clock" }, { t: '九 点', en: "at nine o'clock" }, { t: '十 点', en: "at ten o'clock" }, { t: '十二 点', en: "at twelve o'clock" }, { t: '六 点', en: "at six o'clock" }];
addTopic('clock-routines', 'Daily routines by the clock', 'Place the clock time before the verb. Put the number before 点 to express an hour.', matrix(P, activities, (p, activity, i, offset) => {
  const time = clock[(i + offset) % clock.length];
  return sentence(`${p.t} ${time.t} ${activity.t}`, `${say(p, activity.v, activity.rest)} ${time.en}`, [`${time.t} ${p.t} ${activity.t}`]);
}));
const pastActions = [{ t: '买 了 苹果', en: 'bought apples' }, { t: '买 了 书', en: 'bought books' }, { t: '看 了 电影', en: 'watched a movie' }, { t: '写 了 汉字', en: 'wrote Chinese characters' }, { t: '喝 了 茶', en: 'drank tea' }, { t: '吃 了 米饭', en: 'ate rice' }];
addTopic('completed-actions', 'What happened yesterday', 'Put 昨天 before the verb and 了 after the verb to describe a completed action.', matrix(P, pastActions, (p, action) => sentence(`${p.t} 昨天 ${action.t}`, `${p.en} ${action.en} yesterday`, [`昨天 ${p.t} ${action.t}`])));
addTopic('past-negatives', 'What did not happen', 'Use 没 before a past action that did not happen. Do not add the completed-action 了 in this negative pattern.', matrix(P, activities, (p, action) => sentence(`${p.t} 昨天 没 ${action.t}`, `${p.en} did not ${action.v} ${action.rest} yesterday`, [`昨天 ${p.t} 没 ${action.t}`])));
const destinations = [places[1], places[2], places[3], places[4], places[5], places[0]];
addTopic('taxi-trips', 'Taking a taxi', 'Put 坐出租车 before 去 + destination to explain how someone travels.', matrix(P, destinations, (p, destination) => sentence(`${p.t} 坐 出租车 ${destination.t === '家' ? '回 家' : `去 ${destination.t}`}`, `${say(p, 'take', 'a taxi')} ${destination.t === '家' ? 'home' : `to ${destination.en}`}`)));
const visitors = [{ t: '老师', en: 'the teacher' }, { t: '朋友', en: 'friends' }, { t: '妈妈', en: 'Mom' }, { t: '爸爸', en: 'Dad' }, { t: '同学', en: 'classmates' }, { t: '医生', en: 'the doctor' }];
addTopic('visits', 'Going to see people', 'Use 去看 before a person to mean going to see or visit that person. Put 明天 before the action.', matrix(P, visitors, (p, visitor) => sentence(`${p.t} 明天 去 看 ${visitor.t}`, `${p.en} will go to see ${visitor.en} tomorrow`, [`明天 ${p.t} 去 看 ${visitor.t}`])));
addTopic('coming-home', 'Coming home and coming back', 'Put the time before 回家 or 回来. 回家 means go home; 回来 means come back.', matrix(P, times, (p, time, i, offset) => sentence(`${p.t} ${time.t} ${offset % 2 ? '回来' : '回 家'}`, `${p.en} will ${offset % 2 ? 'come back' : 'go home'} ${time.en}`, [`${time.t} ${p.t} ${offset % 2 ? '回来' : '回 家'}`])));
addTopic('phone-calls', 'Making phone calls', '打电话 means make a phone call. Put the time before 打电话, and 想 before the action to express a wish.', matrix(P, times, (p, time) => sentence(`${p.t} ${time.t} 想 打 电话`, `${p.en} would like to make a phone call ${time.en}`, [`${time.t} ${p.t} 想 打 电话`, `${p.t} 想 ${time.t} 打 电话`])));
const homes = [{ t: '北京', en: 'Beijing' }, { t: '中国', en: 'China' }, { t: '这儿', en: 'here' }, { t: '那儿', en: 'there' }, { t: '学校', en: 'the school' }, { t: '我 家', en: "my family's home" }];
addTopic('living', 'Where people live', 'Use 住在 before the place where someone lives or stays. Add 吗 at the end to ask a question.', matrix(P, homes, (p, place, i, offset) => {
  const location = ['这儿', '那儿'].includes(place.t) ? place.en : ['学校', '我 家'].includes(place.t) ? `at ${place.en}` : `in ${place.en}`;
  return p.en === 'I' || (i + offset) % 2 ? sentence(`${p.t} 不 住 在 ${place.t}`, negative(p, 'live', location)) : sentence(`${p.t} 住 在 ${place.t} 吗`, ask(p, 'live', location));
}));
const questionPeople = [{ t: '你', en: 'you', be: 'are' }, { t: '他', en: 'he', be: 'is' }, { t: '她', en: 'she', be: 'is' }, { t: '你 的 老师', en: 'your teacher', be: 'is' }, { t: '你 的 朋友', en: 'your friend', be: 'is' }, { t: '你 的 妈妈', en: 'your mother', be: 'is' }];
const questions = [
  { t: '在 哪儿', en: p => `where ${p.be} ${p.en}` },
  { t: '叫 什么 名字', en: p => `what is ${p.en === 'you' ? 'your' : p.en === 'he' ? 'his' : p.en === 'she' ? 'her' : `${p.en}'s`} name` },
  { t: '几 点 回 家', en: p => `what time ${p.en === 'you' ? 'do' : 'does'} ${p.en} go home` },
  { t: '什么时候 来', en: p => `when ${p.en === 'you' ? 'do' : 'does'} ${p.en} come` },
  { t: '想 喝 什么', en: p => `what would ${p.en} like to drink` },
  { t: '想 吃 什么', en: p => `what would ${p.en} like to eat` },
];
addTopic('polite-questions', 'Asking politely', 'Start with 请问 to ask politely. Keep the question word in the place where the answer would go.', matrix(questionPeople, questions, (p, question) => sentence(`请问 ${p.t} ${question.t}`, `excuse me, ${question.en(p)}?`)));
const instructions = [{ t: '看', en: 'look at' }, { t: '读', en: 'read', suffix: ' aloud' }, { t: '写', en: 'write' }];
const texts = [{ t: '这 个 字', en: 'this character' }, { t: '那 个 字', en: 'that character' }, { t: '我 的 名字', en: 'my name' }, { t: '你 的 名字', en: 'your name' }, { t: '他 的 名字', en: 'his name' }, { t: '她 的 名字', en: 'her name' }];
addTopic('polite-instructions', 'Polite classroom requests', 'Place 请 before the requested action. Put the thing to look at, read, or write after the verb.', matrix(texts, instructions, (text, action) => [
  sentence(`请 ${action.t} ${text.t}`, `please ${action.en} ${text.en}${action.suffix || ''}`),
  sentence(`请 现在 ${action.t} ${text.t}`, `please ${action.en} ${text.en}${action.suffix || ''} now`),
]));
const guests = [{ t: '你', en: 'you', verb: 'invite' }, { t: '他', en: 'him' }, { t: '她', en: 'her' }, { t: '老师', en: 'the teacher' }, { t: '朋友', en: 'friends' }, { t: '同学', en: 'classmates' }];
const invitations = [{ t: '喝 茶', en: 'have tea' }, { t: '吃 饭', en: 'have a meal' }, { t: '看 电影', en: 'watch a movie' }, { t: '来 我 家', en: 'come to my home' }, { t: '在 家 吃 饭', en: 'have a meal at home' }, { t: '在 饭店 吃 饭', en: 'have a meal at a restaurant' }];
addTopic('invitations', 'Inviting friends and teachers', 'Use 我请 + person + activity to invite someone to do something. The invited person comes before the activity.', matrix(guests, invitations, (guest, invitation) => sentence(`我 请 ${guest.t} ${invitation.t}`, `I invite ${guest.en} to ${invitation.en}`)));
const companions = [{ t: '妈妈', en: 'Mom' }, { t: '爸爸', en: 'Dad' }, { t: '朋友', en: 'a friend' }, { t: '同学', en: 'a classmate' }, { t: '小王', en: 'Xiao Wang' }, { t: '小李', en: 'Xiao Li' }];
addTopic('together', 'Doing things together', 'Put 和 + companion before the action to say with whom someone does it.', matrix(companions, activities, (companion, activity) => sentence(`我 和 ${companion.t} ${activity.t}`, `I ${activity.v} ${activity.rest} with ${companion.en}`)));
const groups = [{ t: '我们', en: 'we' }, { t: '你 和 我', en: 'you and I' }, { t: '他 和 她', en: 'he and she' }, { t: '他们', en: 'they' }, { t: '她们', en: 'they' }, { t: '爸爸 和 妈妈', en: 'Dad and Mom' }];
addTopic('everyone', 'What everyone likes', 'Put 都 after the full subject and before 喜欢. 都 includes everyone in the subject.', matrix(groups, foods, (group, food) => sentence(`${group.t} 都 喜欢 ${food.t}`, `${group.en} ${group.t.includes('和') ? 'both' : 'all'} like ${food.en}`)));
addTopic('permission', 'Asking what is possible', 'Use 能 before an action and 吗 at the end to ask whether someone may or can do it in the current situation.', matrix(P, activities, (p, activity) => sentence(`${p.t} 能 ${activity.t} 吗`, `can ${p.en} ${activity.v} ${activity.rest}?`)));
addTopic('happening-now', 'What people are doing', 'Place 在 before the action to describe something happening now. Add 吗 to ask whether it is happening.', matrix(P.slice(1), activities, (p, activity) => sentence(`${p.t} 在 ${activity.t} 吗`, `${p.be} ${p.en} ${activity.ing}?`)));

if (sentences.length !== 1300 || topics.length !== 60) throw new Error(`Expected 1,300 sentences in 60 topics, found ${sentences.length}/${topics.length}`);
const expanded = { ...catalog, version: 2, topics, sentences };
if (process.argv.includes('--check')) {
  if (JSON.stringify(catalog) !== JSON.stringify(expanded)) throw new Error('The saved expansion differs from the generated content.');
} else fs.writeFileSync(file, `${JSON.stringify(expanded, null, 2)}\n`);
console.log('Verified 1,000 additional unique sentences: 1,300 total, 60 topics. Original 300 preserved.');
