const db = require('./db');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function seed() {
  const adminEmail = 'admin@zoebet.com';
  const adminPass = 'admin';
  const adminId = 'admin_001';

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
    if (existing) {
      // Ensure admin is always verified
      db.prepare('UPDATE users SET verified=1 WHERE email=?').run(adminEmail);
      console.log('[Seed] Admin kullanıcısı zaten mevcut.');
    } else {
      db.prepare('INSERT INTO users (id, email, password, role, name, verified) VALUES (?, ?, ?, ?, ?, 1)')
        .run(adminId, adminEmail, hashPassword(adminPass), 'admin', 'Admin');
      
      db.prepare('INSERT INTO wallets (user_id, balance) VALUES (?, ?)')
        .run(adminId, 1000000);

      console.log('[Seed] ZoeBet Varsayılan Admin hesabı oluşturuldu.');
      console.log(`Email: ${adminEmail}`);
      console.log(`Şifre: ${adminPass}`);
    }
  } catch (err) {
    console.error('[Seed] Hata:', err.message);
  }
}

seed();
