const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    url:      { type: String, required: true },
    publicId: { type: String, required: true },
    type:     { type: String, enum: ['image', 'video'], required: true },
    filename: { type: String, default: '' },
    format:   { type: String, default: '' },
    size:     { type: Number, default: 0 },
    // Where this file originated — lets the library show "product", "settings", etc.
    source:   { type: String, default: 'media_library' },
  },
  { timestamps: true }
);

// Compound index for the most common query: images sorted newest-first
mediaSchema.index({ type: 1, createdAt: -1 });
// Text index for filename search
mediaSchema.index({ filename: 'text' });

module.exports = mongoose.model('Media', mediaSchema);
