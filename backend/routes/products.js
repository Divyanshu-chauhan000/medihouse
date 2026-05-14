import express from 'express';
import Product from '../models/Product.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filters and pagination
router.get('/', async (req, res) => {
  try {
    const { category, search, requiresPrescription, sortBy, page = 1, limit = 12 } = req.query;
    let query = {};

    if (category) query.category = category;
    if (requiresPrescription !== undefined) query.requiresPrescription = requiresPrescription === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let sort = {};
    if (sortBy === 'price_low') sort.price = 1;
    else if (sortBy === 'price_high') sort.price = -1;
    else if (sortBy === 'rating') sort.ratings = -1;
    else sort.createdAt = -1;

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('vendor', 'name');

    res.json({
      success: true,
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/products/vendor
// @desc    Get vendor's products
router.get('/vendor', protect, authorize('vendor'), async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.user.id });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('vendor', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/products
// @desc    Create product (Vendor/Admin)
router.post('/', protect, authorize('vendor', 'admin'), async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      vendor: req.user.id
    });
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
