import sql from 'mssql';
import bcrypt from 'bcryptjs';
import { Category, Product, Order, OrderItem, User, UserRole, Review, SupportMessage, GroupOrder, GroupMember, GroupMemberItem, Coupon } from '@/types';
import { generateGroupCode, computeGroupOrderStats, MIN_GROUP_MEMBERS, MAX_GROUP_MEMBERS } from '@/lib/groupOrder';

function parseToppingsField(raw: any): any[] {
  if (!raw) return [];
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch { return []; }
}

// Cloud/Local Database Configuration from environment (.env.local)
export function getDatabaseConfig(): any {
  const rawHost = (process.env.SQLSERVER_HOST || '').trim();
  let server = rawHost;
  let instanceName: string | undefined;

  // Handle host\\instance format (e.g. localhost\\SQLEXPRESS, .\\SQLEXPRESS)
  if (rawHost.includes('\\')) {
    const parts = rawHost.split('\\');
    server = parts[0] === '.' || parts[0] === '(local)' ? 'localhost' : parts[0];
    instanceName = parts[1];
  } else if (rawHost === '.' || rawHost === '(local)') {
    server = 'localhost';
  }

  const explicitPort = process.env.SQLSERVER_PORT ? parseInt(process.env.SQLSERVER_PORT) : undefined;
  const port = explicitPort || (instanceName ? undefined : 1433);

  const trustCert = process.env.SQLSERVER_TRUST_CERT !== 'false';
  const isLocal = !server || server.toLowerCase() === 'localhost' || server === '127.0.0.1';
  const encrypt = process.env.SQLSERVER_ENCRYPT !== undefined
    ? process.env.SQLSERVER_ENCRYPT === 'true'
    : !isLocal;

  const config: any = {
    user: process.env.SQLSERVER_USER,
    password: process.env.SQLSERVER_PASSWORD,
    server: server || 'localhost',
    database: process.env.SQLSERVER_DATABASE,
    options: {
      encrypt,
      trustServerCertificate: trustCert,
      connectTimeout: 15000,
      requestTimeout: 15000,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };

  if (port) {
    config.port = port;
  }
  if (instanceName) {
    config.options.instanceName = instanceName;
  }

  return config;
}

const _initialCfg = getDatabaseConfig();
if (!_initialCfg.user || !_initialCfg.password || !_initialCfg.database) {
  console.warn('⚠️ Database credentials not configured. Set SQLSERVER_USER, SQLSERVER_PASSWORD, SQLSERVER_DATABASE in .env.local');
}

// Global pool singleton for Next.js hot reloading
declare global {
  var _sqlPool: any;
}

let poolPromise: Promise<any> | null = null;

let schemaPromise: Promise<void> | null = null;
async function ensureSchemaColumns(pool: any) {
  if (!pool) return;
  if (schemaPromise) return schemaPromise;
  schemaPromise = (async () => {
    try {
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'toppings')
        ALTER TABLE Products ADD toppings NVARCHAR(MAX) NULL;

      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'prepTime')
        ALTER TABLE Products ADD prepTime INT DEFAULT 15;

      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'walletBalance')
        ALTER TABLE Users ADD walletBalance DECIMAL(18, 0) DEFAULT 0;
      ELSE
      BEGIN
        IF EXISTS (
          SELECT * FROM sys.columns c
          JOIN sys.types t ON c.user_type_id = t.user_type_id
          WHERE c.object_id = OBJECT_ID('Users') AND c.name = 'walletBalance' AND t.name IN ('int', 'smallint', 'tinyint')
        )
        BEGIN
          ALTER TABLE Users ALTER COLUMN walletBalance DECIMAL(18, 0);
        END
      END;

      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'cancelReason')
        ALTER TABLE Orders ADD cancelReason NVARCHAR(500) NULL;

      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'walletAmountUsed')
        ALTER TABLE Orders ADD walletAmountUsed DECIMAL(18, 0) DEFAULT 0;
      ELSE
      BEGIN
        IF EXISTS (
          SELECT * FROM sys.columns c
          JOIN sys.types t ON c.user_type_id = t.user_type_id
          WHERE c.object_id = OBJECT_ID('Orders') AND c.name = 'walletAmountUsed' AND t.name IN ('int', 'smallint', 'tinyint')
        )
        BEGIN
          ALTER TABLE Orders ALTER COLUMN walletAmountUsed DECIMAL(18, 0);
        END
      END;

      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'refundStatus')
        ALTER TABLE Orders ADD refundStatus NVARCHAR(50) DEFAULT 'None';

      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'groupCode')
        ALTER TABLE Orders ADD groupCode NVARCHAR(50) NULL;

      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'shippingFee')
        ALTER TABLE Orders ADD shippingFee DECIMAL(18, 0) DEFAULT 0;

      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'branchId')
        ALTER TABLE Products ADD branchId INT NULL;

      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'branchId')
        ALTER TABLE Orders ADD branchId INT DEFAULT 1;

      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'branchName')
        ALTER TABLE Orders ADD branchName NVARCHAR(150) DEFAULT N'NooNee - Cơ sở 120 Yên Lãng';

      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'branchId')
        ALTER TABLE Users ADD branchId INT NULL;

      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'isActive')
        ALTER TABLE Users ADD isActive BIT DEFAULT 1 WITH VALUES;

      DECLARE @roleCheckConstraint NVARCHAR(200);
      SELECT TOP 1 @roleCheckConstraint = cc.name
      FROM sys.check_constraints cc
      INNER JOIN sys.columns col ON cc.parent_object_id = col.object_id AND cc.parent_column_id = col.column_id
      WHERE cc.parent_object_id = OBJECT_ID('Users') AND col.name = 'role';
      IF @roleCheckConstraint IS NOT NULL
        EXEC('ALTER TABLE Users DROP CONSTRAINT [' + @roleCheckConstraint + ']');

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GroupOrders')
      BEGIN
        CREATE TABLE GroupOrders (
          id INT IDENTITY(1,1) PRIMARY KEY,
          code NVARCHAR(50) UNIQUE NOT NULL,
          hostName NVARCHAR(150) NOT NULL,
          hostUserId INT NULL,
          status NVARCHAR(50) DEFAULT 'active',
          orderCode NVARCHAR(50) NULL,
          membersData NVARCHAR(MAX) NULL,
          createdAt DATETIME DEFAULT GETDATE(),
          updatedAt DATETIME DEFAULT GETDATE()
        );
      END;

      -- Split Cơm & Món chính into Cơm, Bún mì, Phở
      IF EXISTS (SELECT * FROM Categories WHERE name = N'Cơm & Món chính')
      BEGIN
        UPDATE Categories SET name = N'Cơm', slug = 'com', description = N'Các món cơm tấm, cơm rang thơm ngon nóng hổi' WHERE name = N'Cơm & Món chính';
      END

      IF NOT EXISTS (SELECT * FROM Categories WHERE slug = 'bun-mi')
      BEGIN
        INSERT INTO Categories (name, slug, description, icon) VALUES (N'Bún mì', 'bun-mi', N'Các món bún bò Huế, bún trộn, mì xào đậm đà hấp dẫn', 'Soup');
      END

      IF NOT EXISTS (SELECT * FROM Categories WHERE slug = 'pho')
      BEGIN
        INSERT INTO Categories (name, slug, description, icon) VALUES (N'Phở', 'pho', N'Phở bò, phở gà gia truyền nước dùng ngọt thanh', 'Soup');
      END

      DECLARE @bunMiId INT = (SELECT TOP 1 id FROM Categories WHERE slug = 'bun-mi');
      DECLARE @phoId INT = (SELECT TOP 1 id FROM Categories WHERE slug = 'pho');
      DECLARE @comId INT = (SELECT TOP 1 id FROM Categories WHERE slug = 'com');

      IF @bunMiId IS NOT NULL
      BEGIN
        UPDATE Products SET categoryId = @bunMiId WHERE (LOWER(name) LIKE N'%bún%' OR LOWER(name) LIKE N'%mì%' OR LOWER(name) LIKE N'%miến%') AND (categoryId = @comId OR categoryId = 1);
      END

      IF @phoId IS NOT NULL
      BEGIN
        UPDATE Products SET categoryId = @phoId WHERE LOWER(name) LIKE N'%phở%' AND (categoryId = @comId OR categoryId = 1);
      END
    `);
    } catch (err: any) {
      console.warn('Schema check note:', err.message);
    }
  })();
  return schemaPromise;
}

async function getCloudPool(): Promise<any> {
  const connectionString = (process.env.DATABASE_URL || process.env.SQLSERVER_CONNECTION_STRING || '').trim();
  const config = connectionString || getDatabaseConfig();

  // If using config object, verify minimal credentials
  if (!connectionString && (!config.user || !config.password || !config.database)) {
    return null;
  }

  if (global._sqlPool && global._sqlPool.connected) {
    return global._sqlPool;
  }

  if (!poolPromise) {
    try {
      poolPromise = (sql as any).connect(config)
        .then((pool: any) => {
          global._sqlPool = pool;
          ensureSchemaColumns(pool);
          return pool;
        })
        .catch((err: any) => {
          console.warn('⚠️ SQL Server connection failed, using fallback:', err.message);
          poolPromise = null;
          return null;
        });
    } catch (err: any) {
      console.warn('⚠️ SQL Server sync connect error:', err.message);
      poolPromise = null;
      return null;
    }
  }

  return poolPromise;
}

// In-memory fallback cache
let inMemoryCategories: Category[] = [
  { id: 1, name: 'Cơm', slug: 'com', description: 'Các món cơm tấm, cơm rang thơm ngon nóng hổi, chuẩn vị truyền thống', icon: 'Utensils' },
  { id: 4, name: 'Bún mì', slug: 'bun-mi', description: 'Các món bún bò Huế, bún trộn, mì xào đậm đà hấp dẫn', icon: 'Soup' },
  { id: 5, name: 'Phở', slug: 'pho', description: 'Phở bò, phở gà gia truyền nước dùng thanh ngọt thơm lừng', icon: 'Soup' },
  { id: 2, name: 'Đồ ăn vặt', slug: 'do-an-vat', description: 'Các món ăn vặt đường phố hấp dẫn, nóng giòn rụm thơm ngon', icon: 'Sandwich' },
  { id: 3, name: 'Đồ uống', slug: 'do-uong', description: 'Trà sữa, cà phê, sinh tố, nước ép và các món chè thanh mát', icon: 'Coffee' }
];

let inMemoryProducts: Product[] = [
  {
    id: 1,
    categoryId: 1,
    categoryName: 'Cơm',
    name: 'Cơm rang dương châu',
    slug: 'com-rang-duong-chau',
    description: 'Cơm rang giòn tơi hạt vàng ruộm cùng xá xíu, lạp xưởng, đậu Hà Lan, cà rốt và trứng gà béo ngậy.',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isFeatured: true,
    rating: 5.0,
    toppings: [
      { id: 1, name: 'Trứng ốp la', price: 5000 },
      { id: 2, name: 'Chả lụa / Chả trứng', price: 7000 },
      { id: 3, name: 'Sườn nướng thêm', price: 15000 },
      { id: 4, name: 'Dưa chua / Kim chi', price: 3000 },
      { id: 5, name: 'Canh rong biển thịt bằm', price: 5000 }
    ]
  },
  {
    id: 4,
    categoryId: 1,
    categoryName: 'Cơm',
    name: 'Cơm tấm Sài Gòn',
    slug: 'com-tam-sai-gon',
    description: 'Cơm tấm hạt nhuyễn truyền thống, sườn cốt lết nướng than hoa thơm lừng, bì sợi dai giòn, chả trứng béo ngậy kèm mỡ hành tóp mỡ.',
    price: 38000,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isFeatured: true,
    rating: 5.0,
    toppings: [
      { id: 1, name: 'Trứng ốp la', price: 5000 },
      { id: 2, name: 'Chả lụa / Chả trứng', price: 7000 },
      { id: 3, name: 'Sườn nướng thêm', price: 15000 },
      { id: 4, name: 'Dưa chua / Kim chi', price: 3000 },
      { id: 5, name: 'Canh rong biển thịt bằm', price: 5000 }
    ]
  },
  {
    id: 9,
    categoryId: 5,
    categoryName: 'Phở',
    name: 'Phở bò',
    slug: 'pho-bo',
    description: 'Bánh phở tươi mềm mướt, nước dùng hầm xương bò 12 tiếng thơm lừng quế hồi, nạm gầu ngọt mềm đậm vị.',
    price: 40000,
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isFeatured: true,
    rating: 5.0,
    toppings: [
      { id: 1, name: 'Trứng chần', price: 5000 },
      { id: 2, name: 'Quẩy giòn (3 cái)', price: 5000 },
      { id: 3, name: 'Thịt bò thêm', price: 15000 },
      { id: 4, name: 'Mọc / Chả viên thêm', price: 10000 },
      { id: 5, name: 'Tiết luộc mềm', price: 5000 }
    ]
  },
  {
    id: 21,
    categoryId: 2,
    categoryName: 'Đồ ăn vặt',
    name: 'Bánh tráng trộn',
    slug: 'banh-trang-tron',
    description: 'Bánh tráng dai mềm ngấm đều sốt me chua ngọt cay bùi, bò khô cay xé sợi, xoài xanh, trứng cút, đậu phộng rang giòn và rau răm.',
    price: 20000,
    image: 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isFeatured: true,
    rating: 5.0,
    toppings: [
      { id: 1, name: 'Sốt phô mai béo ngậy', price: 5000 },
      { id: 2, name: 'Sốt bơ trứng me cay', price: 5000 },
      { id: 3, name: 'Lắc bột phô mai', price: 4000 },
      { id: 4, name: 'Thêm xúc xích rán', price: 6000 },
      { id: 5, name: 'Trứng cút luộc/chiên (3 quả)', price: 5000 }
    ]
  },
  {
    id: 38,
    categoryId: 3,
    categoryName: 'Đồ uống',
    name: 'Trà sữa (tự chọn topping)',
    slug: 'tra-sua-tu-chon-topping',
    description: 'Trà sữa truyền thống ủ từ lá trà đen thơm đậm vị trà, quyện sữa tươi béo thơm dịu mát, dễ dàng tùy chọn topping yêu thích.',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isFeatured: true,
    rating: 5.0,
    toppings: [
      { id: 1, name: 'Trân châu đen dẻo', price: 5000 },
      { id: 2, name: 'Trân châu trắng 3Q', price: 6000 },
      { id: 3, name: 'Pudding trứng béo mềm', price: 6000 },
      { id: 4, name: 'Kem Cheese Macchiato', price: 8000 },
      { id: 5, name: 'Thạch nha đam thanh mát', price: 5000 }
    ]
  },
  {
    id: 44,
    categoryId: 3,
    categoryName: 'Đồ uống',
    name: 'Trà đào',
    slug: 'tra-dao',
    description: 'Trà thanh nhẹ mát rượi hòa quyện miếng đào ngâm giòn sần sật chua ngọt dịu mát.',
    price: 22000,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isFeatured: true,
    rating: 5.0,
    toppings: [
      { id: 1, name: 'Đào ngâm (2 miếng)', price: 7000 },
      { id: 2, name: 'Thạch nha đam', price: 5000 },
      { id: 3, name: 'Hạt chia', price: 4000 },
      { id: 4, name: 'Trân châu trắng 3Q', price: 6000 }
    ]
  },
  {
    id: 45,
    categoryId: 4,
    categoryName: 'Bún mì',
    name: 'Bún bò Huế',
    slug: 'bun-bo-hue',
    description: 'Bún bò Huế đậm đà chuẩn vị cố đô, nước dùng hầm xương ngọt thanh cay nồng sả ớt, chả cua, thịt bắp bò hoa và tiết mềm thơm ngon.',
    price: 42000,
    image: '/frames_clean/frame_0001.png',
    isAvailable: true,
    isFeatured: true,
    rating: 5.0,
    toppings: [
      { id: 1, name: 'Thêm bắp bò hoa', price: 15000 },
      { id: 2, name: 'Thêm chả cua Huế', price: 10000 },
      { id: 3, name: 'Thêm móng giò giòn', price: 15000 },
      { id: 4, name: 'Thêm tiết luộc mềm', price: 5000 },
      { id: 5, name: 'Quẩy giòn (3 cái)', price: 5000 }
    ]
  }
];

let inMemoryOrders: Order[] = [];

let inMemoryUsers: User[] = [];

// In-Memory Cache for ultra-fast reading (STT 5)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
let categoriesCache: CacheEntry<Category[]> | null = null;
let productsCache: CacheEntry<Product[]> | null = null;
const CACHE_TTL_MS = 120000; // 2 minutes TTL for high performance DB caching

export function invalidateProductsCache() {
  productsCache = null;
}

export function invalidateCategoriesCache() {
  categoriesCache = null;
}

// ==========================================
// PUBLIC DATABASE APIS (Cloud-First Architecture)
// ==========================================

export async function getCategories(): Promise<Category[]> {
  const now = Date.now();
  if (categoriesCache && (now - categoriesCache.timestamp) < CACHE_TTL_MS) {
    return categoriesCache.data;
  }

  try {
    const pool = await getCloudPool();
    if (pool) {
      const result = await pool.request().query('SELECT id, name, slug, description, icon, createdAt FROM Categories WITH (NOLOCK) ORDER BY id ASC');
      if (result.recordset && result.recordset.length > 0) {
        categoriesCache = { data: result.recordset, timestamp: now };
        return result.recordset;
      }
    }
  } catch (err) {
    console.error('Error fetching categories from cloud:', err);
  }

  categoriesCache = { data: inMemoryCategories, timestamp: now };
  return inMemoryCategories;
}

export async function createCategory(data: { name: string; slug: string; description?: string; icon?: string }): Promise<Category> {
  invalidateCategoriesCache();
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

  return newCat;
}

export async function updateCategory(id: number, data: { name?: string; slug?: string; description?: string; icon?: string }): Promise<boolean> {
  invalidateCategoriesCache();
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

  return true;
}

export async function deleteCategory(id: number): Promise<boolean> {
  invalidateCategoriesCache();
  inMemoryCategories = inMemoryCategories.filter(c => c.id !== id);

  try {
    const pool = await getCloudPool();
    if (pool) {
      const req1 = pool.request();
      req1.input('id', sql.Int, id);
      await req1.query('UPDATE Products SET categoryId = NULL WHERE categoryId = @id');
      
      const req2 = pool.request();
      req2.input('id', sql.Int, id);
      await req2.query('DELETE FROM Categories WHERE id = @id');
      return true;
    }
  } catch (err) {
    console.error('Error deleting category in cloud:', err);
  }

  return true;
}

export async function getAllProductsCached(): Promise<Product[]> {
  const now = Date.now();
  if (productsCache && (now - productsCache.timestamp) < CACHE_TTL_MS) {
    return productsCache.data;
  }

  try {
    const pool = await getCloudPool();
    if (pool) {
      const query = `
        SELECT p.id, p.categoryId, c.name AS categoryName, p.name, p.slug, p.description, 
               CAST(p.price AS INT) AS price, p.image, p.isAvailable, p.isFeatured, 
               CAST(p.rating AS FLOAT) AS rating, ISNULL(p.prepTime, 15) AS prepTime, p.toppings, p.branchId, p.createdAt 
        FROM Products p WITH (NOLOCK)
        LEFT JOIN Categories c WITH (NOLOCK) ON p.categoryId = c.id
        ORDER BY p.isFeatured DESC, p.id ASC
      `;
      const result = await pool.request().query(query);
      if (result.recordset && result.recordset.length > 0) {
        const mapped = result.recordset.map((r: any) => ({
          ...r,
          prepTime: r.prepTime || 15,
          branchId: r.branchId !== undefined && r.branchId !== null ? Number(r.branchId) : null,
          toppings: parseToppingsField(r.toppings),
          isAvailable: Boolean(r.isAvailable),
          isFeatured: Boolean(r.isFeatured),
        }));
        productsCache = { data: mapped, timestamp: now };
        return mapped;
      }
    }
  } catch (err) {
    console.error('Error querying products from cloud:', err);
  }

  productsCache = { data: inMemoryProducts, timestamp: now };
  return inMemoryProducts;
}

export async function getProducts(options?: {
  categoryId?: number;
  search?: string;
  isFeatured?: boolean;
  branchId?: number | 'all' | null;
  page?: number;
  limit?: number;
}): Promise<Product[]> {
  const allProducts = await getAllProductsCached();
  let result = [...allProducts];

  // Branch filter: if a specific branchId (1 or 2) is chosen, include dishes available for that branch + dishes for all branches (branchId === null)
  if (options?.branchId && options.branchId !== 'all') {
    const bId = Number(options.branchId);
    result = result.filter(p => p.branchId === null || p.branchId === undefined || p.branchId === bId);
  }

  if (options?.categoryId) {
    result = result.filter(p => p.categoryId === options.categoryId);
  }
  if (options?.isFeatured) {
    result = result.filter(p => p.isFeatured);
  }
  if (options?.search) {
    const q = options.search.toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
  }

  const page = options?.page || 1;
  const limit = options?.limit || 200;
  return result.slice((page - 1) * limit, page * limit);
}

export async function getProductById(id: number): Promise<Product | null> {
  const all = await getAllProductsCached();
  return all.find((p) => p.id === id) || null;
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
               CAST(p.rating AS FLOAT) AS rating, ISNULL(p.prepTime, 15) AS prepTime, p.toppings, p.branchId, p.createdAt 
        FROM Products p 
        LEFT JOIN Categories c ON p.categoryId = c.id
        WHERE p.slug = @slug
      `);
      if (res.recordset && res.recordset[0]) {
        const row = res.recordset[0];
        let parsedToppings = parseToppingsField(row.toppings);
        return {
          ...row,
          prepTime: row.prepTime || 15,
          branchId: row.branchId !== undefined && row.branchId !== null ? Number(row.branchId) : null,
          toppings: parsedToppings,
          isAvailable: Boolean(row.isAvailable),
          isFeatured: Boolean(row.isFeatured),
        };
      }
    }
  } catch (err) {
    console.error('Error fetching product by slug from cloud:', err);
  }


  return inMemoryProducts.find(p => p.slug === slug) || null;
}

export async function createProduct(data: Omit<Product, 'id'>): Promise<Product> {
  invalidateProductsCache();
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
      req.input('prepTime', sql.Int, data.prepTime ? Number(data.prepTime) : 15);
      req.input('branchId', sql.Int, data.branchId ? Number(data.branchId) : null);

      const res = await req.query(`
        INSERT INTO Products (categoryId, name, slug, description, price, image, isAvailable, isFeatured, rating, toppings, prepTime, branchId)
        OUTPUT INSERTED.id, INSERTED.categoryId, INSERTED.name, INSERTED.slug, INSERTED.description, 
               CAST(INSERTED.price AS INT) AS price, INSERTED.image, INSERTED.isAvailable, INSERTED.isFeatured, 
               CAST(INSERTED.rating AS FLOAT) AS rating, ISNULL(INSERTED.prepTime, 15) AS prepTime, INSERTED.toppings, INSERTED.branchId, INSERTED.createdAt
        VALUES (@catId, @name, @slug, @desc, @price, @img, @avail, @feat, @rat, @toppings, @prepTime, @branchId)
      `);
      if (res.recordset && res.recordset[0]) {
        return {
          ...res.recordset[0],
          prepTime: res.recordset[0].prepTime || 15,
          branchId: res.recordset[0].branchId !== undefined && res.recordset[0].branchId !== null ? Number(res.recordset[0].branchId) : null,
          toppings: data.toppings || [],
          isAvailable: Boolean(res.recordset[0].isAvailable),
          isFeatured: Boolean(res.recordset[0].isFeatured),
        };
      }
    }
  } catch (err) {
    console.error('Error creating product in cloud:', err);
  }

  return newProduct;
}

export async function updateProduct(id: number, data: Partial<Product>): Promise<boolean> {
  invalidateProductsCache();
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
      if (data.prepTime !== undefined) {
        req.input('prepTime', sql.Int, Number(data.prepTime));
        setClauses.push('prepTime = @prepTime');
      }
      if (data.branchId !== undefined) {
        req.input('branchId', sql.Int, data.branchId ? Number(data.branchId) : null);
        setClauses.push('branchId = @branchId');
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

  return true;
}

export async function deleteProduct(id: number): Promise<boolean> {
  invalidateProductsCache();
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
  shippingFee?: number;
  discountAmount?: number;
  couponCode?: string | null;
  freeshipCouponCode?: string | null;
  groupCode?: string | null;
  paymentMethod?: 'Sepay' | 'COD' | 'Wallet';
  paymentStatus?: 'Unpaid' | 'Paid';
  walletAmountUsed?: number;
  branchId?: number;
  branchName?: string;
  items: {
    productId: number;
    productName: string;
    price: number;
    quantity: number;
    toppings?: string | null;
    note?: string | null;
  }[];
}): Promise<Order> {
  const chosenBranchId = data.branchId ? Number(data.branchId) : 1;
  const chosenBranchName = data.branchName || (chosenBranchId === 2 ? 'NooNee - Cơ sở 269 Cầu Giấy' : 'NooNee - Cơ sở 120 Yên Lãng');

  const newOrder: Order = {
    id: inMemoryOrders.length + 1,
    orderCode: data.orderCode,
    userId: data.userId || null,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    deliveryAddress: data.deliveryAddress,
    notes: data.notes || '',
    totalAmount: data.totalAmount,
    shippingFee: data.shippingFee !== undefined ? data.shippingFee : 0,
    discountAmount: data.discountAmount || 0,
    couponCode: data.couponCode || null,
    groupCode: data.groupCode || null,
    status: 'Pending',
    paymentMethod: data.paymentMethod || 'Sepay',
    paymentStatus: data.paymentStatus || 'Unpaid',
    walletAmountUsed: data.walletAmountUsed || 0,
    refundStatus: 'None',
    cancelReason: null,
    branchId: chosenBranchId,
    branchName: chosenBranchName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: data.items.map(item => ({
      ...item,
      total: item.price * item.quantity
    }))
  };

  // 1. Insert into Cloud SQL Server
  try {
    const pool = await getCloudPool();
    if (pool) {
      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      try {
        if (data.walletAmountUsed && data.walletAmountUsed > 0 && data.userId) {
          const wReq = new sql.Request(transaction);
          wReq.input('userId', sql.Int, data.userId);
          wReq.input('amount', sql.Decimal(18, 0), data.walletAmountUsed);
          const wRes = await wReq.query(`
            UPDATE Users SET walletBalance = walletBalance - @amount 
            OUTPUT INSERTED.walletBalance
            WHERE id = @userId AND walletBalance >= @amount
          `);
          if (!wRes.recordset || wRes.recordset.length === 0) {
            throw new Error('Insufficient wallet balance');
          }
        }

        const req = new sql.Request(transaction);
        req.input('code', sql.NVarChar(50), data.orderCode);
        req.input('userId', sql.Int, data.userId || null);
        req.input('name', sql.NVarChar(100), data.customerName);
        req.input('phone', sql.NVarChar(20), data.customerPhone);
        req.input('address', sql.NVarChar(255), data.deliveryAddress);
        req.input('notes', sql.NVarChar(500), data.notes || '');
        req.input('amount', sql.Decimal(18, 0), data.totalAmount);
        req.input('shippingFee', sql.Decimal(18, 0), data.shippingFee || 0);
        req.input('discount', sql.Decimal(18, 2), data.discountAmount || 0);
        req.input('coupon', sql.NVarChar(50), data.couponCode || null);
        req.input('groupCode', sql.NVarChar(50), data.groupCode || null);
        req.input('method', sql.NVarChar(50), data.paymentMethod || 'Sepay');
        req.input('payStatus', sql.NVarChar(50), data.paymentStatus || 'Unpaid');
        req.input('walletAmount', sql.Decimal(18, 0), data.walletAmountUsed || 0);
        req.input('branchId', sql.Int, chosenBranchId);
        req.input('branchName', sql.NVarChar(150), chosenBranchName);

        const orderRes = await req.query(`
          INSERT INTO Orders (orderCode, userId, customerName, customerPhone, deliveryAddress, notes, totalAmount, shippingFee, discountAmount, couponCode, groupCode, status, paymentMethod, paymentStatus, walletAmountUsed, branchId, branchName)
          OUTPUT INSERTED.id
          VALUES (@code, @userId, @name, @phone, @address, @notes, @amount, @shippingFee, @discount, @coupon, @groupCode, 'Pending', @method, @payStatus, @walletAmount, @branchId, @branchName)
        `);

        if (data.groupCode) {
          const groupReq = new sql.Request(transaction);
          groupReq.input('groupCode', sql.NVarChar(50), data.groupCode);
          groupReq.input('orderCode', sql.NVarChar(50), data.orderCode);
          const groupRes = await groupReq.query(`
            UPDATE GroupOrders SET status = 'completed', orderCode = @orderCode, updatedAt = GETDATE()
            WHERE code = @groupCode AND status = 'locked' AND orderCode IS NULL
          `);
          if ((groupRes.rowsAffected?.[0] || 0) !== 1) throw new Error('Group order is not available for checkout');
        }

        for (const couponCode of Array.from(new Set([data.couponCode, data.freeshipCouponCode].filter((code): code is string => Boolean(code))))) {
          const couponReq = new sql.Request(transaction);
          couponReq.input('couponCode', sql.NVarChar(50), couponCode);
          const couponRes = await couponReq.query(`
            UPDATE Coupons SET usedCount = ISNULL(usedCount, 0) + 1, updatedAt = GETDATE()
            WHERE UPPER(code) = UPPER(@couponCode)
              AND (usageLimit IS NULL OR ISNULL(usedCount, 0) < usageLimit)
              AND (isActive = 1 OR isActive IS NULL)
          `);
          if ((couponRes.rowsAffected?.[0] || 0) !== 1) throw new Error('Coupon usage limit reached or coupon unavailable');
        }

        const orderId = orderRes.recordset[0]?.id;
        if (orderId) {
          newOrder.id = orderId;
          for (const it of data.items) {
            const itemReq = new sql.Request(transaction);
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
        }
        await transaction.commit();
        inMemoryOrders.unshift(newOrder);
        
        // Update in-memory user wallet if needed
        if (data.walletAmountUsed && data.walletAmountUsed > 0 && data.userId) {
          const u = inMemoryUsers.find(u => u.id === data.userId);
          if (u && (u.walletBalance || 0) >= data.walletAmountUsed) {
            u.walletBalance = (u.walletBalance || 0) - data.walletAmountUsed;
          }
        }
        return newOrder;
      } catch (err) {
        await transaction.rollback();
        console.error('Error inserting order in cloud, transaction rolled back:', err);
        throw err;
      }
    }
  } catch (err) {
    console.error('Error inserting order in cloud:', err);
    throw err;
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Database unavailable for order creation');
  inMemoryOrders.unshift(newOrder);
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
               o.notes, CAST(o.totalAmount AS BIGINT) AS totalAmount, 
               CAST(ISNULL(o.shippingFee, 0) AS BIGINT) AS shippingFee,
               CAST(ISNULL(o.discountAmount, 0) AS BIGINT) AS discountAmount, o.couponCode,
               o.status, o.paymentMethod, o.paymentStatus,
               o.cancelReason, CAST(ISNULL(o.walletAmountUsed, 0) AS BIGINT) AS walletAmountUsed,
               ISNULL(o.refundStatus, 'None') AS refundStatus,
               o.groupCode,
               ISNULL(o.branchId, 1) AS branchId,
               ISNULL(o.branchName, N'NooNee - Cơ sở 120 Yên Lãng') AS branchName,
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
      return null;
    }
  } catch (err) {
    console.error('Error fetching order from cloud:', err);
    if (process.env.NODE_ENV === 'production') throw err;
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Database unavailable for order lookup');
  return inMemoryOrders.find(o => o.orderCode === cleanCode) || null;
}

export async function getOrders(filter?: {
  status?: string;
  search?: string;
  userId?: number;
  branchId?: number | 'all';
  page?: number;
  limit?: number;
}): Promise<Order[]> {
  const cleanSearch = (filter?.search || '').trim().replace(/^#+/, '');
  try {
    const pool = await getCloudPool();
    if (pool) {
      let query = `
        SELECT o.id, o.orderCode, o.userId, o.customerName, o.customerPhone, o.deliveryAddress, 
               o.notes, CAST(o.totalAmount AS BIGINT) AS totalAmount,
               CAST(ISNULL(o.shippingFee, 0) AS BIGINT) AS shippingFee,
               CAST(ISNULL(o.discountAmount, 0) AS BIGINT) AS discountAmount, o.couponCode,
               o.status, o.paymentMethod, o.paymentStatus,
               o.cancelReason, CAST(ISNULL(o.walletAmountUsed, 0) AS BIGINT) AS walletAmountUsed,
               ISNULL(o.refundStatus, 'None') AS refundStatus,
               o.groupCode,
               ISNULL(o.branchId, 1) AS branchId,
               ISNULL(o.branchName, N'NooNee - Cơ sở 120 Yên Lãng') AS branchName,
               o.createdAt, o.updatedAt
        FROM Orders o
        WHERE 1=1
      `;
      const req = pool.request();
      if (filter?.userId) {
        req.input('userId', sql.Int, filter.userId);
        query += ` AND (
          o.userId = @userId 
          OR (o.groupCode IS NOT NULL AND o.groupCode IN (
            SELECT code FROM GroupOrders 
            WHERE membersData LIKE '%"userId":' + CAST(@userId AS NVARCHAR) + '%'
          ))
        )`;
      }
      if (filter?.status && filter.status !== 'all') {
        req.input('status', sql.NVarChar(50), filter.status);
        query += ` AND o.status = @status`;
      }
      if (filter?.branchId && filter.branchId !== 'all') {
        req.input('branchId', sql.Int, Number(filter.branchId));
        if (Number(filter.branchId) === 1) {
          query += ` AND (o.branchId = 1 OR o.branchId IS NULL)`;
        } else {
          query += ` AND o.branchId = @branchId`;
        }
      }
      if (cleanSearch) {
        req.input('search', sql.NVarChar(100), `%${cleanSearch}%`);
        query += ` AND (o.orderCode LIKE @search OR o.customerName LIKE @search OR o.customerPhone LIKE @search)`;
      }
      query += ` ORDER BY o.id DESC`;
      
      const page = filter?.page || 1;
      const limit = filter?.limit || 50;
      const offset = (page - 1) * limit;
      req.input('offset', sql.Int, offset);
      req.input('limit', sql.Int, limit);
      query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

      const result = await req.query(query);
      if (result.recordset) {
        return result.recordset;
      }
      return [];
    }
  } catch (err) {
    console.error('Error fetching orders from cloud:', err);
    if (process.env.NODE_ENV === 'production') throw err;
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Database unavailable for orders listing');

  let res = [...inMemoryOrders];
  if (filter?.userId) {
    res = res.filter(o => {
      if (o.userId === filter.userId) return true;
      if (o.groupCode) {
        const grp = inMemoryGroupOrders.find(g => g.code === o.groupCode);
        if (grp && grp.members?.some(m => m.userId === filter.userId)) {
          return true;
        }
      }
      return false;
    });
  }
  if (filter?.status && filter.status !== 'all') {
    res = res.filter(o => o.status === filter.status);
  }
  if (cleanSearch) {
    const s = cleanSearch.toLowerCase();
    res = res.filter(o => o.orderCode.toLowerCase().includes(s) || o.customerName.toLowerCase().includes(s) || o.customerPhone.includes(s));
  }
  const page = filter?.page || 1;
  const limit = filter?.limit || 50;
  return res.slice((page - 1) * limit, page * limit);
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
  const updateLocal = () => {
    if (o) {
      o.status = status as any;
      if (paymentStatus) o.paymentStatus = paymentStatus as any;
      if (cancelReason !== undefined) o.cancelReason = cancelReason;
      o.updatedAt = new Date().toISOString();
    }
  };

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
      if (paymentStatus === 'Paid') sqlQuery += ` AND status <> 'Cancelled'`;

      const result = await req.query(sqlQuery);
      const updated = (result.rowsAffected?.[0] || 0) > 0;
      if (updated) updateLocal();
      return updated;
    }
  } catch (err) {
    console.error('Error updating order status in cloud:', err);
    return false;
  }
  if (process.env.NODE_ENV !== 'production' && o) {
    updateLocal();
    return true;
  }
  return false;
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
      const res = await req.query(`SELECT CAST(ISNULL(walletBalance, 0) AS BIGINT) AS walletBalance FROM Users WHERE id = @userId`);
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

export async function cancelOrder(orderCode: string, cancelReason: string, allowProcessingCancel: boolean = false): Promise<{
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

  // Requirement STT 8 & 9: Khách chỉ hủy khi Pending; Bếp/Admin hủy được cả Pending và Processing
  if (!allowProcessingCancel && order.status !== 'Pending') {
    return { success: false, message: 'Đơn hàng đã được xác nhận vào bếp, không thể hủy!' };
  }
  if (allowProcessingCancel && order.status !== 'Pending' && order.status !== 'Processing') {
    return { success: false, message: 'Đơn hàng đang giao hoặc đã hoàn thành, không thể hủy!' };
  }

  // Claim cancellation and refund atomically. The conditional UPDATE means
  // concurrent cancellation requests cannot refund the same order twice.
  try {
    const pool = await getCloudPool();
    if (pool) {
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        const req = new sql.Request(tx);
        req.input('code', sql.NVarChar(50), cleanCode);
        req.input('reason', sql.NVarChar(500), cancelReason || 'Hủy theo yêu cầu');
        const allowed = allowProcessingCancel ? "('Pending', 'Processing')" : "('Pending')";
        const changed = await req.query(`
          UPDATE Orders SET status = 'Cancelled', cancelReason = @reason,
            refundStatus = CASE WHEN paymentStatus = 'Paid' OR ISNULL(walletAmountUsed, 0) > 0 THEN 'Refunded' ELSE 'None' END,
            updatedAt = GETDATE()
          OUTPUT INSERTED.userId, INSERTED.paymentStatus, INSERTED.totalAmount, INSERTED.walletAmountUsed
          WHERE orderCode = @code AND status IN ${allowed}
        `);
        const row = changed.recordset?.[0];
        if (!row) {
          await tx.rollback();
          return { success: false, message: 'Đơn hàng đã thay đổi trạng thái hoặc đã được hủy' };
        }
        const refundAmount = (row.paymentStatus === 'Paid' ? Number(row.totalAmount) || 0 : 0) + (Number(row.walletAmountUsed) || 0);
        if (refundAmount > 0 && row.userId) {
          const walletReq = new sql.Request(tx);
          walletReq.input('userId', sql.Int, row.userId);
          walletReq.input('amount', sql.Decimal(18, 0), refundAmount);
          const walletRes = await walletReq.query('UPDATE Users SET walletBalance = ISNULL(walletBalance, 0) + @amount WHERE id = @userId');
          if ((walletRes.rowsAffected?.[0] || 0) !== 1) throw new Error('Wallet refund could not be committed');
        }
        await tx.commit();
        const local = inMemoryOrders.find(o => o.orderCode === cleanCode);
        if (local) {
          local.status = 'Cancelled';
          local.cancelReason = cancelReason;
          local.refundStatus = refundAmount > 0 ? 'Refunded' : 'None';
          local.updatedAt = new Date().toISOString();
        }
        return { success: true, message: 'Hủy đơn hàng thành công', refundedAmount: refundAmount };
      } catch (err) {
        await tx.rollback();
        throw err;
      }
    }
    if (process.env.NODE_ENV === 'production') return { success: false, message: 'Không thể kết nối cơ sở dữ liệu để hủy đơn' };
  } catch (err) {
    console.error('Atomic order cancellation failed:', err);
    return { success: false, message: 'Không thể hoàn tất hủy đơn và hoàn tiền' };
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



  return {
    success: true,
    message: 'Hủy đơn hàng thành công',
    refundedAmount: refundAmount,
  };
}

export async function getAdminStats(
  period: 'all' | 'today' | 'week' | 'month' | 'quarter' = 'all',
  branchId?: number | 'all'
) {
  let dateCondition = '1=1';
  const now = new Date();
  let cutoffDate: Date | null = null;

  if (period === 'today') {
    dateCondition = 'createdAt >= CAST(GETDATE() AS DATE)';
    cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'week') {
    dateCondition = 'createdAt >= DATEADD(day, -7, GETDATE())';
    cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === 'month') {
    dateCondition = 'createdAt >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)';
    cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'quarter') {
    dateCondition = 'createdAt >= DATEADD(quarter, DATEDIFF(quarter, 0, GETDATE()), 0)';
    const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
    cutoffDate = new Date(now.getFullYear(), quarterMonth, 1);
  }

  let branchCondition = '1=1';
  if (branchId && branchId !== 'all') {
    const bId = Number(branchId);
    if (bId === 1) {
      branchCondition = '(branchId = 1 OR branchId IS NULL)';
    } else {
      branchCondition = `branchId = ${bId}`;
    }
  }

  try {
    const pool = await getCloudPool();
    if (pool) {
      const res = await pool.request().query(`
        SELECT 
          CAST(ISNULL(SUM(CASE WHEN paymentStatus = 'Paid' THEN totalAmount ELSE 0 END), 0) AS BIGINT) AS totalRevenue,
          COUNT(*) AS totalOrders,
          COUNT(CASE WHEN status = 'Pending' THEN 1 END) AS pendingOrders,
          COUNT(CASE WHEN status = 'Delivering' THEN 1 END) AS deliveringOrders,
          COUNT(CASE WHEN status = 'Completed' THEN 1 END) AS completedOrders,
          COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) AS cancelledOrders,
          CAST(ISNULL(SUM(CASE WHEN paymentStatus = 'Paid' AND (branchId = 1 OR branchId IS NULL) THEN totalAmount ELSE 0 END), 0) AS BIGINT) AS branch1Revenue,
          COUNT(CASE WHEN (branchId = 1 OR branchId IS NULL) THEN 1 END) AS branch1Orders,
          CAST(ISNULL(SUM(CASE WHEN paymentStatus = 'Paid' AND branchId = 2 THEN totalAmount ELSE 0 END), 0) AS BIGINT) AS branch2Revenue,
          COUNT(CASE WHEN branchId = 2 THEN 1 END) AS branch2Orders
        FROM Orders
        WHERE ${dateCondition} AND ${branchCondition}
      `);
      let prodBranchCondition = '1=1';
      if (branchId && branchId !== 'all') {
        const bId = Number(branchId);
        prodBranchCondition = `(branchId = ${bId} OR branchId IS NULL)`;
      }
      const prodRes = await pool.request().query(`SELECT COUNT(*) AS cnt FROM Products WHERE ${prodBranchCondition}`);
      const recentRes = await pool.request().query(`
        SELECT TOP 10 id, orderCode, customerName, customerPhone, CAST(totalAmount AS BIGINT) AS totalAmount, 
               paymentMethod, paymentStatus, status, ISNULL(branchId, 1) AS branchId, ISNULL(branchName, N'NooNee - Cơ sở 120 Yên Lãng') AS branchName, createdAt
        FROM Orders 
        WHERE ${dateCondition} AND ${branchCondition}
        ORDER BY id DESC
      `);

      // Orders for calculating top products
      const allPeriodOrdersRes = await pool.request().query(`
        SELECT id, totalAmount, paymentStatus, status, items, ISNULL(branchId, 1) AS branchId, createdAt
        FROM Orders
        WHERE ${dateCondition} AND ${branchCondition}
      `);
      
      const ordersList = allPeriodOrdersRes.recordset || [];
      const topProductsMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

      ordersList.forEach((o: any) => {
        try {
          const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              const name = item.product?.name || item.name || 'Món ăn';
              const qty = Number(item.quantity) || 1;
              const price = Number(item.itemPrice || item.product?.price || 0);
              if (!topProductsMap[name]) {
                topProductsMap[name] = { name, quantity: 0, revenue: 0 };
              }
              topProductsMap[name].quantity += qty;
              topProductsMap[name].revenue += price * qty;
            });
          }
        } catch (e) {}
      });

      const topProducts = Object.values(topProductsMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      const totalRevenue = Number(res.recordset[0]?.totalRevenue || 0);
      const totalOrders = Number(res.recordset[0]?.totalOrders || 0);
      const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

      return {
        ...res.recordset[0],
        totalProducts: prodRes.recordset[0]?.cnt || 0,
        recentOrders: recentRes.recordset || [],
        topProducts,
        averageOrderValue,
        period,
        selectedBranchId: branchId || 'all',
        branchBreakdown: {
          branch1: {
            id: 1,
            name: 'NooNee - Cơ sở 120 Yên Lãng',
            shortName: '120 Yên Lãng',
            revenue: Number(res.recordset[0]?.branch1Revenue || 0),
            orders: Number(res.recordset[0]?.branch1Orders || 0),
          },
          branch2: {
            id: 2,
            name: 'NooNee - Cơ sở 269 Cầu Giấy',
            shortName: '269 Cầu Giấy',
            revenue: Number(res.recordset[0]?.branch2Revenue || 0),
            orders: Number(res.recordset[0]?.branch2Orders || 0),
          },
        },
      };
    }
  } catch (e) { console.error('Admin stats error:', e); }
  
  const allOrders = await getOrders({ branchId });
  const products = await getProducts({ branchId });
  const filteredOrders = cutoffDate ? allOrders.filter(o => new Date(o.createdAt) >= cutoffDate!) : allOrders;

  const totalRevenue = filteredOrders.reduce((sum, o) => (o.paymentStatus === 'Paid' ? sum + o.totalAmount : sum), 0);
  const pendingOrders = filteredOrders.filter(o => o.status === 'Pending').length;
  const deliveringOrders = filteredOrders.filter(o => o.status === 'Delivering').length;
  const completedOrders = filteredOrders.filter(o => o.status === 'Completed').length;
  const cancelledOrders = filteredOrders.filter(o => o.status === 'Cancelled').length;
  const averageOrderValue = filteredOrders.length > 0 ? Math.round(totalRevenue / filteredOrders.length) : 0;

  const topProductsMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  filteredOrders.forEach((o) => {
    try {
      const items = Array.isArray(o.items) ? o.items : JSON.parse(o.items as any);
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          const name = item.product?.name || item.name || 'Món ăn';
          const qty = Number(item.quantity) || 1;
          const price = Number(item.itemPrice || item.product?.price || 0);
          if (!topProductsMap[name]) {
            topProductsMap[name] = { name, quantity: 0, revenue: 0 };
          }
          topProductsMap[name].quantity += qty;
          topProductsMap[name].revenue += price * qty;
        });
      }
    } catch (e) {}
  });

  const topProducts = Object.values(topProductsMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return {
    totalRevenue,
    totalOrders: filteredOrders.length,
    totalProducts: products.length,
    pendingOrders,
    deliveringOrders,
    completedOrders,
    cancelledOrders,
    averageOrderValue,
    topProducts,
    recentOrders: filteredOrders.slice(0, 10),
    period,
  };
}

export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  engine: string;
  host: string;
  databaseName: string;
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

      const cfg = getDatabaseConfig();
      const hostDisplay = cfg.port ? `${cfg.server}:${cfg.port}` : cfg.server;
      return {
        connected: true,
        engine: 'Microsoft SQL Server',
        host: hostDisplay,
        databaseName: cfg.database || 'Configured DB',
        database: `${cfg.database || 'Configured DB'} @ ${cfg.server}`,
        categoryCount: catRes.recordset[0]?.cnt || 0,
        productCount: prodRes.recordset[0]?.cnt || 0,
        orderCount: orderRes.recordset[0]?.cnt || 0,
        details: `Kết nối thành công tới máy chủ SQL Server (${cfg.server}). Dữ liệu đang được đồng bộ trực tiếp.`
      };
    }
  } catch (err: any) {
    console.warn('Cloud health check failed:', err.message);
  }

  return {
    connected: false,
    engine: 'In-Memory Fallback',
    host: 'Chưa cấu hình / Chế độ cục bộ',
    databaseName: 'FoodOrderingDB (Hybrid)',
    database: 'FoodOrderingDB (Hybrid)',
    categoryCount: inMemoryCategories.length,
    productCount: inMemoryProducts.length,
    orderCount: inMemoryOrders.length,
    details: 'Chưa kết nối SQL Server (chưa cấu hình biến SQLSERVER_* trong .env.local hoặc máy chủ không phản hồi). Hệ thống đang dùng dữ liệu dự phòng trong bộ nhớ.'
  };
}

// ==========================================
// USER & AUTHENTICATION (Cloud SQL Server)
// ==========================================

function normalizeUserRow(row: any): User {
  return {
    ...row,
    branchId: row.branchId !== undefined && row.branchId !== null ? Number(row.branchId) : null,
    isActive: row.isActive === undefined || row.isActive === null ? true : Boolean(row.isActive),
    walletBalance: Number(row.walletBalance || 0),
  };
}

export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('username', sql.NVarChar(50), username);
      const res = await req.query(`
        SELECT id, username, fullName, email, phone, address, role, branchId, ISNULL(isActive, 1) AS isActive, CAST(ISNULL(walletBalance, 0) AS BIGINT) AS walletBalance, createdAt
        FROM Users
        WHERE username = @username
      `);
      if (res.recordset && res.recordset.length > 0) {
        return normalizeUserRow(res.recordset[0]);
      }
    }
  } catch (err) {
    console.error('Error querying user from cloud:', err);
  }
  const u = inMemoryUsers.find((u) => u.username === username);
  if (u) { const { password, ...safeU } = u as any; return normalizeUserRow(safeU); }
  return null;
}

export async function getUserByUsernameWithPassword(username: string): Promise<User | null> {
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('username', sql.NVarChar(50), username);
      const res = await req.query(`
        SELECT id, username, password, fullName, email, phone, address, role, branchId, ISNULL(isActive, 1) AS isActive, CAST(ISNULL(walletBalance, 0) AS BIGINT) AS walletBalance, createdAt
        FROM Users
        WHERE username = @username
      `);
      if (res.recordset && res.recordset.length > 0) {
        return normalizeUserRow(res.recordset[0]);
      }
    }
  } catch (err) {
    console.error('Error querying user from cloud:', err);
  }
  const u = inMemoryUsers.find((u) => u.username === username);
  return u ? normalizeUserRow(u) : null;
}

export async function createUser(data: {
  username: string;
  password: string;
  fullName: string;
  phone?: string;
  address?: string;
  email?: string;
  role?: UserRole;
  branchId?: number | null;
  isActive?: boolean;
}): Promise<User> {
  const role: UserRole = data.role || 'customer';
  const branchId = data.branchId !== undefined && data.branchId !== null ? Number(data.branchId) : null;
  const isActive = data.isActive === undefined ? true : Boolean(data.isActive);
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('username', sql.NVarChar(50), data.username);
      const hashedPassword = await bcrypt.hash(data.password, 12);
      req.input('password', sql.NVarChar(255), hashedPassword);
      req.input('fullName', sql.NVarChar(100), data.fullName);
      req.input('phone', sql.NVarChar(20), data.phone || '');
      req.input('address', sql.NVarChar(255), data.address || '');
      req.input('email', sql.NVarChar(100), data.email || null);
      req.input('role', sql.NVarChar(20), role);
      req.input('branchId', sql.Int, branchId);
      req.input('isActive', sql.Bit, isActive ? 1 : 0);

      const res = await req.query(`
        INSERT INTO Users (username, password, fullName, phone, address, email, role, branchId, isActive, walletBalance)
        OUTPUT INSERTED.id, INSERTED.username, INSERTED.fullName, INSERTED.phone, INSERTED.address, INSERTED.email, INSERTED.role, INSERTED.branchId, ISNULL(INSERTED.isActive, 1) AS isActive, CAST(ISNULL(INSERTED.walletBalance, 0) AS BIGINT) AS walletBalance, INSERTED.createdAt
        VALUES (@username, @password, @fullName, @phone, @address, @email, @role, @branchId, @isActive, 0)
      `);
      if (res.recordset && res.recordset[0]) {
        return normalizeUserRow(res.recordset[0]);
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
    branchId,
    isActive,
    walletBalance: 0,
    createdAt: new Date().toISOString(),
  };
  inMemoryUsers.push(newU);
  return newU;
}

export async function verifyUserCredentials(username: string, password: string): Promise<User | null> {
  const user = await getUserByUsernameWithPassword(username);
  if (!user) return null;
  if (await bcrypt.compare(password, (user as any).password)) {
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
        SELECT id, username, fullName, email, phone, address, role, branchId, ISNULL(isActive, 1) AS isActive, CAST(ISNULL(walletBalance, 0) AS BIGINT) AS walletBalance, createdAt
        FROM Users
        WHERE id = @id
      `);
      if (res.recordset && res.recordset.length > 0) {
        return normalizeUserRow(res.recordset[0]);
      }
    }
  } catch (err) {
    console.error('Error querying user by id from cloud:', err);
  }
  const u = inMemoryUsers.find((u) => u.id === userId);
  if (u) { const { password, ...safeU } = u as any; return normalizeUserRow(safeU); }
  return null;
}

export async function getUserByIdWithPassword(userId: number): Promise<User | null> {
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('id', sql.Int, userId);
      const res = await req.query(`
        SELECT id, username, password, fullName, email, phone, address, role, branchId, ISNULL(isActive, 1) AS isActive, CAST(ISNULL(walletBalance, 0) AS BIGINT) AS walletBalance, createdAt
        FROM Users
        WHERE id = @id
      `);
      if (res.recordset && res.recordset.length > 0) {
        return normalizeUserRow(res.recordset[0]);
      }
    }
  } catch (err) {
    console.error('Error querying user by id from cloud:', err);
  }
  const u = inMemoryUsers.find((u) => u.id === userId);
  return u ? normalizeUserRow(u) : null;
}

export async function getUserSpendingStats(userId: number): Promise<{
  totalSpent: number;
  orderCount: number;
  completedCount: number;
}> {
  let directTotalSpent = 0;
  let directOrderCount = 0;
  let directCompletedCount = 0;

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
        directTotalSpent = Number(res.recordset[0].totalSpent) || 0;
        directOrderCount = Number(res.recordset[0].orderCount) || 0;
        directCompletedCount = Number(res.recordset[0].completedCount) || 0;
      }
    }
  } catch (err) {
    console.error('Error fetching user spending stats:', err);
  }

  // Fallback to in-memory orders if pool not connected or empty
  if (directOrderCount === 0 && directTotalSpent === 0) {
    const userOrders = inMemoryOrders.filter((o) => o.userId === userId);
    const completed = userOrders.filter(
      (o) => o.paymentStatus === 'Paid' || o.status === 'Completed'
    );
    directTotalSpent = completed.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    directOrderCount = userOrders.length;
    directCompletedCount = completed.length;
  }

  // Add stats from completed Group Orders where user was a participating member (not the host)
  let groupOrderCount = 0;
  let groupSpent = 0;
  let groupCompletedCount = 0;

  // 1. In-memory completed group orders
  for (const grp of inMemoryGroupOrders) {
    if (grp.status === 'completed' && grp.hostUserId !== userId) {
      const myMember = grp.members?.find((m) => m.userId === userId);
      if (myMember && (myMember.items || []).length > 0) {
        groupOrderCount++;
        groupCompletedCount++;
        const memSubtotal = (myMember.items || []).reduce((s, it) => s + it.price * it.quantity, 0);
        const discountPct = grp.discountPercentage || 0;
        const memDiscount = Math.round(memSubtotal * (discountPct / 100));
        groupSpent += Math.max(0, memSubtotal - memDiscount);
      }
    }
  }

  // 2. Cloud SQL completed group orders if available
  try {
    const pool = await getCloudPool();
    if (pool) {
      const gReq = pool.request();
      gReq.input('userId', sql.Int, userId);
      const gRes = await gReq.query(`
        SELECT code, hostUserId, membersData, discountPercentage 
        FROM GroupOrders 
        WHERE status = 'completed' 
          AND (hostUserId IS NULL OR hostUserId != @userId)
          AND membersData LIKE '%"userId":' + CAST(@userId AS NVARCHAR) + '%'
      `);
      if (gRes.recordset && gRes.recordset.length > 0) {
        groupOrderCount = 0;
        groupSpent = 0;
        groupCompletedCount = 0;
        for (const row of gRes.recordset) {
          try {
            const members: GroupMember[] = JSON.parse(row.membersData || '[]');
            const myMem = members.find((m) => m.userId === userId);
            if (myMem && (myMem.items || []).length > 0) {
              groupOrderCount++;
              groupCompletedCount++;
              const memSubtotal = (myMem.items || []).reduce((s, it) => s + it.price * it.quantity, 0);
              const discountPct = row.discountPercentage || 0;
              const memDiscount = Math.round(memSubtotal * (discountPct / 100));
              groupSpent += Math.max(0, memSubtotal - memDiscount);
            }
          } catch {}
        }
      }
    }
  } catch (gErr) {
    console.error('Error fetching group order member spending stats:', gErr);
  }

  return {
    totalSpent: directTotalSpent + groupSpent,
    orderCount: directOrderCount + groupOrderCount,
    completedCount: directCompletedCount + groupCompletedCount,
  };
}

export async function updateUserPassword(
  userId: number,
  currentPass: string,
  newPass: string
): Promise<{ success: boolean; message: string }> {
  const user = await getUserByIdWithPassword(userId);
  if (!user) {
    return { success: false, message: 'Không tìm thấy tài khoản người dùng' };
  }

  if (!(await bcrypt.compare(currentPass, (user as any).password))) {
    return { success: false, message: 'Mật khẩu hiện tại không chính xác' };
  }

  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('userId', sql.Int, userId);
      const hashedNewPass = await bcrypt.hash(newPass, 12);
      req.input('password', sql.NVarChar(255), hashedNewPass);
      await req.query(`UPDATE Users SET password = @password WHERE id = @userId`);
    }
  } catch (err: any) {
    console.error('Error updating password in cloud:', err);
  }

  // Update in-memory fallback
  const inMem = inMemoryUsers.find((u) => u.id === userId);
  if (inMem) {
    (inMem as any).password = await bcrypt.hash(newPass, 12);
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
        OUTPUT INSERTED.id, INSERTED.username, INSERTED.fullName, INSERTED.email, INSERTED.phone, INSERTED.address, INSERTED.role, INSERTED.branchId, ISNULL(INSERTED.isActive, 1) AS isActive, CAST(ISNULL(INSERTED.walletBalance, 0) AS BIGINT) AS walletBalance, INSERTED.createdAt
        WHERE id = @userId
      `);
      if (res.recordset && res.recordset[0]) {
        return normalizeUserRow(res.recordset[0]);
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

export async function getInternalUsers(): Promise<User[]> {
  try {
    const pool = await getCloudPool();
    if (pool) {
      const res = await pool.request().query(`
        SELECT id, username, fullName, email, phone, address, role, branchId, ISNULL(isActive, 1) AS isActive, CAST(ISNULL(walletBalance, 0) AS BIGINT) AS walletBalance, createdAt
        FROM Users
        WHERE role IN ('admin', 'manager', 'staff')
        ORDER BY
          CASE role
            WHEN 'admin' THEN 1
            WHEN 'manager' THEN 2
            WHEN 'staff' THEN 3
            ELSE 4
          END ASC,
          id DESC
      `);
      if (res.recordset) {
        return res.recordset.map(normalizeUserRow);
      }
    }
  } catch (err) {
    console.error('Error fetching internal users:', err);
  }
  return inMemoryUsers
    .filter((u) => u.role === 'admin' || u.role === 'manager' || u.role === 'staff')
    .map((u) => {
      const { password, ...safeU } = u as any;
      return normalizeUserRow(safeU);
    });
}

export async function updateInternalUser(
  userId: number,
  data: {
    fullName?: string;
    phone?: string;
    email?: string | null;
    password?: string;
    role?: 'admin' | 'manager' | 'staff';
    branchId?: number | null;
    isActive?: boolean;
  }
): Promise<User | null> {
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('userId', sql.Int, userId);
      const setClauses: string[] = [];

      if (data.fullName !== undefined) {
        req.input('fullName', sql.NVarChar(100), data.fullName.trim());
        setClauses.push('fullName = @fullName');
      }
      if (data.phone !== undefined) {
        req.input('phone', sql.NVarChar(20), data.phone.trim());
        setClauses.push('phone = @phone');
      }
      if (data.email !== undefined) {
        req.input('email', sql.NVarChar(100), data.email ? data.email.trim() : null);
        setClauses.push('email = @email');
      }
      if (data.role !== undefined) {
        req.input('role', sql.NVarChar(20), data.role);
        setClauses.push('role = @role');
      }
      if (data.branchId !== undefined) {
        req.input('branchId', sql.Int, data.branchId !== null ? Number(data.branchId) : null);
        setClauses.push('branchId = @branchId');
      }
      if (data.isActive !== undefined) {
        req.input('isActive', sql.Bit, data.isActive ? 1 : 0);
        setClauses.push('isActive = @isActive');
      }
      if (data.password && data.password.trim().length > 0) {
        const hashedPassword = await bcrypt.hash(data.password.trim(), 12);
        req.input('password', sql.NVarChar(255), hashedPassword);
        setClauses.push('password = @password');
      }

      if (setClauses.length === 0) {
        return await getUserById(userId);
      }

      const res = await req.query(`
        UPDATE Users
        SET ${setClauses.join(', ')}
        OUTPUT INSERTED.id, INSERTED.username, INSERTED.fullName, INSERTED.email, INSERTED.phone, INSERTED.address, INSERTED.role, INSERTED.branchId, ISNULL(INSERTED.isActive, 1) AS isActive, CAST(ISNULL(INSERTED.walletBalance, 0) AS BIGINT) AS walletBalance, INSERTED.createdAt
        WHERE id = @userId
      `);
      if (res.recordset && res.recordset[0]) {
        return normalizeUserRow(res.recordset[0]);
      }
    }
  } catch (err) {
    console.error('Error updating internal user:', err);
    throw err;
  }

  const inMem = inMemoryUsers.find((u) => u.id === userId);
  if (inMem) {
    if (data.fullName !== undefined) inMem.fullName = data.fullName;
    if (data.phone !== undefined) inMem.phone = data.phone;
    if (data.email !== undefined) inMem.email = data.email;
    if (data.role !== undefined) inMem.role = data.role;
    if (data.branchId !== undefined) inMem.branchId = data.branchId;
    if (data.isActive !== undefined) inMem.isActive = data.isActive;
    if (data.password && data.password.trim()) {
      (inMem as any).password = await bcrypt.hash(data.password.trim(), 12);
    }
    const { password, ...safeU } = inMem as any;
    return normalizeUserRow(safeU);
  }
  return null;
}

export async function deleteInternalUser(userId: number): Promise<boolean> {
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('userId', sql.Int, userId);
      await req.query(`
        UPDATE Orders SET userId = NULL WHERE userId = @userId;
        IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SupportMessages')
          UPDATE SupportMessages SET userId = NULL WHERE userId = @userId;
        IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Reviews')
          UPDATE Reviews SET userId = NULL WHERE userId = @userId;
        IF EXISTS (SELECT * FROM sys.tables WHERE name = 'GroupOrders')
          UPDATE GroupOrders SET hostUserId = NULL WHERE hostUserId = @userId;
        DELETE FROM Users WHERE id = @userId AND role IN ('staff', 'manager');
      `);
      return true;
    }
  } catch (err) {
    console.error('Error deleting internal user:', err);
    throw err;
  }
  const idx = inMemoryUsers.findIndex((u) => u.id === userId && (u.role === 'staff' || u.role === 'manager'));
  if (idx !== -1) {
    inMemoryUsers.splice(idx, 1);
    return true;
  }
  return false;
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

let inMemorySupportMessages: SupportMessage[] = [
  {
    id: 1,
    orderCode: null,
    userId: null,
    senderRole: 'admin',
    senderName: 'NooNee CSKH',
    message: 'Chào mừng bạn đến với kênh hỗ trợ trực tuyến NooNee Food! Chúng mình luôn sẵn sàng lắng nghe mọi thắc mắc và hỗ trợ bạn nhanh nhất.',
    isComplaint: false,
    status: 'open',
    createdAt: new Date().toISOString(),
  }
];

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
        if (options.orderCode === 'GENERAL') {
          query += ` AND (orderCode IS NULL OR orderCode = 'GENERAL')`;
        } else {
          req.input('orderCode', sql.NVarChar(50), options.orderCode);
          query += ` AND orderCode = @orderCode`;
        }
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
    if (process.env.NODE_ENV === 'production') throw err;
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Database unavailable for support messages');

  // Robust In-memory fallback
  let list = [...inMemorySupportMessages];
  if (options?.orderCode) {
    if (options.orderCode === 'GENERAL') {
      list = list.filter((m) => !m.orderCode || m.orderCode === 'GENERAL');
    } else {
      list = list.filter((m) => m.orderCode === options.orderCode);
    }
  }
  if (options?.userId) {
    list = list.filter((m) => m.userId === options.userId);
  }
  return list;
}

export async function createSupportMessage(data: {
  orderCode?: string | null;
  userId?: number | null;
  senderRole: 'customer' | 'admin';
  senderName: string;
  message: string;
  isComplaint?: boolean;
}): Promise<SupportMessage> {
  const cleanOrderCode = data.orderCode === 'GENERAL' ? null : (data.orderCode || null);
  const fallbackMsg: SupportMessage = {
    id: Date.now(),
    orderCode: cleanOrderCode,
    userId: data.userId || null,
    senderRole: data.senderRole,
    senderName: data.senderName,
    message: data.message,
    isComplaint: Boolean(data.isComplaint),
    status: 'open',
    createdAt: new Date().toISOString(),
  };

  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('orderCode', sql.NVarChar(50), cleanOrderCode);
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
        inMemorySupportMessages.push(res.recordset[0]);
        return res.recordset[0];
      }
    }
  } catch (err) {
    console.error('Error creating support message in cloud:', err);
    if (process.env.NODE_ENV === 'production') throw err;
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Database unavailable for support message creation');

  inMemorySupportMessages.push(fallbackMsg);
  return fallbackMsg;
}

// ==========================================
// GROUP ORDERS (ĐẶT ĐƠN NHÓM)
// ==========================================

let inMemoryGroupOrders: GroupOrder[] = [];

export async function createGroupOrder(data: {
  hostName: string;
  hostUserId?: number | null;
}): Promise<GroupOrder> {
  const code = generateGroupCode();
  const hostMember: GroupMember = {
    id: `host-${Date.now()}`,
    name: data.hostName.trim() || 'Trưởng nhóm',
    isHost: true,
    userId: data.hostUserId || null,
    joinedAt: new Date().toISOString(),
    items: [],
  };

  const newGroup: GroupOrder = {
    id: inMemoryGroupOrders.length + 1,
    code,
    hostName: data.hostName.trim() || 'Trưởng nhóm',
    hostUserId: data.hostUserId || null,
    status: 'active',
    members: [hostMember],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const enriched = computeGroupOrderStats(newGroup);

  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('code', sql.NVarChar(50), code);
      req.input('hostName', sql.NVarChar(150), hostMember.name);
      req.input('hostUserId', sql.Int, data.hostUserId || null);
      req.input('membersData', sql.NVarChar(sql.MAX), JSON.stringify([hostMember]));
      const res = await req.query(`
        INSERT INTO GroupOrders (code, hostName, hostUserId, status, membersData, createdAt, updatedAt)
        OUTPUT INSERTED.id, INSERTED.code, INSERTED.hostName, INSERTED.hostUserId, INSERTED.status, INSERTED.createdAt, INSERTED.updatedAt
        VALUES (@code, @hostName, @hostUserId, 'active', @membersData, GETDATE(), GETDATE())
      `);
      if (res.recordset && res.recordset[0]) {
        enriched.id = res.recordset[0].id;
      }
      inMemoryGroupOrders.unshift(enriched);
      return enriched;
    }
  } catch (err) {
    console.error('Error creating group order in cloud:', err);
    throw err;
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Database unavailable for group creation');
  inMemoryGroupOrders.unshift(enriched);
  return enriched;
}

export async function getGroupOrderByCode(code: string): Promise<GroupOrder | null> {
  const cleanCode = (code || '').trim().toUpperCase();
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('code', sql.NVarChar(50), cleanCode);
      const res = await req.query(`
        SELECT id, code, hostName, hostUserId, status, orderCode, membersData, createdAt, updatedAt
        FROM GroupOrders
        WHERE code = @code
      `);
      if (res.recordset && res.recordset[0]) {
        const row = res.recordset[0];
        let members: GroupMember[] = [];
        try {
          members = row.membersData ? JSON.parse(row.membersData) : [];
        } catch {
          members = [];
        }
        const group: GroupOrder = {
          id: row.id,
          code: row.code,
          hostName: row.hostName,
          hostUserId: row.hostUserId,
          status: row.status,
          orderCode: row.orderCode,
          members,
          createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
        };
        const enriched = computeGroupOrderStats(group);
        const idx = inMemoryGroupOrders.findIndex(g => g.code === cleanCode);
        if (idx >= 0) inMemoryGroupOrders[idx] = enriched;
        else inMemoryGroupOrders.unshift(enriched);
        return enriched;
      }
      return null;
    }
  } catch (err) {
    console.error('Error fetching group order from cloud:', err);
    if (process.env.NODE_ENV === 'production') throw err;
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Database unavailable for group lookup');

  const inMem = inMemoryGroupOrders.find(g => g.code === cleanCode);
  return inMem ? computeGroupOrderStats(inMem) : null;
}

export async function saveGroupOrderMembers(
  code: string,
  members: GroupMember[],
  status?: 'active' | 'locked' | 'completed',
  orderCode?: string
): Promise<boolean> {
  const cleanCode = (code || '').trim().toUpperCase();
  const membersJson = JSON.stringify(members);

  const updateLocal = () => {
    const inMem = inMemoryGroupOrders.find(g => g.code === cleanCode);
    if (inMem) {
      inMem.members = members;
      if (status) inMem.status = status;
      if (orderCode) inMem.orderCode = orderCode;
      inMem.updatedAt = new Date().toISOString();
    }
  };

  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('code', sql.NVarChar(50), cleanCode);
      req.input('membersData', sql.NVarChar(sql.MAX), membersJson);
      let sqlQuery = `UPDATE GroupOrders SET membersData = @membersData, updatedAt = GETDATE()`;
      if (status) {
        req.input('status', sql.NVarChar(50), status);
        sqlQuery += `, status = @status`;
      }
      if (orderCode) {
        req.input('orderCode', sql.NVarChar(50), orderCode);
        sqlQuery += `, orderCode = @orderCode`;
      }
      sqlQuery += ` WHERE code = @code`;
      const result = await req.query(sqlQuery);
      const saved = (result.rowsAffected?.[0] || 0) > 0;
      if (saved) updateLocal();
      return saved;
    }
  } catch (err) {
    console.error('Error saving group order members in cloud:', err);
    return false;
  }
  if (process.env.NODE_ENV !== 'production') {
    updateLocal();
    return true;
  }
  return false;
}

export async function joinGroupOrder(
  code: string,
  memberName: string,
  userId?: number | null,
  memberId?: string
): Promise<{ success: boolean; message?: string; group?: GroupOrder; member?: GroupMember }> {
  const group = await getGroupOrderByCode(code);
  if (!group) {
    return { success: false, message: 'Không tìm thấy nhóm với mã này' };
  }

  if (group.status !== 'active') {
    return { success: false, message: 'Nhóm này đã bị khóa hoặc đã hoàn tất đơn hàng' };
  }

  const name = memberName.trim();
  if (!name) {
    return { success: false, message: 'Vui lòng nhập tên của bạn' };
  }

  // Check if member already exists by provided memberId or (userId / name)
  let existingMember = group.members.find(
    m => Boolean(userId && m.userId === userId)
  );

  if (existingMember) {
    existingMember.name = name;
    if (userId && !existingMember.userId) existingMember.userId = userId;
    if (!(await saveGroupOrderMembers(group.code, group.members))) return { success: false, message: 'Không lưu được thành viên nhóm' };
    return { success: true, group: computeGroupOrderStats(group), member: existingMember };
  }

  // Check group max limit (10 members)
  if (group.members.length >= MAX_GROUP_MEMBERS) {
    return { success: false, message: `Nhóm đã đạt số lượng tối đa (${MAX_GROUP_MEMBERS} người)` };
  }

  const newMember: GroupMember = {
    id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    isHost: false,
    userId: userId || null,
    joinedAt: new Date().toISOString(),
    items: [],
  };

  group.members.push(newMember);
  if (!(await saveGroupOrderMembers(group.code, group.members))) return { success: false, message: 'Không lưu được thành viên nhóm' };
  return { success: true, group: computeGroupOrderStats(group), member: newMember };
}

export async function updateGroupMemberItem(
  code: string,
  memberId: string,
  action: 'add' | 'remove' | 'update_qty',
  itemData: {
    itemId?: string;
    productId?: number;
    productName?: string;
    price?: number;
    quantity?: number;
    toppings?: any[] | string;
    note?: string;
  },
  requesterMemberId?: string
): Promise<{ success: boolean; message?: string; group?: GroupOrder }> {
  const group = await getGroupOrderByCode(code);
  if (!group) {
    return { success: false, message: 'Không tìm thấy nhóm' };
  }

  if (group.status !== 'active') {
    return { success: false, message: 'Nhóm đang bị khóa hoặc đã hoàn tất, không thể chỉnh sửa món' };
  }

  // Authorization check (Test Case 4.1): Only the member themselves or the Host can modify items
  if (requesterMemberId && requesterMemberId !== memberId) {
    const requester = group.members.find(m => m.id === requesterMemberId);
    if (!requester?.isHost) {
      return { success: false, message: 'Bạn không có quyền chỉnh sửa phần ăn của thành viên khác' };
    }
  }

  const member = group.members.find(m => m.id === memberId);
  if (!member) {
    return { success: false, message: 'Thành viên không thuộc nhóm này' };
  }

  if (!member.items) member.items = [];

  if (action === 'add') {
    if (!itemData.productId || !itemData.productName || !itemData.price) {
      return { success: false, message: 'Dữ liệu món ăn không hợp lệ' };
    }
    const qty = Math.max(1, itemData.quantity || 1);
    const toppingsStr = typeof itemData.toppings === 'string' ? itemData.toppings : JSON.stringify(itemData.toppings || []);
    const noteStr = (itemData.note || '').trim();

    // Check if duplicate item (same product, same toppings, same note)
    const existingIdx = member.items.findIndex(it => 
      it.productId === itemData.productId &&
      (it.toppings || '') === toppingsStr &&
      (it.note || '') === noteStr
    );

    if (existingIdx >= 0) {
      member.items[existingIdx].quantity += qty;
      member.items[existingIdx].total = member.items[existingIdx].price * member.items[existingIdx].quantity;
    } else {
      const newItem: GroupMemberItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: itemData.productId,
        productName: itemData.productName,
        price: itemData.price,
        quantity: qty,
        toppings: toppingsStr,
        note: noteStr,
        total: itemData.price * qty,
      };
      member.items.push(newItem);
    }
  } else if (action === 'remove') {
    if (!itemData.itemId) {
      return { success: false, message: 'Thiếu mã món cần xóa' };
    }
    member.items = member.items.filter(it => it.id !== itemData.itemId);
  } else if (action === 'update_qty') {
    if (!itemData.itemId) {
      return { success: false, message: 'Thiếu mã món cần cập nhật' };
    }
    const item = member.items.find(it => it.id === itemData.itemId);
    if (item) {
      const newQty = itemData.quantity ?? 0;
      if (newQty <= 0) {
        member.items = member.items.filter(it => it.id !== itemData.itemId);
      } else {
        item.quantity = newQty;
        item.total = item.price * newQty;
      }
    }
  }

  if (!(await saveGroupOrderMembers(group.code, group.members))) return { success: false, message: 'Không lưu được món của nhóm' };
  return { success: true, group: computeGroupOrderStats(group) };
}

export async function removeGroupMember(
  code: string,
  memberIdToRemove: string,
  requesterMemberId?: string
): Promise<{ success: boolean; message?: string; group?: GroupOrder }> {
  const group = await getGroupOrderByCode(code);
  if (!group) return { success: false, message: 'Không tìm thấy nhóm' };
  if (group.status !== 'active') {
    return { success: false, message: 'Nhóm đang bị khóa hoặc đã hoàn tất, không thể thay đổi thành viên' };
  }

  const memberToRemove = group.members.find(m => m.id === memberIdToRemove);
  if (!memberToRemove) return { success: false, message: 'Thành viên không tồn tại trong nhóm' };
  if (memberToRemove.isHost) return { success: false, message: 'Không thể xóa trưởng nhóm khỏi phòng' };

  if (requesterMemberId) {
    const requester = group.members.find(m => m.id === requesterMemberId);
    if (!requester?.isHost && requesterMemberId !== memberIdToRemove) {
      return { success: false, message: 'Bạn không có quyền xóa thành viên này' };
    }
  }

  group.members = group.members.filter(m => m.id !== memberIdToRemove);
  if (!(await saveGroupOrderMembers(group.code, group.members))) return { success: false, message: 'Không lưu được thay đổi thành viên' };
  return { success: true, group: computeGroupOrderStats(group) };
}

export async function lockGroupOrder(
  code: string,
  requesterMemberId?: string,
  requesterUserId?: number | null
): Promise<{ success: boolean; message?: string; group?: GroupOrder }> {
  const group = await getGroupOrderByCode(code);
  if (!group) return { success: false, message: 'Không tìm thấy nhóm' };

  // Authorization check (Test Case 4.1): Only host can lock
  if (requesterMemberId || requesterUserId) {
    const isHost =
      (requesterMemberId && group.members.some(m => m.id === requesterMemberId && m.isHost)) ||
      (requesterUserId && group.hostUserId === requesterUserId);
    if (!isHost) {
      return { success: false, message: 'Chỉ trưởng nhóm mới có quyền khóa chốt đơn nhóm' };
    }
  }

  if (group.members.length < MIN_GROUP_MEMBERS) {
    return { success: false, message: `Nhóm cần tối thiểu ${MIN_GROUP_MEMBERS} người để đặt đơn nhóm!` };
  }

  const enriched = computeGroupOrderStats(group);
  if ((enriched.totalQuantity || 0) === 0) {
    return { success: false, message: 'Nhóm chưa chọn món ăn nào!' };
  }

  group.status = 'locked';
  if (!(await saveGroupOrderMembers(group.code, group.members, 'locked'))) return { success: false, message: 'Không khóa được đơn nhóm' };
  return { success: true, group: computeGroupOrderStats(group) };
}

export async function unlockGroupOrder(
  code: string,
  requesterMemberId?: string,
  requesterUserId?: number | null
): Promise<{ success: boolean; message?: string; group?: GroupOrder }> {
  const group = await getGroupOrderByCode(code);
  if (!group) return { success: false, message: 'Không tìm thấy nhóm' };
  if (group.status === 'completed') return { success: false, message: 'Đơn nhóm đã hoàn tất thanh toán, không thể mở lại' };

  // Authorization check: Only host can unlock
  if (requesterMemberId || requesterUserId) {
    const isHost =
      (requesterMemberId && group.members.some(m => m.id === requesterMemberId && m.isHost)) ||
      (requesterUserId && group.hostUserId === requesterUserId);
    if (!isHost) {
      return { success: false, message: 'Chỉ trưởng nhóm mới có quyền mở khóa lại phòng' };
    }
  }

  group.status = 'active';
  if (!(await saveGroupOrderMembers(group.code, group.members, 'active'))) return { success: false, message: 'Không mở khóa được đơn nhóm' };
  return { success: true, group: computeGroupOrderStats(group) };
}

export async function completeGroupOrder(code: string, orderCode: string): Promise<boolean> {
  const group = await getGroupOrderByCode(code);
  if (!group) return false;
  group.status = 'completed';
  group.orderCode = orderCode;
  return await saveGroupOrderMembers(group.code, group.members, 'completed', orderCode);
}

// ==========================================
// VOUCHERS / COUPONS DATABASE APIS (Database Only)
// ==========================================

export async function getCoupons(options?: { activeOnly?: boolean; type?: string }): Promise<Coupon[]> {
  const pool = await getCloudPool();
  if (!pool) {
    throw new Error('Chưa thể kết nối tới cơ sở dữ liệu SQL Server. Vui lòng kiểm tra kết nối CSDL.');
  }

  let query = `
    SELECT id, code, name, description, discountType, 
           CAST(discountValue AS BIGINT) AS discountValue, 
           CAST(minOrderAmount AS BIGINT) AS minOrderAmount, 
           CAST(maxDiscountAmount AS BIGINT) AS maxDiscountAmount,
           requiresVietQR, forNewUserOnly, badge, minTier, 
           expiryDate, usageLimit, usedCount, categoryExclusive, 
           isOneTimeUse, isActive, couponType, createdAt
    FROM Coupons WITH (NOLOCK)
    WHERE 1=1
  `;
  const req = pool.request();
  if (options?.activeOnly) {
    query += ` AND (isActive = 1 OR isActive IS NULL)`;
  }
  if (options?.type) {
    req.input('type', sql.NVarChar(50), options.type);
    query += ` AND couponType = @type`;
  }
  query += ` ORDER BY id ASC`;
  const result = await req.query(query);
  if (result.recordset) {
    return result.recordset.map((r: any) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description || '',
      discountType: r.discountType === 'percentage' ? 'percentage' : 'fixed',
      discountValue: Number(r.discountValue) || 0,
      minOrderAmount: Number(r.minOrderAmount) || 0,
      maxDiscountAmount: r.maxDiscountAmount != null ? Number(r.maxDiscountAmount) : undefined,
      requiresVietQR: Boolean(r.requiresVietQR),
      forNewUserOnly: Boolean(r.forNewUserOnly),
      badge: r.badge || undefined,
      minTier: r.minTier || undefined,
      expiryDate: r.expiryDate || undefined,
      usageLimit: Number(r.usageLimit) || 100,
      usedCount: Number(r.usedCount) || 0,
      categoryExclusive: r.categoryExclusive || 'all',
      isOneTimeUse: Boolean(r.isOneTimeUse),
      isActive: r.isActive !== false && r.isActive !== 0,
      couponType: r.couponType || 'food_discount',
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
    }));
  }

  return [];
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const clean = (code || '').trim().toUpperCase();
  if (!clean) return null;

  const pool = await getCloudPool();
  if (!pool) {
    throw new Error('Chưa thể kết nối tới cơ sở dữ liệu SQL Server');
  }

  const req = pool.request();
  req.input('code', sql.NVarChar(50), clean);
  const res = await req.query(`
    SELECT TOP 1 id, code, name, description, discountType, 
           CAST(discountValue AS BIGINT) AS discountValue, 
           CAST(minOrderAmount AS BIGINT) AS minOrderAmount, 
           CAST(maxDiscountAmount AS BIGINT) AS maxDiscountAmount,
           requiresVietQR, forNewUserOnly, badge, minTier, 
           expiryDate, usageLimit, usedCount, categoryExclusive, 
           isOneTimeUse, isActive, couponType, createdAt
    FROM Coupons WITH (NOLOCK)
    WHERE UPPER(code) = UPPER(@code)
  `);
  if (res.recordset && res.recordset[0]) {
    const r = res.recordset[0];
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description || '',
      discountType: r.discountType === 'percentage' ? 'percentage' : 'fixed',
      discountValue: Number(r.discountValue) || 0,
      minOrderAmount: Number(r.minOrderAmount) || 0,
      maxDiscountAmount: r.maxDiscountAmount != null ? Number(r.maxDiscountAmount) : undefined,
      requiresVietQR: Boolean(r.requiresVietQR),
      forNewUserOnly: Boolean(r.forNewUserOnly),
      badge: r.badge || undefined,
      minTier: r.minTier || undefined,
      expiryDate: r.expiryDate || undefined,
      usageLimit: Number(r.usageLimit) || 100,
      usedCount: Number(r.usedCount) || 0,
      categoryExclusive: r.categoryExclusive || 'all',
      isOneTimeUse: Boolean(r.isOneTimeUse),
      isActive: r.isActive !== false && r.isActive !== 0,
      couponType: r.couponType || 'food_discount',
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
    };
  }

  return null;
}

export async function createCoupon(data: Coupon): Promise<Coupon> {
  const cleanCode = data.code.trim().toUpperCase();

  const pool = await getCloudPool();
  if (!pool) {
    throw new Error('Không thể kết nối cơ sở dữ liệu để tạo mã giảm giá');
  }

  const req = pool.request();
  req.input('code', sql.NVarChar(50), cleanCode);
  req.input('name', sql.NVarChar(255), data.name.trim());
  req.input('desc', sql.NVarChar(500), data.description ? data.description.trim() : null);
  req.input('discountType', sql.NVarChar(50), data.discountType || 'fixed');
  req.input('discountValue', sql.Decimal(18, 0), Number(data.discountValue) || 0);
  req.input('minOrderAmount', sql.Decimal(18, 0), Number(data.minOrderAmount) || 0);
  req.input('maxDiscountAmount', sql.Decimal(18, 0), data.maxDiscountAmount ? Number(data.maxDiscountAmount) : null);
  req.input('requiresVietQR', sql.Bit, data.requiresVietQR ? 1 : 0);
  req.input('forNewUserOnly', sql.Bit, data.forNewUserOnly ? 1 : 0);
  req.input('badge', sql.NVarChar(100), data.badge || null);
  req.input('minTier', sql.NVarChar(50), data.minTier || null);
  req.input('expiryDate', sql.NVarChar(50), data.expiryDate || null);
  req.input('usageLimit', sql.Int, Number(data.usageLimit) || 100);
  req.input('usedCount', sql.Int, Number(data.usedCount) || 0);
  req.input('categoryExclusive', sql.NVarChar(50), data.categoryExclusive || 'all');
  req.input('isOneTimeUse', sql.Bit, data.isOneTimeUse ? 1 : 0);
  req.input('isActive', sql.Bit, data.isActive !== false ? 1 : 0);
  req.input('couponType', sql.NVarChar(50), data.couponType || 'food_discount');

  const res = await req.query(`
    IF EXISTS (SELECT 1 FROM Coupons WHERE UPPER(code) = UPPER(@code))
    BEGIN
      UPDATE Coupons SET
        name = @name,
        description = @desc,
        discountType = @discountType,
        discountValue = @discountValue,
        minOrderAmount = @minOrderAmount,
        maxDiscountAmount = @maxDiscountAmount,
        requiresVietQR = @requiresVietQR,
        forNewUserOnly = @forNewUserOnly,
        badge = @badge,
        minTier = @minTier,
        expiryDate = @expiryDate,
        usageLimit = @usageLimit,
        categoryExclusive = @categoryExclusive,
        isOneTimeUse = @isOneTimeUse,
        isActive = @isActive,
        couponType = @couponType,
        updatedAt = GETDATE()
      OUTPUT INSERTED.id, INSERTED.code, INSERTED.name, INSERTED.description, INSERTED.discountType,
             CAST(INSERTED.discountValue AS BIGINT) AS discountValue,
             CAST(INSERTED.minOrderAmount AS BIGINT) AS minOrderAmount,
             CAST(INSERTED.maxDiscountAmount AS BIGINT) AS maxDiscountAmount,
             INSERTED.requiresVietQR, INSERTED.forNewUserOnly, INSERTED.badge, INSERTED.minTier,
             INSERTED.expiryDate, INSERTED.usageLimit, INSERTED.usedCount, INSERTED.categoryExclusive,
             INSERTED.isOneTimeUse, INSERTED.isActive, INSERTED.couponType, INSERTED.createdAt
      WHERE UPPER(code) = UPPER(@code)
    END
    ELSE
    BEGIN
      INSERT INTO Coupons (code, name, description, discountType, discountValue, minOrderAmount, maxDiscountAmount, requiresVietQR, forNewUserOnly, badge, minTier, expiryDate, usageLimit, usedCount, categoryExclusive, isOneTimeUse, isActive, couponType)
      OUTPUT INSERTED.id, INSERTED.code, INSERTED.name, INSERTED.description, INSERTED.discountType,
             CAST(INSERTED.discountValue AS BIGINT) AS discountValue,
             CAST(INSERTED.minOrderAmount AS BIGINT) AS minOrderAmount,
             CAST(INSERTED.maxDiscountAmount AS BIGINT) AS maxDiscountAmount,
             INSERTED.requiresVietQR, INSERTED.forNewUserOnly, INSERTED.badge, INSERTED.minTier,
             INSERTED.expiryDate, INSERTED.usageLimit, INSERTED.usedCount, INSERTED.categoryExclusive,
             INSERTED.isOneTimeUse, INSERTED.isActive, INSERTED.couponType, INSERTED.createdAt
      VALUES (@code, @name, @desc, @discountType, @discountValue, @minOrderAmount, @maxDiscountAmount, @requiresVietQR, @forNewUserOnly, @badge, @minTier, @expiryDate, @usageLimit, @usedCount, @categoryExclusive, @isOneTimeUse, @isActive, @couponType)
    END
  `);

  if (res.recordset && res.recordset[0]) {
    const r = res.recordset[0];
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description || '',
      discountType: r.discountType === 'percentage' ? 'percentage' : 'fixed',
      discountValue: Number(r.discountValue) || 0,
      minOrderAmount: Number(r.minOrderAmount) || 0,
      maxDiscountAmount: r.maxDiscountAmount != null ? Number(r.maxDiscountAmount) : undefined,
      requiresVietQR: Boolean(r.requiresVietQR),
      forNewUserOnly: Boolean(r.forNewUserOnly),
      badge: r.badge || undefined,
      minTier: r.minTier || undefined,
      expiryDate: r.expiryDate || undefined,
      usageLimit: Number(r.usageLimit) || 100,
      usedCount: Number(r.usedCount) || 0,
      categoryExclusive: r.categoryExclusive || 'all',
      isOneTimeUse: Boolean(r.isOneTimeUse),
      isActive: r.isActive !== false && r.isActive !== 0,
      couponType: r.couponType || 'food_discount',
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
    };
  }

  throw new Error('Không thể lưu mã giảm giá vào cơ sở dữ liệu');
}

export async function deleteCoupon(code: string): Promise<boolean> {
  const clean = code.trim().toUpperCase();
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('code', sql.NVarChar(50), clean);
      await req.query(`DELETE FROM Coupons WHERE UPPER(code) = UPPER(@code)`);
      return true;
    }
  } catch (err) {
    console.error('Error deleting coupon from database:', err);
  }
  return false;
}

export async function incrementCouponUsage(code: string): Promise<boolean> {
  const clean = code.trim().toUpperCase();
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('code', sql.NVarChar(50), clean);
      await req.query(`
        UPDATE Coupons 
        SET usedCount = ISNULL(usedCount, 0) + 1, updatedAt = GETDATE() 
        WHERE UPPER(code) = UPPER(@code)
      `);
      return true;
    }
  } catch (err) {
    console.error('Error incrementing coupon usage in database:', err);
  }
  return false;
}

