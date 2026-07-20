const mongoose = require('mongoose');

const pinyinTableSchema = new mongoose.Schema(
  {
    initials: { type: [String], default: [] },
    finals: { type: [String], default: [] },
    syllables: [
      {
        // the zero initial is stored as '', which mongoose's required
        // validator rejects for strings, so initial/final are left optional
        initial: { type: String, default: '' },
        final: { type: String, default: '' },
        syllable: { type: String, required: true },
        highlighted: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('PinyinTable', pinyinTableSchema);
