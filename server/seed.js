const db = require('./db');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function seed() {
  const adminEmail = 'admin@bahismosco.com';
  const adminPass = 'Admin2026';
  const adminId = 'admin_001';

  try {
    // Always upsert admin with correct credentials
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
    if (existing) {
      db.prepare('UPDATE users SET password=?, verified=1, role=? WHERE email=?')
        .run(hashPassword(adminPass), 'admin', adminEmail);
      console.log('[Seed] Admin guncellendi.');
    } else {
      // Also check old email
      const oldAdmin = db.prepare("SELECT id FROM users WHERE email = 'admin@BahisMosco.com' OR email = 'admin@zoebet.com'").get();
      if (oldAdmin) {
        db.prepare("UPDATE users SET email=?, password=?, verified=1, role=? WHERE id=?")
          .run(adminEmail, hashPassword(adminPass), 'admin', oldAdmin.id);
        console.log('[Seed] Admin email guncellendi.');
      } else {
        db.prepare('INSERT INTO users (id, email, password, role, name, verified) VALUES (?, ?, ?, ?, ?, 1)')
          .run(adminId, adminEmail, hashPassword(adminPass), 'admin', 'Admin');
        db.prepare('INSERT OR IGNORE INTO wallets (user_id, balance) VALUES (?, ?)').run(adminId, 0);
        console.log('[Seed] Admin olusturuldu:', adminEmail);
      }
    }
  } catch (err) {
    console.error('[Seed] Hata:', err.message);
  }
}

seed();

