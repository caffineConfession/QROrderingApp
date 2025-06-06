
import { PrismaClient, ItemCategory, ItemServingType, AdminRole } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

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


async function seedAdminUsers() {
  console.log('Starting to seed admin users...');
  for (const userData of adminUsersToSeed) {
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
    console.log(`Upserted admin user: ${user.email} with role ${user.role}`);
  }
  console.log('Admin users seeding finished.');
}

async function seedProductsAndMenuItems() {
  console.log('Starting to seed products and menu items...');
  for (const productData of productsToSeed) {
    const { menuItems, ...baseProductData } = productData;

    const product = await prisma.product.upsert({
      where: { name: baseProductData.name }, 
      update: {
        ...baseProductData,
      },
      create: {
        ...baseProductData,
      },
    });
    console.log(`Upserted product: ${product.name} (ID: ${product.id})`);

    if (menuItems && menuItems.length > 0) {
      for (const menuItemData of menuItems) {
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
        console.log(`  Upserted menu item for ${product.name}: ${item.servingType}, Price: ${item.price}, Stock: ${item.stockQuantity}, Available: ${item.isAvailable}`);
      }
    }
  }
  console.log('Products and menu items seeding finished.');
}


async function main() {
  await seedAdminUsers();
  await seedProductsAndMenuItems();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seeding complete and Prisma disconnected.');
  })
  .catch(async (e) => {
    console.error('Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
