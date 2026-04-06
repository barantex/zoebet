const db = require('./db');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function seed() {
  const adminEmail = 'admin@BahisMosco.com';
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

      console.log('[Seed] BahisMosco Varsayılan Admin hesabı oluşturuldu.');
      console.log(`Email: ${adminEmail}`);
      console.log(`Şifre: ${adminPass}`);
    }
  } catch (err) {
    console.error('[Seed] Hata:', err.message);
  }
}

seed();

function seedFinance() {
  const financeEmail = 'finans@bahismosco.com';
  const financePass = 'Finans2026';
  const financeId = 'finance_001';
  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(financeEmail);
    if (existing) {
      db.prepare('UPDATE users SET role=? WHERE email=?').run('finance', financeEmail);
      console.log('[Seed] Finans kullanıcısı zaten mevcut.');
    } else {
      db.prepare('INSERT INTO users (id, email, password, role, name, verified) VALUES (?, ?, ?, ?, ?, 1)')
        .run(financeId, financeEmail, hashPassword(financePass), 'finance', 'Finans');
      db.prepare('INSERT OR IGNORE INTO wallets (user_id, balance) VALUES (?, ?)').run(financeId, 0);
      console.log('[Seed] Finans kullanıcısı oluşturuldu: ' + financeEmail);
    }
  } catch (err) {
    console.error('[Seed] Finans hatası:', err.message);
  }
}

seedFinance();

