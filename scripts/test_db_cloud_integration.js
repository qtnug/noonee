const fs = require('fs');

// Mock env
const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    val = val.trim().replace(/^['"]|['"]$/g, '');
    process.env[match[1]] = val;
  }
});

const { checkDatabaseHealth, getCategories, getProducts } = require('./dist-test/test_helper');
