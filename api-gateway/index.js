const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());

// Secret key MUST match the one in user-service
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_in_production';

// Middleware to verify JWT token
const authenticateJWT = (req, res, next) => {
    // Look for the "Authorization: Bearer <token>" header
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ error: 'Forbidden: Invalid Token' });
            }
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ error: 'Unauthorized: Missing Token' });
    }
};

// 1. Route /users traffic to the User Service seamlessly
app.use('/users', createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    changeOrigin: true,
}));

// 2. Route /products traffic, but PROTECT modifying routes (POST, PUT, DELETE)
app.use('/products', (req, res, next) => {
    // If it's a request to modify catalog (e.g. POST), require a valid login session (JWT token)
    if (req.method !== 'GET') {
        return authenticateJWT(req, res, next);
    }
    // GET requests (browsing products) are allowed without auth
    next();
}, createProxyMiddleware({
    target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true,
}));

// Health check for the Gateway
app.get('/health', (req, res) => {
    res.json({ status: 'API Gateway is actively routing traffic and guarding endpoints!' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n================================`);
    console.log(`API Gateway listening on port ${PORT}`);
    console.log(`================================`);
    console.log('Proxying: /users    -> User Service (:3001)');
    console.log('Proxying: /products -> Product Service (:3002) [POST is PROTECTED]');
});
