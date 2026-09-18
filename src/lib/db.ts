import sql from 'mssql';
import bcrypt from 'bcryptjs';
import { Category, Product, Order, OrderItem, User, Review, SupportMessage, GroupOrder, GroupMember, GroupMemberItem } from '@/types';
import { generateGroupCode, computeGroupOrderStats, MIN_GROUP_MEMBERS, MAX_GROUP_MEMBERS } from '@/lib/groupOrder';

function parseToppingsField(raw: any): any[] {
  if (!raw) return [];
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch { return []; }
}

// Cloud Database Configuration from environment (.env.local)
const dbConfig = {
  user: process.env.SQLSERVER_USER,
  password: process.env.SQLSERVER_PASSWORD,
  server: process.env.SQLSERVER_HOST,
  port: parseInt(process.env.SQLSERVER_PORT || '1433'),
  database: process.env.SQLSERVER_DATABASE,
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
if (!dbConfig.user || !dbConfig.password || !dbConfig.server) {
  console.warn('⚠️ Database credentials not configured. Set SQLSERVER_USER, SQLSERVER_PASSWORD, SQLSERVER_HOST in .env.local');
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

      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'cancelReason')
        ALTER TABLE Orders ADD cancelReason NVARCHAR(500) NULL;

      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'walletAmountUsed')
        ALTER TABLE Orders ADD walletAmountUsed DECIMAL(18, 0) DEFAULT 0;

      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'refundStatus')
        ALTER TABLE Orders ADD refundStatus NVARCHAR(50) DEFAULT 'None';

      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'groupCode')
        ALTER TABLE Orders ADD groupCode NVARCHAR(50) NULL;

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
    `);
    } catch (err: any) {
      console.warn('Schema check note:', err.message);
    }
  })();
  return schemaPromise;
}

async function getCloudPool(): Promise<any> {
  // If credentials are not configured, directly return null without attempting connect
  if (!dbConfig.user || !dbConfig.password || !dbConfig.server) {
    return null;
  }

  if (global._sqlPool && global._sqlPool.connected) {
    return global._sqlPool;
  }

  if (!poolPromise) {
    try {
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
    } catch (err: any) {
      console.warn('⚠️ Cloud SQL Server sync connect error:', err.message);
      poolPromise = null;
      return null;
    }
  }

  return poolPromise;
}

// In-memory fallback cache
let inMemoryCategories: Category[] = [
  { id: 1, name: 'Cơm & Món chính', slug: 'com-mon-chinh', description: 'Các món cơm rang, bún, phở, mì thơm ngon nóng hổi, chuẩn vị truyền thống', icon: 'Utensils' },
  { id: 2, name: 'Đồ ăn vặt', slug: 'do-an-vat', description: 'Các món ăn vặt đường phố hấp dẫn, nóng giòn rụm thơm ngon', icon: 'Sandwich' },
  { id: 3, name: 'Đồ uống', slug: 'do-uong', description: 'Trà sữa, cà phê, sinh tố, nước ép và các món chè thanh mát', icon: 'Coffee' }
];

let inMemoryProducts: Product[] = [
  {
    id: 1,
    categoryId: 1,
    categoryName: 'Cơm & Món chính',
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
    categoryName: 'Cơm & Món chính',
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
    categoryId: 1,
    categoryName: 'Cơm & Món chính',
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
const CACHE_TTL_MS = 45000; // 45 seconds TTL

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
      const result = await pool.request().query('SELECT id, name, slug, description, icon, createdAt FROM Categories ORDER BY id ASC');
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
               CAST(p.rating AS FLOAT) AS rating, ISNULL(p.prepTime, 15) AS prepTime, p.toppings, p.createdAt 
        FROM Products p 
        LEFT JOIN Categories c ON p.categoryId = c.id
        ORDER BY p.isFeatured DESC, p.id ASC
      `;
      const result = await pool.request().query(query);
      if (result.recordset && result.recordset.length > 0) {
        const mapped = result.recordset.map((r: any) => ({
          ...r,
          prepTime: r.prepTime || 15,
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

export async function getProducts(options?: { categoryId?: number; search?: string; isFeatured?: boolean; page?: number; limit?: number }): Promise<Product[]> {
  const allProducts = await getAllProductsCached();
  let result = [...allProducts];

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

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const pool = await getCloudPool();
    if (pool) {
      const req = pool.request();
      req.input('slug', sql.NVarChar(150), slug);
      const res = await req.query(`
        SELECT p.id, p.categoryId, c.name AS categoryName, p.name, p.slug, p.description, 
               CAST(p.price AS INT) AS price, p.image, p.isAvailable, p.isFeatured, 
               CAST(p.rating AS FLOAT) AS rating, ISNULL(p.prepTime, 15) AS prepTime, p.toppings, p.createdAt 
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

      const res = await req.query(`
        INSERT INTO Products (categoryId, name, slug, description, price, image, isAvailable, isFeatured, rating, toppings, prepTime)
        OUTPUT INSERTED.id, INSERTED.categoryId, INSERTED.name, INSERTED.slug, INSERTED.description, 
               CAST(INSERTED.price AS INT) AS price, INSERTED.image, INSERTED.isAvailable, INSERTED.isFeatured, 
               CAST(INSERTED.rating AS FLOAT) AS rating, ISNULL(INSERTED.prepTime, 15) AS prepTime, INSERTED.toppings, INSERTED.createdAt
        VALUES (@catId, @name, @slug, @desc, @price, @img, @avail, @feat, @rat, @toppings, @prepTime)
      `);
      if (res.recordset && res.recordset[0]) {
        return {
          ...res.recordset[0],
          prepTime: res.recordset[0].prepTime || 15,
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
  discountAmount?: number;
  couponCode?: string | null;
  groupCode?: string | null;
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
    groupCode: data.groupCode || null,
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
        req.input('discount', sql.Decimal(18, 2), data.discountAmount || 0);
        req.input('coupon', sql.NVarChar(50), data.couponCode || null);
        req.input('groupCode', sql.NVarChar(50), data.groupCode || null);
        req.input('method', sql.NVarChar(50), data.paymentMethod || 'Sepay');
        req.input('payStatus', sql.NVarChar(50), data.paymentStatus || 'Unpaid');
        req.input('walletAmount', sql.Decimal(18, 0), data.walletAmountUsed || 0);

        const orderRes = await req.query(`
          INSERT INTO Orders (orderCode, userId, customerName, customerPhone, deliveryAddress, notes, totalAmount, discountAmount, couponCode, groupCode, status, paymentMethod, paymentStatus, walletAmountUsed)
          OUTPUT INSERTED.id
          VALUES (@code, @userId, @name, @phone, @address, @notes, @amount, @discount, @coupon, @groupCode, 'Pending', @method, @payStatus, @walletAmount)
        `);

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
      }
    }
  } catch (err) {
    console.error('Error inserting order in cloud:', err);
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
               o.groupCode,
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


  return inMemoryOrders.find(o => o.orderCode === cleanCode) || null;
}

export async function getOrders(filter?: { status?: string; search?: string; userId?: number; page?: number; limit?: number }): Promise<Order[]> {
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
               o.groupCode,
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
    }
  } catch (err) {
    console.error('Error fetching orders from cloud:', err);
  }

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



  return {
    success: true,
    message: 'Hủy đơn hàng thành công',
    refundedAmount: refundAmount,
  };
}

export async function getAdminStats() {
  try {
    const pool = await getCloudPool();
    if (pool) {
      const res = await pool.request().query(`
        SELECT 
          CAST(ISNULL(SUM(CASE WHEN paymentStatus = 'Paid' THEN totalAmount ELSE 0 END), 0) AS INT) AS totalRevenue,
          COUNT(*) AS totalOrders,
          COUNT(CASE WHEN status = 'Pending' THEN 1 END) AS pendingOrders,
          COUNT(CASE WHEN status = 'Delivering' THEN 1 END) AS deliveringOrders
        FROM Orders
      `);
      const prodRes = await pool.request().query('SELECT COUNT(*) AS cnt FROM Products');
      const recentRes = await pool.request().query(`
        SELECT TOP 10 id, orderCode, customerName, customerPhone, CAST(totalAmount AS INT) AS totalAmount, 
               paymentMethod, paymentStatus, status, createdAt
        FROM Orders ORDER BY id DESC
      `);
      return {
        ...res.recordset[0],
        totalProducts: prodRes.recordset[0].cnt,
        recentOrders: recentRes.recordset || []
      };
    }
  } catch (e) { console.error('Admin stats error:', e); }
  
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

  return {
    connected: false,
    engine: 'In-Memory Fallback',
    database: 'FoodOrderingDB (Hybrid)',
    categoryCount: inMemoryCategories.length,
    productCount: inMemoryProducts.length,
    orderCount: inMemoryOrders.length,
    details: 'Mất kết nối CSDL, đang hoạt động qua lớp đệm dự phòng hybrid.'
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
        SELECT id, username, fullName, email, phone, address, role, CAST(ISNULL(walletBalance, 0) AS INT) AS walletBalance, createdAt
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
  const u = inMemoryUsers.find((u) => u.username === username);
  if (u) { const { password, ...safeU } = u as any; return safeU as any; }
  return null;
}

export async function getUserByUsernameWithPassword(username: string): Promise<User | null> {
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
      const hashedPassword = await bcrypt.hash(data.password, 12);
      req.input('password', sql.NVarChar(255), hashedPassword);
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
        SELECT id, username, fullName, email, phone, address, role, CAST(ISNULL(walletBalance, 0) AS INT) AS walletBalance, createdAt
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
  const u = inMemoryUsers.find((u) => u.id === userId);
  if (u) { const { password, ...safeU } = u as any; return safeU as any; }
  return null;
}

export async function getUserByIdWithPassword(userId: number): Promise<User | null> {
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
      if (res.recordset && res.recordset.length > 0) {
        return res.recordset;
      }
    }
  } catch (err) {
    console.error('Error fetching support messages from cloud:', err);
  }

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
  }

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
  inMemoryGroupOrders.unshift(enriched);

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
    }
  } catch (err) {
    console.error('Error creating group order in cloud:', err);
  }

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
    }
  } catch (err) {
    console.error('Error fetching group order from cloud:', err);
  }

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

  const inMem = inMemoryGroupOrders.find(g => g.code === cleanCode);
  if (inMem) {
    inMem.members = members;
    if (status) inMem.status = status;
    if (orderCode) inMem.orderCode = orderCode;
    inMem.updatedAt = new Date().toISOString();
  }

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
      await req.query(sqlQuery);
      return true;
    }
  } catch (err) {
    console.error('Error saving group order members in cloud:', err);
  }
  return true;
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
    m => (memberId && m.id === memberId) || (userId && m.userId === userId) || m.name.toLowerCase() === name.toLowerCase()
  );

  if (existingMember) {
    existingMember.name = name;
    if (userId && !existingMember.userId) existingMember.userId = userId;
    await saveGroupOrderMembers(group.code, group.members);
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
  await saveGroupOrderMembers(group.code, group.members);
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

  await saveGroupOrderMembers(group.code, group.members);
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
  await saveGroupOrderMembers(group.code, group.members);
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
  await saveGroupOrderMembers(group.code, group.members, 'locked');
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
  await saveGroupOrderMembers(group.code, group.members, 'active');
  return { success: true, group: computeGroupOrderStats(group) };
}

export async function completeGroupOrder(code: string, orderCode: string): Promise<boolean> {
  const group = await getGroupOrderByCode(code);
  if (!group) return false;
  group.status = 'completed';
  group.orderCode = orderCode;
  await saveGroupOrderMembers(group.code, group.members, 'completed', orderCode);
  return true;
}

