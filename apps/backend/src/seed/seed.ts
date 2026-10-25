import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { putItem, queryGSI } from '../db/dynamodb';
import { UserEntity } from '../routes/auth.routes';
import { CategoryEntity } from '../routes/categories.routes';
import { ProductEntity } from '../routes/products.routes';

export async function seedDynamoDB() {
  console.log('🌱 Starting DynamoDB Seed...');

  // ── 1. Seed Admin User ──────────────────────────────
  const existingAdmin = await queryGSI<UserEntity>('USER_EMAIL#admin@bakery.com');
  if (existingAdmin.length === 0) {
    const adminId = uuidv4();
    const adminUser: UserEntity = {
      PK: `USER#${adminId}`,
      SK: 'METADATA',
      GSI1PK: 'USER_EMAIL#admin@bakery.com',
      GSI1SK: `USER#${adminId}`,
      id: adminId,
      email: 'admin@bakery.com',
      name: 'Bakery Admin',
      firstName: 'Bakery',
      lastName: 'Admin',
      passwordHash: await bcrypt.hash('Admin@1234', 10),
      phone: '+92-300-0000000',
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
    };
    await putItem(adminUser);
    console.log('✅ Admin user created: admin@bakery.com / Admin@1234');
  } else {
    console.log('ℹ️ Admin user already exists');
  }

  // ── 2. Seed Categories ──────────────────────────────
  const categoriesData = [
    {
      name: 'Signature Cakes',
      slug: 'cakes',
      description: 'Handcrafted premium celebratory cakes and gourmet layered delights',
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
      displayOrder: 1,
    },
    {
      name: 'French Pastries',
      slug: 'pastries',
      description: 'Flaky croissants, delicate tarts, and buttery eclairs baked fresh daily',
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600',
      displayOrder: 2,
    },
    {
      name: 'Artisan Breads',
      slug: 'breads',
      description: 'Slow-fermented sourdoughs, baguettes, and multigrain artisan loaves',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600',
      displayOrder: 3,
    },
    {
      name: 'Gourmet Cookies',
      slug: 'cookies',
      description: 'Chewy NYC-style cookies, buttery shortbreads, and festive macarons',
      imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600',
      displayOrder: 4,
    },
    {
      name: 'Custom Celebration Cakes',
      slug: 'custom-cakes',
      description: 'Bespoke custom cakes designed for birthdays, weddings, and anniversaries',
      imageUrl: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=600',
      displayOrder: 5,
    },
  ];

  const seededCategories: CategoryEntity[] = [];
  for (const cat of categoriesData) {
    const existing = await queryGSI<CategoryEntity>('CATEGORIES');
    const found = existing.find((c) => c.slug === cat.slug);

    if (!found) {
      const id = uuidv4();
      const entity: CategoryEntity = {
        PK: `CATEGORY#${id}`,
        SK: 'METADATA',
        GSI1PK: 'CATEGORIES',
        GSI1SK: `${String(cat.displayOrder).padStart(4, '0')}#${cat.slug}`,
        id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        displayOrder: cat.displayOrder,
        createdAt: new Date().toISOString(),
      };
      await putItem(entity);
      seededCategories.push(entity);
      console.log(`✅ Category created: ${cat.name}`);
    } else {
      seededCategories.push(found);
    }
  }

  // ── 3. Seed Products ────────────────────────────────
  const cakesCat = seededCategories.find((c) => c.slug === 'cakes');
  const pastriesCat = seededCategories.find((c) => c.slug === 'pastries');
  const customCat = seededCategories.find((c) => c.slug === 'custom-cakes');

  const productsData = [
    {
      name: 'Belgian Dark Chocolate Truffle Cake',
      slug: 'belgian-dark-chocolate-truffle-cake',
      description:
        'Indulgent layers of moist chocolate sponge, layered with rich Belgian dark chocolate ganache and chocolate curls.',
      shortDescription: 'Rich Belgian dark chocolate ganache cake',
      basePrice: 2800,
      isCustomizable: true,
      stockStatus: 'IN_STOCK' as const,
      isFeatured: true,
      isBestSeller: true,
      category: cakesCat ? { id: cakesCat.id, name: cakesCat.name, slug: cakesCat.slug } : undefined,
      images: [
        {
          id: '1',
          url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
          isPrimary: true,
        },
      ],
      variants: [
        { id: '1', type: 'SIZE', label: '1 Pound (Serves 4-6)', priceModifier: 0 },
        { id: '2', type: 'SIZE', label: '2 Pounds (Serves 8-12)', priceModifier: 1600 },
        { id: '3', type: 'SIZE', label: '3 Pounds (Serves 14-18)', priceModifier: 3200 },
      ],
      customizationOptions: [
        {
          id: 'opt1',
          type: 'TEXT',
          label: 'Message on Cake (e.g. Happy Birthday Sarah)',
          isRequired: false,
          options: null,
        },
        {
          id: 'opt2',
          type: 'BOOLEAN',
          label: 'Eggless Option',
          isRequired: false,
          options: null,
        },
      ],
    },
    {
      name: 'Classic Red Velvet Cream Cheese Cake',
      slug: 'classic-red-velvet-cream-cheese-cake',
      description:
        'Velvety crimson sponge paired with silky smooth Philadelphia cream cheese frosting, topped with ruby cake crumbles.',
      shortDescription: 'Crimson cocoa sponge with rich cream cheese frosting',
      basePrice: 3200,
      isCustomizable: true,
      stockStatus: 'IN_STOCK' as const,
      isFeatured: true,
      isBestSeller: true,
      category: cakesCat ? { id: cakesCat.id, name: cakesCat.name, slug: cakesCat.slug } : undefined,
      images: [
        {
          id: '2',
          url: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=600',
          isPrimary: true,
        },
      ],
      variants: [
        { id: '1', type: 'SIZE', label: '1.5 Pounds (Serves 6-8)', priceModifier: 0 },
        { id: '2', type: 'SIZE', label: '2.5 Pounds (Serves 10-14)', priceModifier: 1800 },
      ],
      customizationOptions: [
        {
          id: 'opt1',
          type: 'TEXT',
          label: 'Message on Cake',
          isRequired: false,
          options: null,
        },
      ],
    },
    {
      name: 'Butter Croissant Duo',
      slug: 'butter-croissant-duo',
      description: 'Classic French croissants baked to golden perfection with 100% French cultured butter.',
      shortDescription: 'Flaky, buttery French croissants (Pack of 2)',
      basePrice: 650,
      isCustomizable: false,
      stockStatus: 'IN_STOCK' as const,
      isFeatured: false,
      isBestSeller: true,
      category: pastriesCat
        ? { id: pastriesCat.id, name: pastriesCat.name, slug: pastriesCat.slug }
        : undefined,
      images: [
        {
          id: '3',
          url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600',
          isPrimary: true,
        },
      ],
      variants: [],
      customizationOptions: [],
    },
    {
      name: 'Bespoke Fondant Theme Cake',
      slug: 'bespoke-fondant-theme-cake',
      description:
        'Custom themed cake tailored to your birthday, wedding, or corporate event with handcrafted edible figurines.',
      shortDescription: 'Custom handcrafted designer celebration cake',
      basePrice: 5500,
      isCustomizable: true,
      stockStatus: 'PRE_ORDER' as const,
      isFeatured: true,
      isBestSeller: false,
      category: customCat ? { id: customCat.id, name: customCat.name, slug: customCat.slug } : undefined,
      images: [
        {
          id: '4',
          url: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=600',
          isPrimary: true,
        },
      ],
      variants: [
        { id: '1', type: 'SIZE', label: '2 Pounds (Serves 8-10)', priceModifier: 0 },
        { id: '2', type: 'SIZE', label: '4 Pounds (Serves 18-22)', priceModifier: 4500 },
      ],
      customizationOptions: [
        {
          id: 'opt1',
          type: 'TEXT',
          label: 'Theme & Message Details',
          isRequired: true,
          options: null,
        },
      ],
    },
  ];

  for (const prod of productsData) {
    const existing = await queryGSI<ProductEntity>('PRODUCTS');
    const found = existing.find((p) => p.slug === prod.slug);

    if (!found) {
      const id = uuidv4();
      const entity: ProductEntity = {
        PK: `PRODUCT#${id}`,
        SK: 'METADATA',
        GSI1PK: 'PRODUCTS',
        GSI1SK: `${prod.slug}#${id}`,
        id,
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        shortDescription: prod.shortDescription,
        basePrice: prod.basePrice,
        isCustomizable: prod.isCustomizable,
        stockStatus: prod.stockStatus,
        isFeatured: prod.isFeatured,
        isBestSeller: prod.isBestSeller,
        categoryId: prod.category?.id || '',
        category: prod.category || { id: '', name: '', slug: '' },
        images: prod.images,
        variants: prod.variants,
        customizationOptions: prod.customizationOptions,
        createdAt: new Date().toISOString(),
      };
      await putItem(entity);
      console.log(`✅ Product created: ${prod.name}`);
    }
  }

  console.log('🎉 DynamoDB Seed Complete!');
}

if (require.main === module) {
  seedDynamoDB().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
}
