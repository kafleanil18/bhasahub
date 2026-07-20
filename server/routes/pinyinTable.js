const express = require('express');
const PinyinTable = require('../models/PinyinTable');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLog');

const router = express.Router();

const DEFAULT_INITIALS = ['', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's'];
const DEFAULT_FINALS = [
  'a', 'o', 'e', 'er', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong',
  'i', 'ia', 'iao', 'ie', 'iu', 'ian', 'in', 'iang', 'ing', 'iong',
  'u', 'ua', 'uo', 'uai', 'ui', 'uan', 'un', 'uang', 'ueng',
  'ü', 'üe', 'üan', 'ün',
];

const DEFAULT_VALID_SYLLABLES = new Set([
  'a', 'ai', 'an', 'ang', 'ao', 'ba', 'bai', 'ban', 'bang', 'bao', 'bei', 'ben', 'beng', 'bi', 'bian', 'biao', 'bie', 'bin', 'bing', 'bo', 'bu',
  'ca', 'cai', 'can', 'cang', 'cao', 'ce', 'cei', 'cen', 'ceng', 'cha', 'chai', 'chan', 'chang', 'chao', 'che', 'chen', 'cheng', 'chi', 'chong', 'chou', 'chu', 'chua', 'chuai', 'chuan', 'chuang', 'chui', 'chun', 'chuo', 'ci', 'cong', 'cou', 'cu', 'cuan', 'cui', 'cun', 'cuo',
  'da', 'dai', 'dan', 'dang', 'dao', 'de', 'dei', 'deng', 'di', 'dian', 'diao', 'die', 'ding', 'diu', 'dong', 'dou', 'du', 'duan', 'dui', 'dun', 'duo',
  'e', 'ei', 'en', 'eng', 'er', 'fa', 'fan', 'fang', 'fei', 'fen', 'feng', 'fo', 'fou', 'fu',
  'ga', 'gai', 'gan', 'gang', 'gao', 'ge', 'gei', 'gen', 'geng', 'gong', 'gou', 'gu', 'gua', 'guai', 'guan', 'guang', 'gui', 'gun', 'guo',
  'ha', 'hai', 'han', 'hang', 'hao', 'he', 'hei', 'hen', 'heng', 'hong', 'hou', 'hu', 'hua', 'huai', 'huan', 'huang', 'hui', 'hun', 'huo',
  'ji', 'jia', 'jian', 'jiang', 'jiao', 'jie', 'jin', 'jing', 'jiong', 'jiu', 'ju', 'juan', 'jue', 'jun',
  'ka', 'kai', 'kan', 'kang', 'kao', 'ke', 'ken', 'keng', 'kong', 'kou', 'ku', 'kua', 'kuai', 'kuan', 'kuang', 'kui', 'kun', 'kuo',
  'la', 'lai', 'lan', 'lang', 'lao', 'le', 'lei', 'leng', 'li', 'lia', 'lian', 'liang', 'liao', 'lie', 'lin', 'ling', 'liu', 'lo', 'long', 'lou', 'lu', 'luan', 'lun', 'luo', 'lü', 'lüe',
  'ma', 'mai', 'man', 'mang', 'mao', 'me', 'mei', 'men', 'meng', 'mi', 'mian', 'miao', 'mie', 'min', 'ming', 'miu', 'mo', 'mou', 'mu',
  'na', 'nai', 'nan', 'nang', 'nao', 'ne', 'nei', 'nen', 'neng', 'ni', 'nian', 'niang', 'niao', 'nie', 'nin', 'ning', 'niu', 'nong', 'nou', 'nu', 'nuan', 'nuo', 'nü', 'nüe',
  'o', 'ou', 'pa', 'pai', 'pan', 'pang', 'pao', 'pei', 'pen', 'peng', 'pi', 'pian', 'piao', 'pie', 'pin', 'ping', 'po', 'pou', 'pu',
  'qi', 'qia', 'qian', 'qiang', 'qiao', 'qie', 'qin', 'qing', 'qiong', 'qiu', 'qu', 'quan', 'que', 'qun',
  'ran', 'rang', 'rao', 're', 'ren', 'reng', 'ri', 'rong', 'rou', 'ru', 'ruan', 'rui', 'run', 'ruo',
  'sa', 'sai', 'san', 'sang', 'sao', 'se', 'sen', 'seng', 'sha', 'shai', 'shan', 'shang', 'shao', 'she', 'shen', 'sheng', 'shi', 'shou', 'shu', 'shua', 'shuai', 'shuan', 'shuang', 'shui', 'shun', 'shuo', 'si', 'song', 'sou', 'su', 'suan', 'sui', 'sun', 'suo',
  'ta', 'tai', 'tan', 'tang', 'tao', 'te', 'teng', 'ti', 'tian', 'tiao', 'tie', 'ting', 'tong', 'tou', 'tu', 'tuan', 'tui', 'tun', 'tuo',
  'wa', 'wai', 'wan', 'wang', 'wei', 'wen', 'weng', 'wo', 'wu',
  'xi', 'xia', 'xian', 'xiang', 'xiao', 'xie', 'xin', 'xing', 'xiong', 'xiu', 'xu', 'xuan', 'xue', 'xun',
  'ya', 'yan', 'yang', 'yao', 'ye', 'yi', 'yin', 'ying', 'yo', 'yong', 'you', 'yu', 'yuan', 'yue', 'yun',
  'za', 'zai', 'zan', 'zang', 'zao', 'ze', 'zei', 'zen', 'zeng', 'zha', 'zhai', 'zhan', 'zhang', 'zhao', 'zhe', 'zhen', 'zheng', 'zhi', 'zhong', 'zhou', 'zhu', 'zhua', 'zhuai', 'zhuan', 'zhuang', 'zhui', 'zhun', 'zhuo', 'zi', 'zong', 'zou', 'zu', 'zuan', 'zui', 'zun', 'zuo',
]);

function normalizeSyllable(initial, final) {
  let rawSyllable = initial + final;

  if (initial === '') {
    if (final === 'i') rawSyllable = 'yi';
    else if (final === 'u') rawSyllable = 'wu';
    else if (final === 'ü') rawSyllable = 'yu';
    else if (final.startsWith('i') && final !== 'i') rawSyllable = 'y' + final.slice(1);
    else if (final.startsWith('u') && final !== 'u') rawSyllable = 'w' + final.slice(1);
    else if (final.startsWith('ü') && final !== 'ü') rawSyllable = 'yu' + final.slice(2);
  } else if (['j', 'q', 'x'].includes(initial) && final.startsWith('ü')) {
    rawSyllable = initial + 'u' + final.slice(1);
  }

  return rawSyllable;
}

function buildDefaultSyllables() {
  const syllables = [];
  DEFAULT_INITIALS.forEach((initial) => {
    DEFAULT_FINALS.forEach((final) => {
      const syllable = normalizeSyllable(initial, final);
      if (DEFAULT_VALID_SYLLABLES.has(syllable)) {
        syllables.push({ initial, final, syllable });
      }
    });
  });
  return syllables;
}

async function getOrCreateTable() {
  let table = await PinyinTable.findOne();
  if (!table) {
    table = await PinyinTable.create({
      initials: DEFAULT_INITIALS,
      finals: DEFAULT_FINALS,
      syllables: buildDefaultSyllables(),
    });
  }
  return table;
}

router.get('/', async (req, res) => {
  try {
    const table = await getOrCreateTable();
    res.json(table);
  } catch (err) {
    console.error('Load pinyin table error:', err);
    res.status(500).json({ error: 'Could not load the pinyin table' });
  }
});

// Every mutation below targets a single initial/final/syllable with a Mongo
// array operator ($addToSet/$pull/$push) instead of replacing the whole
// document. Two admin tabs editing at the same time (or one tab left open
// while the table changes elsewhere) previously clobbered each other's
// changes because each save PUT the entire arrays from whatever stale copy
// the tab had loaded.

router.post('/initials', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const value = (req.body.value || '').trim().toLowerCase();
    if (!value) return res.status(400).json({ error: 'value is required' });

    const table = await getOrCreateTable();
    await PinyinTable.updateOne({ _id: table._id }, { $addToSet: { initials: value } });
    logActivity(req, { action: 'update', resourceType: 'pinyin-table', resourceId: table._id, label: `Added initial "${value}"` });
    res.json(await PinyinTable.findById(table._id));
  } catch (err) {
    console.error('Add initial error:', err);
    res.status(500).json({ error: err.message || 'Could not add the initial' });
  }
});

router.delete('/initials/:value', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const table = await getOrCreateTable();
    await PinyinTable.updateOne(
      { _id: table._id },
      { $pull: { initials: req.params.value, syllables: { initial: req.params.value } } }
    );
    logActivity(req, { action: 'update', resourceType: 'pinyin-table', resourceId: table._id, label: `Removed initial "${req.params.value}"` });
    res.json(await PinyinTable.findById(table._id));
  } catch (err) {
    console.error('Remove initial error:', err);
    res.status(500).json({ error: err.message || 'Could not remove the initial' });
  }
});

router.post('/finals', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const value = (req.body.value || '').trim().toLowerCase();
    if (!value) return res.status(400).json({ error: 'value is required' });

    const table = await getOrCreateTable();
    await PinyinTable.updateOne({ _id: table._id }, { $addToSet: { finals: value } });
    logActivity(req, { action: 'update', resourceType: 'pinyin-table', resourceId: table._id, label: `Added final "${value}"` });
    res.json(await PinyinTable.findById(table._id));
  } catch (err) {
    console.error('Add final error:', err);
    res.status(500).json({ error: err.message || 'Could not add the final' });
  }
});

router.delete('/finals/:value', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const table = await getOrCreateTable();
    await PinyinTable.updateOne(
      { _id: table._id },
      { $pull: { finals: req.params.value, syllables: { final: req.params.value } } }
    );
    logActivity(req, { action: 'update', resourceType: 'pinyin-table', resourceId: table._id, label: `Removed final "${req.params.value}"` });
    res.json(await PinyinTable.findById(table._id));
  } catch (err) {
    console.error('Remove final error:', err);
    res.status(500).json({ error: err.message || 'Could not remove the final' });
  }
});

router.put('/syllable', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { initial, final } = req.body;
    const syllable = (req.body.syllable || '').trim();
    if (initial === undefined || final === undefined) {
      return res.status(400).json({ error: 'initial and final are required' });
    }

    const table = await getOrCreateTable();
    const existing = table.syllables.find((s) => s.initial === initial && s.final === final);
    const highlighted = existing ? existing.highlighted : false;

    await PinyinTable.updateOne({ _id: table._id }, { $pull: { syllables: { initial, final } } });
    if (syllable) {
      await PinyinTable.updateOne({ _id: table._id }, { $push: { syllables: { initial, final, syllable, highlighted } } });
    }
    res.json(await PinyinTable.findById(table._id));
  } catch (err) {
    console.error('Update syllable error:', err);
    res.status(500).json({ error: err.message || 'Could not update the syllable' });
  }
});

router.put('/syllable/highlight', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { initial, final, highlighted } = req.body;
    if (initial === undefined || final === undefined) {
      return res.status(400).json({ error: 'initial and final are required' });
    }

    const table = await getOrCreateTable();
    const result = await PinyinTable.updateOne(
      { _id: table._id, syllables: { $elemMatch: { initial, final } } },
      { $set: { 'syllables.$.highlighted': !!highlighted } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'That cell has no syllable to highlight yet' });
    }
    res.json(await PinyinTable.findById(table._id));
  } catch (err) {
    console.error('Highlight syllable error:', err);
    res.status(500).json({ error: err.message || 'Could not update the highlight' });
  }
});

module.exports = router;
