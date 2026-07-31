// backend/models/Employee.js
// Работа с таблицей employees.

const { query } = require('../config/db');
const { mapEmployee } = require('../utils/mappers');

const Employee = {

    // Есть ли сотрудник с таким email ИЛИ табельным номером
    async findByEmailOrEmployeeId(email, employeeId) {
        const res = await query(
            'SELECT * FROM employees WHERE email = $1 OR employee_id = $2 LIMIT 1',
            [email, employeeId]
        );
        return mapEmployee(res.rows[0]);
    },

    // Поиск по публичному QR-токену
    async findByToken(token) {
        const res = await query('SELECT * FROM employees WHERE qr_unique_token = $1', [token]);
        return mapEmployee(res.rows[0]);
    },

    // Поиск по id
    async findById(id) {
        const res = await query('SELECT * FROM employees WHERE id = $1', [id]);
        return mapEmployee(res.rows[0]);
    },

    // Создание сотрудника
    async create(data) {
        const res = await query(
            `INSERT INTO employees
                (first_name, last_name, middle_name, position, department, employee_id,
                 email, phone, discount_tier, photo, qr_code, qr_unique_token)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
             RETURNING *`,
            [
                data.firstName, data.lastName, data.middleName || '',
                data.position, data.department, data.employeeId,
                data.email, data.phone || '', data.discountTier || 'standard',
                data.photo || '/uploads/photos/default-avatar.png',
                data.qrCode, data.qrUniqueToken
            ]
        );
        return mapEmployee(res.rows[0]);
    },

    // Список с фильтрами и пагинацией
    async list({ status, department, search, page = 1, limit = 20 }) {
        const conditions = [];
        const params = [];
        let i = 1;

        if (status) { conditions.push(`status = $${i++}`); params.push(status); }
        if (department) { conditions.push(`department = $${i++}`); params.push(department); }
        if (search) {
            conditions.push(`(
                first_name  ILIKE $${i} OR
                last_name   ILIKE $${i} OR
                employee_id ILIKE $${i} OR
                email       ILIKE $${i}
            )`);
            params.push(`%${search}%`);
            i++;
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        // total
        const totalRes = await query(`SELECT COUNT(*)::int AS c FROM employees ${where}`, params);
        const total = totalRes.rows[0].c;

        // выборка
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const dataRes = await query(
            `SELECT * FROM employees ${where}
             ORDER BY created_at DESC
             LIMIT $${i++} OFFSET $${i++}`,
            [...params, parseInt(limit), offset]
        );

        return {
            employees: dataRes.rows.map(mapEmployee),
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        };
    },

    // Обновление произвольных полей (принимает camelCase, маппит в колонки)
    async updateById(id, updates) {
        const columnMap = {
            firstName: 'first_name', lastName: 'last_name', middleName: 'middle_name',
            position: 'position', department: 'department', employeeId: 'employee_id',
            email: 'email', phone: 'phone', status: 'status', discountTier: 'discount_tier',
            photo: 'photo', qrCode: 'qr_code', qrUniqueToken: 'qr_unique_token'
        };

        const sets = [];
        const params = [];
        let i = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (columnMap[key] !== undefined) {
                sets.push(`${columnMap[key]} = $${i++}`);
                params.push(value);
            }
        }
        // Всегда обновляем updated_at
        sets.push(`updated_at = now()`);

        if (sets.length === 1) {
            // Нечего менять кроме даты — просто вернём запись
            return this.findById(id);
        }

        params.push(id);
        const res = await query(
            `UPDATE employees SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
            params
        );
        return mapEmployee(res.rows[0]);
    },

    // Смена статуса (для "деактивации")
    async setStatus(id, status) {
        const res = await query(
            `UPDATE employees SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
            [status, id]
        );
        return mapEmployee(res.rows[0]);
    },

    // Обновление QR-кода
    async updateQR(id, qrCode, token) {
        const res = await query(
            `UPDATE employees SET qr_code = $1, qr_unique_token = $2, updated_at = now()
             WHERE id = $3 RETURNING *`,
            [qrCode, token, id]
        );
        return mapEmployee(res.rows[0]);
    },

    // Подсчёты для дашборда
    async count(status) {
        if (status) {
            const res = await query('SELECT COUNT(*)::int AS c FROM employees WHERE status = $1', [status]);
            return res.rows[0].c;
        }
        const res = await query('SELECT COUNT(*)::int AS c FROM employees');
        return res.rows[0].c;
    },

    async deleteAll() {
        await query('DELETE FROM employees');
    }
};

module.exports = Employee;
