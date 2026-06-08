// utils/seed.js
// Run: node utils/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const Product  = require('../models/Product');
const Service  = require('../models/Service');

const connectDB = require('../config/database');

const services = [
  { name: 'Document Printing',    category: 'printing',    icon: '🖨️', description: 'Black & white and color printing for all documents, forms, marksheets, certificates, and more.', pricing: { startingFrom: 2, unit: 'per page', notes: 'B&W ₹2, Color ₹10' }, estimatedTime: '30 mins', sortOrder: 1 },
  { name: 'Xerox & Scanning',     category: 'printing',    icon: '🗂️', description: 'Fast xerox copies and high-quality scanning for all document types.', pricing: { startingFrom: 1, unit: 'per page' }, estimatedTime: '15 mins', sortOrder: 2 },
  { name: 'Ticket Booking',       category: 'digital',     icon: '✈️', description: 'Train, bus, and flight ticket bookings done quickly.', pricing: { startingFrom: 50, unit: 'per booking', notes: 'Service charge only' }, estimatedTime: '10 mins', sortOrder: 3 },
  { name: 'Money Transfer',       category: 'financial',   icon: '💳', description: 'Secure and fast money transfers via NEFT, IMPS. Aadhaar-based withdrawals.', pricing: { startingFrom: 10, unit: 'per transaction' }, estimatedTime: '5 mins', sortOrder: 4 },
  { name: 'Form Filling & Online Work', category: 'digital', icon: '📋', description: 'Government forms, job applications, PAN/Aadhaar corrections.', pricing: { startingFrom: 30, unit: 'per form' }, estimatedTime: '20 mins', sortOrder: 5 },
  { name: 'Photo Printing',       category: 'photography', icon: '📸', description: 'Passport photos, family portraits, ID card photos printed instantly.', pricing: { startingFrom: 10, unit: 'per photo' }, estimatedTime: '10 mins', sortOrder: 6 },
];

const products = [
  { name: 'Custom T-Shirt Printing', category: 'tshirt',       description: 'Full-color print on premium cotton fabric. Any design, any text, any size.', price: { base: 299, unit: 'per piece' }, customizable: true, featured: true, deliveryDays: 2, tags: ['tshirt','custom','clothing'] },
  { name: 'Custom Mug',             category: 'mug',           description: 'Premium ceramic mugs with your photo or design. Perfect gift.', price: { base: 249, unit: 'per piece' }, customizable: true, featured: true, deliveryDays: 2, tags: ['mug','gift','custom'] },
  { name: 'Banner & Poster',        category: 'banner',        description: 'Large-format printing for events, shops, elections. Any size.', price: { base: 80, unit: 'per sq.ft' }, customizable: true, featured: true, deliveryDays: 1, tags: ['banner','poster','large-format'] },
  { name: 'Wedding Cards',          category: 'wedding-card',  description: 'Beautiful custom wedding invitations in various designs and finishes.', price: { base: 8, unit: 'per card' }, customizable: true, featured: true, minQuantity: 50, deliveryDays: 3, tags: ['wedding','invitation','cards'] },
  { name: 'Photo Frame',            category: 'photo-frame',   description: 'Custom photo frames with HD printing for home decor and gifting.', price: { base: 199, unit: 'per piece' }, customizable: true, deliveryDays: 2, tags: ['frame','photo','gift'] },
  { name: 'Visiting Cards',         category: 'visiting-card', description: 'Professional business cards, glossy or matte finish.', price: { base: 150, unit: 'per 100 pcs' }, customizable: true, minQuantity: 100, deliveryDays: 1, tags: ['business-card','visiting-card'] },
];

async function seed() {
  try {
    await connectDB();
    console.log('\n🌱 Seeding database...\n');

    // Clear existing
    await Promise.all([
      User.deleteMany({ role: 'admin' }),
      Service.deleteMany({}),
      Product.deleteMany({}),
    ]);

    // Create admin user
    const admin = await User.create({
      name    : process.env.ADMIN_NAME     || 'PrintZone Admin',
      email   : process.env.ADMIN_EMAIL    || 'admin@printzone.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      role    : 'admin',
      isVerified: true,
    });
    console.log(`✅ Admin created: ${admin.email}`);

    // Seed services
    await Service.insertMany(services);
    console.log(`✅ ${services.length} services seeded`);

    // Seed products
    await Product.insertMany(products);
    console.log(`✅ ${products.length} products seeded`);

    console.log('\n✅ Database seeded successfully!\n');
    console.log('📌 Admin Login:');
    console.log(`   Email    : ${admin.email}`);
    console.log(`   Password : ${process.env.ADMIN_PASSWORD || 'Admin@12345'}`);
    console.log('\nChange this password immediately after first login!\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
