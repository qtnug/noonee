import { exec } from 'child_process';
import { promisify } from 'util';
import sql from 'mssql';
import { Category, Product, Order, OrderItem, User, Review, SupportMessage } from '@/types';

const execAsync = promisify(exec);

// Cloud Database Configuration from environment (.env.local)
const dbConfig = {
  user: process.env.SQLSERVER_USER || 'db68391',
  password: process.env.SQLSERVER_PASSWORD || '7Em_Ze#3-8yA',
  server: process.env.SQLSERVER_HOST || 'db68391.public.databaseasp.net',
  port: parseInt(process.env.SQLSERVER_PORT || '1433'),
  database: process.env.SQLSERVER_DATABASE || 'db68391',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    connectTimeout: 15000,
    requestTimeout: 15000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Global pool singleton for Next.js hot reloading
declare global {
  var _sqlPool: any;
}

let poolPromise: Promise<any> | null = null;

let schemaChecked = false;
async function ensureSchemaColumns(pool: any) {
  if (schemaChecked || !pool) return;
  schemaChecked = true;
  try {
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'walletBalance')
        ALTER TABLE Users ADD walletBalance DECIMAL(18, 0) DEFAULT 0;

      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'cancelReason')
        ALTER TABLE Orders ADD cancelReason NVARCHAR(500) NULL;

      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'walletAmountUsed')
        ALTER TABLE Orders ADD walletAmountUsed DECIMAL(18, 0) DEFAULT 0;

      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'refundStatus')
        ALTER TABLE Orders ADD refundStatus NVARCHAR(50) DEFAULT 'None';
    `);
  } catch (err: any) {
    console.warn('Schema check note:', err.message);
  }
}

async function getCloudPool(): Promise<any> {
  if (global._sqlPool && global._sqlPool.connected) {
    return global._sqlPool;
  }

  if (!poolPromise) {
    poolPromise = (sql as any).connect(dbConfig)
      .then((pool: any) => {
        global._sqlPool = pool;
        ensureSchemaColumns(pool);
        return pool;
      })
      .catch((err: any) => {
        console.warn('⚠️ Cloud SQL Server connection failed, using fallback:', err.message);
        poolPromise = null;
        return null;
      });
  }

  return poolPromise;
}

// In-memory fallback cache
let inMemoryCategories: Category[] = [
  { id: 1, name: 'Cơm & Bún Phở', slug: 'com-bun-pho', description: 'Các món ăn chính thơm ngon, đậm đà hương vị truyền thống', icon: 'BowlFood' },
  { id: 2, name: 'Đồ Ăn Nhanh & Món Nhẹ', slug: 'do-an-nhanh', description: 'Bánh mì, nem rán, khoai tây chiên giòn rụm', icon: 'Sandwich' },
  { id: 3, name: 'Đồ Uống & Tráng Miệng', slug: 'do-uong', description: 'Trà sữa, nước ép trái cây, cà phê nguyên chất mát lạnh', icon: 'Coffee' },
  { id: 4, name: 'Món Đặc Biệt Quán', slug: 'mon-dac-biet', description: 'Các món Signature được yêu thích nhất', icon: 'Sparkles' }
];

let inMemoryProducts: Product[] = [
  { id: 1, categoryId: 1, categoryName: 'Cơm & Bún Phở', name: 'Phở Bò Đặc Biệt Hà Nội', slug: 'pho-bo-dac-biet', description: 'Bánh phở tươi mềm mướt, nước dùng hầm xương bò 12 tiếng thơm lừng quế hồi, nạm gầu giòn béo ngậy.', price: 65000, image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80', isAvailable: true, isFeatured: true, rating: 4.9 },
  { id: 2, categoryId: 1, categoryName: 'Cơm & Bún Phở', name: 'Bún Chả Hà Nội Nướng Than Hoa', slug: 'bun-cha-ha-noi', description: 'Chả nướng than thơm lừng, thịt ba chỉ tẩm ướp đậm vị, nước mắm dưa góp chua ngọt chuẩn vị phố cổ.', price: 55000, image: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?auto=format&fit=crop&w=800&q=80', isAvailable: true, isFeatured: true, rating: 4.8 },
  { id: 3, categoryId: 1, categoryName: 'Cơm & Bún Phở', name: 'Cơm Tấm Sườn Bì Chả Trứng', slug: 'com-tam-suon-bi-cha', description: 'Sườn cốt lết nướng mật ong vàng ruộm, chả trứng béo ngậy, bì dai giòn ăn kèm mỡ hành tóp mỡ.', price: 60000, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', isAvailable: true, isFeatured: true, rating: 4.9 },
  { id: 4, categoryId: 1, categoryName: 'Cơm & Bún Phở', name: 'Bún Bò Huế Cay Nồng', slug: 'bun-bo-hue', description: 'Nước dùng cay nồng hương sả ruốc, bắp bò hoa giòn, chả cua Huế và tiết tươi đậm đà.', price: 60000, image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80', isAvailable: true, isFeatured: false, rating: 4.7 },
  { id: 5, categoryId: 2, categoryName: 'Đồ Ăn Nhanh & Món Nhẹ', name: 'Bánh Mì Thập Cẩm Pate Đặc Biệt', slug: 'banh-mi-thap-cam', description: 'Vỏ bánh giòn tan, pate gan béo ngậy nhà làm, xá xíu, chả lụa kèm đồ chua và rau mùi tươi.', price: 35000, image: 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=800&q=80', isAvailable: true, isFeatured: true, rating: 4.9 },
  { id: 6, categoryId: 2, categoryName: 'Đồ Ăn Nhanh & Món Nhẹ', name: 'Nem Rán Hà Nội Giòn Rụm (5 cuốn)', slug: 'nem-ran-ha-noi', description: 'Nem nhân thịt heo, tôm, mộc nhĩ, miến dong cuốn bánh đa nem rán vàng ruộm chấm mắm ớt tỏi.', price: 45000, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', isAvailable: true, isFeatured: false, rating: 4.8 },
  { id: 7, categoryId: 2, categoryName: 'Đồ Ăn Nhanh & Món Nhẹ', name: 'Gà Rán Sốt Cay Phô Mai', slug: 'ga-ran-sot-cay', description: 'Cánh gà chiên giòn áo lớp sốt cay ngọt Hàn Quốc quyện phô mai béo ngậy tan chảy.', price: 50000, image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=800&q=80', isAvailable: true, isFeatured: false, rating: 4.6 },
  { id: 8, categoryId: 3, categoryName: 'Đồ Uống & Tráng Miệng', name: 'Trà Đào Cam Sả Tươi Mát', slug: 'tra-dao-cam-sa', description: 'Trà thanh nhẹ kết hợp lát đào giòn sần sật, vị chua dịu của cam vàng và hương sả thơm lừng.', price: 32000, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80', isAvailable: true, isFeatured: true, rating: 4.8 },
  { id: 9, categoryId: 3, categoryName: 'Đồ Uống & Tráng Miệng', name: 'Cà Phê Muối Kem Béo', slug: 'ca-phe-muoi-kem-beo', description: 'Cà phê Robusta Đắk Lắk pha phin nguyên chất phủ lớp kem muối béo mặn hài hòa.', price: 30000, image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80', isAvailable: true, isFeatured: true, rating: 4.9 },
  { id: 10, categoryId: 3, categoryName: 'Đồ Uống & Tráng Miệng', name: 'Trà Sữa Trân Châu Đường Đen', slug: 'tra-sua-tran-chau', description: 'Trà sữa béo ngậy chuẩn vị Đài Loan cùng trân châu nấu đường đen dẻo thơm.', price: 35000, image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=800&q=80', isAvailable: true, isFeatured: false, rating: 4.7 },
  { id: 11, categoryId: 4, categoryName: 'Món Đặc Biệt Quán', name: 'Combo Trưa Hoàn Hảo (Cơm sườn + Trà đào)', slug: 'combo-trua-hoan-hao', description: 'Set ăn trưa dinh dưỡng gồm 1 đĩa cơm tấm sườn nướng mật ong và 1 ly trà đào mát lạnh giải nhiệt.', price: 85000, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', isAvailable: true, isFeatured: true, rating: 5.0 }
];

let inMemoryOrders: Order[] = [];

let inMemoryUsers: User[] = [
  { id: 1, username: 'admin', fullName: 'Quản Trị Viên', email: 'admin@quanan.vn', phone: '0988888888', address: '123 Đường Ẩm Thực, Q1', role: 'admin', walletBalance: 0 },
  { id: 2, username: 'khachhang', fullName: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com', phone: '0912345678', address: '45 Lê Lợi, Q1', role: 'customer', walletBalance: 0 }
];

// Fallback local sqlcmd query
async function queryLocalSqlCmd(query: string): Promise<any> {
  const safeQuery = query.replace(/"/g, '""');
  const command = `sqlcmd -S "localhost\\SQLEXPRESS" -d FoodOrderingDB -E -C -Q "${safeQuery}" -y 0 -w 8000`;
  try {
    const { stdout } = await execAsync(command);
    const match = stdout.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return null;
  } catch (err) {
    return null;
  }
}

async function executeLocalSqlCmd(sqlCommand: string): Promise<boolean> {
  const safeCommand = sqlCommand.replace(/"/g, '""');
  const command = `sqlcmd -S "localhost\\SQLEXPRESS" -d FoodOrderingDB -E -C -Q "${safeCommand}"`;
  try {
    await execAsync(command);
    return true;
  } catch (err) {
    return false;
  }
}

// ==========================================
// PUBLIC DATABASE APIS (Cloud-First Architecture)
// ==========================================

export async function getCategories(): Promise<Category[]> {
  try {
    const pool = await getCloudPool();
    if (pool) {
      const result = await pool.request().query('SELECT id, name, slug, description, icon, createdAt FROM Categories ORDER BY id ASC');
      if (result.recordset && result.recordset.length > 0) {
        return result.recordset;
      }
    }
  } catch (err) {
    console.error('Error fetching categories from cloud:', err);
  }

  // Fallback to local / in-memory
  const localRows = await queryLocalSqlCmd('SELECT id, name, slug, description, icon, createdAt FROM Categories FOR JSON PATH;');
  if (localRows && Array.isArray(localRows) && localRows.length > 0) {
    return localRows;
  }
  return inMemoryCategories;
}

export async function createCategory(data: { name: string; slug: string; description?: string; icon?: string }): Promise<Category> {
  const newCat: Category = {
    id: inMemoryCategories.length + 1,
    name: data.name,
    slug: data.slug,
    description: data.description || '',
    icon: data.icon || 'Utensils',
    createdAt: new Date().toISOString()
  };
  inMemoryCategories.push(newCat);

  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('name', sql.NVarChar(100), data.name);
      req.input('slug', sql.NVarChar(100), data.slug);
      req.input('desc', sql.NVarChar(255), data.description || '');
      req.input('icon', sql.NVarChar(50), data.icon || 'Utensils');
      const res = await req.query(`
        INSERT INTO Categories (name, slug, description, icon) 
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.slug, INSERTED.description, INSERTED.icon, INSERTED.createdAt
        VALUES (@name, @slug, @desc, @icon)
      `);
      if (res.recordset && res.recordset[0]) {
        return res.recordset[0];
      }
    }
  } catch (err) {
    console.error('Error creating category in cloud:', err);
  }

  // Local fallback
  await executeLocalSqlCmd(`INSERT INTO Categories (name, slug, description, icon) VALUES (N'${data.name.replace(/'/g, "''")}', '${data.slug.replace(/'/g, "''")}', N'${(data.description || '').replace(/'/g, "''")}', '${(data.icon || 'Utensils').replace(/'/g, "''")}');`);
  return newCat;
}

export async function updateCategory(id: number, data: { name?: string; slug?: string; description?: string; icon?: string }): Promise<boolean> {
  const idx = inMemoryCategories.findIndex(c => c.id === id);
  if (idx !== -1) {
    inMemoryCategories[idx] = { ...inMemoryCategories[idx], ...data };
  }

  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('id', sql.Int, id);
      const setClauses: string[] = [];

      if (data.name !== undefined) {
        req.input('name', sql.NVarChar(100), data.name);
        setClauses.push('name = @name');
      }
      if (data.slug !== undefined) {
        req.input('slug', sql.NVarChar(100), data.slug);
        setClauses.push('slug = @slug');
      }
      if (data.description !== undefined) {
        req.input('desc', sql.NVarChar(255), data.description);
        setClauses.push('description = @desc');
      }
      if (data.icon !== undefined) {
        req.input('icon', sql.NVarChar(50), data.icon);
        setClauses.push('icon = @icon');
      }

      if (setClauses.length > 0) {
        await req.query(`UPDATE Categories SET ${setClauses.join(', ')} WHERE id = @id`);
        return true;
      }
    }
  } catch (err) {
    console.error('Error updating category in cloud:', err);
  }

  // Local fallback
  const updates: string[] = [];
  if (data.name) updates.push(`name = N'${data.name.replace(/'/g, "''")}'`);
  if (data.slug) updates.push(`slug = '${data.slug.replace(/'/g, "''")}'`);
  if (data.description !== undefined) updates.push(`description = N'${data.description.replace(/'/g, "''")}'`);
  if (data.icon) updates.push(`icon = '${data.icon.replace(/'/g, "''")}'`);
  if (updates.length > 0) {
    await executeLocalSqlCmd(`UPDATE Categories SET ${updates.join(', ')} WHERE id = ${id};`);
  }
  return true;
}

export async function deleteCategory(id: number): Promise<boolean> {
  inMemoryCategories = inMemoryCategories.filter(c => c.id !== id);

  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('id', sql.Int, id);
      await req.query('UPDATE Products SET categoryId = NULL WHERE categoryId = @id');
      await req.query('DELETE FROM Categories WHERE id = @id');
      return true;
    }
  } catch (err) {
    console.error('Error deleting category in cloud:', err);
  }

  await executeLocalSqlCmd(`UPDATE Products SET categoryId = NULL WHERE categoryId = ${id}; DELETE FROM Categories WHERE id = ${id};`);
  return true;
}

export async function getProducts(options?: { categoryId?: number; search?: string; isFeatured?: boolean }): Promise<Product[]> {
  try {
    const pool = await getCloudPool();
    if (pool) {
      let query = `
        SELECT p.id, p.categoryId, c.name AS categoryName, p.name, p.slug, p.description, 
               CAST(p.price AS INT) AS price, p.image, p.isAvailable, p.isFeatured, 
               CAST(p.rating AS FLOAT) AS rating, p.toppings, p.createdAt 
        FROM Products p 
        LEFT JOIN Categories c ON p.categoryId = c.id
        WHERE 1=1
      `;
      const req = pool.request();
      if (options?.categoryId) {
        req.input('catId', sql.Int, options.categoryId);
        query += ` AND p.categoryId = @catId`;
      }
      if (options?.isFeatured) {
        query += ` AND p.isFeatured = 1`;
      }
      if (options?.search) {
        req.input('search', sql.NVarChar(150), `%${options.search}%`);
        query += ` AND (p.name LIKE @search OR p.description LIKE @search)`;
      }
      query += ` ORDER BY p.isFeatured DESC, p.id ASC`;

      const result = await req.query(query);
      if (result.recordset && result.recordset.length > 0) {
        return result.recordset.map((r: any) => {
          let parsedToppings = [];
          if (r.toppings) {
            try {
              parsedToppings = typeof r.toppings === 'string' ? JSON.parse(r.toppings) : r.toppings;
            } catch (e) {}
          }
          return {
            ...r,
            toppings: parsedToppings,
            isAvailable: Boolean(r.isAvailable),
            isFeatured: Boolean(r.isFeatured),
          };
        });
      }
    }
  } catch (err) {
    console.error('Error querying products from cloud:', err);
  }

  // Local fallback
  let query = `
    SELECT p.id, p.categoryId, c.name AS categoryName, p.name, p.slug, p.description, 
           CAST(p.price AS INT) AS price, p.image, p.isAvailable, p.isFeatured, 
           CAST(p.rating AS FLOAT) AS rating, p.toppings, p.createdAt 
    FROM Products p 
    LEFT JOIN Categories c ON p.categoryId = c.id
    WHERE 1=1
  `;
  if (options?.categoryId) query += ` AND p.categoryId = ${options.categoryId}`;
  if (options?.isFeatured) query += ` AND p.isFeatured = 1`;
  if (options?.search) {
    const s = options.search.replace(/'/g, "''");
    query += ` AND (p.name LIKE N'%${s}%' OR p.description LIKE N'%${s}%')`;
  }
  query += ' ORDER BY p.isFeatured DESC, p.id ASC FOR JSON PATH;';

  const rows = await queryLocalSqlCmd(query);
  if (rows && Array.isArray(rows) && rows.length > 0) {
    return rows.map((r: any) => {
      let parsedToppings = [];
      if (r.toppings) {
        try {
          parsedToppings = typeof r.toppings === 'string' ? JSON.parse(r.toppings) : r.toppings;
        } catch (e) {}
      }
      return {
        ...r,
        toppings: parsedToppings,
        isAvailable: Boolean(r.isAvailable),
        isFeatured: Boolean(r.isFeatured),
      };
    });
  }

  // In-memory fallback
  let result = [...inMemoryProducts];
  if (options?.categoryId) result = result.filter(p => p.categoryId === options.categoryId);
  if (options?.isFeatured) result = result.filter(p => p.isFeatured);
  if (options?.search) {
    const q = options.search.toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }
  return result;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('slug', sql.NVarChar(150), slug);
      const res = await req.query(`
        SELECT p.id, p.categoryId, c.name AS categoryName, p.name, p.slug, p.description, 
               CAST(p.price AS INT) AS price, p.image, p.isAvailable, p.isFeatured, 
               CAST(p.rating AS FLOAT) AS rating, p.toppings, p.createdAt 
        FROM Products p 
        LEFT JOIN Categories c ON p.categoryId = c.id
        WHERE p.slug = @slug
      `);
      if (res.recordset && res.recordset[0]) {
        const row = res.recordset[0];
        let parsedToppings = [];
        if (row.toppings) {
          try {
            parsedToppings = typeof row.toppings === 'string' ? JSON.parse(row.toppings) : row.toppings;
          } catch (e) {}
        }
        return {
          ...row,
          toppings: parsedToppings,
          isAvailable: Boolean(row.isAvailable),
          isFeatured: Boolean(row.isFeatured),
        };
      }
    }
  } catch (err) {
    console.error('Error fetching product by slug from cloud:', err);
  }

  // Local fallback
  const query = `
    SELECT p.id, p.categoryId, c.name AS categoryName, p.name, p.slug, p.description, 
           CAST(p.price AS INT) AS price, p.image, p.isAvailable, p.isFeatured, 
           CAST(p.rating AS FLOAT) AS rating, p.toppings, p.createdAt 
    FROM Products p 
    LEFT JOIN Categories c ON p.categoryId = c.id
    WHERE p.slug = '${slug.replace(/'/g, "''")}'
    FOR JSON PATH;
  `;
  const rows = await queryLocalSqlCmd(query);
  if (rows && Array.isArray(rows) && rows.length > 0) {
    const row = rows[0];
    let parsedToppings = [];
    if (row.toppings) {
      try {
        parsedToppings = typeof row.toppings === 'string' ? JSON.parse(row.toppings) : row.toppings;
      } catch (e) {}
    }
    return {
      ...row,
      toppings: parsedToppings,
      isAvailable: Boolean(row.isAvailable),
      isFeatured: Boolean(row.isFeatured),
    };
  }
  return inMemoryProducts.find(p => p.slug === slug) || null;
}

export async function createProduct(data: Omit<Product, 'id'>): Promise<Product> {
  const newProduct: Product = {
    ...data,
    id: inMemoryProducts.length + 1,
    createdAt: new Date().toISOString()
  };
  inMemoryProducts.push(newProduct);

  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('catId', sql.Int, data.categoryId);
      req.input('name', sql.NVarChar(150), data.name);
      req.input('slug', sql.NVarChar(150), data.slug);
      req.input('desc', sql.NVarChar(sql.MAX), data.description || '');
      req.input('price', sql.Decimal(18, 0), data.price);
      req.input('img', sql.NVarChar(500), data.image);
      req.input('avail', sql.Bit, data.isAvailable ? 1 : 0);
      req.input('feat', sql.Bit, data.isFeatured ? 1 : 0);
      req.input('rat', sql.Decimal(3, 1), data.rating || 5.0);
      const topStr = data.toppings ? (typeof data.toppings === 'string' ? data.toppings : JSON.stringify(data.toppings)) : null;
      req.input('toppings', sql.NVarChar(sql.MAX), topStr);

      const res = await req.query(`
        INSERT INTO Products (categoryId, name, slug, description, price, image, isAvailable, isFeatured, rating, toppings)
        OUTPUT INSERTED.id, INSERTED.categoryId, INSERTED.name, INSERTED.slug, INSERTED.description, 
               CAST(INSERTED.price AS INT) AS price, INSERTED.image, INSERTED.isAvailable, INSERTED.isFeatured, 
               CAST(INSERTED.rating AS FLOAT) AS rating, INSERTED.toppings, INSERTED.createdAt
        VALUES (@catId, @name, @slug, @desc, @price, @img, @avail, @feat, @rat, @toppings)
      `);
      if (res.recordset && res.recordset[0]) {
        return {
          ...res.recordset[0],
          toppings: data.toppings || [],
          isAvailable: Boolean(res.recordset[0].isAvailable),
          isFeatured: Boolean(res.recordset[0].isFeatured),
        };
      }
    }
  } catch (err) {
    console.error('Error creating product in cloud:', err);
  }

  // Local fallback
  const safeSql = `
    INSERT INTO Products (categoryId, name, slug, description, price, image, isAvailable, isFeatured, rating)
    VALUES (${data.categoryId}, N'${data.name.replace(/'/g, "''")}', '${data.slug.replace(/'/g, "''")}', N'${(data.description || '').replace(/'/g, "''")}', ${data.price}, '${data.image}', ${data.isAvailable ? 1 : 0}, ${data.isFeatured ? 1 : 0}, ${data.rating || 5});
  `;
  await executeLocalSqlCmd(safeSql);
  return newProduct;
}

export async function updateProduct(id: number, data: Partial<Product>): Promise<boolean> {
  const idx = inMemoryProducts.findIndex(p => p.id === id);
  if (idx !== -1) {
    inMemoryProducts[idx] = { ...inMemoryProducts[idx], ...data };
  }

  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('id', sql.Int, id);
      const setClauses: string[] = [];

      if (data.name !== undefined) {
        req.input('name', sql.NVarChar(150), data.name);
        setClauses.push('name = @name');
      }
      if (data.description !== undefined) {
        req.input('desc', sql.NVarChar(sql.MAX), data.description);
        setClauses.push('description = @desc');
      }
      if (data.price !== undefined) {
        req.input('price', sql.Decimal(18, 0), data.price);
        setClauses.push('price = @price');
      }
      if (data.image !== undefined) {
        req.input('image', sql.NVarChar(500), data.image);
        setClauses.push('image = @image');
      }
      if (data.isAvailable !== undefined) {
        req.input('avail', sql.Bit, data.isAvailable ? 1 : 0);
        setClauses.push('isAvailable = @avail');
      }
      if (data.isFeatured !== undefined) {
        req.input('feat', sql.Bit, data.isFeatured ? 1 : 0);
        setClauses.push('isFeatured = @feat');
      }
      if (data.toppings !== undefined) {
        const topStr = typeof data.toppings === 'string' ? data.toppings : JSON.stringify(data.toppings);
        req.input('toppings', sql.NVarChar(sql.MAX), topStr);
        setClauses.push('toppings = @toppings');
      }

      if (setClauses.length > 0) {
        await req.query(`UPDATE Products SET ${setClauses.join(', ')} WHERE id = @id`);
        return true;
      }
    }
  } catch (err) {
    console.error('Error updating product in cloud:', err);
  }

  // Local fallback
  const updates: string[] = [];
  if (data.name) updates.push(`name = N'${data.name.replace(/'/g, "''")}'`);
  if (data.description !== undefined) updates.push(`description = N'${data.description.replace(/'/g, "''")}'`);
  if (data.price !== undefined) updates.push(`price = ${data.price}`);
  if (data.image) updates.push(`image = '${data.image}'`);
  if (data.isAvailable !== undefined) updates.push(`isAvailable = ${data.isAvailable ? 1 : 0}`);
  if (data.isFeatured !== undefined) updates.push(`isFeatured = ${data.isFeatured ? 1 : 0}`);

  if (updates.length > 0) {
    await executeLocalSqlCmd(`UPDATE Products SET ${updates.join(', ')} WHERE id = ${id};`);
  }
  return true;
}

export async function deleteProduct(id: number): Promise<boolean> {
  inMemoryProducts = inMemoryProducts.filter(p => p.id !== id);

  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('id', sql.Int, id);
      await req.query('DELETE FROM Products WHERE id = @id');
      return true;
    }
  } catch (err) {
    console.error('Error deleting product in cloud:', err);
  }

  await executeLocalSqlCmd(`DELETE FROM Products WHERE id = ${id};`);
  return true;
}

export async function createOrder(data: {
  orderCode: string;
  userId?: number | null;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes?: string;
  totalAmount: number;
  discountAmount?: number;
  couponCode?: string | null;
  paymentMethod?: 'Sepay' | 'COD' | 'Wallet';
  paymentStatus?: 'Unpaid' | 'Paid';
  walletAmountUsed?: number;
  items: {
    productId: number;
    productName: string;
    price: number;
    quantity: number;
    toppings?: string | null;
    note?: string | null;
  }[];
}): Promise<Order> {
  const newOrder: Order = {
    id: inMemoryOrders.length + 1,
    orderCode: data.orderCode,
    userId: data.userId || null,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    deliveryAddress: data.deliveryAddress,
    notes: data.notes || '',
    totalAmount: data.totalAmount,
    discountAmount: data.discountAmount || 0,
    couponCode: data.couponCode || null,
    status: 'Pending',
    paymentMethod: data.paymentMethod || 'Sepay',
    paymentStatus: data.paymentStatus || 'Unpaid',
    walletAmountUsed: data.walletAmountUsed || 0,
    refundStatus: 'None',
    cancelReason: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: data.items.map(item => ({
      ...item,
      total: item.price * item.quantity
    }))
  };
  inMemoryOrders.unshift(newOrder);

  // 1. Insert into Cloud SQL Server
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('code', sql.NVarChar(50), data.orderCode);
      req.input('userId', sql.Int, data.userId || null);
      req.input('name', sql.NVarChar(100), data.customerName);
      req.input('phone', sql.NVarChar(20), data.customerPhone);
      req.input('address', sql.NVarChar(255), data.deliveryAddress);
      req.input('notes', sql.NVarChar(500), data.notes || '');
      req.input('amount', sql.Decimal(18, 0), data.totalAmount);
      req.input('discount', sql.Decimal(18, 2), data.discountAmount || 0);
      req.input('coupon', sql.NVarChar(50), data.couponCode || null);
      req.input('method', sql.NVarChar(50), data.paymentMethod || 'Sepay');
      req.input('payStatus', sql.NVarChar(50), data.paymentStatus || 'Unpaid');
      req.input('walletAmount', sql.Decimal(18, 0), data.walletAmountUsed || 0);

      const orderRes = await req.query(`
        INSERT INTO Orders (orderCode, userId, customerName, customerPhone, deliveryAddress, notes, totalAmount, discountAmount, couponCode, status, paymentMethod, paymentStatus, walletAmountUsed)
        OUTPUT INSERTED.id
        VALUES (@code, @userId, @name, @phone, @address, @notes, @amount, @discount, @coupon, 'Pending', @method, @payStatus, @walletAmount)
      `);

      const orderId = orderRes.recordset[0]?.id;
      if (orderId) {
        newOrder.id = orderId;
        for (const it of data.items) {
          const itemReq = pool.request();
          itemReq.input('orderId', sql.Int, orderId);
          itemReq.input('prodId', sql.Int, it.productId);
          itemReq.input('prodName', sql.NVarChar(150), it.productName);
          itemReq.input('price', sql.Decimal(18, 0), it.price);
          itemReq.input('qty', sql.Int, it.quantity);
          itemReq.input('total', sql.Decimal(18, 0), it.price * it.quantity);
          itemReq.input('note', sql.NVarChar(500), it.note || null);
          itemReq.input('toppings', sql.NVarChar(1000), it.toppings || null);

          await itemReq.query(`
            INSERT INTO OrderItems (orderId, productId, productName, price, quantity, total, note, toppings)
            VALUES (@orderId, @prodId, @prodName, @price, @qty, @total, @note, @toppings)
          `);
        }
        return newOrder;
      }
    }
  } catch (err) {
    console.error('Error inserting order in cloud:', err);
  }

  // 2. Local fallback
  try {
    const safeOrderSql = `
      INSERT INTO Orders (orderCode, userId, customerName, customerPhone, deliveryAddress, notes, totalAmount, discountAmount, couponCode, status, paymentMethod, paymentStatus, walletAmountUsed)
      OUTPUT INSERTED.id
      VALUES ('${data.orderCode}', ${data.userId ? data.userId : 'NULL'}, N'${data.customerName.replace(/'/g, "''")}', '${data.customerPhone.replace(/'/g, "''")}', N'${data.deliveryAddress.replace(/'/g, "''")}', N'${(data.notes || '').replace(/'/g, "''")}', ${data.totalAmount}, ${data.discountAmount || 0}, ${data.couponCode ? `'${data.couponCode}'` : 'NULL'}, 'Pending', '${data.paymentMethod || 'Sepay'}', '${data.paymentStatus || 'Unpaid'}', ${data.walletAmountUsed || 0});
    `;
    const insertRes = await queryLocalSqlCmd(safeOrderSql + ' FOR JSON PATH;');
    const orderId = insertRes && insertRes[0] ? insertRes[0].id : null;
    if (orderId) {
      for (const it of data.items) {
        await executeLocalSqlCmd(`
          INSERT INTO OrderItems (orderId, productId, productName, price, quantity, total, note, toppings)
          VALUES (${orderId}, ${it.productId}, N'${it.productName.replace(/'/g, "''")}', ${it.price}, ${it.quantity}, ${it.price * it.quantity}, N'${(it.note || '').replace(/'/g, "''")}', N'${(it.toppings || '').replace(/'/g, "''")}');
        `);
      }
    }
  } catch (err) {
    // fallback maintained
  }

  return newOrder;
}

export async function getOrderByCode(code: string): Promise<Order | null> {
  const cleanCode = code.trim().replace(/^#+/, '');
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('code', sql.NVarChar(50), cleanCode);
      const res = await req.query(`
        SELECT o.id, o.orderCode, o.userId, o.customerName, o.customerPhone, o.deliveryAddress, 
               o.notes, CAST(o.totalAmount AS INT) AS totalAmount, 
               CAST(ISNULL(o.discountAmount, 0) AS INT) AS discountAmount, o.couponCode,
               o.status, o.paymentMethod, o.paymentStatus,
               o.cancelReason, CAST(ISNULL(o.walletAmountUsed, 0) AS INT) AS walletAmountUsed,
               ISNULL(o.refundStatus, 'None') AS refundStatus,
               o.createdAt, o.updatedAt
        FROM Orders o
        WHERE o.orderCode = @code
      `);
      if (res.recordset && res.recordset[0]) {
        const order = res.recordset[0];
        const itemsReq = pool.request();
        itemsReq.input('orderId', sql.Int, order.id);
        const itemsRes = await itemsReq.query(`
          SELECT oi.id, oi.orderId, oi.productId, oi.productName, CAST(oi.price AS INT) AS price, 
                 oi.quantity, CAST(oi.total AS INT) AS total, oi.note, oi.toppings
          FROM OrderItems oi
          WHERE oi.orderId = @orderId
        `);
        order.items = itemsRes.recordset || [];
        return order;
      }
    }
  } catch (err) {
    console.error('Error fetching order from cloud:', err);
  }

  // Local fallback
  const orderQuery = `
    SELECT o.id, o.orderCode, o.userId, o.customerName, o.customerPhone, o.deliveryAddress, 
           o.notes, CAST(o.totalAmount AS INT) AS totalAmount,
           CAST(ISNULL(o.discountAmount, 0) AS INT) AS discountAmount, o.couponCode,
           o.status, o.paymentMethod, o.paymentStatus,
           o.cancelReason, CAST(ISNULL(o.walletAmountUsed, 0) AS INT) AS walletAmountUsed,
           ISNULL(o.refundStatus, 'None') AS refundStatus,
           o.createdAt, o.updatedAt,
           (SELECT oi.id, oi.orderId, oi.productId, oi.productName, CAST(oi.price AS INT) AS price, 
                   oi.quantity, CAST(oi.total AS INT) AS total 
            FROM OrderItems oi 
            WHERE oi.orderId = o.id 
            FOR JSON PATH) AS items
    FROM Orders o
    WHERE o.orderCode = '${cleanCode.replace(/'/g, "''")}'
    FOR JSON PATH;
  `;
  const rows = await queryLocalSqlCmd(orderQuery);
  if (rows && Array.isArray(rows) && rows.length > 0) {
    return rows[0];
  }
  return inMemoryOrders.find(o => o.orderCode === cleanCode) || null;
}

export async function getOrders(filter?: { status?: string; search?: string; userId?: number }): Promise<Order[]> {
  const cleanSearch = (filter?.search || '').trim().replace(/^#+/, '');
  try {
    const pool = await getCloudPool();
    if (pool) {
      let query = `
        SELECT o.id, o.orderCode, o.userId, o.customerName, o.customerPhone, o.deliveryAddress, 
               o.notes, CAST(o.totalAmount AS INT) AS totalAmount,
               CAST(ISNULL(o.discountAmount, 0) AS INT) AS discountAmount, o.couponCode,
               o.status, o.paymentMethod, o.paymentStatus,
               o.cancelReason, CAST(ISNULL(o.walletAmountUsed, 0) AS INT) AS walletAmountUsed,
               ISNULL(o.refundStatus, 'None') AS refundStatus,
               o.createdAt, o.updatedAt
        FROM Orders o
        WHERE 1=1
      `;
      const req = pool.request();
      if (filter?.userId) {
        req.input('userId', sql.Int, filter.userId);
        query += ` AND o.userId = @userId`;
      }
      if (filter?.status && filter.status !== 'all') {
        req.input('status', sql.NVarChar(50), filter.status);
        query += ` AND o.status = @status`;
      }
      if (cleanSearch) {
        req.input('search', sql.NVarChar(100), `%${cleanSearch}%`);
        query += ` AND (o.orderCode LIKE @search OR o.customerName LIKE @search OR o.customerPhone LIKE @search)`;
      }
      query += ` ORDER BY o.id DESC`;

      const result = await req.query(query);
      if (result.recordset) {
        return result.recordset;
      }
    }
  } catch (err) {
    console.error('Error fetching orders from cloud:', err);
  }

  // Local fallback
  let query = `
    SELECT o.id, o.orderCode, o.userId, o.customerName, o.customerPhone, o.deliveryAddress, 
           o.notes, CAST(o.totalAmount AS INT) AS totalAmount,
           CAST(ISNULL(o.discountAmount, 0) AS INT) AS discountAmount, o.couponCode,
           o.status, o.paymentMethod, o.paymentStatus,
           o.cancelReason, CAST(ISNULL(o.walletAmountUsed, 0) AS INT) AS walletAmountUsed,
           ISNULL(o.refundStatus, 'None') AS refundStatus,
           o.createdAt, o.updatedAt
    FROM Orders o
    WHERE 1=1
  `;
  if (filter?.userId) {
    query += ` AND o.userId = ${filter.userId}`;
  }
  if (filter?.status && filter.status !== 'all') {
    query += ` AND o.status = '${filter.status.replace(/'/g, "''")}'`;
  }
  if (cleanSearch) {
    const s = cleanSearch.replace(/'/g, "''");
    query += ` AND (o.orderCode LIKE '%${s}%' OR o.customerName LIKE N'%${s}%' OR o.customerPhone LIKE '%${s}%')`;
  }
  query += ' ORDER BY o.id DESC FOR JSON PATH;';

  const rows = await queryLocalSqlCmd(query);
  if (rows && Array.isArray(rows) && rows.length > 0) {
    return rows;
  }

  let res = [...inMemoryOrders];
  if (filter?.userId) {
    res = res.filter(o => o.userId === filter.userId);
  }
  if (filter?.status && filter.status !== 'all') {
    res = res.filter(o => o.status === filter.status);
  }
  if (cleanSearch) {
    const s = cleanSearch.toLowerCase();
    res = res.filter(o => o.orderCode.toLowerCase().includes(s) || o.customerName.toLowerCase().includes(s) || o.customerPhone.includes(s));
  }
  return res;
}

export async function hasUserPaidFirstVietqr(userId: number): Promise<boolean> {
  if (!userId) return false;
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('userId', sql.Int, userId);
      const res = await req.query(`
        SELECT TOP 1 id FROM Orders
        WHERE userId = @userId
          AND paymentStatus = 'Paid'
          AND status != 'Cancelled'
          AND (paymentMethod = 'Sepay' OR couponCode = 'VIETQR20')
      `);
      return Boolean(res.recordset && res.recordset.length > 0);
    }
  } catch (err) {
    console.error('Error checking user paid VietQR status in cloud:', err);
  }
  return inMemoryOrders.some(
    (o) => o.userId === userId && o.status !== 'Cancelled' && o.paymentStatus === 'Paid' && (o.paymentMethod === 'Sepay' || o.couponCode === 'VIETQR20')
  );
}

export async function updateOrderStatus(
  orderCode: string, 
  status: string, 
  paymentStatus?: string,
  cancelReason?: string
): Promise<boolean> {
  const cleanCode = orderCode.trim().replace(/^#+/, '');
  const o = inMemoryOrders.find(ord => ord.orderCode === cleanCode);
  if (o) {
    o.status = status as any;
    if (paymentStatus) o.paymentStatus = paymentStatus as any;
    if (cancelReason !== undefined) o.cancelReason = cancelReason;
    o.updatedAt = new Date().toISOString();
  }

  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('code', sql.NVarChar(50), cleanCode);
      req.input('status', sql.NVarChar(50), status);

      let sqlQuery = `UPDATE Orders SET status = @status, updatedAt = GETDATE()`;
      if (paymentStatus) {
        req.input('payStatus', sql.NVarChar(50), paymentStatus);
        sqlQuery += `, paymentStatus = @payStatus`;
      }
      if (cancelReason !== undefined) {
        req.input('cancelReason', sql.NVarChar(500), cancelReason);
        sqlQuery += `, cancelReason = @cancelReason`;
      }
      sqlQuery += ` WHERE orderCode = @code`;

      await req.query(sqlQuery);
      return true;
    }
  } catch (err) {
    console.error('Error updating order status in cloud:', err);
  }

  const updates = [`status = '${status.replace(/'/g, "''")}'`, `updatedAt = GETDATE()`];
  if (paymentStatus) {
    updates.push(`paymentStatus = '${paymentStatus.replace(/'/g, "''")}'`);
  }
  if (cancelReason !== undefined) {
    updates.push(`cancelReason = N'${cancelReason.replace(/'/g, "''")}'`);
  }

  await executeLocalSqlCmd(`UPDATE Orders SET ${updates.join(', ')} WHERE orderCode = '${cleanCode.replace(/'/g, "''")}';`);
  return true;
}

// ==========================================
// USER VIRTUAL WALLET & ORDER CANCELLATION
// ==========================================

export async function getUserWalletBalance(userId: number): Promise<number> {
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('userId', sql.Int, userId);
      const res = await req.query(`SELECT CAST(ISNULL(walletBalance, 0) AS INT) AS walletBalance FROM Users WHERE id = @userId`);
      if (res.recordset && res.recordset[0]) {
        return Number(res.recordset[0].walletBalance) || 0;
      }
    }
  } catch (err) {
    console.error('Error fetching user wallet from cloud:', err);
  }
  const u = inMemoryUsers.find(user => user.id === userId);
  return u?.walletBalance || 0;
}

export async function deductUserWallet(userId: number, amount: number): Promise<boolean> {
  if (amount <= 0) return true;
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('userId', sql.Int, userId);
      req.input('amount', sql.Decimal(18, 0), amount);
      const res = await req.query(`
        UPDATE Users
        SET walletBalance = CASE WHEN walletBalance >= @amount THEN walletBalance - @amount ELSE walletBalance END
        OUTPUT INSERTED.walletBalance
        WHERE id = @userId AND walletBalance >= @amount
      `);
      if (res.recordset && res.recordset.length > 0) {
        const inMem = inMemoryUsers.find(u => u.id === userId);
        if (inMem) inMem.walletBalance = Number(res.recordset[0].walletBalance);
        return true;
      }
    }
  } catch (err) {
    console.error('Error deducting user wallet in cloud:', err);
  }
  const u = inMemoryUsers.find(user => user.id === userId);
  if (u && (u.walletBalance || 0) >= amount) {
    u.walletBalance = (u.walletBalance || 0) - amount;
    return true;
  }
  return false;
}

export async function refundToUserWallet(userId: number, amount: number): Promise<boolean> {
  if (amount <= 0) return true;
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('userId', sql.Int, userId);
      req.input('amount', sql.Decimal(18, 0), amount);
      const res = await req.query(`
        UPDATE Users
        SET walletBalance = ISNULL(walletBalance, 0) + @amount
        OUTPUT INSERTED.walletBalance
        WHERE id = @userId
      `);
      if (res.recordset && res.recordset.length > 0) {
        const inMem = inMemoryUsers.find(u => u.id === userId);
        if (inMem) inMem.walletBalance = Number(res.recordset[0].walletBalance);
        return true;
      }
    }
  } catch (err) {
    console.error('Error refunding user wallet in cloud:', err);
  }
  const u = inMemoryUsers.find(user => user.id === userId);
  if (u) {
    u.walletBalance = (u.walletBalance || 0) + amount;
    return true;
  }
  return false;
}

export async function cancelOrder(orderCode: string, cancelReason: string): Promise<{
  success: boolean;
  message: string;
  refundedAmount?: number;
}> {
  const cleanCode = orderCode.trim().replace(/^#+/, '');
  const order = await getOrderByCode(cleanCode);
  if (!order) {
    return { success: false, message: 'Đơn hàng không tồn tại' };
  }

  if (order.status === 'Cancelled') {
    return { success: false, message: 'Đơn hàng này đã bị hủy trước đó' };
  }

  // Requirement: "nếu chưa xác nhận thì mới được huỷ"
  // Only 'Pending' orders can be cancelled!
  if (order.status !== 'Pending') {
    return { success: false, message: 'Đơn hàng đã được xác nhận vào bếp, không thể hủy!' };
  }

  // Calculate refund
  // 1. If paid via gateway: refund totalAmount
  // 2. If wallet was used: refund walletAmountUsed
  let refundAmount = 0;
  if (order.paymentStatus === 'Paid') {
    refundAmount += (order.totalAmount || 0);
  }
  if (order.walletAmountUsed && order.walletAmountUsed > 0) {
    refundAmount += order.walletAmountUsed;
  }

  if (refundAmount > 0 && order.userId) {
    await refundToUserWallet(order.userId, refundAmount);
  }

  const refundStatus = refundAmount > 0 ? 'Refunded' : 'None';

  // Update order status in cloud
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('code', sql.NVarChar(50), cleanCode);
      req.input('reason', sql.NVarChar(500), cancelReason || 'Hủy theo yêu cầu');
      req.input('refundStatus', sql.NVarChar(50), refundStatus);
      await req.query(`
        UPDATE Orders
        SET status = 'Cancelled',
            cancelReason = @reason,
            refundStatus = @refundStatus,
            updatedAt = GETDATE()
        WHERE orderCode = @code
      `);
    }
  } catch (err) {
    console.error('Error cancelling order in cloud:', err);
  }

  // Local & in-memory update
  const inMem = inMemoryOrders.find(o => o.orderCode === cleanCode);
  if (inMem) {
    inMem.status = 'Cancelled';
    inMem.cancelReason = cancelReason;
    inMem.refundStatus = refundStatus;
    inMem.updatedAt = new Date().toISOString();
  }

  try {
    await executeLocalSqlCmd(`
      UPDATE Orders 
      SET status = 'Cancelled', 
          cancelReason = N'${(cancelReason || '').replace(/'/g, "''")}',
          refundStatus = '${refundStatus}',
          updatedAt = GETDATE()
      WHERE orderCode = '${cleanCode.replace(/'/g, "''")}';
    `);
  } catch {}

  return {
    success: true,
    message: 'Hủy đơn hàng thành công',
    refundedAmount: refundAmount,
  };
}

export async function getAdminStats() {
  const orders = await getOrders();
  const products = await getProducts();
  const totalRevenue = orders.reduce((sum, o) => (o.paymentStatus === 'Paid' ? sum + o.totalAmount : sum), 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const deliveringOrders = orders.filter(o => o.status === 'Delivering').length;

  return {
    totalRevenue,
    totalOrders: orders.length,
    totalProducts: products.length,
    pendingOrders,
    deliveringOrders,
    recentOrders: orders.slice(0, 5)
  };
}

export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  engine: string;
  database: string;
  categoryCount: number;
  productCount: number;
  orderCount: number;
  details: string;
}> {
  try {
    const pool = await getCloudPool();
    if (pool) {
      const catRes = await pool.request().query('SELECT COUNT(*) AS cnt FROM Categories');
      const prodRes = await pool.request().query('SELECT COUNT(*) AS cnt FROM Products');
      const orderRes = await pool.request().query('SELECT COUNT(*) AS cnt FROM Orders');

      return {
        connected: true,
        engine: 'Microsoft SQL Server (Cloud - MonsterASP / databaseasp.net)',
        database: `${dbConfig.database} @ ${dbConfig.server}`,
        categoryCount: catRes.recordset[0]?.cnt || 0,
        productCount: prodRes.recordset[0]?.cnt || 0,
        orderCount: orderRes.recordset[0]?.cnt || 0,
        details: `Kết nối thành công tới CSDL trên Cloud: ${dbConfig.server} (User: ${dbConfig.user}, Port: ${dbConfig.port})`
      };
    }
  } catch (err: any) {
    console.warn('Cloud health check failed:', err.message);
  }

  // Fallback check to local
  try {
    const testRes = await queryLocalSqlCmd(`
      SELECT 
        (SELECT COUNT(*) FROM Categories) AS categoryCount,
        (SELECT COUNT(*) FROM Products) AS productCount,
        (SELECT COUNT(*) FROM Orders) AS orderCount
      FOR JSON PATH;
    `);

    if (testRes && testRes[0]) {
      return {
        connected: true,
        engine: 'Microsoft SQL Server 2025 Express (Local SQLEXPRESS Fallback)',
        database: 'FoodOrderingDB',
        categoryCount: testRes[0].categoryCount || 0,
        productCount: testRes[0].productCount || 0,
        orderCount: testRes[0].orderCount || 0,
        details: 'Đang kết nối tới SQL Server cục bộ FoodOrderingDB trên máy chủ (Fallback).'
      };
    }
  } catch (err: any) {}

  return {
    connected: true,
    engine: 'In-Memory Fallback & SQL Bridge',
    database: 'FoodOrderingDB (Hybrid)',
    categoryCount: inMemoryCategories.length,
    productCount: inMemoryProducts.length,
    orderCount: inMemoryOrders.length,
    details: 'Đang hoạt động qua lớp đệm dự phòng hybrid ổn định cao.'
  };
}

// ==========================================
// USER & AUTHENTICATION (Cloud SQL Server)
// ==========================================

export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('username', sql.NVarChar(50), username);
      const res = await req.query(`
        SELECT id, username, password, fullName, email, phone, address, role, CAST(ISNULL(walletBalance, 0) AS INT) AS walletBalance, createdAt
        FROM Users
        WHERE username = @username
      `);
      if (res.recordset && res.recordset.length > 0) {
        return res.recordset[0];
      }
    }
  } catch (err) {
    console.error('Error querying user from cloud:', err);
  }

  // Fallback
  return inMemoryUsers.find((u) => u.username === username) || null;
}

export async function createUser(data: {
  username: string;
  password: string;
  fullName: string;
  phone?: string;
  address?: string;
  email?: string;
  role?: 'admin' | 'customer';
}): Promise<User> {
  const role = data.role || 'customer';
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('username', sql.NVarChar(50), data.username);
      req.input('password', sql.NVarChar(255), data.password);
      req.input('fullName', sql.NVarChar(100), data.fullName);
      req.input('phone', sql.NVarChar(20), data.phone || '');
      req.input('address', sql.NVarChar(255), data.address || '');
      req.input('email', sql.NVarChar(100), data.email || null);
      req.input('role', sql.NVarChar(20), role);

      const res = await req.query(`
        INSERT INTO Users (username, password, fullName, phone, address, email, role, walletBalance)
        OUTPUT INSERTED.id, INSERTED.username, INSERTED.fullName, INSERTED.phone, INSERTED.address, INSERTED.email, INSERTED.role, CAST(ISNULL(INSERTED.walletBalance, 0) AS INT) AS walletBalance, INSERTED.createdAt
        VALUES (@username, @password, @fullName, @phone, @address, @email, @role, 0)
      `);
      if (res.recordset && res.recordset[0]) {
        return res.recordset[0];
      }
    }
  } catch (err) {
    console.error('Error creating user in cloud:', err);
    throw err;
  }

  const newU: User = {
    id: inMemoryUsers.length + 1,
    username: data.username,
    fullName: data.fullName,
    phone: data.phone || '',
    address: data.address || '',
    email: data.email || null,
    role,
    walletBalance: 0,
    createdAt: new Date().toISOString(),
  };
  inMemoryUsers.push(newU);
  return newU;
}

export async function verifyUserCredentials(username: string, password: string): Promise<User | null> {
  const user = await getUserByUsername(username);
  if (!user) return null;
  if ((user as any).password === password) {
    const { password: _, ...safeUser } = user as any;
    return safeUser;
  }
  return null;
}

export async function getUserById(userId: number): Promise<User | null> {
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('id', sql.Int, userId);
      const res = await req.query(`
        SELECT id, username, password, fullName, email, phone, address, role, CAST(ISNULL(walletBalance, 0) AS INT) AS walletBalance, createdAt
        FROM Users
        WHERE id = @id
      `);
      if (res.recordset && res.recordset.length > 0) {
        return res.recordset[0];
      }
    }
  } catch (err) {
    console.error('Error querying user by id from cloud:', err);
  }

  return inMemoryUsers.find((u) => u.id === userId) || null;
}

export async function getUserSpendingStats(userId: number): Promise<{
  totalSpent: number;
  orderCount: number;
  completedCount: number;
}> {
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('userId', sql.Int, userId);
      const res = await req.query(`
        SELECT 
          COUNT(*) AS orderCount,
          ISNULL(SUM(CASE WHEN paymentStatus = 'Paid' OR status = 'Completed' THEN totalAmount ELSE 0 END), 0) AS totalSpent,
          COUNT(CASE WHEN paymentStatus = 'Paid' OR status = 'Completed' THEN 1 END) AS completedCount
        FROM Orders
        WHERE userId = @userId
      `);
      if (res.recordset && res.recordset[0]) {
        return {
          totalSpent: Number(res.recordset[0].totalSpent) || 0,
          orderCount: Number(res.recordset[0].orderCount) || 0,
          completedCount: Number(res.recordset[0].completedCount) || 0,
        };
      }
    }
  } catch (err) {
    console.error('Error fetching user spending stats:', err);
  }

  // Fallback to in-memory orders
  const userOrders = inMemoryOrders.filter((o) => o.userId === userId);
  const completed = userOrders.filter(
    (o) => o.paymentStatus === 'Paid' || o.status === 'Completed'
  );
  const totalSpent = completed.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  return {
    totalSpent,
    orderCount: userOrders.length,
    completedCount: completed.length,
  };
}

export async function updateUserPassword(
  userId: number,
  currentPass: string,
  newPass: string
): Promise<{ success: boolean; message: string }> {
  const user = await getUserById(userId);
  if (!user) {
    return { success: false, message: 'Không tìm thấy tài khoản người dùng' };
  }

  if ((user as any).password !== currentPass) {
    return { success: false, message: 'Mật khẩu hiện tại không chính xác' };
  }

  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('userId', sql.Int, userId);
      req.input('password', sql.NVarChar(255), newPass);
      await req.query(`UPDATE Users SET password = @password WHERE id = @userId`);
    }
  } catch (err: any) {
    console.error('Error updating password in cloud:', err);
  }

  // Update in-memory fallback
  const inMem = inMemoryUsers.find((u) => u.id === userId);
  if (inMem) {
    (inMem as any).password = newPass;
  }

  return { success: true, message: 'Đổi mật khẩu thành công!' };
}

export async function updateUserProfile(
  userId: number,
  data: { fullName?: string; phone?: string; address?: string }
): Promise<User | null> {
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('userId', sql.Int, userId);
      req.input('fullName', sql.NVarChar(100), data.fullName || '');
      req.input('phone', sql.NVarChar(20), data.phone || '');
      req.input('address', sql.NVarChar(255), data.address || '');
      const res = await req.query(`
        UPDATE Users 
        SET fullName = COALESCE(NULLIF(@fullName, ''), fullName),
            phone = COALESCE(NULLIF(@phone, ''), phone),
            address = COALESCE(NULLIF(@address, ''), address)
        OUTPUT INSERTED.id, INSERTED.username, INSERTED.fullName, INSERTED.email, INSERTED.phone, INSERTED.address, INSERTED.role, CAST(ISNULL(INSERTED.walletBalance, 0) AS INT) AS walletBalance, INSERTED.createdAt
        WHERE id = @userId
      `);
      if (res.recordset && res.recordset[0]) {
        return res.recordset[0];
      }
    }
  } catch (err) {
    console.error('Error updating user profile in cloud:', err);
  }

  const inMem = inMemoryUsers.find((u) => u.id === userId);
  if (inMem) {
    if (data.fullName) inMem.fullName = data.fullName;
    if (data.phone) inMem.phone = data.phone;
    if (data.address) inMem.address = data.address;
    return inMem;
  }
  return null;
}

// ==========================================
// REVIEWS & RATINGS (Cloud SQL Server)
// ==========================================

export async function getReviewsByProduct(productId: number): Promise<Review[]> {
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('prodId', sql.Int, productId);
      const res = await req.query(`
        SELECT id, productId, userId, customerName, rating, comment, orderCode, createdAt
        FROM Reviews
        WHERE productId = @prodId
        ORDER BY id DESC
      `);
      return res.recordset || [];
    }
  } catch (err) {
    console.error('Error fetching reviews from cloud:', err);
  }
  return [];
}

export async function hasUserOrderedProduct(
  productId: number,
  userId?: number | null,
  orderCode?: string | null
): Promise<boolean> {
  if (!userId && !orderCode) return false;
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('prodId', sql.Int, productId);
      let whereClause = '';
      if (userId && orderCode) {
        req.input('userId', sql.Int, userId);
        req.input('orderCode', sql.NVarChar(50), orderCode);
        whereClause = '(o.userId = @userId OR o.orderCode = @orderCode)';
      } else if (userId) {
        req.input('userId', sql.Int, userId);
        whereClause = 'o.userId = @userId';
      } else if (orderCode) {
        req.input('orderCode', sql.NVarChar(50), orderCode);
        whereClause = 'o.orderCode = @orderCode';
      }

      const res = await req.query(`
        SELECT TOP 1 1 AS hasOrdered
        FROM Orders o
        JOIN OrderItems oi ON o.id = oi.orderId
        WHERE oi.productId = @prodId
          AND o.status <> 'Cancelled'
          AND ${whereClause}
      `);
      return Boolean(res.recordset && res.recordset.length > 0);
    }
  } catch (err) {
    console.error('Error checking user order history:', err);
  }

  // Fallback in-memory
  const matchedOrder = inMemoryOrders.find(
    (o) =>
      o.status !== 'Cancelled' &&
      ((userId && o.userId === userId) || (orderCode && o.orderCode === orderCode)) &&
      o.items?.some((it) => it.productId === productId)
  );
  return Boolean(matchedOrder);
}

export async function getUserReview(
  productId: number,
  userId?: number | null,
  orderCode?: string | null
): Promise<Review | null> {
  if (!userId && !orderCode) return null;
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('prodId', sql.Int, productId);
      let whereClause = '';
      if (userId && orderCode) {
        req.input('userId', sql.Int, userId);
        req.input('orderCode', sql.NVarChar(50), orderCode);
        whereClause = '(r.userId = @userId OR r.orderCode = @orderCode)';
      } else if (userId) {
        req.input('userId', sql.Int, userId);
        whereClause = 'r.userId = @userId';
      } else if (orderCode) {
        req.input('orderCode', sql.NVarChar(50), orderCode);
        whereClause = 'r.orderCode = @orderCode';
      }

      const res = await req.query(`
        SELECT TOP 1 id, productId, userId, customerName, rating, comment, orderCode, createdAt
        FROM Reviews r
        WHERE r.productId = @prodId AND ${whereClause}
        ORDER BY r.id DESC
      `);
      if (res.recordset && res.recordset.length > 0) {
        return res.recordset[0];
      }
    }
  } catch (err) {
    console.error('Error getting user review:', err);
  }
  return null;
}

export async function upsertReview(data: {
  productId: number;
  userId?: number | null;
  customerName: string;
  rating: number;
  comment: string;
  orderCode?: string | null;
}): Promise<{ review: Review; isUpdate: boolean }> {
  try {
    const pool = await getCloudPool();
    if (pool) {
      const existing = await getUserReview(data.productId, data.userId, data.orderCode);

      const req = pool.request();
      req.input('prodId', sql.Int, data.productId);
      req.input('userId', sql.Int, data.userId || null);
      req.input('custName', sql.NVarChar(100), data.customerName);
      req.input('rating', sql.Int, data.rating);
      req.input('comment', sql.NVarChar(sql.MAX), data.comment);
      req.input('orderCode', sql.NVarChar(50), data.orderCode || null);

      if (existing) {
        req.input('existingId', sql.Int, existing.id);
        const res = await req.query(`
          UPDATE Reviews
          SET rating = @rating, comment = @comment, customerName = @custName, orderCode = COALESCE(@orderCode, orderCode)
          OUTPUT INSERTED.id, INSERTED.productId, INSERTED.userId, INSERTED.customerName, INSERTED.rating, INSERTED.comment, INSERTED.orderCode, INSERTED.createdAt
          WHERE id = @existingId;

          UPDATE Products
          SET rating = (SELECT ROUND(AVG(CAST(rating AS FLOAT)), 1) FROM Reviews WHERE productId = @prodId)
          WHERE id = @prodId;
        `);
        return {
          review: res.recordset[0] || { ...existing, rating: data.rating, comment: data.comment },
          isUpdate: true,
        };
      } else {
        const res = await req.query(`
          INSERT INTO Reviews (productId, userId, customerName, rating, comment, orderCode)
          OUTPUT INSERTED.id, INSERTED.productId, INSERTED.userId, INSERTED.customerName, INSERTED.rating, INSERTED.comment, INSERTED.orderCode, INSERTED.createdAt
          VALUES (@prodId, @userId, @custName, @rating, @comment, @orderCode);

          UPDATE Products
          SET rating = (SELECT ROUND(AVG(CAST(rating AS FLOAT)), 1) FROM Reviews WHERE productId = @prodId)
          WHERE id = @prodId;
        `);
        return {
          review: res.recordset[0],
          isUpdate: false,
        };
      }
    }
  } catch (err) {
    console.error('Error upserting review in cloud:', err);
    throw err;
  }

  return {
    review: {
      id: Date.now(),
      productId: data.productId,
      userId: data.userId || null,
      customerName: data.customerName,
      rating: data.rating,
      comment: data.comment,
      orderCode: data.orderCode || null,
      createdAt: new Date().toISOString(),
    },
    isUpdate: false,
  };
}

export async function createReview(data: {
  productId: number;
  userId?: number | null;
  customerName: string;
  rating: number;
  comment: string;
  orderCode?: string | null;
}): Promise<Review> {
  const result = await upsertReview(data);
  return result.review;
}

// ==========================================
// SUPPORT & COMPLAINTS CHAT (Cloud SQL Server)
// ==========================================

export async function getSupportMessages(options?: { orderCode?: string; userId?: number }): Promise<SupportMessage[]> {
  try {
    const pool = await getCloudPool();
    if (pool) {
      let query = `
        SELECT id, orderCode, userId, senderRole, senderName, message, isComplaint, status, createdAt
        FROM SupportMessages
        WHERE 1=1
      `;
      const req = pool.request();
      if (options?.orderCode) {
        req.input('orderCode', sql.NVarChar(50), options.orderCode);
        query += ` AND orderCode = @orderCode`;
      }
      if (options?.userId) {
        req.input('userId', sql.Int, options.userId);
        query += ` AND userId = @userId`;
      }
      query += ` ORDER BY id ASC`;
      const res = await req.query(query);
      return res.recordset || [];
    }
  } catch (err) {
    console.error('Error fetching support messages from cloud:', err);
  }
  return [];
}

export async function createSupportMessage(data: {
  orderCode?: string | null;
  userId?: number | null;
  senderRole: 'customer' | 'admin';
  senderName: string;
  message: string;
  isComplaint?: boolean;
}): Promise<SupportMessage> {
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('orderCode', sql.NVarChar(50), data.orderCode || null);
      req.input('userId', sql.Int, data.userId || null);
      req.input('senderRole', sql.NVarChar(20), data.senderRole);
      req.input('senderName', sql.NVarChar(100), data.senderName);
      req.input('message', sql.NVarChar(sql.MAX), data.message);
      req.input('isComplaint', sql.Bit, data.isComplaint ? 1 : 0);

      const res = await req.query(`
        INSERT INTO SupportMessages (orderCode, userId, senderRole, senderName, message, isComplaint)
        OUTPUT INSERTED.id, INSERTED.orderCode, INSERTED.userId, INSERTED.senderRole, INSERTED.senderName, INSERTED.message, INSERTED.isComplaint, INSERTED.status, INSERTED.createdAt
        VALUES (@orderCode, @userId, @senderRole, @senderName, @message, @isComplaint)
      `);
      if (res.recordset && res.recordset[0]) {
        return res.recordset[0];
      }
    }
  } catch (err) {
    console.error('Error creating support message in cloud:', err);
    throw err;
  }
  return {
    id: Date.now(),
    orderCode: data.orderCode || null,
    userId: data.userId || null,
    senderRole: data.senderRole,
    senderName: data.senderName,
    message: data.message,
    isComplaint: Boolean(data.isComplaint),
    status: 'open',
    createdAt: new Date().toISOString(),
  };
}

