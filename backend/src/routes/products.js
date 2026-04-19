const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  getAllProducts,
  getProduct,
  getFeaturedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  getRelatedProducts,
} = require('../controllers/productController');

// Static/specific routes before wildcards
router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);

// Admin routes (specific paths before wildcard /:slug)
router.post('/upload/images', protect, adminOnly, upload.array('images', 5), uploadProductImages);
router.post('/', protect, adminOnly, createProduct);

// Wildcard param routes last
router.get('/:slug', getProduct);
router.get('/:id/related', getRelatedProducts);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
