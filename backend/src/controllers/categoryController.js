const Category = require('../models/Category');

// GET /api/categories — public, only published
exports.getPublishedCategories = async (req, res) => {
  const categories = await Category.find({ status: 'published' }).sort({ order: 1, name: 1 });
  res.json({ success: true, categories });
};

// GET /api/categories/admin — admin, all (draft + published)
exports.getAllCategories = async (req, res) => {
  const categories = await Category.find().sort({ order: 1, name: 1 });
  res.json({ success: true, categories });
};

// POST /api/categories — admin
exports.createCategory = async (req, res) => {
  const { name, description, emoji, color, imageUrl, status, order } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }
  const category = await Category.create({ name, description, emoji, color, imageUrl, status, order });
  res.status(201).json({ success: true, category });
};

// PUT /api/categories/:id — admin
exports.updateCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, category });
};

// DELETE /api/categories/:id — admin
exports.deleteCategory = async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, message: 'Category deleted' });
};
