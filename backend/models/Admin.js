// backend/models/Admin.js
// Работа с таблицей admins. Пароль всегда хранится в виде bcrypt-хэша.

const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { mapAdmin } = require('../utils/mappers');

const Admin = {

    // Поиск по имени пользователя (возвращает строку с хэшем пароля — для логина)
    async findByUsername(username) {
        const res = await query('SELECT * FROM admins WHERE username = $1', [username]);
        return res.rows[0] || null;
    },

    // Поиск по id, БЕЗ пароля (для middleware auth)
    async findByIdSafe(id) {
        const res = await query('SELECT * FROM admins WHERE id = $1', [id]);
        return mapAdmin(res.rows[0]);
    },

    // Создание админа с хэшированием пароля
    async create({ username, email, password, role = 'hr' }) {
        const hash = await bcrypt.hash(password, 12);
        const res = await query(
            `INSERT INTO admins (username, email, password, role)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [username, email, hash, role]
        );
        return mapAdmin(res.rows[0]);
    },

    // Проверка пароля при логине
    async comparePassword(candidatePassword, hash) {
        return bcrypt.compare(candidatePassword, hash);
    },

    // Кол-во админов
    async count() {
        const res = await query('SELECT COUNT(*)::int AS c FROM admins');
        return res.rows[0].c;
    }
};

module.exports = Admin;
