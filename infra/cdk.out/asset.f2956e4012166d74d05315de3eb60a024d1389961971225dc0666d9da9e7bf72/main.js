/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.handler = void 0;
const tslib_1 = __webpack_require__(1);
tslib_1.__exportStar(__webpack_require__(2), exports);
var index_1 = __webpack_require__(2);
Object.defineProperty(exports, "handler", ({ enumerable: true, get: function () { return index_1.handler; } }));


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("tslib");

/***/ }),
/* 2 */
/***/ ((module, exports, __webpack_require__) => {

/* module decorator */ module = __webpack_require__.nmd(module);

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.handler = exports.app = void 0;
const hono_1 = __webpack_require__(3);
const cors_1 = __webpack_require__(4);
const aws_lambda_1 = __webpack_require__(5);
const auth_routes_1 = __webpack_require__(6);
const categories_routes_1 = __webpack_require__(15);
const products_routes_1 = __webpack_require__(16);
const cart_routes_1 = __webpack_require__(17);
const orders_routes_1 = __webpack_require__(18);
const payments_routes_1 = __webpack_require__(19);
const reports_routes_1 = __webpack_require__(20);
const uploads_routes_1 = __webpack_require__(21);
const users_routes_1 = __webpack_require__(24);
exports.app = new hono_1.Hono();
// ── Global CORS Middleware ────────────────────────────
exports.app.use('*', (0, cors_1.cors)({
    origin: (origin) => {
        // Allow local development and deployed frontend origins
        if (!origin ||
            origin.includes('localhost') ||
            origin.includes('127.0.0.1') ||
            origin.includes('cloudfront.net') ||
            origin.includes('amazonaws.com')) {
            return origin || '*';
        }
        return origin;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders: ['Content-Length', 'X-Total-Count'],
    credentials: true,
}));
// ── Health Check ──────────────────────────────────────
exports.app.get('/api/health', (c) => {
    return c.json({
        status: 'ok',
        service: 'Bakery AWS Lambda Backend',
        database: 'Amazon DynamoDB',
        timestamp: new Date().toISOString(),
    });
});
// ── Mount Sub-Routers ─────────────────────────────────
exports.app.route('/api/auth', auth_routes_1.authRoutes);
exports.app.route('/api/categories', categories_routes_1.categoriesRoutes);
exports.app.route('/api/products', products_routes_1.productsRoutes);
exports.app.route('/api/cart', cart_routes_1.cartRoutes);
exports.app.route('/api/orders', orders_routes_1.ordersRoutes);
exports.app.route('/api/payments', payments_routes_1.paymentsRoutes);
exports.app.route('/api/reports', reports_routes_1.reportsRoutes);
exports.app.route('/api/uploads', uploads_routes_1.uploadsRoutes);
exports.app.route('/api/users', users_routes_1.usersRoutes);
// ── Fallback 404 Route ────────────────────────────────
exports.app.notFound((c) => {
    return c.json({ message: `Route not found: ${c.req.method} ${c.req.path}` }, 404);
});
// ── Global Error Handler ──────────────────────────────
exports.app.onError((err, c) => {
    console.error('Unhandled Lambda Error:', err);
    return c.json({
        message: err.message || 'Internal Server Error',
        error: process.env['NODE_ENV'] === 'development' ? err.stack : undefined,
    }, 500);
});
// ── AWS Lambda Handler Export ─────────────────────────
exports.handler = (0, aws_lambda_1.handle)(exports.app);
// ── Local Development Server ──────────────────────────
if (process.env['NODE_ENV'] !== 'production' && __webpack_require__.c[__webpack_require__.s] === module) {
    try {
        const { serve } = __webpack_require__(25);
        const port = Number(process.env['PORT']) || 3000;
        console.log(`🚀 Local Bakery Lambda API running on http://localhost:${port}/api`);
        serve({
            fetch: exports.app.fetch,
            port,
        });
    }
    catch (e) {
        // @hono/node-server not required on AWS Lambda
    }
}


/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("hono");

/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("hono/cors");

/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("@hono/aws-lambda");

/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.authRoutes = void 0;
const tslib_1 = __webpack_require__(1);
const hono_1 = __webpack_require__(3);
const bcrypt = tslib_1.__importStar(__webpack_require__(7));
const jwt = tslib_1.__importStar(__webpack_require__(8));
const uuid_1 = __webpack_require__(9);
const dynamodb_1 = __webpack_require__(10);
const config_1 = __webpack_require__(13);
const auth_middleware_1 = __webpack_require__(14);
exports.authRoutes = new hono_1.Hono();
function generateToken(user) {
    return jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
    }, config_1.config.jwtSecret, { expiresIn: config_1.config.jwtExpiresIn });
}
// ── Customer Registration ──────────────────────────────
exports.authRoutes.post('/register', async (c) => {
    const body = await c.req.json();
    const { email, password, name, phone } = body;
    if (!email || !password || !name) {
        return c.json({ message: 'Name, email, and password are required' }, 400);
    }
    const normalizedEmail = email.toLowerCase().trim();
    // Check if email already registered
    const existingUsers = await (0, dynamodb_1.queryGSI)(`USER_EMAIL#${normalizedEmail}`);
    if (existingUsers.length > 0) {
        return c.json({ message: 'Email is already registered' }, 409);
    }
    const id = (0, uuid_1.v4)();
    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const newUser = {
        PK: `USER#${id}`,
        SK: 'METADATA',
        GSI1PK: `USER_EMAIL#${normalizedEmail}`,
        GSI1SK: `USER#${id}`,
        id,
        email: normalizedEmail,
        name,
        firstName,
        lastName,
        passwordHash,
        phone: phone || '',
        role: 'CUSTOMER',
        createdAt,
    };
    await (0, dynamodb_1.putItem)(newUser);
    const tokenUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        phone: newUser.phone,
    };
    const accessToken = generateToken(tokenUser);
    return c.json({ accessToken, user: tokenUser }, 201);
});
// ── Customer Login ────────────────────────────────────
exports.authRoutes.post('/login', async (c) => {
    const body = await c.req.json();
    const { email, password } = body;
    if (!email || !password) {
        return c.json({ message: 'Email and password are required' }, 400);
    }
    const normalizedEmail = email.toLowerCase().trim();
    const users = await (0, dynamodb_1.queryGSI)(`USER_EMAIL#${normalizedEmail}`);
    if (users.length === 0) {
        return c.json({ message: 'Invalid email or password' }, 401);
    }
    const user = users[0];
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
        return c.json({ message: 'Invalid email or password' }, 401);
    }
    const tokenUser = {
        id: user.id,
        email: user.email,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
    };
    const accessToken = generateToken(tokenUser);
    return c.json({ accessToken, user: tokenUser });
});
// ── Admin Login ───────────────────────────────────────
exports.authRoutes.post('/admin/login', async (c) => {
    const body = await c.req.json();
    const { email, password } = body;
    if (!email || !password) {
        return c.json({ message: 'Email and password are required' }, 400);
    }
    const normalizedEmail = email.toLowerCase().trim();
    const users = await (0, dynamodb_1.queryGSI)(`USER_EMAIL#${normalizedEmail}`);
    if (users.length === 0) {
        return c.json({ message: 'Invalid admin credentials' }, 401);
    }
    const user = users[0];
    if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
        return c.json({ message: 'Access denied: Admin role required' }, 403);
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
        return c.json({ message: 'Invalid admin credentials' }, 401);
    }
    const tokenUser = {
        id: user.id,
        email: user.email,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        firstName: user.firstName || 'Admin',
        lastName: user.lastName || '',
        role: user.role,
        phone: user.phone,
    };
    const accessToken = generateToken(tokenUser);
    return c.json({ accessToken, user: tokenUser });
});
// ── Get Current User ──────────────────────────────────
exports.authRoutes.get('/me', auth_middleware_1.authMiddleware, async (c) => {
    const tokenUser = c.get('user');
    const user = await (0, dynamodb_1.getItem)(`USER#${tokenUser.id}`, 'METADATA');
    if (!user) {
        return c.json({ message: 'User not found' }, 404);
    }
    return c.json({
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
    });
});


/***/ }),
/* 7 */
/***/ ((module) => {

module.exports = require("bcryptjs");

/***/ }),
/* 8 */
/***/ ((module) => {

module.exports = require("jsonwebtoken");

/***/ }),
/* 9 */
/***/ ((module) => {

module.exports = require("uuid");

/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TABLE_NAME = exports.docClient = void 0;
exports.getItem = getItem;
exports.putItem = putItem;
exports.deleteItem = deleteItem;
exports.queryByPK = queryByPK;
exports.queryGSI = queryGSI;
exports.scanItems = scanItems;
const client_dynamodb_1 = __webpack_require__(11);
const lib_dynamodb_1 = __webpack_require__(12);
const config_1 = __webpack_require__(13);
const client = new client_dynamodb_1.DynamoDBClient({
    region: config_1.config.region,
    ...(config_1.config.dynamoEndpoint ? { endpoint: config_1.config.dynamoEndpoint } : {}),
});
exports.docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true,
        convertEmptyValues: true,
    },
    unmarshallOptions: {
        wrapNumbers: false,
    },
});
exports.TABLE_NAME = config_1.config.tableName;
async function getItem(pk, sk = 'METADATA') {
    const result = await exports.docClient.send(new lib_dynamodb_1.GetCommand({
        TableName: exports.TABLE_NAME,
        Key: { PK: pk, SK: sk },
    }));
    return result.Item || null;
}
async function putItem(item) {
    await exports.docClient.send(new lib_dynamodb_1.PutCommand({
        TableName: exports.TABLE_NAME,
        Item: item,
    }));
    return item;
}
async function deleteItem(pk, sk = 'METADATA') {
    await exports.docClient.send(new lib_dynamodb_1.DeleteCommand({
        TableName: exports.TABLE_NAME,
        Key: { PK: pk, SK: sk },
    }));
}
async function queryByPK(pk, skBeginsWith) {
    const params = {
        TableName: exports.TABLE_NAME,
        KeyConditionExpression: skBeginsWith ? 'PK = :pk AND begins_with(SK, :sk)' : 'PK = :pk',
        ExpressionAttributeValues: skBeginsWith ? { ':pk': pk, ':sk': skBeginsWith } : { ':pk': pk },
    };
    const result = await exports.docClient.send(new lib_dynamodb_1.QueryCommand(params));
    return result.Items || [];
}
async function queryGSI(gsi1pk, gsi1skBeginsWith, indexName = 'GSI1') {
    const params = {
        TableName: exports.TABLE_NAME,
        IndexName: indexName,
        KeyConditionExpression: gsi1skBeginsWith
            ? 'GSI1PK = :gpk AND begins_with(GSI1SK, :gsk)'
            : 'GSI1PK = :gpk',
        ExpressionAttributeValues: gsi1skBeginsWith
            ? { ':gpk': gsi1pk, ':gsk': gsi1skBeginsWith }
            : { ':gpk': gsi1pk },
    };
    const result = await exports.docClient.send(new lib_dynamodb_1.QueryCommand(params));
    return result.Items || [];
}
async function scanItems(filterExpression, expressionValues, expressionNames) {
    const params = {
        TableName: exports.TABLE_NAME,
        ...(filterExpression ? { FilterExpression: filterExpression } : {}),
        ...(expressionValues ? { ExpressionAttributeValues: expressionValues } : {}),
        ...(expressionNames ? { ExpressionAttributeNames: expressionNames } : {}),
    };
    const result = await exports.docClient.send(new lib_dynamodb_1.ScanCommand(params));
    return result.Items || [];
}


/***/ }),
/* 11 */
/***/ ((module) => {

module.exports = require("@aws-sdk/client-dynamodb");

/***/ }),
/* 12 */
/***/ ((module) => {

module.exports = require("@aws-sdk/lib-dynamodb");

/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.config = void 0;
exports.config = {
    tableName: process.env['TABLE_NAME'] || 'BakeryTable',
    region: process.env['AWS_REGION'] || process.env['AWS_DEFAULT_REGION'] || 'us-east-1',
    dynamoEndpoint: process.env['DYNAMODB_ENDPOINT'], // for local development if needed
    jwtSecret: process.env['JWT_SECRET'] || 'bakery-secret-key-change-in-production-123456789',
    jwtExpiresIn: process.env['JWT_EXPIRES_IN'] || '7d',
    uploadsBucket: process.env['UPLOADS_BUCKET_NAME'] || 'bakery-uploads-bucket',
    frontendUrl: process.env['FRONTEND_URL'] || 'http://localhost:4200',
    adminUrl: process.env['ADMIN_URL'] || 'http://localhost:4201',
};


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.authMiddleware = authMiddleware;
exports.adminGuard = adminGuard;
const tslib_1 = __webpack_require__(1);
const jwt = tslib_1.__importStar(__webpack_require__(8));
const config_1 = __webpack_require__(13);
async function authMiddleware(c, next) {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ message: 'Unauthorized: missing or invalid token' }, 401);
    }
    const token = authHeader.substring(7);
    try {
        const payload = jwt.verify(token, config_1.config.jwtSecret);
        c.set('user', payload);
        await next();
    }
    catch (err) {
        return c.json({ message: 'Unauthorized: invalid or expired token' }, 401);
    }
}
async function adminGuard(c, next) {
    const user = c.get('user');
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
        return c.json({ message: 'Forbidden: Admin access required' }, 403);
    }
    await next();
}


/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.categoriesRoutes = void 0;
const hono_1 = __webpack_require__(3);
const uuid_1 = __webpack_require__(9);
const dynamodb_1 = __webpack_require__(10);
const auth_middleware_1 = __webpack_require__(14);
exports.categoriesRoutes = new hono_1.Hono();
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}
// ── List Categories (Public) ──────────────────────────
exports.categoriesRoutes.get('/', async (c) => {
    const items = await (0, dynamodb_1.queryGSI)('CATEGORIES');
    // Sort by displayOrder ascending
    items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    const result = items.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        displayOrder: cat.displayOrder,
    }));
    return c.json(result);
});
// ── Get Category By ID or Slug (Public) ───────────────
exports.categoriesRoutes.get('/:idOrSlug', async (c) => {
    const idOrSlug = c.req.param('idOrSlug');
    let category = await (0, dynamodb_1.getItem)(`CATEGORY#${idOrSlug}`, 'METADATA');
    if (!category) {
        const all = await (0, dynamodb_1.queryGSI)('CATEGORIES');
        category = all.find((cat) => cat.slug === idOrSlug || cat.id === idOrSlug) || null;
    }
    if (!category) {
        return c.json({ message: 'Category not found' }, 404);
    }
    return c.json({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl,
        displayOrder: category.displayOrder,
    });
});
// ── Create Category (Admin Only) ──────────────────────
exports.categoriesRoutes.post('/', auth_middleware_1.authMiddleware, auth_middleware_1.adminGuard, async (c) => {
    const body = await c.req.json();
    const { name, description, imageUrl, displayOrder } = body;
    if (!name) {
        return c.json({ message: 'Category name is required' }, 400);
    }
    const id = (0, uuid_1.v4)();
    const slug = slugify(name);
    const order = typeof displayOrder === 'number' ? displayOrder : 0;
    const createdAt = new Date().toISOString();
    const newCategory = {
        PK: `CATEGORY#${id}`,
        SK: 'METADATA',
        GSI1PK: 'CATEGORIES',
        GSI1SK: `${String(order).padStart(4, '0')}#${slug}`,
        id,
        name,
        slug,
        description: description || '',
        imageUrl: imageUrl || '',
        displayOrder: order,
        createdAt,
    };
    await (0, dynamodb_1.putItem)(newCategory);
    return c.json(newCategory, 201);
});
// ── Update Category (Admin Only) ──────────────────────
exports.categoriesRoutes.put('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.adminGuard, async (c) => {
    const id = c.req.param('id');
    const existing = await (0, dynamodb_1.getItem)(`CATEGORY#${id}`, 'METADATA');
    if (!existing) {
        return c.json({ message: 'Category not found' }, 404);
    }
    const body = await c.req.json();
    const updated = {
        ...existing,
        name: body.name || existing.name,
        slug: body.name ? slugify(body.name) : existing.slug,
        description: body.description !== undefined ? body.description : existing.description,
        imageUrl: body.imageUrl !== undefined ? body.imageUrl : existing.imageUrl,
        displayOrder: body.displayOrder !== undefined ? body.displayOrder : existing.displayOrder,
    };
    await (0, dynamodb_1.putItem)(updated);
    return c.json(updated);
});
// ── Delete Category (Admin Only) ──────────────────────
exports.categoriesRoutes.delete('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.adminGuard, async (c) => {
    const id = c.req.param('id');
    await (0, dynamodb_1.deleteItem)(`CATEGORY#${id}`, 'METADATA');
    return c.json({ message: 'Category deleted successfully' });
});


/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.productsRoutes = void 0;
const hono_1 = __webpack_require__(3);
const uuid_1 = __webpack_require__(9);
const dynamodb_1 = __webpack_require__(10);
const auth_middleware_1 = __webpack_require__(14);
exports.productsRoutes = new hono_1.Hono();
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}
// ── List Products with Filters & Pagination (Public) ──
exports.productsRoutes.get('/', async (c) => {
    const categoryFilter = c.req.query('category');
    const searchFilter = c.req.query('search')?.toLowerCase().trim();
    const isFeatured = c.req.query('isFeatured');
    const isBestSeller = c.req.query('isBestSeller');
    const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
    const limit = Math.max(1, parseInt(c.req.query('limit') || '12', 10));
    let products = await (0, dynamodb_1.queryGSI)('PRODUCTS');
    // If query returns empty (e.g. before initial indexing), fallback to scan for PRODUCTS
    if (!products || products.length === 0) {
        products = await (0, dynamodb_1.scanItems)('begins_with(PK, :prefix)', { ':prefix': 'PRODUCT#' });
    }
    // Filter by category slug or id
    if (categoryFilter) {
        products = products.filter((p) => p.categoryId === categoryFilter ||
            p.category?.slug === categoryFilter ||
            p.category?.name?.toLowerCase() === categoryFilter.toLowerCase());
    }
    // Filter by search query
    if (searchFilter) {
        products = products.filter((p) => p.name?.toLowerCase().includes(searchFilter) ||
            p.description?.toLowerCase().includes(searchFilter) ||
            p.shortDescription?.toLowerCase().includes(searchFilter));
    }
    // Filter by featured
    if (isFeatured === 'true') {
        products = products.filter((p) => p.isFeatured === true);
    }
    // Filter by best seller
    if (isBestSeller === 'true') {
        products = products.filter((p) => p.isBestSeller === true);
    }
    const total = products.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const items = products.slice(start, start + limit);
    return c.json({
        items,
        total,
        page,
        limit,
        totalPages,
    });
});
// ── Get Single Product By Slug or ID (Public) ─────────
exports.productsRoutes.get('/:slugOrId', async (c) => {
    const slugOrId = c.req.param('slugOrId');
    let product = await (0, dynamodb_1.getItem)(`PRODUCT#${slugOrId}`, 'METADATA');
    if (!product) {
        const all = await (0, dynamodb_1.queryGSI)('PRODUCTS');
        product = all.find((p) => p.slug === slugOrId || p.id === slugOrId) || null;
        if (!product) {
            const scanned = await (0, dynamodb_1.scanItems)('begins_with(PK, :prefix) AND (slug = :s OR id = :s)', { ':prefix': 'PRODUCT#', ':s': slugOrId });
            product = scanned[0] || null;
        }
    }
    if (!product) {
        return c.json({ message: 'Product not found' }, 404);
    }
    return c.json(product);
});
// ── Create Product (Admin Only) ───────────────────────
exports.productsRoutes.post('/', auth_middleware_1.authMiddleware, auth_middleware_1.adminGuard, async (c) => {
    const body = await c.req.json();
    const { name, description, shortDescription, basePrice, categoryId, category, images, variants, customizationOptions, isCustomizable, stockStatus, isFeatured, isBestSeller, } = body;
    if (!name || basePrice === undefined) {
        return c.json({ message: 'Product name and base price are required' }, 400);
    }
    const id = (0, uuid_1.v4)();
    const slug = slugify(name);
    const createdAt = new Date().toISOString();
    const newProduct = {
        PK: `PRODUCT#${id}`,
        SK: 'METADATA',
        GSI1PK: 'PRODUCTS',
        GSI1SK: `${slug}#${id}`,
        id,
        name,
        slug,
        description: description || '',
        shortDescription: shortDescription || '',
        basePrice: Number(basePrice),
        isCustomizable: !!isCustomizable,
        stockStatus: stockStatus || 'IN_STOCK',
        isFeatured: !!isFeatured,
        isBestSeller: !!isBestSeller,
        categoryId: categoryId || category?.id || '',
        category: category || { id: categoryId, name: '', slug: '' },
        images: images || [],
        variants: variants || [],
        customizationOptions: customizationOptions || [],
        createdAt,
    };
    await (0, dynamodb_1.putItem)(newProduct);
    return c.json(newProduct, 201);
});
// ── Update Product (Admin Only) ───────────────────────
exports.productsRoutes.put('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.adminGuard, async (c) => {
    const id = c.req.param('id');
    const existing = await (0, dynamodb_1.getItem)(`PRODUCT#${id}`, 'METADATA');
    if (!existing) {
        return c.json({ message: 'Product not found' }, 404);
    }
    const body = await c.req.json();
    const updated = {
        ...existing,
        ...body,
        PK: existing.PK,
        SK: existing.SK,
        GSI1PK: 'PRODUCTS',
        id: existing.id,
        basePrice: body.basePrice !== undefined ? Number(body.basePrice) : existing.basePrice,
        slug: body.name ? slugify(body.name) : existing.slug,
    };
    await (0, dynamodb_1.putItem)(updated);
    return c.json(updated);
});
// ── Delete Product (Admin Only) ───────────────────────
exports.productsRoutes.delete('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.adminGuard, async (c) => {
    const id = c.req.param('id');
    await (0, dynamodb_1.deleteItem)(`PRODUCT#${id}`, 'METADATA');
    return c.json({ message: 'Product deleted successfully' });
});


/***/ }),
/* 17 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.cartRoutes = void 0;
const hono_1 = __webpack_require__(3);
const uuid_1 = __webpack_require__(9);
const dynamodb_1 = __webpack_require__(10);
const auth_middleware_1 = __webpack_require__(14);
exports.cartRoutes = new hono_1.Hono();
function calculateCartTotals(items) {
    let totalAmount = 0;
    for (const item of items) {
        item.totalPrice = item.unitPrice * item.quantity;
        totalAmount += item.totalPrice;
    }
    return totalAmount;
}
// ── Get Cart ──────────────────────────────────────────
exports.cartRoutes.get('/', auth_middleware_1.authMiddleware, async (c) => {
    const user = c.get('user');
    let cart = await (0, dynamodb_1.getItem)(`CART#${user.id}`, 'METADATA');
    if (!cart) {
        cart = {
            PK: `CART#${user.id}`,
            SK: 'METADATA',
            userId: user.id,
            items: [],
            totalAmount: 0,
            updatedAt: new Date().toISOString(),
        };
    }
    return c.json(cart);
});
// ── Add Item to Cart ──────────────────────────────────
exports.cartRoutes.post('/items', auth_middleware_1.authMiddleware, async (c) => {
    const user = c.get('user');
    const body = await c.req.json();
    const { productId, quantity = 1, variantId, customMessage, customEggless } = body;
    if (!productId) {
        return c.json({ message: 'productId is required' }, 400);
    }
    // Fetch product to get accurate pricing and details
    const product = await (0, dynamodb_1.getItem)(`PRODUCT#${productId}`, 'METADATA');
    if (!product) {
        return c.json({ message: 'Product not found' }, 404);
    }
    let cart = await (0, dynamodb_1.getItem)(`CART#${user.id}`, 'METADATA');
    if (!cart) {
        cart = {
            PK: `CART#${user.id}`,
            SK: 'METADATA',
            userId: user.id,
            items: [],
            totalAmount: 0,
            updatedAt: new Date().toISOString(),
        };
    }
    let unitPrice = product.basePrice;
    let selectedVariant = undefined;
    if (variantId && product.variants?.length) {
        selectedVariant = product.variants.find((v) => v.id === variantId);
        if (selectedVariant) {
            unitPrice += selectedVariant.priceModifier || 0;
        }
    }
    // Check if item already exists in cart with same configurations
    const existingIdx = cart.items.findIndex((item) => item.productId === productId &&
        item.selectedVariant?.id === variantId &&
        item.customMessage === customMessage);
    if (existingIdx > -1) {
        cart.items[existingIdx].quantity += quantity;
        cart.items[existingIdx].unitPrice = unitPrice;
        cart.items[existingIdx].totalPrice = cart.items[existingIdx].quantity * unitPrice;
    }
    else {
        const newItem = {
            id: (0, uuid_1.v4)(),
            productId,
            quantity,
            unitPrice,
            totalPrice: unitPrice * quantity,
            customMessage: customMessage || '',
            customEggless: !!customEggless,
            selectedVariant,
            product: {
                id: product.id,
                name: product.name,
                slug: product.slug,
                basePrice: product.basePrice,
                images: product.images || [],
            },
        };
        cart.items.push(newItem);
    }
    cart.totalAmount = calculateCartTotals(cart.items);
    cart.updatedAt = new Date().toISOString();
    await (0, dynamodb_1.putItem)(cart);
    return c.json(cart, 201);
});
// ── Update Cart Item Quantity ─────────────────────────
exports.cartRoutes.put('/items/:itemId', auth_middleware_1.authMiddleware, async (c) => {
    const user = c.get('user');
    const itemId = c.req.param('itemId');
    const body = await c.req.json();
    const quantity = Math.max(1, parseInt(body.quantity || '1', 10));
    let cart = await (0, dynamodb_1.getItem)(`CART#${user.id}`, 'METADATA');
    if (!cart) {
        return c.json({ message: 'Cart not found' }, 404);
    }
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
        return c.json({ message: 'Cart item not found' }, 404);
    }
    item.quantity = quantity;
    cart.totalAmount = calculateCartTotals(cart.items);
    cart.updatedAt = new Date().toISOString();
    await (0, dynamodb_1.putItem)(cart);
    return c.json(cart);
});
// ── Delete Cart Item ──────────────────────────────────
exports.cartRoutes.delete('/items/:itemId', auth_middleware_1.authMiddleware, async (c) => {
    const user = c.get('user');
    const itemId = c.req.param('itemId');
    let cart = await (0, dynamodb_1.getItem)(`CART#${user.id}`, 'METADATA');
    if (!cart) {
        return c.json({ message: 'Cart not found' }, 404);
    }
    cart.items = cart.items.filter((i) => i.id !== itemId);
    cart.totalAmount = calculateCartTotals(cart.items);
    cart.updatedAt = new Date().toISOString();
    await (0, dynamodb_1.putItem)(cart);
    return c.json(cart);
});
// ── Clear Cart ────────────────────────────────────────
exports.cartRoutes.delete('/', auth_middleware_1.authMiddleware, async (c) => {
    const user = c.get('user');
    const emptyCart = {
        PK: `CART#${user.id}`,
        SK: 'METADATA',
        userId: user.id,
        items: [],
        totalAmount: 0,
        updatedAt: new Date().toISOString(),
    };
    await (0, dynamodb_1.putItem)(emptyCart);
    return c.json(emptyCart);
});


/***/ }),
/* 18 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ordersRoutes = void 0;
const hono_1 = __webpack_require__(3);
const uuid_1 = __webpack_require__(9);
const dynamodb_1 = __webpack_require__(10);
const auth_middleware_1 = __webpack_require__(14);
exports.ordersRoutes = new hono_1.Hono();
// ── Place Order (Customer) ────────────────────────────
exports.ordersRoutes.post('/', auth_middleware_1.authMiddleware, async (c) => {
    const user = c.get('user');
    const body = await c.req.json();
    const { shippingAddress, paymentMethod = 'COD', items: directItems, notes } = body;
    let orderItems = directItems;
    let totalAmount = 0;
    // If items not sent directly, pull from user's cart
    if (!orderItems || orderItems.length === 0) {
        const cart = await (0, dynamodb_1.getItem)(`CART#${user.id}`, 'METADATA');
        if (!cart || cart.items.length === 0) {
            return c.json({ message: 'Cart is empty. Please add items to place an order.' }, 400);
        }
        orderItems = cart.items.map((i) => ({
            productId: i.productId,
            productName: i.product?.name || 'Bakery Item',
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
            customMessage: i.customMessage,
            customEggless: i.customEggless,
            selectedVariant: i.selectedVariant,
            imageUrl: i.product?.images?.[0]?.url,
        }));
        totalAmount = cart.totalAmount;
        // Clear cart after creating order
        await (0, dynamodb_1.putItem)({
            PK: `CART#${user.id}`,
            SK: 'METADATA',
            userId: user.id,
            items: [],
            totalAmount: 0,
            updatedAt: new Date().toISOString(),
        });
    }
    else {
        totalAmount = orderItems.reduce((sum, item) => sum + (item.totalPrice || item.unitPrice * item.quantity), 0);
    }
    const orderId = (0, uuid_1.v4)();
    const now = new Date().toISOString();
    const newOrder = {
        PK: `ORDER#${orderId}`,
        SK: 'METADATA',
        GSI1PK: `USER_ORDERS#${user.id}`,
        GSI1SK: `${now}#${orderId}`,
        id: orderId,
        userId: user.id,
        user: {
            id: user.id,
            firstName: user.firstName || user.name?.split(' ')[0] || 'Customer',
            lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
            email: user.email,
            phone: user.phone || shippingAddress?.phone || '',
        },
        items: orderItems,
        totalAmount,
        shippingAddress: {
            fullName: shippingAddress?.fullName || user.name || 'Valued Customer',
            phone: shippingAddress?.phone || user.phone || '',
            street: shippingAddress?.street || shippingAddress?.address || 'Standard Delivery',
            city: shippingAddress?.city || 'Karachi',
            postalCode: shippingAddress?.postalCode || '',
            notes: notes || shippingAddress?.notes || '',
        },
        paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
    };
    await (0, dynamodb_1.putItem)(newOrder);
    return c.json(newOrder, 201);
});
// ── Customer Order History ────────────────────────────
exports.ordersRoutes.get('/my-orders', auth_middleware_1.authMiddleware, async (c) => {
    const user = c.get('user');
    const orders = await (0, dynamodb_1.queryGSI)(`USER_ORDERS#${user.id}`);
    // Sort descending by date
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json(orders);
});
// ── Get Single Order Detail ───────────────────────────
exports.ordersRoutes.get('/:id', auth_middleware_1.authMiddleware, async (c) => {
    const orderId = c.req.param('id');
    const order = await (0, dynamodb_1.getItem)(`ORDER#${orderId}`, 'METADATA');
    if (!order) {
        return c.json({ message: 'Order not found' }, 404);
    }
    const currentUser = c.get('user');
    // Only the owner or admin/staff can view the order
    if (order.userId !== currentUser.id &&
        currentUser.role !== 'ADMIN' &&
        currentUser.role !== 'STAFF') {
        return c.json({ message: 'Access denied' }, 403);
    }
    return c.json(order);
});
// ── Admin: List All Orders ────────────────────────────
exports.ordersRoutes.get('/', auth_middleware_1.authMiddleware, auth_middleware_1.adminGuard, async (c) => {
    const statusFilter = c.req.query('status');
    const limit = Math.max(1, parseInt(c.req.query('limit') || '50', 10));
    let orders = await (0, dynamodb_1.scanItems)('begins_with(PK, :prefix)', { ':prefix': 'ORDER#' });
    if (statusFilter) {
        orders = orders.filter((o) => o.status === statusFilter);
    }
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json(orders.slice(0, limit));
});
// ── Admin: Update Order Status ────────────────────────
exports.ordersRoutes.patch('/:id/status', auth_middleware_1.authMiddleware, auth_middleware_1.adminGuard, async (c) => {
    const orderId = c.req.param('id');
    const body = await c.req.json();
    const { status, paymentStatus } = body;
    const order = await (0, dynamodb_1.getItem)(`ORDER#${orderId}`, 'METADATA');
    if (!order) {
        return c.json({ message: 'Order not found' }, 404);
    }
    if (status)
        order.status = status;
    if (paymentStatus)
        order.paymentStatus = paymentStatus;
    order.updatedAt = new Date().toISOString();
    await (0, dynamodb_1.putItem)(order);
    return c.json(order);
});


/***/ }),
/* 19 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.paymentsRoutes = void 0;
const hono_1 = __webpack_require__(3);
const uuid_1 = __webpack_require__(9);
const dynamodb_1 = __webpack_require__(10);
const auth_middleware_1 = __webpack_require__(14);
exports.paymentsRoutes = new hono_1.Hono();
// ── Initiate EasyPaisa ────────────────────────────────
exports.paymentsRoutes.post('/easypaisa/initiate', auth_middleware_1.authMiddleware, async (c) => {
    const body = await c.req.json();
    const { orderId } = body;
    const order = await (0, dynamodb_1.getItem)(`ORDER#${orderId}`, 'METADATA');
    if (!order) {
        return c.json({ message: 'Order not found' }, 404);
    }
    const txnRefNo = `EP-${(0, uuid_1.v4)().replace(/-/g, '').substring(0, 12).toUpperCase()}`;
    const paymentId = (0, uuid_1.v4)();
    const payment = {
        PK: `PAYMENT#${paymentId}`,
        SK: 'METADATA',
        id: paymentId,
        orderId,
        gateway: 'EASYPAISA',
        txnRefNo,
        amount: order.totalAmount,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
    };
    await (0, dynamodb_1.putItem)(payment);
    const redirectUrl = `https://easypay.easypaisa.com.pk/easypay/Index.jsf?postBackURL=${encodeURIComponent('http://localhost:4200/checkout/processing')}&orderId=${orderId}&amount=${order.totalAmount}&txnRefNo=${txnRefNo}`;
    return c.json({ redirectUrl, txnRefNo });
});
// ── Initiate JazzCash ─────────────────────────────────
exports.paymentsRoutes.post('/jazzcash/initiate', auth_middleware_1.authMiddleware, async (c) => {
    const body = await c.req.json();
    const { orderId } = body;
    const order = await (0, dynamodb_1.getItem)(`ORDER#${orderId}`, 'METADATA');
    if (!order) {
        return c.json({ message: 'Order not found' }, 404);
    }
    const txnRefNo = `JC-${(0, uuid_1.v4)().replace(/-/g, '').substring(0, 12).toUpperCase()}`;
    const paymentId = (0, uuid_1.v4)();
    const payment = {
        PK: `PAYMENT#${paymentId}`,
        SK: 'METADATA',
        id: paymentId,
        orderId,
        gateway: 'JAZZCASH',
        txnRefNo,
        amount: order.totalAmount,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
    };
    await (0, dynamodb_1.putItem)(payment);
    const postUrl = 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/';
    const postData = {
        pp_Version: '1.1',
        pp_TxnType: 'MWALLET',
        pp_Amount: String(Math.round(order.totalAmount * 100)),
        pp_TxnRefNo: txnRefNo,
        pp_BillReference: orderId,
        pp_Description: 'Bakery Order Payment',
        pp_ReturnURL: 'http://localhost:4200/checkout/processing',
    };
    return c.json({ postUrl, postData, txnRefNo });
});
// ── Payment Status Callback / Webhook ─────────────────
exports.paymentsRoutes.post('/callback', async (c) => {
    const body = await c.req.json();
    const { orderId, txnRefNo, status } = body;
    if (orderId) {
        const order = await (0, dynamodb_1.getItem)(`ORDER#${orderId}`, 'METADATA');
        if (order) {
            if (status === 'SUCCESS' || status === 'PAID' || status === '000') {
                order.paymentStatus = 'PAID';
                order.status = 'CONFIRMED';
            }
            else {
                order.paymentStatus = 'FAILED';
            }
            order.updatedAt = new Date().toISOString();
            await (0, dynamodb_1.putItem)(order);
        }
    }
    return c.json({ message: 'Callback processed successfully' });
});


/***/ }),
/* 20 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.reportsRoutes = void 0;
const hono_1 = __webpack_require__(3);
const dynamodb_1 = __webpack_require__(10);
const auth_middleware_1 = __webpack_require__(14);
exports.reportsRoutes = new hono_1.Hono();
// ── Admin Dashboard Statistics ────────────────────────
exports.reportsRoutes.get('/dashboard', auth_middleware_1.authMiddleware, auth_middleware_1.adminGuard, async (c) => {
    // Query orders, products, and users
    const orders = await (0, dynamodb_1.scanItems)('begins_with(PK, :prefix)', { ':prefix': 'ORDER#' });
    const products = await (0, dynamodb_1.scanItems)('begins_with(PK, :prefix)', { ':prefix': 'PRODUCT#' });
    const users = await (0, dynamodb_1.scanItems)('begins_with(PK, :prefix) AND #r = :role', { ':prefix': 'USER#', ':role': 'CUSTOMER' }, { '#r': 'role' });
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
    const totalRevenue = orders
        .filter((o) => o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalProducts = products.length;
    const totalCustomers = users.length;
    // Sort orders descending by createdAt and get the 5 most recent
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const recentOrders = orders.slice(0, 5).map((o) => ({
        id: o.id,
        user: o.user,
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        status: o.status,
        createdAt: o.createdAt,
    }));
    return c.json({
        totalOrders,
        pendingOrders,
        totalRevenue,
        totalProducts,
        totalCustomers,
        recentOrders,
    });
});


/***/ }),
/* 21 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.uploadsRoutes = void 0;
const hono_1 = __webpack_require__(3);
const client_s3_1 = __webpack_require__(22);
const s3_request_presigner_1 = __webpack_require__(23);
const uuid_1 = __webpack_require__(9);
const config_1 = __webpack_require__(13);
const auth_middleware_1 = __webpack_require__(14);
exports.uploadsRoutes = new hono_1.Hono();
const s3 = new client_s3_1.S3Client({ region: config_1.config.region });
// ── Generate S3 Presigned Upload URL ───────────────────
exports.uploadsRoutes.post('/presigned-url', auth_middleware_1.authMiddleware, async (c) => {
    const body = await c.req.json();
    const { fileName, fileType = 'image/jpeg' } = body;
    const ext = fileName ? fileName.split('.').pop() : 'jpg';
    const key = `uploads/${(0, uuid_1.v4)()}.${ext}`;
    try {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: config_1.config.uploadsBucket,
            Key: key,
            ContentType: fileType,
        });
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: 300 });
        const fileUrl = `https://${config_1.config.uploadsBucket}.s3.${config_1.config.region}.amazonaws.com/${key}`;
        return c.json({ uploadUrl, fileUrl, key });
    }
    catch (err) {
        // If S3 bucket not yet created or local fallback
        const mockUrl = `/uploads/${(0, uuid_1.v4)()}.${ext}`;
        return c.json({ uploadUrl: mockUrl, fileUrl: mockUrl, key });
    }
});
// ── Fallback Direct Upload Endpoint ───────────────────
exports.uploadsRoutes.post('/', auth_middleware_1.authMiddleware, async (c) => {
    const id = (0, uuid_1.v4)();
    const fileUrl = `https://${config_1.config.uploadsBucket}.s3.${config_1.config.region}.amazonaws.com/uploads/${id}.jpg`;
    return c.json({ url: fileUrl, id });
});


/***/ }),
/* 22 */
/***/ ((module) => {

module.exports = require("@aws-sdk/client-s3");

/***/ }),
/* 23 */
/***/ ((module) => {

module.exports = require("@aws-sdk/s3-request-presigner");

/***/ }),
/* 24 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.usersRoutes = void 0;
const hono_1 = __webpack_require__(3);
const dynamodb_1 = __webpack_require__(10);
const auth_middleware_1 = __webpack_require__(14);
exports.usersRoutes = new hono_1.Hono();
// ── Admin: List All Users ─────────────────────────────
exports.usersRoutes.get('/', auth_middleware_1.authMiddleware, auth_middleware_1.adminGuard, async (c) => {
    const users = await (0, dynamodb_1.scanItems)('begins_with(PK, :prefix)', { ':prefix': 'USER#' });
    const safeUsers = users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        role: u.role,
        createdAt: u.createdAt,
    }));
    return c.json(safeUsers);
});
// ── Get User By ID ────────────────────────────────────
exports.usersRoutes.get('/:id', auth_middleware_1.authMiddleware, async (c) => {
    const id = c.req.param('id');
    const currentUser = c.get('user');
    if (currentUser.id !== id && currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF') {
        return c.json({ message: 'Access denied' }, 403);
    }
    const user = await (0, dynamodb_1.getItem)(`USER#${id}`, 'METADATA');
    if (!user) {
        return c.json({ message: 'User not found' }, 404);
    }
    return c.json({
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
    });
});
// ── Admin: Update User Role/Profile ───────────────────
exports.usersRoutes.put('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.adminGuard, async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const user = await (0, dynamodb_1.getItem)(`USER#${id}`, 'METADATA');
    if (!user) {
        return c.json({ message: 'User not found' }, 404);
    }
    if (body.role)
        user.role = body.role;
    if (body.name)
        user.name = body.name;
    if (body.phone)
        user.phone = body.phone;
    await (0, dynamodb_1.putItem)(user);
    return c.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
    });
});
// ── Admin: Delete User ────────────────────────────────
exports.usersRoutes.delete('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.adminGuard, async (c) => {
    const id = c.req.param('id');
    await (0, dynamodb_1.deleteItem)(`USER#${id}`, 'METADATA');
    return c.json({ message: 'User deleted successfully' });
});


/***/ }),
/* 25 */
/***/ ((module) => {

module.exports = require("@hono/node-server");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = __webpack_module_cache__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// module cache are used so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	var __webpack_exports__ = __webpack_require__(__webpack_require__.s = 0);
/******/ 	
/******/ })()
;
//# sourceMappingURL=main.js.map