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

async function migrate() {
  console.log('Connecting to cloud SQL Server:', config.server, config.database);
  const pool = await sql.connect(config);
  console.log('Connected! Creating tables and seeding data...');

  const schemaStatements = [
    `IF OBJECT_ID('dbo.Payments', 'U') IS NOT NULL DROP TABLE dbo.Payments;`,
    `IF OBJECT_ID('dbo.OrderItems', 'U') IS NOT NULL DROP TABLE dbo.OrderItems;`,
    `IF OBJECT_ID('dbo.Orders', 'U') IS NOT NULL DROP TABLE dbo.Orders;`,
    `IF OBJECT_ID('dbo.Products', 'U') IS NOT NULL DROP TABLE dbo.Products;`,
    `IF OBJECT_ID('dbo.Categories', 'U') IS NOT NULL DROP TABLE dbo.Categories;`,
    `IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;`,

    `CREATE TABLE dbo.Users (
      id INT IDENTITY(1,1) PRIMARY KEY,
      username NVARCHAR(50) UNIQUE NOT NULL,
      password NVARCHAR(255) NOT NULL,
      fullName NVARCHAR(100) NOT NULL,
      email NVARCHAR(100) NULL,
      phone NVARCHAR(20) NULL,
      address NVARCHAR(255) NULL,
      role NVARCHAR(20) DEFAULT 'customer' NOT NULL,
      createdAt DATETIME DEFAULT GETDATE() NOT NULL
    );`,

    `CREATE TABLE dbo.Categories (
      id INT IDENTITY(1,1) PRIMARY KEY,
      name NVARCHAR(100) NOT NULL,
      slug NVARCHAR(100) UNIQUE NOT NULL,
      description NVARCHAR(255) NULL,
      icon NVARCHAR(50) DEFAULT 'Utensils' NOT NULL,
      createdAt DATETIME DEFAULT GETDATE() NOT NULL
    );`,

    `CREATE TABLE dbo.Products (
      id INT IDENTITY(1,1) PRIMARY KEY,
      categoryId INT NOT NULL FOREIGN KEY REFERENCES dbo.Categories(id) ON DELETE CASCADE,
      name NVARCHAR(150) NOT NULL,
      slug NVARCHAR(150) UNIQUE NOT NULL,
      description NVARCHAR(MAX) NULL,
      price DECIMAL(18, 0) NOT NULL,
      image NVARCHAR(500) NOT NULL,
      isAvailable BIT DEFAULT 1 NOT NULL,
      isFeatured BIT DEFAULT 0 NOT NULL,
      rating DECIMAL(3, 1) DEFAULT 5.0 NOT NULL,
      createdAt DATETIME DEFAULT GETDATE() NOT NULL
    );`,

    `CREATE TABLE dbo.Orders (
      id INT IDENTITY(1,1) PRIMARY KEY,
      orderCode NVARCHAR(50) UNIQUE NOT NULL,
      userId INT NULL FOREIGN KEY REFERENCES dbo.Users(id) ON DELETE SET NULL,
      customerName NVARCHAR(100) NOT NULL,
      customerPhone NVARCHAR(20) NOT NULL,
      deliveryAddress NVARCHAR(255) NOT NULL,
      notes NVARCHAR(500) NULL,
      totalAmount DECIMAL(18, 0) NOT NULL,
      status NVARCHAR(50) DEFAULT 'Pending' NOT NULL,
      paymentMethod NVARCHAR(50) DEFAULT 'Sepay' NOT NULL,
      paymentStatus NVARCHAR(50) DEFAULT 'Unpaid' NOT NULL,
      createdAt DATETIME DEFAULT GETDATE() NOT NULL,
      updatedAt DATETIME DEFAULT GETDATE() NOT NULL
    );`,

    `CREATE TABLE dbo.OrderItems (
      id INT IDENTITY(1,1) PRIMARY KEY,
      orderId INT NOT NULL FOREIGN KEY REFERENCES dbo.Orders(id) ON DELETE CASCADE,
      productId INT NULL FOREIGN KEY REFERENCES dbo.Products(id) ON DELETE SET NULL,
      productName NVARCHAR(150) NOT NULL,
      price DECIMAL(18, 0) NOT NULL,
      quantity INT NOT NULL,
      total DECIMAL(18, 0) NOT NULL
    );`,

    `CREATE TABLE dbo.Payments (
      id INT IDENTITY(1,1) PRIMARY KEY,
      orderId INT NOT NULL FOREIGN KEY REFERENCES dbo.Orders(id) ON DELETE CASCADE,
      transactionId NVARCHAR(100) NULL,
      referenceCode NVARCHAR(100) NOT NULL,
      amount DECIMAL(18, 0) NOT NULL,
      bankAccount NVARCHAR(50) NULL,
      bankCode NVARCHAR(50) NULL,
      status NVARCHAR(50) DEFAULT 'Pending' NOT NULL,
      paidAt DATETIME NULL,
      createdAt DATETIME DEFAULT GETDATE() NOT NULL
    );`,

    `INSERT INTO dbo.Users (username, password, fullName, email, phone, address, role) VALUES
    ('admin', 'admin123', N'Quản Trị Viên', 'admin@quanan.vn', '0988888888', N'123 Đường Ẩm Thực, Quận 1, TP.HCM', 'admin'),
    ('khachhang', '123456', N'Nguyễn Văn An', 'an.nguyen@gmail.com', '0912345678', N'45 Lê Lợi, Quận 1, TP.HCM', 'customer');`,

    `INSERT INTO dbo.Categories (name, slug, description, icon) VALUES
    (N'Cơm & Bún Phở', 'com-bun-pho', N'Các món ăn chính thơm ngon, đậm đà hương vị truyền thống', 'BowlFood'),
    (N'Đồ Ăn Nhanh & Món Nhẹ', 'do-an-nhanh', N'Bánh mì, nem rán, khoai tây chiên giòn rụm', 'Sandwich'),
    (N'Đồ Uống & Tráng Miệng', 'do-uong', N'Trà sữa, nước ép trái cây, cà phê nguyên chất mát lạnh', 'Coffee'),
    (N'Món Đặc Biệt Quán', 'mon-dac-biet', N'Các món Signature được yêu thích nhất', 'Sparkles');`,

    `INSERT INTO dbo.Products (categoryId, name, slug, description, price, image, isAvailable, isFeatured, rating) VALUES
    (1, N'Phở Bò Đặc Biệt Hà Nội', 'pho-bo-dac-biet', N'Bánh phở tươi mềm mướt, nước dùng hầm xương bò 12 tiếng thơm lừng quế hồi, nạm gầu giòn béo ngậy.', 65000, 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80', 1, 1, 4.9),
    (1, N'Bún Chả Hà Nội Nướng Than Hoa', 'bun-cha-ha-noi', N'Chả nướng than thơm lừng, thịt ba chỉ tẩm ướp đậm vị, nước mắm dưa góp chua ngọt chuẩn vị phố cổ.', 55000, 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?auto=format&fit=crop&w=800&q=80', 1, 1, 4.8),
    (1, N'Cơm Tấm Sườn Bì Chả Trứng', 'com-tam-suon-bi-cha', N'Sườn cốt lết nướng mật ong vàng ruộm, chả trứng béo ngậy, bì dai giòn ăn kèm mỡ hành tóp mỡ.', 60000, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', 1, 1, 4.9),
    (1, N'Bún Bò Huế Cay Nồng', 'bun-bo-hue', N'Nước dùng cay nồng hương sả ruốc, bắp bò hoa giòn, chả cua Huế và tiết tươi đậm đà.', 60000, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80', 1, 0, 4.7),
    (2, N'Bánh Mì Thập Cẩm Pate Đặc Biệt', 'banh-mi-thap-cam', N'Vỏ bánh giòn tan, pate gan béo ngậy nhà làm, xá xíu, chả lụa kèm đồ chua và rau mùi tươi.', 35000, 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=800&q=80', 1, 1, 4.9),
    (2, N'Nem Rán Hà Nội Giòn Rụm (5 cuốn)', 'nem-ran-ha-noi', N'Nem nhân thịt heo, tôm, mộc nhĩ, miến dong cuốn bánh đa nem rán vàng ruộm chấm mắm ớt tỏi.', 45000, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', 1, 0, 4.8),
    (2, N'Gà Rán Sốt Cay Phô Mai', 'ga-ran-sot-cay', N'Cánh gà chiên giòn áo lớp sốt cay ngọt Hàn Quốc quyện phô mai béo ngậy tan chảy.', 50000, 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=800&q=80', 1, 0, 4.6),
    (3, N'Trà Đào Cam Sả Tươi Mát', 'tra-dao-cam-sa', N'Trà thanh nhẹ kết hợp lát đào giòn sần sật, vị chua dịu của cam vàng và hương sả thơm lừng.', 32000, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80', 1, 1, 4.8),
    (3, N'Cà Phê Muối Kem Béo', 'ca-phe-muoi-kem-beo', N'Cà phê Robusta Đắk Lắk pha phin nguyên chất phủ lớp kem muối béo mặn hài hòa.', 30000, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80', 1, 1, 4.9),
    (3, N'Trà Sữa Trân Châu Đường Đen', 'tra-sua-tran-chau', N'Trà sữa béo ngậy chuẩn vị Đài Loan cùng trân châu nấu đường đen dẻo thơm.', 35000, 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=800&q=80', 1, 0, 4.7),
    (4, N'Combo Trưa Hoàn Hảo (Cơm sườn + Trà đào)', 'combo-trua-hoan-hao', N'Set ăn trưa dinh dưỡng gồm 1 đĩa cơm tấm sườn nướng mật ong và 1 ly trà đào mát lạnh giải nhiệt.', 85000, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', 1, 1, 5.0);`,

    `INSERT INTO dbo.Orders (orderCode, userId, customerName, customerPhone, deliveryAddress, notes, totalAmount, status, paymentMethod, paymentStatus) VALUES
    ('DH1001', 2, N'Nguyễn Văn An', '0912345678', N'45 Lê Lợi, Quận 1, TP.HCM', N'Ít đá vào nước uống nhé quán', 97000, 'Delivering', 'Sepay', 'Paid');`,

    `INSERT INTO dbo.OrderItems (orderId, productId, productName, price, quantity, total) VALUES
    (1, 1, N'Phở Bò Đặc Biệt Hà Nội', 65000, 1, 65000),
    (1, 8, N'Trà Đào Cam Sả Tươi Mát', 32000, 1, 32000);`,

    `INSERT INTO dbo.Payments (orderId, transactionId, referenceCode, amount, bankAccount, bankCode, status, paidAt) VALUES
    (1, 'TXN99881234', 'DH1001', 97000, '0388889999', 'MB', 'Success', GETDATE());`
  ];

  for (const stmt of schemaStatements) {
    await pool.request().query(stmt);
  }

  console.log('✅ All tables and seed data created successfully on Cloud SQL Server!');

  // Verify
  const cats = await pool.request().query('SELECT COUNT(*) as cnt FROM Categories');
  const prods = await pool.request().query('SELECT COUNT(*) as cnt FROM Products');
  const orders = await pool.request().query('SELECT COUNT(*) as cnt FROM Orders');

  console.log('📊 Cloud DB Verification:');
  console.log('Categories count:', cats.recordset[0].cnt);
  console.log('Products count:', prods.recordset[0].cnt);
  console.log('Orders count:', orders.recordset[0].cnt);

  await pool.close();
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
