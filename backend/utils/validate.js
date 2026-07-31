// backend/utils/validate.js
// Проверка, что строка — валидный UUID (аналог mongoose.Types.ObjectId.isValid).
// Нужна, чтобы не отправлять в Postgres мусор и отдавать 400 вместо 500.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidId(id) {
    return typeof id === 'string' && UUID_RE.test(id);
}

module.exports = { isValidId };
