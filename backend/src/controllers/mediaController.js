const Media = require('../models/Media');
const { cloudinary } = require('../config/cloudinary');

// ─── POST /api/media/upload ────────────────────────────────────────────────────
// Supports uploading multiple files at once (images + videos)
exports.uploadMedia = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }

  const docs = req.files.map(file => ({
    url:      file.path,                                          // Cloudinary CDN URL
    publicId: file.filename,                                      // Cloudinary public_id
    type:     file.mimetype.startsWith('video/') ? 'video' : 'image',
    filename: file.originalname,
    format:   file.mimetype.split('/')[1] || '',
    size:     file.size || 0,
  }));

  const media = await Media.insertMany(docs);
  res.status(201).json({ success: true, count: media.length, media });
};

// ─── GET /api/media ────────────────────────────────────────────────────────────
// Optional query params: type=image|video  search=  page=  limit=
exports.getAllMedia = async (req, res) => {
  const { type, search, page = 1, limit = 60 } = req.query;

  const query = {};
  if (type && ['image', 'video'].includes(type)) query.type = type;
  if (search) query.filename = { $regex: search, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);
  const [media, total] = await Promise.all([
    Media.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Media.countDocuments(query),
  ]);

  // Aggregate size stats
  const [stats] = await Media.aggregate([
    { $group: { _id: null, totalSize: { $sum: '$size' }, images: { $sum: { $cond: [{ $eq: ['$type', 'image'] }, 1, 0] } }, videos: { $sum: { $cond: [{ $eq: ['$type', 'video'] }, 1, 0] } } } },
  ]);

  res.json({
    success: true,
    media,
    total,
    pages: Math.ceil(total / Number(limit)),
    stats: stats || { totalSize: 0, images: 0, videos: 0 },
  });
};

// ─── GET /api/media/images ────────────────────────────────────────────────────
// Global image library — all images across products, media uploads, settings.
// Query params: search=  page=  limit=  (default limit 24 for modal grid)
exports.getMediaImages = async (req, res) => {
  const { search, page = 1, limit = 24 } = req.query;
  const pageNum  = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const query = { type: 'image' };
  if (search) query.filename = { $regex: search, $options: 'i' };

  const skip = (pageNum - 1) * limitNum;
  const [data, totalItems] = await Promise.all([
    Media.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Media.countDocuments(query),
  ]);

  res.json({
    success:    true,
    data,
    page:       pageNum,
    totalPages: Math.ceil(totalItems / limitNum),
    totalItems,
  });
};

// ─── DELETE /api/media/:id ─────────────────────────────────────────────────────
// Removes the file from Cloudinary AND the database
exports.deleteMedia = async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) return res.status(404).json({ success: false, message: 'Media not found' });

  // Destroy from Cloudinary (resource_type must match what was uploaded)
  try {
    await cloudinary.uploader.destroy(media.publicId, {
      resource_type: media.type === 'video' ? 'video' : 'image',
    });
  } catch (cloudErr) {
    // Log but don't block — still remove the DB record
    console.error('[Cloudinary] destroy failed:', cloudErr.message);
  }

  await media.deleteOne();
  res.json({ success: true, message: 'Media deleted' });
};
