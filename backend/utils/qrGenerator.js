// backend/utils/qrGenerator.js

const QRCode = require('qrcode');
const crypto = require('crypto');

class QRGenerator {

    // Генерация случайного токена (32 символа hex)
    static generateToken() {
        return crypto.randomBytes(16).toString('hex');
    }

    // Генерация QR-кода как base64-картинки
    static async generateQR(token, baseUrl) {
        const url = `${baseUrl}/badge/${token}`;

        try {
            const qrDataUrl = await QRCode.toDataURL(url, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#1a1a2e',   // тёмно-синий AYACOM
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'H'
            });

            return { qrCode: qrDataUrl, qrUrl: url, token };
        } catch (error) {
            throw new Error(`Ошибка генерации QR: ${error.message}`);
        }
    }
}

module.exports = QRGenerator;
