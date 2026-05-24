const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

async function postJson(path, body, headers = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Test-Bypass-Rate-Limit': 'true', ...headers },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

async function createInventoryFixture(prefix, stock) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const product = await prisma.product.create({
    data: { name: `${prefix} Product`, sku: `${prefix}-${suffix}` },
  });
  const warehouse = await prisma.warehouse.create({
    data: { name: `${prefix} Warehouse`, city: 'Test City' },
  });
  const inventory = await prisma.inventory.create({
    data: { productId: product.id, warehouseId: warehouse.id, totalStock: stock, reservedStock: 0 },
  });

  return { product, warehouse, inventory };
}

async function cleanupFixture({ product, warehouse, inventory }) {
  const reservations = await prisma.reservation.findMany({
    where: { inventoryId: inventory.id },
    select: { id: true, idempotencyKey: true },
  });
  const reservationIds = reservations.map((reservation) => reservation.id);
  const idempotencyKeys = reservations
    .map((reservation) => reservation.idempotencyKey)
    .filter(Boolean);

  await prisma.auditLog.deleteMany({ where: { reservationId: { in: reservationIds } } });
  await prisma.reservation.deleteMany({ where: { id: { in: reservationIds } } });
  await prisma.idempotencyRequest.deleteMany({ where: { key: { in: idempotencyKeys } } });
  await prisma.inventory.delete({ where: { id: inventory.id } });
  await prisma.warehouse.delete({ where: { id: warehouse.id } });
  await prisma.product.delete({ where: { id: product.id } });
}

async function testConcurrentReservations() {
  console.log('Starting concurrency test: 50 concurrent reserves on 5-item stock...');
  const fixture = await createInventoryFixture('CONCURRENCY', 5);

  try {
    const attempts = Array.from({ length: 50 }, (_, index) =>
      postJson(
        '/api/reservations',
        {
          productId: fixture.product.id,
          warehouseId: fixture.warehouse.id,
          quantity: 1,
        },
        { 'Idempotency-Key': `concurrency-${fixture.inventory.id}-${index}` }
      )
    );

    const results = await Promise.all(attempts);
    const successes = results.filter((result) => result.status === 201);
    const conflicts = results.filter((result) => result.status === 409);
    const failures = results.filter((result) => ![201, 409].includes(result.status));

    console.log(`Successes: ${successes.length} (expected 5)`);
    console.log(`Conflicts: ${conflicts.length} (expected 45)`);
    console.log(`Other failures: ${failures.length} (expected 0)`);
    if (failures.length > 0) {
      console.log('Sample failures:', failures.slice(0, 3));
    }

    if (successes.length !== 5 || conflicts.length !== 45 || failures.length !== 0) {
      throw new Error('Concurrency test failed');
    }

    console.log('PASS: concurrent reservations did not oversell stock.');
  } finally {
    await cleanupFixture(fixture);
  }
}

async function testReservationLifecycle() {
  console.log('Testing lifecycle: reserve -> confirm...');
  const fixture = await createInventoryFixture('LIFECYCLE', 10);

  try {
    const reserved = await postJson('/api/reservations', {
      productId: fixture.product.id,
      warehouseId: fixture.warehouse.id,
      quantity: 3,
    });

    if (reserved.status !== 201) {
      throw new Error(`Reserve failed with status ${reserved.status}`);
    }

    const reservationId = reserved.data.reservationId;
    const confirmed = await fetch(`${BASE_URL}/api/reservations/${reservationId}/confirm`, {
      method: 'POST',
    }).then(async (response) => ({ status: response.status, data: await response.json() }));

    if (confirmed.status !== 200 || confirmed.data.status !== 'CONFIRMED') {
      throw new Error(`Confirm failed with status ${confirmed.status}`);
    }

    const inventory = await prisma.inventory.findUnique({ where: { id: fixture.inventory.id } });
    if (inventory.totalStock !== 7 || inventory.reservedStock !== 0) {
      throw new Error(
        `Inventory mismatch after confirm: totalStock=${inventory.totalStock}, reservedStock=${inventory.reservedStock}`
      );
    }

    console.log('PASS: lifecycle updated reservation and inventory correctly.');
  } finally {
    await cleanupFixture(fixture);
  }
}

async function main() {
  await testConcurrentReservations();
  await testReservationLifecycle();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
