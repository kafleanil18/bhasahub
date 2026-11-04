import { shuffleSentences } from './sentenceQuiz.js';

export const MEASURE_TOPICS = [
  { id: 'people', title: 'People & animals', description: 'Count students, friends, and animals.' },
  { id: 'study', title: 'Books & paper', description: 'Choose the words for books, paper, and photos.' },
  { id: 'food', title: 'Food & drinks', description: 'Count fruit and cups of drinks.' },
  { id: 'home', title: 'Things at home', description: 'Practice furniture, keys, and appliances.' },
  { id: 'outside', title: 'Clothing & transport', description: 'Count clothes, vehicles, and long things.' },
];
// Distractors exclude common alternative classifiers for these nouns. For
// example, dogs also take 条, fish also take 只, and chairs can take 张.
export const MEASURE_GROUPS = [
  { word:'个', pinyin:'gè', meaning:'People and many everyday objects', explanation:'个 is a common measure word for people and many everyday objects, including these fruits.', distractors:['本','杯','件','辆','张','台','把'] },
  { word:'本', pinyin:'běn', meaning:'Books and bound volumes', explanation:'Use 本 for bound volumes such as books, textbooks, and dictionaries.', distractors:['杯','辆','只','把','台','条','张','件'] },
  { word:'杯', pinyin:'bēi', meaning:'Cups and glasses of drinks', explanation:'Use 杯 to count cups or glasses of a drink. Here the English specifies cups or glasses, not bottles or bowls.', distractors:['本','辆','张','台','件'] },
  { word:'件', pinyin:'jiàn', meaning:'Individual pieces of clothing', explanation:'Use 件 for individual garments such as a shirt, a coat, or a piece of clothing.', distractors:['本','杯','辆','张','台','只','把'] },
  { word:'只', pinyin:'zhī', meaning:'Many animals', explanation:'Use 只 for many animals, including cats, dogs, and birds. Some animals have other valid classifiers too.', distractors:['本','杯','辆','张','台','把','件'] },
  { word:'张', pinyin:'zhāng', meaning:'Flat things and tables', explanation:'Use 张 for flat things such as sheets of paper, photographs, and tables.', distractors:['本','杯','辆','只'] },
  { word:'把', pinyin:'bǎ', meaning:'Chairs and things with handles', explanation:'Use 把 for chairs and many things you hold by a handle, such as umbrellas and keys.', distractors:['本','杯','辆','件'] },
  { word:'台', pinyin:'tái', meaning:'Machines and appliances', explanation:'Use 台 for machines or appliances, including computers, TV sets, and washing machines.', distractors:['本','杯','辆','只','把','条','张'] },
  { word:'辆', pinyin:'liàng', meaning:'Wheeled vehicles', explanation:'Use 辆 for wheeled vehicles, including bicycles, cars, and taxis.', distractors:['本','杯','件','张','只','把','条'] },
  { word:'条', pinyin:'tiáo', meaning:'Long things, fish, and some clothes', explanation:'Use 条 for long or narrow things. It is also used with fish, trousers, and skirts.', distractors:['本','杯','辆','张','台','把'] },
];
const nounRows = [
  ['student','个','people','学生','xué sheng','student','students'],
  ['friend','个','people','朋友','péng you','friend','friends'],
  ['child','个','people','孩子','hái zi','child','children'],
  ['apple','个','food','苹果','píng guǒ','apple','apples'],
  ['orange','个','food','橙子','chéng zi','orange','oranges'],
  ['banana','个','food','香蕉','xiāng jiāo','banana','bananas'],
  ['book','本','study','书','shū','book','books'],
  ['textbook','本','study','课本','kè běn','textbook','textbooks'],
  ['dictionary','本','study','词典','cí diǎn','dictionary','dictionaries'],
  ['water','杯','food','水','shuǐ','glass of water','glasses of water'],
  ['tea','杯','food','茶','chá','cup of tea','cups of tea'],
  ['milk','杯','food','牛奶','niú nǎi','glass of milk','glasses of milk'],
  ['clothes','件','outside','衣服','yī fu','piece of clothing','pieces of clothing'],
  ['shirt','件','outside','衬衫','chèn shān','shirt','shirts'],
  ['coat','件','outside','外套','wài tào','coat','coats'],
  ['cat','只','people','猫','māo','cat','cats'],
  ['dog','只','people','狗','gǒu','dog','dogs'],
  ['bird','只','people','鸟','niǎo','bird','birds'],
  ['paper','张','study','纸','zhǐ','sheet of paper','sheets of paper'],
  ['photo','张','study','照片','zhào piàn','photograph','photographs'],
  ['table','张','home','桌子','zhuō zi','table','tables'],
  ['chair','把','home','椅子','yǐ zi','chair','chairs'],
  ['umbrella','把','home','伞','sǎn','umbrella','umbrellas'],
  ['key','把','home','钥匙','yào shi','key','keys'],
  ['computer','台','home','电脑','diàn nǎo','computer','computers'],
  ['tv','台','home','电视机','diàn shì jī','TV set','TV sets'],
  ['washer','台','home','洗衣机','xǐ yī jī','washing machine','washing machines'],
  ['bicycle','辆','outside','自行车','zì xíng chē','bicycle','bicycles'],
  ['car','辆','outside','汽车','qì chē','car','cars'],
  ['taxi','辆','outside','出租车','chū zū chē','taxi','taxis'],
  ['fish','条','outside','鱼','yú','fish','fish'],
  ['trousers','条','outside','裤子','kù zi','pair of trousers','pairs of trousers'],
  ['skirt','条','outside','裙子','qún zi','skirt','skirts'],
];
const quantities = [
  { value:1, chinese:'一', english:'One', pinyin:'yī' },
  { value:2, chinese:'两', english:'Two', pinyin:'liǎng' },
  { value:3, chinese:'三', english:'Three', pinyin:'sān' },
  { value:5, chinese:'五', english:'Five', pinyin:'wǔ' },
];
export const MEASURE_QUESTIONS = nounRows.flatMap(([nounId, measure, topic, noun, nounPinyin, singular, plural]) => quantities.map(quantity => {
  const group = MEASURE_GROUPS.find(group => group.word === measure);
  const countPinyin = quantity.value === 1 ? /[àèìòùǜ]/.test(group.pinyin) ? 'yí' : 'yì' : quantity.pinyin;
  return {
    id:`measure-${nounId}-${quantity.value}`, topic, measure, noun, nounPinyin:nounPinyin.split(' '), quantity:quantity.chinese, quantityPinyin:[countPinyin],
    english:`${quantity.english} ${quantity.value === 1 ? singular : plural}`, explanation:group.explanation,
    tokens:[quantity.chinese,measure,noun], tokenPinyin:[[countPinyin],[measure === '个' ? 'ge' : group.pinyin],nounPinyin.split(' ')], chinese:`${quantity.chinese}${measure}${noun}。`,
  };
}));
export function measureRound(topic = 'mixed', random = Math.random) {
  const pool = MEASURE_QUESTIONS.filter(question => topic === 'mixed' || question.topic === topic);
  const chosen = topic === 'mixed' ? shuffleSentences(MEASURE_GROUPS, random).map(group => shuffleSentences(pool.filter(question => question.measure === group.word), random)[0]) : shuffleSentences(pool, random).slice(0,10);
  return chosen.map(question => ({ ...question, options:shuffleSentences([question.measure,...shuffleSentences(MEASURE_GROUPS.find(group => group.word === question.measure).distractors,random).slice(0,3)],random) }));
}
export function isCorrectMeasure(question, selected) {
  return question.options.includes(selected) && selected === question.measure;
}
