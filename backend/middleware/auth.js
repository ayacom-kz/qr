// backend/middleware/auth.js
// Проверка JWT-токена администратора.

const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Нет токена авторизации. Войдите в систему.'
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Неверный формат токена' });
        }

        if (!process.env.JWT_SECRET) {
            console.error('❌ JWT_SECRET НЕ ЗАДАН!');
            return res.status(500).json({ error: 'Ошибка конфигурации сервера' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Проверяем, что админ ещё существует в БД
        const admin = await Admin.findByIdSafe(decoded.id);
        if (!admin) {
            return res.status(401).json({ error: 'Пользователь не найден. Войдите заново.' });
        }

        req.admin = admin;
        req.adminId = admin._id;
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Токен недействителен. Войдите заново.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Токен истёк. Войдите заново.' });
        }
        console.error('❌ Auth error:', error.message);
        return res.status(500).json({ error: 'Ошибка проверки авторизации' });
    }
};
