// backend/scripts/seed.js
// Наполняет базу тестовыми данными: админ, 3 ресторана, 1 сотрудник.
// Запуск: npm run seed

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { pool } = require('../config/db');
const Admin = require('../models/Admin');
const Restaurant = require('../models/Restaurant');
const Employee = require('../models/Employee');
const QRGenerator = require('../utils/qrGenerator');

async function seed() {
    try {
        // 1. Админ
        const existingAdmin = await Admin.findByUsername('admin');
        if (!existingAdmin) {
            await Admin.create({
                username: 'admin',
                email: 'hr@ayacom.com',
                password: 'admin123',
                role: 'superadmin'
            });
            console.log('👤 Админ создан: admin / admin123');
        } else {
            console.log('👤 Админ уже есть');
        }

        // 2. Рестораны — пересоздаём
        await Restaurant.deleteAll();
        await Restaurant.insertMany([
            {
                name: 'Ресторан "Уют"',
                address: 'ул. Абая 150',
                discounts: { standard: 10, premium: 15, vip: 20 },
                contactPerson: 'Айгуль',
                contactPhone: '+7 777 111 2233'
            },
            {
                name: 'Кафе "Восток"',
                address: 'пр. Аль-Фараби 77',
                discounts: { standard: 10, premium: 12, vip: 15 },
                contactPerson: 'Марат',
                contactPhone: '+7 777 444 5566'
            },
            {
                name: 'Burger House',
                address: 'ул. Сатпаева 22',
                discounts: { standard: 15, premium: 20, vip: 25 },
                contactPerson: 'Данияр',
                contactPhone: '+7 707 888 9900'
            }
        ]);
        console.log('🍽️  3 ресторана добавлены');

        // 3. Тестовый сотрудник — пересоздаём
        await Employee.deleteAll();
        const qrToken = QRGenerator.generateToken();
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const qrData = await QRGenerator.generateQR(qrToken, baseUrl);

        await Employee.create({
            firstName: 'Алексей',
            lastName: 'Тестов',
            middleName: 'Демович',
            position: 'Senior Developer',
            department: 'IT Department',
            employeeId: 'AYA-0001',
            email: 'test@ayacom.com',
            phone: '+7 777 000 1122',
            discountTier: 'vip',
            qrCode: qrData.qrCode,
            qrUniqueToken: qrToken
        });

        console.log('');
        console.log('👨‍💻 Тестовый сотрудник создан:');
        console.log('   Имя: Алексей Тестов');
        console.log('   ID: AYA-0001');
        console.log('   Токен: ' + qrToken);
        console.log('');
        console.log('🔗 Открой в браузере:');
        console.log('   ' + qrData.qrUrl);
        console.log('');
        console.log('✅ Seed завершён!');
        await pool.end();
        process.exit(0);

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        process.exit(1);
    }
}

seed();
