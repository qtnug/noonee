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
    const res = await pool.request().query('SELECT id, username, fullName, role, passwordHash FROM Users');
    console.log('Users in DB:', res.recordset);
    await pool.close();
  } catch (err) {
    console.error(err);
  }
})();
