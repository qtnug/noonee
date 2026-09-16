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
  options: {
    encrypt: true,
    trustServerCertificate: true,
    connectTimeout: 20000
  }
};

console.log('Connecting to cloud SQL Server:', config.server, 'DB:', config.database, 'User:', config.user);

async function main() {
  try {
    const pool = await sql.connect(config);
    console.log('✅ SUCCESSFULLY CONNECTED TO CLOUD SQL SERVER!');
    const result = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
    console.log('📋 Existing tables in cloud DB:', result.recordset.map(r => r.TABLE_NAME));
    await pool.close();
  } catch (err) {
    console.error('❌ Cloud connection failed:', err.message);
  }
}

main();
