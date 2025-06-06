
console.log("--- prisma/seed.ts execution started ---"); // Debug: Top-level log

import { PrismaClient, ItemCategory, ItemServingType, AdminRole } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const saltRounds = 10;

// Admin users based on hashPassword.js for consistency
const adminUsersToSeed = [
  { email: 'manager@caffico.com',       role: AdminRole.BUSINESS_MANAGER,   password: 'managerPass123'   },
  { email: 'manualorder@caffico.com',   role: AdminRole.MANUAL_ORDER_TAKER, password: 'manualPass123'    },
  { email: 'processor@caffico.com',     role: AdminRole.ORDER_PROCESSOR,    password: 'processorPass123' },
];

// Product and Menu Item data
const productsToSeed = [
  {
    name: "Vanilla Cold Coffee",
    description: "A classic smooth vanilla flavored cold coffee.",
    category: ItemCategory.COFFEE,
    isAvailable: true,
    imageHint: "vanilla coffee",
    menuItems: [
      { servingType: ItemServingType.Cone, price: 130, stockQuantity: 50, isAvailable: true },
      { servingType: ItemServingType.Cup, price: 150, stockQuantity: 40, isAvailable: true },
    ]
  },
  {
    name: "Original Cold Coffee",
    description: "The classic cold coffee, perfectly blended.",
    category: ItemCategory.COFFEE,
    isAvailable: true,
    imageHint: "coffee",
    menuItems: [
      { servingType: ItemServingType.Cone, price: 120, stockQuantity: 60, isAvailable: true },
      { servingType: ItemServingType.Cup, price: 140, stockQuantity: 0, isAvailable: false }, // Cup explicitly out of stock
    ]
  },
  {
    name: "Hazelnut Cold Coffee",
    description: "Rich hazelnut flavor in a refreshing cold coffee.",
    category: ItemCategory.COFFEE,
    isAvailable: true,
    imageHint: "hazelnut coffee",
    menuItems: [
      { servingType: ItemServingType.Cup, price: 160, stockQuantity: 30, isAvailable: true },
    ]
  },
  {
    name: "Chocolate Shake",
    description: "A decadent and creamy chocolate shake.",
    category: ItemCategory.SHAKES,
    isAvailable: true,
    imageHint: "chocolate shake",
    menuItems: [
      { servingType: ItemServingType.Cone, price: 180, stockQuantity: 25, isAvailable: true },
      { servingType: ItemServingType.Cup, price: 200, stockQuantity: 35, isAvailable: true },
    ]
  },
  {
    name: "KitKat Shake",
    description: "Crunchy KitKat bits blended into a delicious shake.",
    category: ItemCategory.SHAKES,
    isAvailable: false, // Product generally unavailable
    imageHint: "kitkat shake",
    menuItems: [
      { servingType: ItemServingType.Cup, price: 220, stockQuantity: 10, isAvailable: false }, // Item also unavailable
    ]
  },
  {
    name: "Oreo Shake",
    description: "Classic Oreo cookies blended for a perfect shake.",
    category: ItemCategory.SHAKES,
    isAvailable: true,
    imageHint: "oreo shake",
    menuItems: [
      { servingType: ItemServingType.Cup, price: 210, stockQuantity: 5, isAvailable: true }, // Low stock
    ]
  }
];

async function seedDatabase(prisma: PrismaClient, dbName: string) {
  console.log(`\n--- Starting to seed database: ${dbName} ---`);

  console.log(`[${dbName}] Starting to seed admin users...`);
  for (const userData of adminUsersToSeed) {
    try {
      const hashedPassword = await bcryptjs.hash(userData.password, saltRounds);
      const user = await prisma.adminUser.upsert({
        where: { email: userData.email },
        update: {
          passwordHash: hashedPassword,
          role: userData.role,
        },
        create: {
          email: userData.email,
          passwordHash: hashedPassword,
          role: userData.role,
        },
      });
      console.log(`[${dbName}] Upserted admin user: ${user.email} with role ${user.role}`);
    } catch (e: any) {
      console.error(`[${dbName}] Error upserting admin user ${userData.email}: ${e.message}`, e.stack);
    }
  }
  console.log(`[${dbName}] Admin users seeding finished.`);

  console.log(`[${dbName}] Starting to seed products and menu items...`);
  for (const productData of productsToSeed) {
    const { menuItems, ...baseProductData } = productData;
    try {
      const product = await prisma.product.upsert({
        where: { name: baseProductData.name }, // Ensure 'name' is unique in Product schema
        update: {
          ...baseProductData,
        },
        create: {
          ...baseProductData,
        },
      });
      console.log(`[${dbName}] Upserted product: ${product.name} (ID: ${product.id})`);

      if (menuItems && menuItems.length > 0) {
        for (const menuItemData of menuItems) {
          try {
            const finalAvailability = (menuItemData.stockQuantity > 0) ? menuItemData.isAvailable : false;
            const item = await prisma.menuItem.upsert({
              where: {
                productId_servingType: {
                  productId: product.id,
                  servingType: menuItemData.servingType,
                }
              },
              update: {
                price: menuItemData.price,
                stockQuantity: menuItemData.stockQuantity,
                isAvailable: finalAvailability,
              },
              create: {
                productId: product.id,
                servingType: menuItemData.servingType,
                price: menuItemData.price,
                stockQuantity: menuItemData.stockQuantity,
                isAvailable: finalAvailability,
              },
            });
            console.log(`[${dbName}]   Upserted menu item for ${product.name}: ${item.servingType}, Price: ${item.price}, Stock: ${item.stockQuantity}, Available: ${item.isAvailable}`);
          } catch (e: any) {
            console.error(`[${dbName}] Error upserting menu item ${menuItemData.servingType} for product ${product.name}: ${e.message}`, e.stack);
          }
        }
      }
    } catch (e: any) {
      console.error(`[${dbName}] Error upserting product ${baseProductData.name}: ${e.message}`, e.stack);
    }
  }
  console.log(`[${dbName}] Products and menu items seeding finished.`);
  console.log(`--- Seeding database ${dbName} completed ---`);
}

async function main() {
  console.log("--- main() function in seed.ts started ---"); // Debug: Log main function start

  // Seed primary database
  console.log("Attempting to instantiate PrismaClient for Primary DB...");
  const prismaPrimary = new PrismaClient(); // Uses DATABASE_URL from env
  console.log("PrismaClient for Primary DB instantiated.");
  try {
    if (!process.env.DATABASE_URL) {
      console.error("CRITICAL: DATABASE_URL is not defined in the seed script's main function for primary DB!");
    }
    await seedDatabase(prismaPrimary, "Primary DB (DATABASE_URL)");
  } catch (e: any) {
    console.error("Error during primary database seeding process in main():", e.message, e.stack);
  } finally {
    await prismaPrimary.$disconnect();
    console.log("Primary Prisma Client disconnected from main().");
  }

  // Seed secondary database if URL is provided and different from primary
  const secondaryDbUrl = process.env.DATABASE_URL_SECONDARY;
  const primaryDbUrl = process.env.DATABASE_URL;

  if (secondaryDbUrl && secondaryDbUrl.trim() !== "" && secondaryDbUrl !== primaryDbUrl) {
    console.log("\nFound DATABASE_URL_SECONDARY, attempting to seed secondary database.");
    console.log("Attempting to instantiate PrismaClient for Secondary DB...");
    const prismaSecondary = new PrismaClient({
      datasources: {
        db: {
          url: secondaryDbUrl,
        },
      },
    });
    console.log("PrismaClient for Secondary DB instantiated.");
    try {
      await seedDatabase(prismaSecondary, "Secondary DB (DATABASE_URL_SECONDARY)");
    } catch (e: any) {
      console.error("Error during secondary database seeding process in main():", e.message, e.stack);
    } finally {
      await prismaSecondary.$disconnect();
      console.log("Secondary Prisma Client disconnected from main().");
    }
  } else if (secondaryDbUrl && secondaryDbUrl === primaryDbUrl) {
    console.log("\nDATABASE_URL_SECONDARY is the same as DATABASE_URL. Skipping redundant seeding of secondary database.");
  } else {
    console.log("\nDATABASE_URL_SECONDARY not found or empty. Skipping seeding of secondary database.");
  }

  console.log("\n--- All seeding functions in main() invocation completed. ---");
}

main()
  .then(() => {
    console.log('--- Seeding script main() promise resolved. Execution finished. ---');
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('--- Critical error in main seed runner (main promise rejected): ---', e.message, e.stack);
    process.exit(1);
  });

console.log("--- prisma/seed.ts execution reached end of file ---"); // Debug: Bottom-level log
CDATA