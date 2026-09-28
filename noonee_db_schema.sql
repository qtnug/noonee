-- ================================================================
-- NOONEE FOOD DATABASE DDL EXPORT
-- Database: db68391
-- Host: db68391.public.databaseasp.net
-- Exported at: 2026-09-28T03:39:00.576Z
-- ================================================================

-- ------------------------------------------------------------
-- Table: [Categories] (Current rows: 5)
-- ------------------------------------------------------------
IF OBJECT_ID('dbo.[Categories]', 'U') IS NOT NULL
    DROP TABLE dbo.[Categories];
GO

CREATE TABLE dbo.[Categories] (
    [id] INT IDENTITY(1,1) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    [slug] NVARCHAR(100) NOT NULL,
    [description] NVARCHAR(255) NULL,
    [icon] NVARCHAR(50) NOT NULL DEFAULT ('Utensils'),
    [createdAt] DATETIME NOT NULL DEFAULT (getdate()),
    CONSTRAINT [PK_Categories] PRIMARY KEY CLUSTERED ([id])
);
GO

CREATE UNIQUE NONCLUSTERED INDEX [UQ__Categori__32DD1E4C52CE5DE9] ON dbo.[Categories] ([slug]);
GO

-- ------------------------------------------------------------
-- Table: [GroupOrders] (Current rows: 9)
-- ------------------------------------------------------------
IF OBJECT_ID('dbo.[GroupOrders]', 'U') IS NOT NULL
    DROP TABLE dbo.[GroupOrders];
GO

CREATE TABLE dbo.[GroupOrders] (
    [id] INT IDENTITY(1,1) NOT NULL,
    [code] NVARCHAR(50) NOT NULL,
    [hostName] NVARCHAR(150) NOT NULL,
    [hostUserId] INT NULL,
    [status] NVARCHAR(50) NULL DEFAULT ('active'),
    [orderCode] NVARCHAR(50) NULL,
    [membersData] NVARCHAR(MAX) NULL,
    [createdAt] DATETIME NULL DEFAULT (getdate()),
    [updatedAt] DATETIME NULL DEFAULT (getdate()),
    CONSTRAINT [PK_GroupOrders] PRIMARY KEY CLUSTERED ([id])
);
GO

CREATE UNIQUE NONCLUSTERED INDEX [UQ__GroupOrd__357D4CF9D42EBC0B] ON dbo.[GroupOrders] ([code]);
GO

-- ------------------------------------------------------------
-- Table: [OrderItems] (Current rows: 2)
-- ------------------------------------------------------------
IF OBJECT_ID('dbo.[OrderItems]', 'U') IS NOT NULL
    DROP TABLE dbo.[OrderItems];
GO

CREATE TABLE dbo.[OrderItems] (
    [id] INT IDENTITY(1,1) NOT NULL,
    [orderId] INT NOT NULL,
    [productId] INT NULL,
    [productName] NVARCHAR(150) NOT NULL,
    [price] DECIMAL(18, 0) NOT NULL,
    [quantity] INT NOT NULL,
    [total] DECIMAL(18, 0) NOT NULL,
    [note] NVARCHAR(500) NULL,
    [toppings] NVARCHAR(1000) NULL,
    CONSTRAINT [PK_OrderItems] PRIMARY KEY CLUSTERED ([id])
);
GO

-- ------------------------------------------------------------
-- Table: [Orders] (Current rows: 1)
-- ------------------------------------------------------------
IF OBJECT_ID('dbo.[Orders]', 'U') IS NOT NULL
    DROP TABLE dbo.[Orders];
GO

CREATE TABLE dbo.[Orders] (
    [id] INT IDENTITY(1,1) NOT NULL,
    [orderCode] NVARCHAR(50) NOT NULL,
    [userId] INT NULL,
    [customerName] NVARCHAR(100) NOT NULL,
    [customerPhone] NVARCHAR(20) NOT NULL,
    [deliveryAddress] NVARCHAR(255) NOT NULL,
    [notes] NVARCHAR(500) NULL,
    [totalAmount] DECIMAL(18, 0) NOT NULL,
    [status] NVARCHAR(50) NOT NULL DEFAULT ('Pending'),
    [paymentMethod] NVARCHAR(50) NOT NULL DEFAULT ('Sepay'),
    [paymentStatus] NVARCHAR(50) NOT NULL DEFAULT ('Unpaid'),
    [createdAt] DATETIME NOT NULL DEFAULT (getdate()),
    [updatedAt] DATETIME NOT NULL DEFAULT (getdate()),
    [discountAmount] DECIMAL(18, 2) NULL DEFAULT ((0)),
    [couponCode] NVARCHAR(50) NULL,
    [cancelReason] NVARCHAR(500) NULL,
    [walletAmountUsed] DECIMAL(18, 0) NULL DEFAULT ((0)),
    [refundStatus] NVARCHAR(50) NULL DEFAULT ('None'),
    [groupCode] NVARCHAR(50) NULL,
    [shippingFee] DECIMAL(18, 0) NULL DEFAULT ((0)),
    CONSTRAINT [PK_Orders] PRIMARY KEY CLUSTERED ([id])
);
GO

CREATE UNIQUE NONCLUSTERED INDEX [UQ__Orders__23699D68C6992A5A] ON dbo.[Orders] ([orderCode]);
GO

-- ------------------------------------------------------------
-- Table: [Payments] (Current rows: 0)
-- ------------------------------------------------------------
IF OBJECT_ID('dbo.[Payments]', 'U') IS NOT NULL
    DROP TABLE dbo.[Payments];
GO

CREATE TABLE dbo.[Payments] (
    [id] INT IDENTITY(1,1) NOT NULL,
    [orderId] INT NOT NULL,
    [transactionId] NVARCHAR(100) NULL,
    [referenceCode] NVARCHAR(100) NOT NULL,
    [amount] DECIMAL(18, 0) NOT NULL,
    [bankAccount] NVARCHAR(50) NULL,
    [bankCode] NVARCHAR(50) NULL,
    [status] NVARCHAR(50) NOT NULL DEFAULT ('Pending'),
    [paidAt] DATETIME NULL,
    [createdAt] DATETIME NOT NULL DEFAULT (getdate()),
    CONSTRAINT [PK_Payments] PRIMARY KEY CLUSTERED ([id])
);
GO

-- ------------------------------------------------------------
-- Table: [Products] (Current rows: 73)
-- ------------------------------------------------------------
IF OBJECT_ID('dbo.[Products]', 'U') IS NOT NULL
    DROP TABLE dbo.[Products];
GO

CREATE TABLE dbo.[Products] (
    [id] INT IDENTITY(1,1) NOT NULL,
    [categoryId] INT NOT NULL,
    [name] NVARCHAR(150) NOT NULL,
    [slug] NVARCHAR(150) NOT NULL,
    [description] NVARCHAR(MAX) NULL,
    [price] DECIMAL(18, 0) NOT NULL,
    [image] NVARCHAR(500) NOT NULL,
    [isAvailable] BIT NOT NULL DEFAULT ((1)),
    [isFeatured] BIT NOT NULL DEFAULT ((0)),
    [rating] DECIMAL(3, 1) NOT NULL DEFAULT ((5.0)),
    [createdAt] DATETIME NOT NULL DEFAULT (getdate()),
    [toppings] NVARCHAR(MAX) NULL,
    [prepTime] INT NULL DEFAULT ((15)),
    CONSTRAINT [PK_Products] PRIMARY KEY CLUSTERED ([id])
);
GO

CREATE UNIQUE NONCLUSTERED INDEX [UQ__Products__32DD1E4C47E44413] ON dbo.[Products] ([slug]);
GO

-- ------------------------------------------------------------
-- Table: [Reviews] (Current rows: 0)
-- ------------------------------------------------------------
IF OBJECT_ID('dbo.[Reviews]', 'U') IS NOT NULL
    DROP TABLE dbo.[Reviews];
GO

CREATE TABLE dbo.[Reviews] (
    [id] INT IDENTITY(1,1) NOT NULL,
    [productId] INT NOT NULL,
    [userId] INT NULL,
    [customerName] NVARCHAR(100) NOT NULL,
    [rating] INT NOT NULL,
    [comment] NVARCHAR(MAX) NOT NULL,
    [orderCode] NVARCHAR(50) NULL,
    [createdAt] DATETIME NOT NULL DEFAULT (getdate()),
    CONSTRAINT [PK_Reviews] PRIMARY KEY CLUSTERED ([id])
);
GO

-- ------------------------------------------------------------
-- Table: [SupportMessages] (Current rows: 8)
-- ------------------------------------------------------------
IF OBJECT_ID('dbo.[SupportMessages]', 'U') IS NOT NULL
    DROP TABLE dbo.[SupportMessages];
GO

CREATE TABLE dbo.[SupportMessages] (
    [id] INT IDENTITY(1,1) NOT NULL,
    [orderCode] NVARCHAR(50) NULL,
    [userId] INT NULL,
    [senderRole] NVARCHAR(20) NOT NULL,
    [senderName] NVARCHAR(100) NOT NULL,
    [message] NVARCHAR(MAX) NOT NULL,
    [isComplaint] BIT NOT NULL DEFAULT ((0)),
    [status] NVARCHAR(30) NOT NULL DEFAULT ('open'),
    [createdAt] DATETIME NOT NULL DEFAULT (getdate()),
    CONSTRAINT [PK_SupportMessages] PRIMARY KEY CLUSTERED ([id])
);
GO

-- ------------------------------------------------------------
-- Table: [Users] (Current rows: 8)
-- ------------------------------------------------------------
IF OBJECT_ID('dbo.[Users]', 'U') IS NOT NULL
    DROP TABLE dbo.[Users];
GO

CREATE TABLE dbo.[Users] (
    [id] INT IDENTITY(1,1) NOT NULL,
    [username] NVARCHAR(50) NOT NULL,
    [password] NVARCHAR(255) NOT NULL,
    [fullName] NVARCHAR(100) NOT NULL,
    [email] NVARCHAR(100) NULL,
    [phone] NVARCHAR(20) NULL,
    [address] NVARCHAR(255) NULL,
    [role] NVARCHAR(20) NOT NULL DEFAULT ('customer'),
    [createdAt] DATETIME NOT NULL DEFAULT (getdate()),
    [walletBalance] DECIMAL(18, 0) NULL DEFAULT ((0)),
    CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED ([id])
);
GO

CREATE UNIQUE NONCLUSTERED INDEX [UQ__Users__F3DBC572242F82B4] ON dbo.[Users] ([username]);
GO

-- ================================================================
-- FOREIGN KEY CONSTRAINTS
-- ================================================================
ALTER TABLE dbo.[OrderItems] WITH CHECK ADD CONSTRAINT [FK__OrderItem__order__6477ECF3] FOREIGN KEY([orderId])
REFERENCES dbo.[Orders] ([id]) ON DELETE CASCADE;
GO

ALTER TABLE dbo.[OrderItems] WITH CHECK ADD CONSTRAINT [FK__OrderItem__produ__656C112C] FOREIGN KEY([productId])
REFERENCES dbo.[Products] ([id]) ON DELETE SET NULL;
GO

ALTER TABLE dbo.[Orders] WITH CHECK ADD CONSTRAINT [FK__Orders__userId__5CD6CB2B] FOREIGN KEY([userId])
REFERENCES dbo.[Users] ([id]) ON DELETE SET NULL;
GO

ALTER TABLE dbo.[Payments] WITH CHECK ADD CONSTRAINT [FK__Payments__orderI__68487DD7] FOREIGN KEY([orderId])
REFERENCES dbo.[Orders] ([id]) ON DELETE CASCADE;
GO

ALTER TABLE dbo.[Products] WITH CHECK ADD CONSTRAINT [FK__Products__catego__5535A963] FOREIGN KEY([categoryId])
REFERENCES dbo.[Categories] ([id]) ON DELETE CASCADE;
GO

ALTER TABLE dbo.[Reviews] WITH CHECK ADD CONSTRAINT [FK__Reviews__product__6D0D32F4] FOREIGN KEY([productId])
REFERENCES dbo.[Products] ([id]) ON DELETE CASCADE;
GO

ALTER TABLE dbo.[Reviews] WITH CHECK ADD CONSTRAINT [FK__Reviews__userId__6E01572D] FOREIGN KEY([userId])
REFERENCES dbo.[Users] ([id]) ON DELETE SET NULL;
GO

ALTER TABLE dbo.[SupportMessages] WITH CHECK ADD CONSTRAINT [FK__SupportMe__userI__72C60C4A] FOREIGN KEY([userId])
REFERENCES dbo.[Users] ([id]) ON DELETE SET NULL;
GO

