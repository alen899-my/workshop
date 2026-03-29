require('dotenv').config();
const db = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function testRegistration() {
  const shopName = 'Test Auto Works';
  const location = 'Kochi, Kerala';
  const ownerName = 'Test Owner';
  const phone = '9999000001';
  const password = 'test123';

  try {
    // 1. Check if already exists
    const userCheck = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (userCheck.rows.length > 0) {
      console.log('⚠️  Phone already registered, cleaning up first...');
      await db.query('DELETE FROM users WHERE phone = $1', [phone]);
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Resolve shop_owner role
    const roleR = await db.query("SELECT id, name, slug FROM roles WHERE slug = 'shop_owner'");
    console.log('✅ shop_owner role found:', roleR.rows[0]);
    const roleId = roleR.rows[0].id;

    // 4. Transaction
    await db.query('BEGIN');

    const shopResult = await db.query(
      'INSERT INTO shops (name, location, owner_name) VALUES ($1, $2, $3) RETURNING *',
      [shopName, location, ownerName]
    );
    console.log('✅ Shop created:', shopResult.rows[0]);
    const shopId = shopResult.rows[0].id;

    const userResult = await db.query(
      'INSERT INTO users (shop_id, name, phone, password_hash, role, role_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, phone, role, role_id, shop_id',
      [shopId, ownerName, phone, passwordHash, 'shop_owner', roleId]
    );
    console.log('✅ User created:', userResult.rows[0]);

    await db.query('COMMIT');
    console.log('✅ Transaction committed successfully!');

    // Cleanup
    await db.query('DELETE FROM users WHERE phone = $1', [phone]);
    await db.query('DELETE FROM shops WHERE id = $1', [shopId]);
    console.log('🧹 Cleanup done.');
    process.exit(0);
  } catch (e) {
    await db.query('ROLLBACK');
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

testRegistration();
