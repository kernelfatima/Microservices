const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createClient } = require('redis');

const app = express();
app.use(express.json());
app.use(cors());

// Redis Client Setup
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.connect().then(() => console.log('Connected to Redis Cache')).catch(console.error);

// Connect to MongoDB
// Our docker-compose.yml uses admin:password123 for root user
const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:password123@localhost:27017/product_db?authSource=admin';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB', err));

// Define a Product Database Schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: String
});

const Product = mongoose.model('Product', productSchema);

// Routes
// 1. Get all products (WITH REDIS CACHE)
app.get('/', async (req, res) => {
    try {
        // Intercept request to check cache
        const cachedProducts = await redisClient.get('all_products');
        if (cachedProducts) {
            console.log('Serving instantly from Redis Cache! 🚀');
            return res.json(JSON.parse(cachedProducts));
        }

        console.log('Serving from MongoDB (Cache Miss) 🐢');
        const products = await Product.find();
        
        // Save the result to cache for 1 hour (3600s)
        await redisClient.setEx('all_products', 3600, JSON.stringify(products));
        
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Create a product (INVALIDATES CACHE)
app.post('/', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        
        // Catalog updated, so we must securely wipe the stale cache!
        await redisClient.del('all_products');
        
        res.status(201).json(savedProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Product Service is running!' });
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Product Service listening on port ${PORT}`);
});
