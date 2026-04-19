const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Check whether real Cloudinary credentials are present
// Rejects blank values and common placeholder strings
const PLACEHOLDERS = new Set(['placeholder', 'your_cloud_name', 'your_api_key', 'your_api_secret', 'xxx']);
const isReal = (v) => v && !PLACEHOLDERS.has(v.toLowerCase());

const isCloudinaryConfigured = !!(
  isReal(process.env.CLOUDINARY_CLOUD_NAME) &&
  isReal(process.env.CLOUDINARY_API_KEY) &&
  isReal(process.env.CLOUDINARY_API_SECRET)
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn('[upload] ⚠  Cloudinary env vars not set — falling back to local disk storage');
}

// ─── Helper: create a disk-storage instance for a given subfolder ─────────────
function diskStorage(subfolder) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '../../uploads', subfolder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });
}

// ─── Product image upload ─────────────────────────────────────────────────────
const productStorage = isCloudinaryConfigured
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'spiritual-revamp/products',
      },
    })
  : diskStorage('products');

const upload = multer({
  storage: productStorage,
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

// ─── Media Library upload (images + videos) ───────────────────────────────────
const mediaStorage = isCloudinaryConfigured
  ? new CloudinaryStorage({
      cloudinary,
      params: async (req, file) => ({
        folder:        'spiritual-revamp/media',
        resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image',
      }),
    })
  : diskStorage('media');

const uploadMedia = multer({
  storage: mediaStorage,
  limits:  { fileSize: 100 * 1024 * 1024 }, // 100 MB (for videos)
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  },
});

module.exports = { cloudinary, upload, uploadMedia, isCloudinaryConfigured };
