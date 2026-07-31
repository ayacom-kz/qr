// backend/config/db.js
// Подключение к PostgreSQL (Supabase) через пул соединений

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL не задан в .env — укажите строку подключения из Supabase.');
}

// Supabase требует SSL. rejectUnauthorized:false — чтобы принять их сертификат.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')
        ? false
        : { rejectUnauthorized: false }
});

// Небольшой помощник — выполняет SQL и возвращает результат
async function query(text, params) {
    return pool.query(text, params);
}

// Проверка соединения при старте сервера
async function connectDB() {
    try {
        const res = await pool.query('SELECT current_database() AS db, now() AS time');
        console.log('');
        console.log('=================================');
        console.log('✅ PostgreSQL (Supabase) подключена успешно!');
        console.log(`📂 База: ${res.rows[0].db}`);
        console.log('=================================');
        console.log('');
    } catch (error) {
        console.error('');
        console.error('❌ ОШИБКА подключения к PostgreSQL:');
        console.error(error.message);
        console.error('');
        console.error('Проверь:');
        console.error('1. Правильная ли строка DATABASE_URL в .env');
        console.error('2. Создан ли проект в Supabase и не на паузе ли он');
        console.error('3. Выполнена ли инициализация схемы: npm run init-db');
        console.error('');
        process.exit(1);
    }
}

module.exports = { pool, query, connectDB };
