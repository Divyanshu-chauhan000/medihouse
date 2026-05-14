import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price']
  },
  stock: {
    type: Number,
    required: [true, 'Please provide stock quantity'],
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['Antibiotics', 'Pain Relief', 'Cold & Flu', 'Digestive', 'Skin Care', 'Supplements', 'Vitamins', 'First Aid', 'Others']
  },
  manufacturer: {
    type: String,
    required: [true, 'Please provide manufacturer name']
  },
  batchNo: {
    type: String,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  image: {
    type: String
  },
  requiresPrescription: {
    type: Boolean,
    default: false
  },
  prescriptionType: {
    type: String,
    enum: ['OTC', 'Rx'],
    default: 'OTC'
  },
  dosage: String,
  strength: String,
  formulation: {
    type: String,
    enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Suspension', 'Powder', 'Spray', 'Drops']
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Product = mongoose.model('Product', productSchema);

export default Product;
