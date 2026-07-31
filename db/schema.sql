-- db/schema.sql
-- Схема базы данных для AYACOM QR Badge System (PostgreSQL / Supabase)
-- Запускается один раз при инициализации: npm run init-db

-- Расширение для генерации UUID (в Supabase / Postgres 13+ доступно из коробки)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- Администраторы (HR / superadmin)
-- =========================================================
CREATE TABLE IF NOT EXISTS admins (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    TEXT UNIQUE NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,                 -- bcrypt-хэш, НИКОГДА не открытый пароль
    role        TEXT NOT NULL DEFAULT 'hr' CHECK (role IN ('hr', 'superadmin')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- Сотрудники
-- =========================================================
CREATE TABLE IF NOT EXISTS employees (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Личные данные
    first_name       TEXT NOT NULL,
    last_name        TEXT NOT NULL,
    middle_name      TEXT NOT NULL DEFAULT '',

    -- Рабочие данные
    position         TEXT NOT NULL,
    department       TEXT NOT NULL,
    employee_id      TEXT UNIQUE NOT NULL,      -- Табельный номер, напр. AYA-0042

    -- Фото хранится прямо в БД как data-URL (base64), чтобы переживать передеплой
    photo            TEXT NOT NULL DEFAULT '/uploads/photos/default-avatar.png',

    -- QR-код
    qr_code          TEXT,                      -- base64-картинка QR
    qr_unique_token  TEXT UNIQUE,               -- уникальный токен для публичной ссылки

    -- Контакты
    email            TEXT UNIQUE NOT NULL,
    phone            TEXT NOT NULL DEFAULT '',

    -- Статус и скидка
    status           TEXT NOT NULL DEFAULT 'active'   CHECK (status IN ('active', 'inactive', 'suspended')),
    discount_tier    TEXT NOT NULL DEFAULT 'standard' CHECK (discount_tier IN ('standard', 'premium', 'vip')),

    -- Даты
    hire_date        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employees_status      ON employees (status);
CREATE INDEX IF NOT EXISTS idx_employees_department  ON employees (department);
CREATE INDEX IF NOT EXISTS idx_employees_token       ON employees (qr_unique_token);

-- =========================================================
-- Рестораны-партнёры
-- =========================================================
CREATE TABLE IF NOT EXISTS restaurants (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name               TEXT NOT NULL,
    address            TEXT NOT NULL DEFAULT '',
    logo               TEXT NOT NULL DEFAULT '',

    -- Скидки по уровням сотрудников (в процентах)
    discount_standard  INTEGER NOT NULL DEFAULT 10,
    discount_premium   INTEGER NOT NULL DEFAULT 15,
    discount_vip       INTEGER NOT NULL DEFAULT 20,

    contact_person     TEXT NOT NULL DEFAULT '',
    contact_phone      TEXT NOT NULL DEFAULT '',
    is_active          BOOLEAN NOT NULL DEFAULT true,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
