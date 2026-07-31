// backend/utils/mappers.js
// Превращают строки из Postgres (snake_case) в JSON того же формата,
// что ждал прежний фронтенд (camelCase + _id + вложенный discounts).
// Благодаря этому интерфейс работает без единого изменения.

function mapEmployee(row) {
    if (!row) return null;
    return {
        _id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        middleName: row.middle_name,
        position: row.position,
        department: row.department,
        employeeId: row.employee_id,
        photo: row.photo,
        qrCode: row.qr_code,
        qrUniqueToken: row.qr_unique_token,
        email: row.email,
        phone: row.phone,
        status: row.status,
        discountTier: row.discount_tier,
        hireDate: row.hire_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

function mapRestaurant(row) {
    if (!row) return null;
    return {
        _id: row.id,
        name: row.name,
        address: row.address,
        logo: row.logo,
        discounts: {
            standard: row.discount_standard,
            premium: row.discount_premium,
            vip: row.discount_vip
        },
        contactPerson: row.contact_person,
        contactPhone: row.contact_phone,
        isActive: row.is_active,
        createdAt: row.created_at
    };
}

function mapAdmin(row) {
    if (!row) return null;
    return {
        _id: row.id,
        username: row.username,
        email: row.email,
        role: row.role,
        createdAt: row.created_at
    };
}

module.exports = { mapEmployee, mapRestaurant, mapAdmin };
