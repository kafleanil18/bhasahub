const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    text: { type: String, required: true },
    rating: { type: Number, default: 5 },
    photo: { type: String, default: '' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Testimonial', testimonialSchema);