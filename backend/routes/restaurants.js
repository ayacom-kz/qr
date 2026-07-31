// backend/routes/restaurants.js

const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const auth = require('../middleware/auth');
const { isValidId } = require('../utils/validate');

// GET /api/restaurants — Список активных ресторанов
router.get('/', auth, async (req, res) => {
    try {
        const restaurants = await Restaurant.listActive();
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/restaurants — Добавить ресторан
router.post('/', auth, async (req, res) => {
    try {
        const restaurant = await Restaurant.create(req.body);
        res.status(201).json({ success: true, restaurant });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/restaurants/:id — Обновить
router.put('/:id', auth, async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ error: 'Неверный ID' });
        }
        const restaurant = await Restaurant.updateById(req.params.id, req.body);
        res.json({ success: true, restaurant });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/restaurants/:id — Деактивировать
router.delete('/:id', auth, async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ error: 'Неверный ID' });
        }
        await Restaurant.deactivate(req.params.id);
        res.json({ success: true, message: 'Ресторан деактивирован' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
