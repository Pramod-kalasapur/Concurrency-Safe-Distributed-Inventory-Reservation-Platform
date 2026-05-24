import { prisma } from '@/lib/prisma';
import { reserveInventory, confirmReservation, releaseReservation } from '@/lib/reservation';

/**
 * Concurrency stress test: 50 concurrent reservation attempts on single inventory
 * Expected: Only quantity-many should succeed, rest should fail with 409
 */
async function testConcurrentReservations() {
  console.log('🧪 Starting concurrency test: 50 concurrent reserves on 5-item stock...');

  // Create test data
  const product = await prisma.product.create({
    data: { name: 'Test Product', sku: `TEST-${Date.now()}` },
  });

  const warehouse = await prisma.warehouse.create({
    data: { name: 'Test Warehouse', city: 'Test City' },
  });

  const inventory = await prisma.inventory.create({
    data: { productId: product.id, warehouseId: warehouse.id, totalStock: 5, reservedStock: 0 },
  });

  console.log(`Created test inventory with 5 items: ${inventory.id}`);

  // Launch 50 concurrent reservation attempts (each trying to reserve 1 item)
  const attempts = Array.from({ length: 50 }, (_, i) => i);
  const results = await Promise.allSettled(
    attempts.map((i) =>
      reserveInventory({
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: 1,
        idempotencyKey: `test-${i}-${Date.now()}`,
      }).catch((e: any) => {
        if (e?.status === 409) return { error: 'insufficient_stock' };
        throw e;
      })
    )
  );

  // Count results
  const successes = results.filter((r) => r.status === 'fulfilled' && !(r as any).value?.error);
  const conflicts = results.filter((r) => r.status === 'fulfilled' && (r as any).value?.error === 'insufficient_stock');
  const failures = results.filter((r) => r.status === 'rejected');

  console.log(`✓ Successes: ${successes.length} (expected ~5)`);
  console.log(`✓ Conflicts (409): ${conflicts.length} (expected ~45)`);
  console.log(`✓ Other errors: ${failures.length} (expected 0)`);

  if (successes.length === 5 && conflicts.length === 45 && failures.length === 0) {
    console.log('✅ PASS: Concurrency test passed! Serializable isolation working correctly.');
  } else {
    console.log('❌ FAIL: Concurrency test did not produce expected results.');
  }

  // Cleanup
  await prisma.inventory.delete({ where: { id: inventory.id } });
  await prisma.warehouse.delete({ where: { id: warehouse.id } });
  await prisma.product.delete({ where: { id: product.id } });
}

async function testReservationLifecycle() {
  console.log('\n🧪 Testing reservation lifecycle (create -> confirm -> complete)...');

  const product = await prisma.product.create({
    data: { name: 'Lifecycle Test Product', sku: `LIFECYCLE-${Date.now()}`, price: 99.99 },
  });

  const warehouse = await prisma.warehouse.create({
    data: { name: 'Lifecycle Warehouse', city: 'Test' },
  });

  const inventory = await prisma.inventory.create({
    data: { productId: product.id, warehouseId: warehouse.id, totalStock: 10, reservedStock: 0 },
  });

  try {
    // Reserve
    const reserved = await reserveInventory({ productId: product.id, warehouseId: warehouse.id, quantity: 3 });
    console.log(`✓ Reserved: ${reserved.reservationId}`);

    // Confirm
    const confirmed = await confirmReservation(reserved.reservationId);
    console.log(`✓ Confirmed: status=${confirmed.status}`);

    // Verify inventory was decremented
    const inv = await prisma.inventory.findUnique({ where: { id: inventory.id } });
    console.log(`✓ Inventory after confirm: totalStock=${inv?.totalStock}, reservedStock=${inv?.reservedStock}`);

    if (inv?.totalStock === 7 && inv?.reservedStock === 0) {
      console.log('✅ PASS: Lifecycle test passed!');
    } else {
      console.log('❌ FAIL: Inventory not updated correctly.');
    }
  } finally {
    await prisma.inventory.delete({ where: { id: inventory.id } });
    await prisma.warehouse.delete({ where: { id: warehouse.id } });
    await prisma.product.delete({ where: { id: product.id } });
  }
}

async function main() {
  try {
    await testConcurrentReservations();
    await testReservationLifecycle();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
