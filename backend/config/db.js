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

// ⚠️ КРИТИЧНО для прод-хостинга + пулер Supabase:
// пулер разрывает простаивающие соединения, и пул эмитит событие 'error'.
// Без этого обработчика Node аварийно завершает процесс (crash loop / no-server).
// Здесь мы просто логируем — пул сам восстановит соединение при следующем запросе.
pool.on('error', (err) => {
    console.error('⚠️ Ошибка простаивающего соединения pg (не критично, пул переподключится):', err.message);
});

// Небольшой помощник — выполняет SQL и возвращает результат
async function query(text, params) {
    return pool.query(text, params);
}

// Проверка соединения при старте сервера.
// НЕ роняем процесс при ошибке — веб-сервер должен остаться живым и пройти
// health-check хостинга; отдельные запросы переподключатся через пул сами.
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
        console.error('❌ Не удалось подключиться к PostgreSQL при старте:');
        console.error(error.message);
        console.error('Сервер продолжит работу и повторит подключение при первом запросе.');
        console.error('Проверь DATABASE_URL, активность проекта Supabase и схему (npm run init-db).');
        console.error('');
        // НЕ вызываем process.exit — иначе хостинг уходит в бесконечный рестарт.
    }
}

module.exports = { pool, query, connectDB };
