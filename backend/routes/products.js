import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Product from '../models/Product.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Multer Configuration for Product Images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products');
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Images Only!'));
    }
  }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads/products')) {
  fs.mkdirSync('uploads/products', { recursive: true });
}

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
router.post('/', protect, authorize('vendor', 'admin'), upload.single('image'), async (req, res) => {
  try {
    const productData = { ...req.body };
    if (req.file) {
      productData.image = `/uploads/products/${req.file.filename}`;
    }
    
    // Convert values
    if (productData.requiresPrescription === 'true') {
      productData.requiresPrescription = true;
    } else if (productData.requiresPrescription === 'false') {
      productData.requiresPrescription = false;
    }
    
    const product = await Product.create({
      ...productData,
      vendor: req.user.id
    });
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product (Vendor/Admin)
router.put('/:id', protect, authorize('vendor', 'admin'), upload.single('image'), async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check ownership unless admin
    if (product.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to update this product' });
    }

    const productData = { ...req.body };
    if (req.file) {
      // If there's an existing image, delete it
      if (product.image && product.image.startsWith('/uploads/products/')) {
        const oldPath = path.join(process.cwd(), product.image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      productData.image = `/uploads/products/${req.file.filename}`;
    }

    // Convert values
    if (productData.requiresPrescription === 'true') {
      productData.requiresPrescription = true;
    } else if (productData.requiresPrescription === 'false') {
      productData.requiresPrescription = false;
    }

    product = await Product.findByIdAndUpdate(req.params.id, productData, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (Vendor/Admin)
router.delete('/:id', protect, authorize('vendor', 'admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check ownership unless admin
    if (product.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this product' });
    }

    // Delete associated image file
    if (product.image && product.image.startsWith('/uploads/products/')) {
      const imgPath = path.join(process.cwd(), product.image);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
