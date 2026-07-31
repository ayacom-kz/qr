// backend/auth/ldap.js
// ЗАГОТОВКА под будущую интеграцию с MS Active Directory (LDAP).
//
// Сейчас логин работает по локальной таблице admins (bcrypt).
// Когда понадобится вход по доменной учётке AD — реализуй функцию ниже
// и вызови её из routes/admin.js вместо локальной проверки пароля.
//
// Что понадобится:
//   1. npm install ldapjs        (или ldapauth-fork — обёртка попроще)
//   2. Переменные окружения в .env:
//        AD_URL=ldap://dc.company.local:389        (или ldaps:// на 636)
//        AD_BASE_DN=dc=company,dc=local
//        AD_DOMAIN=COMPANY                          (NetBIOS-имя домена)
//   3. Схема входа:
//        - пользователь вводит доменный логин + пароль
//        - делаем bind к AD как COMPANY\login (или login@company.local)
//        - если bind успешен — пользователь аутентифицирован
//        - подтягиваем группы (memberOf) и маппим на роль hr/superadmin
//        - выдаём тот же JWT, что и сейчас
//
// Ниже — скелет. Раскомментируй и допили, когда будет доступ к домену.

/*
const ldap = require('ldapjs');

async function authenticateAD(username, password) {
    return new Promise((resolve, reject) => {
        const client = ldap.createClient({ url: process.env.AD_URL });
        const userPrincipal = `${username}@${process.env.AD_DOMAIN_FQDN}`; // login@company.local

        client.bind(userPrincipal, password, (err) => {
            if (err) {
                client.unbind();
                return resolve(null); // неверный логин/пароль
            }

            // Пользователь аутентифицирован — читаем его атрибуты и группы
            const opts = {
                scope: 'sub',
                filter: `(userPrincipalName=${userPrincipal})`,
                attributes: ['displayName', 'mail', 'memberOf']
            };

            client.search(process.env.AD_BASE_DN, opts, (searchErr, res) => {
                let entry = null;
                res.on('searchEntry', (e) => { entry = e.object; });
                res.on('end', () => {
                    client.unbind();
                    if (!entry) return resolve({ username });

                    const groups = [].concat(entry.memberOf || []);
                    const isAdmin = groups.some(g => /HR-Admins|Domain Admins/i.test(g));

                    resolve({
                        username,
                        email: entry.mail || '',
                        role: isAdmin ? 'superadmin' : 'hr'
                    });
                });
                res.on('error', () => { client.unbind(); resolve({ username }); });
            });
        });
    });
}

module.exports = { authenticateAD };
*/

module.exports = {
    // Заглушка, пока AD не подключён.
    authenticateAD: null
};
