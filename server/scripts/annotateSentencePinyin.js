// Align the bank's reviewed sentence pinyin to each Chinese character.
// Erhua is shown as a separate "r" annotation over 儿, preserving nǎr/zhèr/nàr.
// Run with --check to verify the stored annotations without rewriting the bank.
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '../data/hsk1Sentences.json');
const catalog = JSON.parse(fs.readFileSync(file, 'utf8'));
const syllables = `
打:da 住:zhu 能:neng 台:tai 一:yi 七:qi 三:san 上:shang 下:xia 不:bu 东:dong 两:liang 个:ge 中:zhong 么:me 九:jiu 习:xi 书:shu 买:mai 了:le 二:er 五:wu 些:xie 京:jing 亮:liang 人:ren 什:shen 今:jin 他:ta 们:men 件:jian 会:hui 作:zuo 你:ni 候:hou 做:zuo 儿:er 八:ba 六:liu 兴:xing 写:xie 冷:leng 几:ji 出:chu 分:fen 北:bei 医:yi 十:shi 午:wu 去:qu 友:you 口:kou 只:zhi 叫:jiao 号:hao 吃:chi 同:tong 名:ming 吗:ma 听:ting 和:he 哪:na 商:shang 喜:xi 喝:he 四:si 回:hui 国:guo 在:zai 坐:zuo 块:kuai 多:duo 大:da 天:tian 女:nu 她:ta 好:hao 妈:ma 子:zi 字:zi 学:xue 家:jia 小:xiao 少:shao 岁:sui 工:gong 师:shi 年:nian 店:dian 张:zhang 影:ying 很:hen 怎:zen 想:xiang 我:wo 把:ba 日:ri 时:shi 明:ming 星:xing 昨:zuo 是:shi 月:yue 有:you 朋:peng 服:fu 期:qi 本:ben 机:ji 李:li 来:lai 杯:bei 果:guo 校:xiao 样:yang 桌:zhuo 椅:yi 欢:huan 气:qi 水:shui 汉:han 没:mei 漂:piao 点:dian 热:re 爸:ba 狗:gou 猫:mao 王:wang 现:xian 生:sheng 电:dian 的:de 看:kan 睡:shui 租:zu 米:mi 老:lao 脑:nao 苹:ping 茶:cha 菜:cai 衣:yi 西:xi 要:yao 视:shi 觉:jiao 认:ren 识:shi 话:hua 语:yu 说:shuo 请:qing 读:du 谁:shei 谢:xie 车:che 这:zhe 那:na 都:dou 钱:qian 问:wen 院:yuan 飞:fei 饭:fan 高:gao
`;
const bases = Object.fromEntries(syllables.trim().split(/\s+/).map(pair => pair.split(':')));
const plain = text => text.normalize('NFD').replace(/\p{M}/gu, '');
for (const sentence of catalog.sentences) {
  let remaining = sentence.pinyin.normalize('NFC').toLowerCase().replace(/[^\p{L}]/gu, '');
  const tokenPinyin = sentence.tokens.map(token => Array.from(token).map(character => {
    const base = character === '儿' && ['哪儿', '这儿', '那儿'].includes(token) ? 'r' : bases[character];
    if (!base) throw new Error(`Missing pronunciation for ${character} in ${sentence.id}`);
    const reading = remaining.slice(0, base.length);
    if (plain(reading) !== base) throw new Error(`Pinyin alignment failed for ${sentence.id}, ${character}: ${remaining}`);
    remaining = remaining.slice(base.length);
    return reading;
  }));
  if (remaining) throw new Error(`Extra pinyin in ${sentence.id}: ${remaining}`);
  if (process.argv.includes('--check')) {
    if (JSON.stringify(sentence.tokenPinyin) !== JSON.stringify(tokenPinyin)) throw new Error(`Annotations differ for ${sentence.id}`);
  } else sentence.tokenPinyin = tokenPinyin;
}
if (!process.argv.includes('--check')) fs.writeFileSync(file, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Verified character-by-character pinyin for ${catalog.sentences.length} sentences.`);
