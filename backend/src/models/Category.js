const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: String,
  emoji: { type: String, default: '✨' },
  color: { type: String, default: '#D4AF37' },
  imageUrl: String,
  // 'draft' = hidden from frontend, 'published' = visible
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published',
  },
  order: { type: Number, default: 0 },
}, { timestamps: true });

categorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
