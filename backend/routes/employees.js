const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Employee = require('../models/Employee');
const QRGenerator = require('../utils/qrGenerator');
const auth = require('../middleware/auth');
const { isValidId } = require('../utils/validate');

// ===== Загрузка фото В ПАМЯТЬ (не на диск) =====
// Фото превращается в base64 data-URL и хранится прямо в БД,
// поэтому переживает передеплой на бесплатном хостинге.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extOk = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeOk = allowedTypes.test(file.mimetype);
        if (extOk && mimeOk) return cb(null, true);
        cb(new Error('Разрешены только изображения: jpeg, jpg, png, webp'));
    }
});

// Превращает загруженный файл в data-URL строку
function fileToDataUrl(file) {
    return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}

// ==================================================
// POST /api/employees — ДОБАВИТЬ СОТРУДНИКА
// ==================================================
router.post('/', auth, upload.single('photo'), async (req, res) => {
    try {
        const {
            firstName, lastName, middleName,
            position, department, employeeId,
            email, phone, discountTier
        } = req.body;

        const existing = await Employee.findByEmailOrEmployeeId(email, employeeId);
        if (existing) {
            return res.status(400).json({
                error: 'Сотрудник с таким email или ID уже существует!'
            });
        }

        const qrToken = QRGenerator.generateToken();
        const baseUrl = process.env.BASE_URL;
        const qrData = await QRGenerator.generateQR(qrToken, baseUrl);

        const employee = await Employee.create({
            firstName,
            lastName,
            middleName: middleName || '',
            position,
            department,
            employeeId,
            email,
            phone: phone || '',
            discountTier: discountTier || 'standard',
            photo: req.file
                ? fileToDataUrl(req.file)
                : '/uploads/photos/default-avatar.png',
            qrCode: qrData.qrCode,
            qrUniqueToken: qrToken
        });

        console.log(`Сотрудник ${firstName} ${lastName} добавлен`);
        console.log(`QR ссылка: ${qrData.qrUrl}`);

        res.status(201).json({
            success: true,
            message: 'Сотрудник добавлен! QR-код сгенерирован.',
            employee,
            qrUrl: qrData.qrUrl
        });

    } catch (error) {
        console.error('Ошибка добавления:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==================================================
// GET /api/employees — СПИСОК СОТРУДНИКОВ
// ==================================================
router.get('/', auth, async (req, res) => {
    try {
        const { status, department, search, page = 1, limit = 20 } = req.query;

        const result = await Employee.list({ status, department, search, page, limit });

        res.json({
            employees: result.employees,
            pagination: {
                total: result.total,
                page: result.page,
                pages: result.pages
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================================================
// GET /api/employees/badge/:token — ПУБЛИЧНАЯ СТРАНИЦА БЕЙДЖА
// ⚠️ ДОЛЖЕН быть ВЫШЕ чем /:id
// ==================================================
router.get('/badge/:token', async (req, res) => {
    try {
        const employee = await Employee.findByToken(req.params.token);

        if (!employee) {
            return res.status(404).json({
                error: 'Сотрудник не найден. QR-код недействителен.'
            });
        }

        if (employee.status !== 'active') {
            return res.status(403).json({
                error: 'Бейдж деактивирован',
                status: employee.status
            });
        }

        res.json({
            firstName: employee.firstName,
            lastName: employee.lastName,
            middleName: employee.middleName,
            position: employee.position,
            department: employee.department,
            employeeId: employee.employeeId,
            photo: employee.photo,
            status: employee.status,
            discountTier: employee.discountTier,
            company: 'AYACOM'
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================================================
// POST /api/employees/:id/regenerate-qr — НОВЫЙ QR КОД
// ⚠️ ВЫШЕ чем просто /:id
// ==================================================
router.post('/:id/regenerate-qr', auth, async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ error: 'Неверный ID' });
        }

        const newToken = QRGenerator.generateToken();
        const baseUrl = process.env.BASE_URL;
        const qrData = await QRGenerator.generateQR(newToken, baseUrl);

        const employee = await Employee.updateQR(req.params.id, qrData.qrCode, newToken);

        if (!employee) {
            return res.status(404).json({ error: 'Сотрудник не найден' });
        }

        res.json({
            success: true,
            message: 'QR-код перегенерирован! Старый больше не работает.',
            qrUrl: qrData.qrUrl,
            qrCode: qrData.qrCode
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================================================
// GET /api/employees/:id — ОДИН СОТРУДНИК
// ==================================================
router.get('/:id', auth, async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ error: 'Неверный ID' });
        }

        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ error: 'Сотрудник не найден' });
        }
        res.json(employee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================================================
// PUT /api/employees/:id — ОБНОВИТЬ СОТРУДНИКА
// ==================================================
router.put('/:id', auth, upload.single('photo'), async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ error: 'Неверный ID' });
        }

        const updates = { ...req.body };
        if (req.file) {
            updates.photo = fileToDataUrl(req.file);
        }

        const employee = await Employee.updateById(req.params.id, updates);

        if (!employee) {
            return res.status(404).json({ error: 'Сотрудник не найден' });
        }

        res.json({ success: true, employee });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================================================
// DELETE /api/employees/:id — ДЕАКТИВИРОВАТЬ
// ==================================================
router.delete('/:id', auth, async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ error: 'Неверный ID' });
        }

        const employee = await Employee.setStatus(req.params.id, 'inactive');

        if (!employee) {
            return res.status(404).json({ error: 'Сотрудник не найден' });
        }

        res.json({
            success: true,
            message: `${employee.firstName} ${employee.lastName} деактивирован.`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
