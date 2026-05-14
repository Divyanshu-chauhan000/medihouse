import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Product from '../models/Product.js';

dns.setServers([
  '8.8.8.8',
  '1.1.1.1'
]);

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      phone: '+1234567890',
      role: 'admin',
      isVerified: true
    });

    // Create vendor user
    const vendor = await User.create({
      name: 'Pharmacy Vendor',
      email: 'vendor@example.com',
      password: 'vendor123',
      phone: '+0987654321',
      role: 'vendor',
      isVerified: true
    });

    // Create regular user
    const user = await User.create({
      name: 'John Doe',
      email: 'user@example.com',
      password: 'password123',
      phone: '+1111111111',
      role: 'user',
      isVerified: true
    });

    console.log('✓ Users created');

    // Create sample products
    const products = [
      {
        name: 'Aspirin 500mg',
        description: 'Effective pain reliever and fever reducer. Used to reduce fever and relieve mild to moderate pain from conditions such as muscle aches, toothaches, common cold, and headaches.',
        price: 50,
        stock: 100,
        category: 'Pain Relief',
        manufacturer: 'Generic Pharma',
        batchNo: 'BATCH001',
        expiryDate: new Date('2025-12-31'),
        requiresPrescription: false,
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=2030&auto=format&fit=crop',
        dosage: '500mg',
        formulation: 'Tablet',
        vendor: vendor._id
      },
      {
        name: 'Amoxicillin 250mg',
        description: 'Antibiotic for bacterial infections. Amoxicillin is used to treat a wide variety of bacterial infections. This medication is a penicillin-type antibiotic.',
        price: 120,
        stock: 50,
        category: 'Antibiotics',
        manufacturer: 'Abbott',
        batchNo: 'BATCH002',
        expiryDate: new Date('2025-06-30'),
        requiresPrescription: true,
        image: 'https://images.unsplash.com/photo-1550572017-ed2001594950?q=80&w=1974&auto=format&fit=crop',
        dosage: '250mg',
        formulation: 'Capsule',
        vendor: vendor._id
      },
      {
        name: 'Vitamin C 1000mg',
        description: 'Boost immunity with natural vitamin C. Helps protect cells and keep them healthy. Maintaining healthy skin, blood vessels, bones and cartilage.',
        price: 300,
        stock: 200,
        category: 'Vitamins',
        manufacturer: 'Nature\'s Best',
        batchNo: 'BATCH003',
        expiryDate: new Date('2026-12-31'),
        requiresPrescription: false,
        image: 'https://images.unsplash.com/photo-1616671285410-9c2490538a79?q=80&w=1964&auto=format&fit=crop',
        dosage: '1000mg',
        formulation: 'Tablet',
        vendor: vendor._id
      },
      {
        name: 'Metformin 500mg',
        description: 'Diabetes management medication. Metformin is used with a proper diet and exercise program and possibly with other medications to control high blood sugar.',
        price: 85,
        stock: 150,
        category: 'Digestive',
        manufacturer: 'Cipla',
        batchNo: 'BATCH005',
        expiryDate: new Date('2025-08-31'),
        requiresPrescription: true,
        image: 'https://images.unsplash.com/photo-1471864190281-ad5fe9bb0724?q=80&w=2070&auto=format&fit=crop',
        dosage: '500mg',
        formulation: 'Tablet',
        vendor: vendor._id
      },
      {
        name: 'Sunscreen SPF 50',
        description: 'Protect your skin from harmful UV rays. Broad-spectrum protection against UVA and UVB rays.',
        price: 450,
        stock: 80,
        category: 'Skin Care',
        manufacturer: 'SkinCare Plus',
        batchNo: 'BATCH006',
        expiryDate: new Date('2026-03-31'),
        requiresPrescription: false,
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1974&auto=format&fit=crop',
        dosage: '50ml',
        formulation: 'Cream',
        vendor: vendor._id
      },
      {
        name: 'Iron Supplement',
        description: 'Combat iron deficiency anemia. Essential for the production of red blood cells.',
        price: 200,
        stock: 120,
        category: 'Supplements',
        manufacturer: 'Health Plus',
        batchNo: 'BATCH007',
        expiryDate: new Date('2026-01-31'),
        requiresPrescription: false,
        image: 'https://images.unsplash.com/photo-1550572017-47b649563c3a?q=80&w=2012&auto=format&fit=crop',
        dosage: '325mg',
        formulation: 'Tablet',
        vendor: vendor._id
      }
    ];

    await Product.insertMany(products);
    console.log('✓ Products created');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nDemo Credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Vendor: vendor@example.com / vendor123');
    console.log('User: user@example.com / password123');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
