// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');
const Restaurant = require('../models/Restaurant');
const auth = require('../middleware/auth');

// ===== Логин =====
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log('🔑 Login attempt:', username);

        const adminRow = await Admin.findByUsername(username);
        if (!adminRow) {
            console.log('❌ Admin not found');
            return res.status(401).json({ success: false, error: 'Неверный логин или пароль' });
        }

        const isMatch = await Admin.comparePassword(password, adminRow.password);
        if (!isMatch) {
            console.log('❌ Password mismatch');
            return res.status(401).json({ success: false, error: 'Неверный логин или пароль' });
        }

        if (!process.env.JWT_SECRET) {
            console.error('❌ JWT_SECRET НЕ ЗАДАН!');
            return res.status(500).json({ success: false, error: 'Ошибка конфигурации сервера' });
        }

        const token = jwt.sign(
            { id: adminRow.id, username: adminRow.username, role: adminRow.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            admin: {
                id: adminRow.id,
                username: adminRow.username,
                email: adminRow.email,
                role: adminRow.role
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

// ===== Дашборд (статистика) =====
router.get('/dashboard', auth, async (req, res) => {
    try {
        const totalEmployees = await Employee.count();
        const activeEmployees = await Employee.count('active');
        const inactiveEmployees = await Employee.count('inactive');
        const totalRestaurants = await Restaurant.count();

        res.json({
            success: true,
            totalEmployees,
            activeEmployees,
            inactiveEmployees,
            totalRestaurants
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки статистики' });
    }
});

// ===== Проверка токена =====
router.get('/verify', auth, (req, res) => {
    res.json({ success: true, admin: req.admin });
});

module.exports = router;
