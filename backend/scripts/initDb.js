// backend/scripts/initDb.js
// Создаёт таблицы в Postgres (Supabase) из db/schema.sql.
// Запуск: npm run init-db

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { pool } = require('../config/db');

async function initDb() {
    try {
        const schemaPath = path.join(__dirname, '../../db/schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('📦 Применяю схему из db/schema.sql ...');
        await pool.query(sql);

        console.log('✅ Таблицы созданы (admins, employees, restaurants).');
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка инициализации схемы:', error.message);
        process.exit(1);
    }
}

initDb();
