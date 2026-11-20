/**
 * ============================================================
 *  BÁNH FG – CẤU HÌNH KẾT NỐI DATABASE (SQL SERVER)
 *  File: config/database.js
 * ============================================================
 */
const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123',
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  database: process.env.DB_NAME || 'FreshGardenDB',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise = null;

async function getPool() {
  if (!poolPromise) {
    poolPromise = sql
      .connect(config)
      .then((pool) => {
        console.log(`[Database] Đã kết nối thành công tới SQL Server DB: [${config.database}] tại [${config.server}:${config.port}]`);
        return pool;
      })
      .catch((err) => {
        console.error('[Database] Lỗi kết nối SQL Server:', err.message);
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

module.exports = {
  sql,
  getPool,
};

