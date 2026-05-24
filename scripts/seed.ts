import { prisma } from '@/lib/prisma';

async function main() {
  console.log('Seeding database...');

  // Create products
  const macbook = await prisma.product.create({
    data: { name: 'MacBook Pro 16"', sku: 'MBP-16-2024', description: 'Apple M3 Max, 36GB RAM, 1TB SSD', price: 3499.99 },
  });

  const iphone = await prisma.product.create({
    data: { name: 'iPhone 16 Pro', sku: 'IP16P-256GB', description: 'A18 Pro, 256GB, Space Black', price: 1199.99 },
  });

  const ipad = await prisma.product.create({
    data: { name: 'iPad Air', sku: 'IPAD-AIR-11', description: 'M2, 11-inch, Wi-Fi + Cellular', price: 899.99 },
  });

  console.log('✓ Created products:', { macbook: macbook.id, iphone: iphone.id, ipad: ipad.id });

  // Create warehouses
  const bangalore = await prisma.warehouse.create({ data: { name: 'Bangalore Hub', city: 'Bangalore' } });
  const mumbai = await prisma.warehouse.create({ data: { name: 'Mumbai Hub', city: 'Mumbai' } });
  const delhi = await prisma.warehouse.create({ data: { name: 'Delhi Hub', city: 'Delhi' } });

  console.log('✓ Created warehouses:', { bangalore: bangalore.id, mumbai: mumbai.id, delhi: delhi.id });

  // Create inventory
  const inv1 = await prisma.inventory.create({
    data: { productId: macbook.id, warehouseId: bangalore.id, totalStock: 25, reservedStock: 0 },
  });

  const inv2 = await prisma.inventory.create({
    data: { productId: macbook.id, warehouseId: mumbai.id, totalStock: 15, reservedStock: 0 },
  });

  const inv3 = await prisma.inventory.create({
    data: { productId: iphone.id, warehouseId: bangalore.id, totalStock: 100, reservedStock: 0 },
  });

  const inv4 = await prisma.inventory.create({
    data: { productId: iphone.id, warehouseId: delhi.id, totalStock: 80, reservedStock: 0 },
  });

  const inv5 = await prisma.inventory.create({
    data: { productId: ipad.id, warehouseId: mumbai.id, totalStock: 50, reservedStock: 0 },
  });

  console.log('✓ Created inventory records:', { inv1: inv1.id, inv2: inv2.id, inv3: inv3.id, inv4: inv4.id, inv5: inv5.id });

  console.log('✓ Database seeded successfully!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
