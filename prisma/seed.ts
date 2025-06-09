
import { PrismaClient, AdminRole, ItemCategory, ItemServingType, OrderStatus, PaymentStatus, OrderSource, PaymentMethod } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { ALL_MENU_ITEMS } from '../src/lib/constants'; // Path relative to the prisma directory

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log(`🌱 Starting database seeding process...`);

  // 1. Clear existing data (optional, but good for repeatable seeds)
  console.log('🗑️  Deleting existing data (Order Matters for Foreign Keys)...');
  await prisma.productRating.deleteMany({});
  console.log('   - ProductRatings deleted.');
  await prisma.experienceRating.deleteMany({});
  console.log('   - ExperienceRatings deleted.');
  await prisma.orderItem.deleteMany({});
  console.log('   - OrderItems deleted.');
  await prisma.order.deleteMany({});
  console.log('   - Orders deleted.');
  await prisma.adminUser.deleteMany({});
  console.log('   - AdminUsers deleted.');
  await prisma.menuItem.deleteMany({});
  console.log('   - MenuItems deleted.');
  await prisma.product.deleteMany({});
  console.log('   - Products deleted.');
  console.log('✅ Existing data deletion complete.');

  // 2. Create Admin Users
  console.log('👤 Creating admin users...');
  const adminUsersData = [
    { email: 'manager@caffico.com', role: AdminRole.BUSINESS_MANAGER, password: 'managerPass123' },
    { email: 'manualorder@caffico.com', role: AdminRole.MANUAL_ORDER_TAKER, password: 'manualPass123' },
    { email: 'processor@caffico.com', role: AdminRole.ORDER_PROCESSOR, password: 'processorPass123' },
  ];

  for (const userData of adminUsersData) {
    const hashedPassword = await bcryptjs.hash(userData.password, SALT_ROUNDS);
    await prisma.adminUser.create({
      data: {
        email: userData.email.toLowerCase(),
        passwordHash: hashedPassword,
        role: userData.role,
      },
    });
    console.log(`   ✓ Created admin user: ${userData.email}`);
  }
  console.log('✅ Admin users creation complete.');

  // 3. Create Products and MenuItems
  console.log('☕ Creating products and menu items from constants...');
  const createdProductsDb = []; // To store products created in DB for later use in sample orders

  for (const productData of ALL_MENU_ITEMS) {
    // Ensure product description is not null if your schema requires it
    const description = productData.description || `${productData.name} - a delicious treat from Caffico.`;
    
    const product = await prisma.product.create({
      data: {
        id: productData.id, // Using predefined ID from constants
        name: productData.name,
        description: description,
        category: productData.category, // This is ItemCategory from @/types which should match Prisma's enum
        isAvailable: true, // Default to available
        imageUrl: productData.imageUrl,
        imageHint: productData.imageHint,
      },
    });
    createdProductsDb.push(product);
    console.log(`   ✓ Created product: ${product.name} (ID: ${product.id})`);

    // Create MenuItems for this product
    // The prices are structured as Record<ItemServingType, number> in constants
    for (const [servingTypeStr, price] of Object.entries(productData.prices)) {
      const servingType = servingTypeStr as ItemServingType; // Cast string key to Prisma's ItemServingType enum
      
      // Validate if servingType is a valid enum member (optional robustness)
      if (!Object.values(ItemServingType).includes(servingType)) {
        console.warn(`   ⚠️ Invalid serving type "${servingTypeStr}" for product ${product.name}. Skipping menu item.`);
        continue;
      }

      await prisma.menuItem.create({
        data: {
          productId: product.id,
          servingType: servingType,
          price: price,
          stockQuantity: 50, // Default stock quantity
          isAvailable: true,  // Default to available
        },
      });
      console.log(`     ✓ Created menu item: ${product.name} - ${servingType} @ ₹${price}`);
    }
  }
  console.log('✅ Products and menu items creation complete.');

  // 4. Create Sample Orders (if products were created)
  console.log('🛒 Creating sample orders...');
  if (createdProductsDb.length >= 2) {
    const product1 = createdProductsDb[0];
    const product2 = createdProductsDb[1];

    const product1MenuItems = await prisma.menuItem.findMany({ where: { productId: product1.id } });
    const product2MenuItems = await prisma.menuItem.findMany({ where: { productId: product2.id } });

    if (product1MenuItems.length > 0 && product2MenuItems.length > 0) {
      // Sample Order 1: Online Order
      const sampleOrder1 = await prisma.order.create({
        data: {
          customerName: 'Aisha Sharma',
          customerPhone: '9876500001',
          customerEmail: 'aisha.sharma@example.com',
          totalAmount: product1MenuItems[0].price * 1,
          paymentMethod: PaymentMethod.Razorpay,
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.COMPLETED,
          orderSource: OrderSource.CUSTOMER_ONLINE,
          gatewayPaymentId: `pay_${Date.now().toString(36)}`, // Mock Razorpay ID
          items: {
            create: [
              {
                productId: product1.id,
                productName: product1.name,
                category: product1.category,
                servingType: product1MenuItems[0].servingType,
                quantity: 1,
                priceAtPurchase: product1MenuItems[0].price,
                customization: 'normal',
              },
            ],
          },
        },
      });
      console.log(`   ✓ Created sample order ID: ${sampleOrder1.id} for ${sampleOrder1.customerName}`);

      // Add ratings for Sample Order 1
      await prisma.experienceRating.create({
        data: {
          orderId: sampleOrder1.id,
          rating: 5,
          comment: 'Absolutely loved the ' + product1.name + '! Will order again.',
        }
      });
      console.log(`     ✓ Added experience rating for order ${sampleOrder1.id}`);
      await prisma.productRating.create({
        data: {
          orderId: sampleOrder1.id,
          productId: product1.id,
          productName: product1.name,
          rating: 5,
          comment: 'This ' + product1.name + ' was perfectly blended and delicious!',
        }
      });
      console.log(`     ✓ Added product rating for ${product1.name} in order ${sampleOrder1.id}`);

      // Sample Order 2: Manual Staff Order
      const managerUser = await prisma.adminUser.findUnique({where: {email: 'manager@caffico.com'}});
      if (managerUser && product2MenuItems.length > 0 && product1MenuItems.length > (product1MenuItems[0].servingType === ItemServingType.Cup ? 0:1) ) {
          const item1Menu = product2MenuItems[0];
          const item2Menu = product1MenuItems.length > 1 && product1MenuItems[0].servingType !== product1MenuItems[1].servingType ? product1MenuItems[1] : product1MenuItems[0];

          const sampleOrder2 = await prisma.order.create({
            data: {
              customerName: 'Rohan Verma',
              customerPhone: '9988770002',
              customerEmail: 'rohan.verma@example.com',
              totalAmount: (item1Menu.price * 1) + (item2Menu.price * 2),
              paymentMethod: PaymentMethod.Cash,
              paymentStatus: PaymentStatus.PAID,
              status: OrderStatus.PENDING_PREPARATION,
              orderSource: OrderSource.STAFF_MANUAL,
              takenById: managerUser.id, // Associated with the manager
              items: {
                create: [
                  {
                    productId: product2.id,
                    productName: product2.name,
                    category: product2.category,
                    servingType: item1Menu.servingType,
                    quantity: 1,
                    priceAtPurchase: item1Menu.price,
                    customization: 'sweet',
                  },
                   {
                    productId: product1.id,
                    productName: product1.name,
                    category: product1.category,
                    servingType: item2Menu.servingType,
                    quantity: 2,
                    priceAtPurchase: item2Menu.price,
                    customization: 'normal',
                  },
                ],
              },
            },
          });
          console.log(`   ✓ Created sample order ID: ${sampleOrder2.id} for ${sampleOrder2.customerName} (manual)`);
      } else {
          console.log('   ⚠️ Could not create second sample order due to missing manager or menu items.');
      }
    } else {
      console.warn('   ⚠️ Not enough menu items found for sample products. Skipping sample order creation.');
    }
  } else {
    console.warn('   ⚠️ Not enough products created. Skipping sample order creation.');
  }
  console.log('✅ Sample orders and ratings creation attempt complete.');

  console.log('🎉 Seeding finished successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("🚪 Prisma client disconnected.");
  })
  .catch(async (e) => {
    console.error("❌ Error during seeding:", e);
    await prisma.$disconnect();
    console.error("🚪 Prisma client disconnected after error.");
    process.exit(1);
  });
