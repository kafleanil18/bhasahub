import { shuffleSentences } from './sentenceQuiz.js';

export const NUMBER_MODES = [
  { id: 'prices', title: 'Prices', symbol: '¥', description: 'Recognize yuan and jiao while shopping.', question: 'What price do you hear?' },
  { id: 'time', title: 'Time', symbol: '◷', description: 'Understand morning, afternoon, and evening times.', question: 'What time do you hear?' },
  { id: 'dates', title: 'Dates', symbol: '日', description: 'Recognize the month and day.', question: 'What date do you hear?' },
  { id: 'ages', title: 'Ages', symbol: '岁', description: 'Understand how old someone is.', question: 'What age do you hear?' },
  { id: 'phones', title: 'Phone numbers', symbol: '☎', description: 'Listen carefully and enter every digit in order.', question: 'What phone number do you hear?' },
];
const digits = '零一二三四五六七八九';
export function chineseNumber(number) {
  if (!Number.isInteger(number) || number < 0 || number > 9999) throw new RangeError('Use an integer from 0 to 9999.');
  if (!number) return '零';
  const units = ['', '十', '百', '千'];
  let result = '', pendingZero = false;
  const text = String(number);
  for (let index = 0; index < text.length; index++) {
    const digit = Number(text[index]);
    if (!digit) { pendingZero = Boolean(result); continue; }
    if (pendingZero) { result += '零'; pendingZero = false; }
    result += `${digit === 1 && text.length === 2 && index === 0 ? '' : digits[digit]}${units[text.length - index - 1]}`;
  }
  return result;
}
const readings = {
  零: 'líng', 一: 'yī', 二: 'èr', 两: 'liǎng', 三: 'sān', 四: 'sì', 五: 'wǔ', 六: 'liù', 七: 'qī', 八: 'bā', 九: 'jiǔ',
  十: 'shí', 百: 'bǎi', 千: 'qiān', 块: 'kuài', 钱: 'qián', 角: 'jiǎo', 分: 'fēn', 点: 'diǎn', 半: 'bàn', 刻: 'kè',
  上: 'shàng', 午: 'wǔ', 下: 'xià', 中: 'zhōng', 晚: 'wǎn', 月: 'yuè', 号: 'hào', 岁: 'suì', 幺: 'yāo',
};
function prompt(id, mode, chinese, expected, display, explanation, speech = chinese) {
  const characters = Array.from(chinese);
  const tokenPinyin = characters.map((character, index) => {
    let reading = character === '上' && chinese.startsWith('晚上') ? 'shang' : readings[character];
    if (!reading) throw new Error(`Missing pinyin for ${character}`);
    if (mode !== 'dates' && character === '一' && !'十百千零'.includes(characters[index - 1] || ' ')) {
      if ('百千角'.includes(characters[index + 1] || ' ')) reading = 'yì';
      if ('块刻岁'.includes(characters[index + 1] || ' ')) reading = 'yí';
    }
    return [reading];
  });
  return { id, mode, expected, display, explanation, speech, tokens: characters, tokenPinyin, chinese: `${chinese}。` };
}
const questions = [];
const integerPrices = [1,2,3,5,6,7,8,9,10,11,12,15,18,20,21,25,28,30,35,40,45,50,55,60,65,70,75,80,85,90,95,99,100,101,105,110,120,150,200,205,250,300,500,999];
const fractionalPrices = [35,55,68,72,85,99,125,158,185,205,255,308,352,505,995,1008];
for (const tenths of [...integerPrices.map(value => value * 10), ...fractionalPrices]) {
  const yuan = Math.floor(tenths / 10), jiao = tenths % 10;
  const chinese = `${yuan === 2 ? '两' : chineseNumber(yuan)}块${jiao ? `${chineseNumber(jiao)}角` : '钱'}`;
  questions.push(prompt(`price-${tenths}`, 'prices', chinese, tenths * 10, `¥${(tenths / 10).toFixed(jiao ? 2 : 0)}`, '块 is a spoken word for yuan. Ten 角 (jiao) make one yuan. Enter the price using a decimal point.'));
}
for (const hour of [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21]) {
  for (const minute of [0,15,30,45]) {
    const twelveHour = hour % 12 || 12;
    const period = hour < 12 ? '上午' : hour === 12 ? '中午' : hour < 18 ? '下午' : '晚上';
    const chinese = `${period}${twelveHour === 2 ? '两' : chineseNumber(twelveHour)}点${minute === 30 ? '半' : minute === 15 ? '一刻' : minute ? `${chineseNumber(minute)}分` : ''}`;
    questions.push(prompt(`time-${hour}-${minute}`, 'time', chinese, { hour, minute }, `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')} (${twelveHour}:${String(minute).padStart(2,'0')} ${hour < 12 ? 'AM' : 'PM'})`, '半 means 30 minutes, and 一刻 means 15 minutes. 下午 and 晚上 indicate PM; enter the hour in 24-hour format.'));
  }
}
const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
for (let month = 1; month <= 12; month++) {
  for (const day of [1,5,10,15,20,25]) questions.push(prompt(`date-${month}-${day}`, 'dates', `${chineseNumber(month)}月${chineseNumber(day)}号`, { month, day }, `${monthNames[month - 1]} ${day}`, 'Chinese dates put the month before the day. 月 marks the month and 号 marks the day.'));
}
for (let age = 1; age <= 60; age++) questions.push(prompt(`age-${age}`, 'ages', `${age === 2 ? '两' : chineseNumber(age)}岁`, age, `${age} ${age === 1 ? 'year' : 'years'} old`, '岁 follows the number to express age. Enter the number of years.'));
for (let index = 0; index < 30; index++) {
  const number = index < 15 ? String(1234567 + index * 7919).padStart(8,'0') : `1${[3,5,8,9][index % 4]}${String(700000000 + index * 12347)}`;
  const chinese = Array.from(number, digit => digit === '1' ? '幺' : digits[Number(digit)]).join('');
  questions.push(prompt(`phone-${index}`, 'phones', chinese, number, number, 'Phone numbers are read digit by digit. 一 is often spoken as 幺 (yāo). Keep every digit, including leading zeros.', Array.from(chinese).join('，')));
}
export const NUMBER_QUESTIONS = questions;
export function numberRound(mode, random = Math.random) {
  return shuffleSentences(NUMBER_QUESTIONS.filter(question => question.mode === mode), random).slice(0, 10);
}
const clean = value => String(value ?? '').normalize('NFKC').trim();
export function checkNumberAnswer(question, answer) {
  if (question.mode === 'prices') {
    let value = clean(answer.value).replace(/^(?:¥|CNY|RMB)\s*/i, '').replace(/\s*(?:元|块钱|块|yuan|CNY|RMB)$/i, '');
    if (/^\d{1,3}(,\d{3})+(?:\.\d{1,2})?$/.test(value)) value = value.replaceAll(',', '');
    if (!/^\d{1,6}(?:\.\d{1,2})?$/.test(value)) return { valid: false, error: 'Enter the price in digits, using a decimal point for jiao, such as 25.50.' };
    const [whole, fraction = ''] = value.split('.');
    return { valid: true, correct: Number(whole) * 100 + Number(fraction.padEnd(2,'0')) === question.expected };
  }
  if (question.mode === 'time' || question.mode === 'dates') {
    const time = question.mode === 'time';
    const first = clean(answer[time ? 'hour' : 'month']), second = clean(answer[time ? 'minute' : 'day']);
    if (!/^\d{1,2}$/.test(first) || !/^\d{1,2}$/.test(second)) return { valid: false, error: time ? 'Enter an hour from 0 to 23 and minutes from 0 to 59.' : 'Enter a month from 1 to 12 and a valid day.' };
    const a = Number(first), b = Number(second);
    if (time ? a > 23 || b > 59 : a < 1 || a > 12 || b < 1 || b > [31,29,31,30,31,30,31,31,30,31,30,31][a - 1]) return { valid: false, error: time ? 'Use a valid 24-hour time.' : 'Use a valid month and day.' };
    return { valid: true, correct: a === question.expected[time ? 'hour' : 'month'] && b === question.expected[time ? 'minute' : 'day'] };
  }
  const value = clean(answer.value);
  if (question.mode === 'ages') {
    if (!/^\d{1,3}$/.test(value) || Number(value) > 120) return { valid: false, error: 'Enter an age from 0 to 120 using digits.' };
    return { valid: true, correct: Number(value) === question.expected };
  }
  if (!/^[\d\s()-]+$/.test(value)) return { valid: false, error: 'Enter the phone number using digits. Spaces, hyphens, and parentheses are allowed.' };
  const phone = value.replace(/[\s()-]/g,'');
  if (!phone) return { valid: false, error: 'Enter the digits you hear.' };
  return { valid: true, correct: phone === question.expected };
}
export function typedNumberAnswer(question, answer) {
  if (question.mode === 'time') return `${answer.hour || '0'}:${String(answer.minute || '0').padStart(2,'0')}`;
  if (question.mode === 'dates') return `${answer.month || '?'}/${answer.day || '?'}`;
  return answer.value || '';
}
