// backend/scripts/importUsers.js
// Импорт сотрудников из выгрузки .xls (на деле — HTML-таблица Excel).
// Колонки: Сотрудник | Подразделение | E-Mail | Мобильный телефон | Фото
//
// Запуск (BASE_URL — адрес живого сайта, чтобы QR вели на него):
//   BASE_URL=https://ayacom-qr-badge.onrender.com node backend/scripts/importUsers.js "путь/к/users.xls"
//
// Безопасен при повторном запуске: сотрудники с уже существующим email пропускаются.

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { pool, query } = require('../config/db');
const Employee = require('../models/Employee');
const QRGenerator = require('../utils/qrGenerator');

const filePath = process.argv[2];
if (!filePath) {
    console.error('❌ Укажи путь к файлу: node backend/scripts/importUsers.js <файл.xls>');
    process.exit(1);
}

// --- Парсинг HTML-таблицы ---
function parseFile(fp) {
    const html = fs.readFileSync(fp, 'utf8');
    const rows = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(m => m[1]);
    const cells = tr => [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
        .map(m => m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim());
    const out = [];
    for (let i = 1; i < rows.length; i++) {            // i=0 — заголовок
        const c = cells(rows[i]);
        if (c.length < 3) continue;
        out.push({ name: c[0] || '', dep: c[1] || '', email: (c[2] || '').toLowerCase(), phone: c[3] || '' });
    }
    return out;
}

// Имя "First Last" -> {firstName, lastName}. 3+ слов: середина -> middleName.
function splitName(full) {
    const t = full.split(/\s+/).filter(Boolean);
    if (t.length === 1) return { firstName: t[0], lastName: '', middleName: '' };
    if (t.length === 2) return { firstName: t[0], lastName: t[1], middleName: '' };
    return { firstName: t[0], lastName: t[t.length - 1], middleName: t.slice(1, -1).join(' ') };
}

async function nextIdCounter() {
    const res = await query("SELECT employee_id FROM employees WHERE employee_id ~ '^AYA-[0-9]+$'");
    let max = 0;
    for (const r of res.rows) {
        const n = parseInt(r.employee_id.split('-')[1], 10);
        if (n > max) max = n;
    }
    return max;
}

async function run() {
    const rows = parseFile(filePath);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    console.log(`Файл: ${filePath}`);
    console.log(`Строк данных: ${rows.length}`);
    console.log(`BASE_URL для QR: ${baseUrl}`);
    console.log('');

    let counter = await nextIdCounter();
    let created = 0, skippedExisting = 0, skippedInvalid = 0;
    const createdList = [];

    for (const row of rows) {
        // Пропускаем невалидные/системные записи
        if (!row.email || !row.name || row.name.split(/\s+/).filter(Boolean).length < 2) {
            console.log(`  ⏭  пропуск (не человек/нет email): "${row.name}" <${row.email}>`);
            skippedInvalid++;
            continue;
        }

        // Дедуп по email
        const existing = await query('SELECT 1 FROM employees WHERE email = $1', [row.email]);
        if (existing.rowCount > 0) {
            skippedExisting++;
            continue;
        }

        const { firstName, lastName, middleName } = splitName(row.name);
        counter++;
        const employeeId = 'AYA-' + String(counter).padStart(4, '0');

        const token = QRGenerator.generateToken();
        const qr = await QRGenerator.generateQR(token, baseUrl);

        await Employee.create({
            firstName,
            lastName,
            middleName,
            position: '—',                 // в выгрузке нет должности — заглушка, редактируется в админке
            department: row.dep || '—',
            employeeId,
            email: row.email,
            phone: row.phone || '',
            discountTier: 'standard',
            photo: '/uploads/photos/default-avatar.png',
            qrCode: qr.qrCode,
            qrUniqueToken: token
        });

        created++;
        createdList.push(`${employeeId}  ${firstName} ${lastName}  <${row.email}>`);
    }

    console.log('');
    console.log('=== ИТОГ ===');
    console.log(`✅ Создано: ${created}`);
    console.log(`↩️  Пропущено (email уже в базе): ${skippedExisting}`);
    console.log(`⏭  Пропущено (не человек/невалидно): ${skippedInvalid}`);
    if (createdList.length) {
        console.log('');
        console.log('Добавлены:');
        createdList.forEach(l => console.log('  ' + l));
    }

    await pool.end();
    process.exit(0);
}

run().catch(async e => {
    console.error('❌ Ошибка импорта:', e.message);
    try { await pool.end(); } catch {}
    process.exit(1);
});
