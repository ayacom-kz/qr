const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Страховка: не даём одиночной async-ошибке уронить процесс (crash loop на хостинге)
process.on('unhandledRejection', (reason) => {
    console.error('⚠️ unhandledRejection:', reason && reason.message ? reason.message : reason);
});

const { connectDB } = require('./config/db');
const employeeRoutes = require('./routes/employees');
const adminRoutes = require('./routes/admin');
const restaurantRoutes = require('./routes/restaurants');

const app = express();

connectDB();

app.use(cors());
// Фото приходят как base64 внутри JSON/форм — поднимаем лимит тела запроса
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Дефолтный аватар (фото хранятся в БД, но нужен запасной по старому пути)
app.get('/uploads/photos/default-avatar.png', (req, res) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="#e5e7eb"/>
        <circle cx="100" cy="78" r="38" fill="#9ca3af"/>
        <path d="M40 180c0-33 27-56 60-56s60 23 60 56z" fill="#9ca3af"/>
    </svg>`;
    res.set('Content-Type', 'image/svg+xml');
    res.send(svg);
});

// Статика фронтенда
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')));
app.use('/public', express.static(path.join(__dirname, '../frontend/public')));

// API
app.use('/api/employees', employeeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/restaurants', restaurantRoutes);

// Публичная страница бейджа
app.get('/badge/:token', (req, res) => {
    const filePath = path.join(__dirname, '../frontend/public/badge.html');
    res.sendFile(filePath, (err) => {
        if (err) {
            console.log('Error sending badge.html:', err.message);
            res.status(500).send('File not found');
        }
    });
});

// Главная
app.get('/', (req, res) => {
    res.json({ service: 'AYACOM QR Badge System', status: 'running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('AYACOM QR Badge Server');
    console.log('Port: ' + PORT);
    console.log('Admin: http://localhost:' + PORT + '/admin/');
    console.log('API: http://localhost:' + PORT + '/api/');
    console.log('');
});
