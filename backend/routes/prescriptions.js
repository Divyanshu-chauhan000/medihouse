import express from 'express';
import multer from 'multer';
import path from 'path';
import Prescription from '../models/Prescription.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/prescriptions');
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
      cb('Error: Images Only!');
    }
  }
});

// Create uploads directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync('uploads/prescriptions')) {
  fs.mkdirSync('uploads/prescriptions', { recursive: true });
}

// @route   GET /api/prescriptions
// @desc    Get user's prescriptions
router.get('/', protect, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ user: req.user.id }).sort('-createdAt');
    res.json({ success: true, prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/prescriptions/pending
// @desc    Get pending prescriptions (Admin)
router.get('/pending', protect, authorize('admin'), async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ status: 'Pending' })
      .populate('user', 'name email')
      .sort('-createdAt');
    res.json({ success: true, prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/prescriptions
// @desc    Upload new prescription
router.post('/', protect, upload.single('prescription'), async (req, res) => {
  try {
    const { patientName, doctorName } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a prescription image' });
    }

    const prescription = await Prescription.create({
      user: req.user.id,
      patientName,
      doctorName,
      imageUrl: `/uploads/prescriptions/${req.file.filename}`,
      status: 'Pending'
    });

    res.status(201).json({ success: true, prescription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/prescriptions/:id
// @desc    Update prescription status (Admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    res.json({ success: true, prescription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
