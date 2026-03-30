require('dotenv').config({ path: 'd:\\New Projects\\workshop\\backend\\.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log("Starting normalization migration...");
    
    // 1. Customers Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
        name VARCHAR(255),
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Customers table ready.");

    // 2. Vehicles Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
        vehicle_number VARCHAR(50) NOT NULL,
        model_name VARCHAR(255),
        vehicle_type VARCHAR(100),
        vehicle_image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Vehicles table ready.");

    // 3. Add vehicle_id to repairs
    await pool.query(`
      ALTER TABLE repairs ADD COLUMN IF NOT EXISTS vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL;
    `);
    console.log("Repairs table updated with vehicle_id.");

    // 4. Data Migration (Optional but good to have)
    // We can populate customers and vehicles from existing repairs
    const repairsLog = await pool.query("SELECT id, shop_id, owner_name, phone_number, vehicle_number, model_name, vehicle_type, vehicle_image FROM repairs WHERE vehicle_id IS NULL");
    
    for (const r of repairsLog.rows) {
        // Find or create customer
        let customer = await pool.query("SELECT id FROM customers WHERE phone = $1 AND shop_id = $2", [r.phone_number, r.shop_id]);
        let customerId;
        if (customer.rows.length === 0) {
            const ins = await pool.query("INSERT INTO customers (shop_id, name, phone) VALUES ($1, $2, $3) RETURNING id", [r.shop_id, r.owner_name, r.phone_number]);
            customerId = ins.rows[0].id;
        } else {
            customerId = customer.rows[0].id;
        }

        // Find or create vehicle
        let vehicle = await pool.query("SELECT id FROM vehicles WHERE vehicle_number = $1 AND shop_id = $2", [r.vehicle_number, r.shop_id]);
        let vehicleId;
        if (vehicle.rows.length === 0) {
            const ins = await pool.query("INSERT INTO vehicles (customer_id, shop_id, vehicle_number, model_name, vehicle_type, vehicle_image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id", 
                [customerId, r.shop_id, r.vehicle_number, r.model_name, r.vehicle_type, r.vehicle_image]);
            vehicleId = ins.rows[0].id;
        } else {
            vehicleId = vehicle.rows[0].id;
        }

        // Link repair
        await pool.query("UPDATE repairs SET vehicle_id = $1 WHERE id = $2", [vehicleId, r.id]);
    }
    console.log("Data migration completed.");

  } catch (e) {
    console.error("Migration fatal error:", e);
  } finally {
    await pool.end();
  }
}

migrate();
