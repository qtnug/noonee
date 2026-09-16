const fs = require('fs');
const sql = require('mssql');
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    val = val.trim().replace(/^['"]|['"]$/g, '');
    env[match[1]] = val;
  }
});
const config = {
  user: env.SQLSERVER_USER,
  password: env.SQLSERVER_PASSWORD,
  server: env.SQLSERVER_HOST,
  port: parseInt(env.SQLSERVER_PORT || '1433'),
  database: env.SQLSERVER_DATABASE,
  options: { encrypt: true, trustServerCertificate: true }
};
(async () => {
  try {
    const pool = await sql.connect(config);
    const cols = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users'");
    console.log('Columns in Users table:', cols.recordset);
    const allUsers = await pool.request().query("SELECT * FROM Users");
    console.log('All users in DB:', allUsers.recordset);
    await pool.close();
  } catch (err) {
    console.error(err);
  }
})();
