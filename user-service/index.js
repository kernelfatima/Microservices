const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const amqp = require('amqplib');

const app = express();

// RabbitMQ Setup
let rabbitChannel;
const connectRabbitMQ = async () => {
    try {
        const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
        rabbitChannel = await conn.createChannel();
        await rabbitChannel.assertQueue('user_events');
        console.log('Connected to RabbitMQ 🐇');
    } catch (err) {
        console.error('RabbitMQ Connection failed. Retrying in 5s...', err.message);
        setTimeout(connectRabbitMQ, 5000);
    }
};
connectRabbitMQ();
app.use(express.json());
app.use(cors());

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_in_production';

// Configure PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'admin',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'user_service_db',
  password: process.env.DB_PASSWORD || 'password123',
  port: process.env.DB_PORT || 5433,
});

// Drop table and recreate it with a password field
const initDb = async () => {
    try {
        await pool.query(`DROP TABLE IF EXISTS users;`);
        await pool.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE
            );
        `);
        console.log('Database initialized with secure password field');
    } catch (err) {
        console.error('Error initializing database', err);
    }
};

initDb();

// 1. Register a new user
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Automatically make emails starting with 'admin' or 'boss' an admin for testing!
        const isAdmin = email.startsWith('admin') || email.startsWith('boss');

        const result = await pool.query(
            'INSERT INTO users (name, email, password, is_admin) VALUES ($1, $2, $3, $4) RETURNING id, name, email, is_admin',
            [name, email, hashedPassword, isAdmin]
        );
        
        // Asynchronously publish an event to RabbitMQ 🚀
        if (rabbitChannel) {
            const msg = JSON.stringify({ event: 'UserRegistered', id: result.rows[0].id, name, email, isAdmin });
            rabbitChannel.sendToQueue('user_events', Buffer.from(msg));
            console.log('Published UserRegistered event to queue');
        }

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// 2. Login user
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Find user by email
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        // Check password match
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, email: user.email, isAdmin: user.is_admin }, 
            JWT_SECRET, 
            { expiresIn: '1h' }
        );

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, isAdmin: user.is_admin } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Get all users (Just for fetching list)
app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email FROM users');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'User Service Authentication active!' });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`User Service Auth listening on port ${PORT}`);
});
