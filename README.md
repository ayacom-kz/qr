# AYACOM QR Badge System — версия на Supabase (PostgreSQL)

Пересозданная версия системы корпоративных QR-бейджей. Интерфейс и логика
идентичны оригиналу, но база данных переведена с MongoDB на **бесплатный
PostgreSQL (Supabase)**, а фото сотрудников хранятся **прямо в БД (base64)** —
поэтому переживают передеплой на любом бесплатном хостинге.

## Что внутри

| Слой | Технологии |
|------|-----------|
| Backend | Node.js + Express 5 |
| База данных | PostgreSQL (Supabase, бесплатный тариф) через `pg` |
| Авторизация | JWT + bcrypt (задел под Active Directory — см. ниже) |
| Frontend | Статические HTML (admin-панель, логин, публичный бейдж) — без изменений |
| Фото | base64 data-URL в колонке `employees.photo` |
| QR | пакет `qrcode`, ссылка `/badge/<token>` |

## Быстрый старт (локально)

1. **Создай проект в Supabase** (https://supabase.com, бесплатно).
   Возьми строку подключения: `Project Settings → Database → Connection string → URI`.

2. **Настрой окружение:**
   ```bash
   cp .env.example .env
   # впиши DATABASE_URL, JWT_SECRET, BASE_URL
   ```

3. **Установи зависимости и создай таблицы:**
   ```bash
   npm install
   npm run init-db      # создаёт таблицы из db/schema.sql
   npm run seed         # тестовые данные: admin/admin123, 3 ресторана, 1 сотрудник
   ```

4. **Запусти:**
   ```bash
   npm run dev
   ```
   - Админка: http://localhost:3000/admin/
   - Логин: `admin` / `admin123`

## Деплой бесплатно (Render)

1. Залей код в GitHub-репозиторий.
2. Render → **New → Blueprint** → выбери репозиторий (`render.yaml` уже готов).
3. В **Environment** задай: `DATABASE_URL` (из Supabase), `JWT_SECRET`,
   `BASE_URL` (публичный адрес приложения на Render).
4. После первого деплоя один раз выполни инициализацию схемы:
   можно локально с прод-`DATABASE_URL` (`npm run init-db && npm run seed`),
   либо через Render Shell.

> На бесплатном тарифе Render сервис «засыпает» после простоя и просыпается
> при первом запросе (первый заход может занять ~30 сек) — данные при этом не
> теряются, они в Supabase.

## Структура

```
db/schema.sql             — схема Postgres (таблицы admins/employees/restaurants)
backend/
  config/db.js            — пул соединений pg + проверка связи
  models/                 — слой доступа к данным (Admin, Employee, Restaurant)
  routes/                 — те же эндпоинты, что в оригинале
  middleware/auth.js      — проверка JWT
  utils/mappers.js        — snake_case (Postgres) → camelCase + _id (для фронта)
  utils/qrGenerator.js    — генерация токена и QR
  utils/validate.js       — проверка UUID
  auth/ldap.js            — ЗАГОТОВКА под Active Directory
  scripts/initDb.js       — создание таблиц
  scripts/seed.js         — тестовые данные
frontend/                 — HTML-страницы (скопированы 1-в-1)
```

## Совместимость с фронтендом

API отдаёт JSON в точности того же формата, что ждал старый интерфейс:
`_id`, camelCase-поля (`firstName`, `discountTier`, …), у ресторанов —
вложенный объект `discounts: { standard, premium, vip }`. Поэтому HTML/JS
фронтенда скопированы без единого изменения.

## Будущее: интеграция с MS Active Directory

Задел уже заложен в `backend/auth/ldap.js`. План:

1. `npm install ldapjs`
2. Добавить в `.env`: `AD_URL`, `AD_BASE_DN`, `AD_DOMAIN_FQDN`.
3. Реализовать `authenticateAD(username, password)` (в файле есть готовый скелет:
   bind к домену → чтение `memberOf` → маппинг групп AD на роли hr/superadmin).
4. В `routes/admin.js` в маршруте `/login` — если задан `AD_URL`, проверять
   пароль через AD вместо локального bcrypt, а при успехе выдавать тот же JWT.

Локальная таблица `admins` при этом остаётся как резервный способ входа.
