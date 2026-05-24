const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function upsertProduct(data) {
  return prisma.product.upsert({
    where: { sku: data.sku },
    update: data,
    create: data,
  });
}

async function findOrCreateWarehouse(data) {
  const existing = await prisma.warehouse.findFirst({
    where: { name: data.name, city: data.city },
  });

  if (existing) return existing;
  return prisma.warehouse.create({ data });
}

async function upsertInventory(productId, warehouseId, totalStock) {
  return prisma.inventory.upsert({
    where: { productId_warehouseId: { productId, warehouseId } },
    update: { totalStock },
    create: { productId, warehouseId, totalStock, reservedStock: 0 },
  });
}

async function main() {
  console.log('Seeding database...');

  const macbook = await upsertProduct({
    name: 'MacBook Pro 16"',
    sku: 'MBP-16-2024',
    description: 'Apple M3 Max, 36GB RAM, 1TB SSD',
    price: 3499.99,
  });

  const iphone = await upsertProduct({
    name: 'iPhone 16 Pro',
    sku: 'IP16P-256GB',
    description: 'A18 Pro, 256GB, Space Black',
    price: 1199.99,
  });

  const ipad = await upsertProduct({
    name: 'iPad Air',
    sku: 'IPAD-AIR-11',
    description: 'M2, 11-inch, Wi-Fi + Cellular',
    price: 899.99,
  });

  const bangalore = await findOrCreateWarehouse({ name: 'Bangalore Hub', city: 'Bangalore' });
  const mumbai = await findOrCreateWarehouse({ name: 'Mumbai Hub', city: 'Mumbai' });
  const delhi = await findOrCreateWarehouse({ name: 'Delhi Hub', city: 'Delhi' });

  await upsertInventory(macbook.id, bangalore.id, 25);
  await upsertInventory(macbook.id, mumbai.id, 15);
  await upsertInventory(iphone.id, bangalore.id, 100);
  await upsertInventory(iphone.id, delhi.id, 80);
  await upsertInventory(ipad.id, mumbai.id, 50);

  console.log('Database seeded successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
