import express from 'express';
import Wishlist from '../models/Wishlist.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/wishlist
// @desc    Get user wishlist
router.get('/', protect, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id }).populate('items.product');
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, items: [] });
    }
    const products = wishlist.items.map(item => item.product).filter(p => p !== null);
    res.json({ success: true, items: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/wishlist
// @desc    Toggle product in wishlist
router.post('/', protect, async (req, res) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) wishlist = await Wishlist.create({ user: req.user.id, items: [] });

    const itemIndex = wishlist.items.findIndex(item => item.product.toString() === productId);

    if (itemIndex > -1) {
      wishlist.items.splice(itemIndex, 1);
    } else {
      wishlist.items.push({ product: productId });
    }

    await wishlist.save();
    const updatedWishlist = await Wishlist.findOne({ user: req.user.id }).populate('items.product');
    const products = updatedWishlist.items.map(item => item.product).filter(p => p !== null);
    res.json({ success: true, items: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
