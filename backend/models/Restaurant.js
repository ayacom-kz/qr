// backend/models/Restaurant.js
// Работа с таблицей restaurants.

const { query } = require('../config/db');
const { mapRestaurant } = require('../utils/mappers');

const Restaurant = {

    // Список активных ресторанов, по алфавиту
    async listActive() {
        const res = await query(
            'SELECT * FROM restaurants WHERE is_active = true ORDER BY name ASC'
        );
        return res.rows.map(mapRestaurant);
    },

    // Создание. Принимает как плоские поля, так и вложенный discounts.
    async create(body) {
        const d = body.discounts || {};
        const res = await query(
            `INSERT INTO restaurants
                (name, address, logo, discount_standard, discount_premium, discount_vip,
                 contact_person, contact_phone, is_active)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             RETURNING *`,
            [
                body.name,
                body.address || '',
                body.logo || '',
                d.standard != null ? d.standard : 10,
                d.premium  != null ? d.premium  : 15,
                d.vip      != null ? d.vip      : 20,
                body.contactPerson || '',
                body.contactPhone || '',
                body.isActive != null ? body.isActive : true
            ]
        );
        return mapRestaurant(res.rows[0]);
    },

    // Обновление
    async updateById(id, body) {
        const columnMap = {
            name: 'name', address: 'address', logo: 'logo',
            contactPerson: 'contact_person', contactPhone: 'contact_phone',
            isActive: 'is_active'
        };

        const sets = [];
        const params = [];
        let i = 1;

        for (const [key, value] of Object.entries(body)) {
            if (columnMap[key] !== undefined) {
                sets.push(`${columnMap[key]} = $${i++}`);
                params.push(value);
            }
        }
        // Вложенные скидки
        if (body.discounts) {
            if (body.discounts.standard != null) { sets.push(`discount_standard = $${i++}`); params.push(body.discounts.standard); }
            if (body.discounts.premium  != null) { sets.push(`discount_premium = $${i++}`);  params.push(body.discounts.premium); }
            if (body.discounts.vip      != null) { sets.push(`discount_vip = $${i++}`);      params.push(body.discounts.vip); }
        }

        if (!sets.length) {
            const res = await query('SELECT * FROM restaurants WHERE id = $1', [id]);
            return mapRestaurant(res.rows[0]);
        }

        params.push(id);
        const res = await query(
            `UPDATE restaurants SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
            params
        );
        return mapRestaurant(res.rows[0]);
    },

    // Деактивация
    async deactivate(id) {
        await query('UPDATE restaurants SET is_active = false WHERE id = $1', [id]);
    },

    async count() {
        const res = await query('SELECT COUNT(*)::int AS c FROM restaurants');
        return res.rows[0].c;
    },

    async deleteAll() {
        await query('DELETE FROM restaurants');
    },

    async insertMany(list) {
        for (const r of list) {
            await this.create(r);
        }
    }
};

module.exports = Restaurant;
