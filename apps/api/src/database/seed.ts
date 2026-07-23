import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { Product, StockStatus } from '../products/entities/product.entity';
import { ProductVariant, VariantType } from '../products/entities/product-variant.entity';
import { CustomizationOption, CustomizationType } from '../products/entities/customization-option.entity';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL', 'postgresql://bakery_user:bakery_pass@localhost:5432/bakery_db'),
  entities: [User, Category, Product, ProductVariant, CustomizationOption],
  synchronize: true,
  logging: false,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('🌱 Starting seed...');

  // ── Admin User ──────────────────────────────────────────
  const userRepo = AppDataSource.getRepository(User);
  const existing = await userRepo.findOne({ where: { email: 'admin@bakery.com' } });
  if (!existing) {
    const admin = userRepo.create({
      name: 'Bakery Admin',
      email: 'admin@bakery.com',
      passwordHash: await bcrypt.hash('Admin@1234', 12),
      phone: '+92-300-0000000',
      role: UserRole.ADMIN,
    });
    await userRepo.save(admin);
    console.log('✅ Admin user created: admin@bakery.com / Admin@1234');
  }

  // ── Staff User ──────────────────────────────────────────
  const staffExists = await userRepo.findOne({ where: { email: 'staff@bakery.com' } });
  if (!staffExists) {
    const staff = userRepo.create({
      name: 'Bakery Staff',
      email: 'staff@bakery.com',
      passwordHash: await bcrypt.hash('Staff@1234', 12),
      phone: '+92-300-1111111',
      role: UserRole.STAFF,
    });
    await userRepo.save(staff);
    console.log('✅ Staff user created: staff@bakery.com / Staff@1234');
  }

  // ── Categories ──────────────────────────────────────────
  const categoryRepo = AppDataSource.getRepository(Category);
  const categories = [
    { name: 'Cakes', slug: 'cakes', description: 'Custom and ready-made cakes for every occasion', sortOrder: 1 },
    { name: 'Cupcakes', slug: 'cupcakes', description: 'Individually portioned cupcakes in assorted flavors', sortOrder: 2 },
    { name: 'Pastries', slug: 'pastries', description: 'Freshly baked pastries and croissants', sortOrder: 3 },
    { name: 'Cookies', slug: 'cookies', description: 'Handcrafted cookies in a variety of flavors', sortOrder: 4 },
    { name: 'Breads', slug: 'breads', description: 'Artisan breads baked fresh daily', sortOrder: 5 },
  ];

  const savedCategories: Record<string, Category> = {};
  for (const cat of categories) {
    let saved = await categoryRepo.findOne({ where: { slug: cat.slug } });
    if (!saved) {
      saved = await categoryRepo.save(categoryRepo.create(cat));
      console.log(`✅ Category created: ${cat.name}`);
    }
    savedCategories[cat.slug] = saved;
  }

  // ── Products ──────────────────────────────────────────
  const productRepo = AppDataSource.getRepository(Product);
  const variantRepo = AppDataSource.getRepository(ProductVariant);
  const customizationRepo = AppDataSource.getRepository(CustomizationOption);

  const products = [
    {
      name: 'Classic Chocolate Cake',
      slug: 'classic-chocolate-cake',
      categorySlug: 'cakes',
      description: 'A rich, moist chocolate cake with velvety ganache frosting. Perfect for birthdays and celebrations.',
      shortDescription: 'Rich chocolate cake with ganache frosting',
      basePrice: 1200,
      isCustomizable: true,
      isFeatured: true,
      isBestSeller: true,
      stockStatus: StockStatus.IN_STOCK,
      variants: [
        { type: VariantType.WEIGHT, label: '1 lb', priceModifier: 0, sortOrder: 1 },
        { type: VariantType.WEIGHT, label: '2 lb', priceModifier: 600, sortOrder: 2 },
        { type: VariantType.WEIGHT, label: '3 lb', priceModifier: 1200, sortOrder: 3 },
        { type: VariantType.WEIGHT, label: '5 lb', priceModifier: 2400, sortOrder: 4 },
      ],
      customizations: [
        {
          type: CustomizationType.WEIGHT,
          label: 'Select Weight',
          isRequired: true,
          options: [
            { label: '1 lb', value: '1lb', priceModifier: 0 },
            { label: '2 lb', value: '2lb', priceModifier: 600 },
            { label: '3 lb', value: '3lb', priceModifier: 1200 },
            { label: '5 lb', value: '5lb', priceModifier: 2400 },
          ],
        },
        {
          type: CustomizationType.FLAVOR,
          label: 'Select Flavor',
          isRequired: false,
          options: [
            { label: 'Chocolate', value: 'chocolate' },
            { label: 'Vanilla', value: 'vanilla' },
            { label: 'Red Velvet', value: 'red-velvet' },
            { label: 'Lemon', value: 'lemon' },
          ],
        },
        { type: CustomizationType.TEXT, label: 'Cake Message', isRequired: false, options: null },
        { type: CustomizationType.IMAGE, label: 'Reference Design Image', isRequired: false, options: null },
      ],
    },
    {
      name: 'Strawberry Cheesecake',
      slug: 'strawberry-cheesecake',
      categorySlug: 'cakes',
      description: 'Creamy New York-style cheesecake with a fresh strawberry glaze topping on a buttery biscuit crust.',
      shortDescription: 'Creamy cheesecake with strawberry glaze',
      basePrice: 1500,
      isCustomizable: true,
      isFeatured: true,
      isBestSeller: false,
      stockStatus: StockStatus.IN_STOCK,
      variants: [
        { type: VariantType.WEIGHT, label: '1 lb', priceModifier: 0, sortOrder: 1 },
        { type: VariantType.WEIGHT, label: '2 lb', priceModifier: 750, sortOrder: 2 },
        { type: VariantType.WEIGHT, label: '3 lb', priceModifier: 1500, sortOrder: 3 },
      ],
      customizations: [
        {
          type: CustomizationType.WEIGHT,
          label: 'Select Weight',
          isRequired: true,
          options: [
            { label: '1 lb', value: '1lb', priceModifier: 0 },
            { label: '2 lb', value: '2lb', priceModifier: 750 },
            { label: '3 lb', value: '3lb', priceModifier: 1500 },
          ],
        },
        { type: CustomizationType.TEXT, label: 'Cake Message', isRequired: false, options: null },
      ],
    },
    {
      name: 'Assorted Cupcakes Box',
      slug: 'assorted-cupcakes-box',
      categorySlug: 'cupcakes',
      description: 'A box of 6 beautifully decorated cupcakes in rotating seasonal flavors. Great for gifting.',
      shortDescription: 'Box of 6 assorted flavored cupcakes',
      basePrice: 800,
      isCustomizable: false,
      isFeatured: true,
      isBestSeller: true,
      stockStatus: StockStatus.IN_STOCK,
      variants: [],
      customizations: [],
    },
    {
      name: 'Butter Croissant',
      slug: 'butter-croissant',
      categorySlug: 'pastries',
      description: 'Flaky, buttery croissants made from scratch with pure French butter. Baked fresh every morning.',
      shortDescription: 'Classic flaky butter croissant',
      basePrice: 150,
      isCustomizable: false,
      isFeatured: false,
      isBestSeller: true,
      stockStatus: StockStatus.IN_STOCK,
      variants: [],
      customizations: [],
    },
    {
      name: 'Chocolate Chip Cookies (12 pcs)',
      slug: 'chocolate-chip-cookies',
      categorySlug: 'cookies',
      description: 'Chewy, golden chocolate chip cookies loaded with premium Belgian chocolate chips. Baked to perfection.',
      shortDescription: 'Chewy chocolate chip cookies, pack of 12',
      basePrice: 450,
      isCustomizable: false,
      isFeatured: false,
      isBestSeller: true,
      stockStatus: StockStatus.IN_STOCK,
      variants: [],
      customizations: [],
    },
    {
      name: 'Sourdough Bread',
      slug: 'sourdough-bread',
      categorySlug: 'breads',
      description: 'Artisan sourdough loaf with a crispy crust and tangy, chewy interior. Fermented for 24 hours.',
      shortDescription: 'Artisan sourdough loaf, 24-hour fermented',
      basePrice: 350,
      isCustomizable: false,
      isFeatured: false,
      isBestSeller: false,
      stockStatus: StockStatus.IN_STOCK,
      variants: [],
      customizations: [],
    },
  ];

  for (const p of products) {
    const exists = await productRepo.findOne({ where: { slug: p.slug } });
    if (!exists) {
      const { variants, customizations, categorySlug, ...productData } = p;
      const product = await productRepo.save(
        productRepo.create({
          ...productData,
          categoryId: savedCategories[categorySlug].id,
        }),
      );

      // Save variants
      if (variants.length) {
        await variantRepo.save(
          variants.map((v) => variantRepo.create({ ...v, productId: product.id })),
        );
      }

      // Save customizations
      if (customizations.length) {
        await customizationRepo.save(
          customizations.map((c) =>
            customizationRepo.create({ ...c, productId: product.id } as any),
          ),
        );
      }

      console.log(`✅ Product created: ${p.name}`);
    }
  }

  console.log('\n🎉 Seed completed!');
  console.log('──────────────────────────────');
  console.log('Admin login: admin@bakery.com / Admin@1234');
  console.log('Staff login: staff@bakery.com / Staff@1234');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
