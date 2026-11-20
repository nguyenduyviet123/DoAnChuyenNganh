const sql = require('mssql');
require('dotenv').config();

async function test() {
  console.log('Testing connection to SQL Server...');
  console.log('Server:', process.env.DB_SERVER);
  console.log('Instance:', process.env.DB_INSTANCE);
  console.log('User:', process.env.DB_USER);
  console.log('Database:', process.env.DB_NAME);

  const configs = [
    // Config 1: SQL Auth with instanceName
    {
      name: 'localhost with instance SQLEXPRESS (SQL Auth)',
      server: 'localhost',
      user: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || '123',
      database: 'FreshGardenDB',
      options: {
        instanceName: 'SQLEXPRESS',
        trustServerCertificate: true,
      }
    },
    // Config 2: localhost:1433 (SQL Auth)
    {
      name: 'localhost:1433 default port (SQL Auth)',
      server: 'localhost',
      port: 1433,
      user: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || '123',
      database: 'FreshGardenDB',
      options: {
        trustServerCertificate: true,
      }
    },
    // Config 3: Server name from image NGUYENDUYVIET01 with SQLEXPRESS
    {
      name: 'NGUYENDUYVIET01 with instance SQLEXPRESS (SQL Auth)',
      server: 'NGUYENDUYVIET01',
      user: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || '123',
      database: 'FreshGardenDB',
      options: {
        instanceName: 'SQLEXPRESS',
        trustServerCertificate: true,
      }
    }
  ];

  for (const c of configs) {
    try {
      console.log(`\n--- Thử cấu hình: ${c.name} ---`);
      const pool = await sql.connect(c);
      const res = await pool.request().query('SELECT COUNT(*) AS TotalProducts FROM dbo.SAN_PHAM');
      console.log('✅ KẾT NỐI THÀNH CÔNG! Số sản phẩm trong SAN_PHAM:', res.recordset[0].TotalProducts);
      await pool.close();
      return;
    } catch (err) {
      console.log('❌ Thất bại:', err.message);
    }
  }
}

test();

