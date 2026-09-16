const sql = require('mssql');

const config = {
  user: 'db68391',
  password: '7Em_Ze#3-8yA',
  server: 'db68391.public.databaseasp.net',
  port: 1433,
  database: 'db68391',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    connectTimeout: 20000
  }
};

async function setup() {
  console.log('Connecting to cloud database...');
  const pool = await sql.connect(config);
  console.log('Connected!');

  const queries = [
    `IF OBJECT_ID('dbo.Reviews', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Reviews (
        id INT IDENTITY(1,1) PRIMARY KEY,
        productId INT NOT NULL FOREIGN KEY REFERENCES dbo.Products(id) ON DELETE CASCADE,
        userId INT NULL FOREIGN KEY REFERENCES dbo.Users(id) ON DELETE SET NULL,
        customerName NVARCHAR(100) NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment NVARCHAR(MAX) NOT NULL,
        orderCode NVARCHAR(50) NULL,
        createdAt DATETIME DEFAULT GETDATE() NOT NULL
      );
      PRINT 'Created dbo.Reviews';
    END`,

    `IF OBJECT_ID('dbo.SupportMessages', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.SupportMessages (
        id INT IDENTITY(1,1) PRIMARY KEY,
        orderCode NVARCHAR(50) NULL,
        userId INT NULL FOREIGN KEY REFERENCES dbo.Users(id) ON DELETE SET NULL,
        senderRole NVARCHAR(20) NOT NULL, -- 'customer' or 'admin'
        senderName NVARCHAR(100) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        isComplaint BIT DEFAULT 0 NOT NULL,
        status NVARCHAR(30) DEFAULT 'open' NOT NULL, -- 'open', 'resolved'
        createdAt DATETIME DEFAULT GETDATE() NOT NULL
      );
      PRINT 'Created dbo.SupportMessages';
    END`,

    `IF NOT EXISTS (SELECT 1 FROM dbo.Reviews)
    BEGIN
      INSERT INTO dbo.Reviews (productId, customerName, rating, comment, orderCode, createdAt) VALUES
      (1, N'Nguyễn Văn An', 5, N'Nước dùng phở bò ngọt thanh từ xương hầm, thịt bò tái nạm tươi ngon, giao tới nơi còn nóng hổi!', 'DH1001', DATEADD(DAY, -2, GETDATE())),
      (1, N'Lê Thị Hương', 5, N'Bánh phở mềm ngon, có đầy đủ rau thơm và chanh ớt, đóng gói cẩn thận 10 điểm.', 'DH1002', DATEADD(DAY, -1, GETDATE())),
      (3, N'Trần Minh Tuấn', 5, N'Cơm tấm sườn nướng vị vừa vặn, thơm phức, chả trứng béo ngậy. Sẽ tiếp tục ủng hộ!', 'DH1003', DATEADD(DAY, -3, GETDATE())),
      (5, N'Phạm Hoàng Nam', 4, N'Bánh mì giòn tan, pate béo bùi nhiều nhân, giao nhanh trong 20 phút.', 'DH1004', DATEADD(HOUR, -5, GETDATE()));
      PRINT 'Seeded initial reviews';
    END`
  ];

  for (const q of queries) {
    await pool.request().query(q);
  }

  console.log('Tables setup successfully!');
  await pool.close();
}

setup().catch(err => {
  console.error('Setup error:', err);
  process.exit(1);
});
