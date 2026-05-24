import pkg from '@prisma/client'

const { PrismaClient } = pkg as any

const prisma = new PrismaClient()

async function main() {

  console.log('🌱 Starting database seed...')

  // =========================
  // CLEAR OLD DATA
  // =========================

  await prisma.inventory.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.product.deleteMany()
  await prisma.warehouse.deleteMany()

  // =========================
  // WAREHOUSES
  // =========================

  const bangalore =
    await prisma.warehouse.create({
      data: {
        name: 'Bangalore Warehouse',
        city: 'Bangalore',
        address:
          'Whitefield, Bangalore',
      },
    })

  const mumbai =
    await prisma.warehouse.create({
      data: {
        name: 'Mumbai Warehouse',
        city: 'Mumbai',
        address:
          'Andheri East, Mumbai',
      },
    })

  const delhi =
    await prisma.warehouse.create({
      data: {
        name: 'Delhi Warehouse',
        city: 'Delhi',
        address:
          'Connaught Place, Delhi',
      },
    })

  const hyderabad =
    await prisma.warehouse.create({
      data: {
        name: 'Hyderabad Warehouse',
        city: 'Hyderabad',
        address:
          'Hitech City, Hyderabad',
      },
    })

  const chennai =
    await prisma.warehouse.create({
      data: {
        name: 'Chennai Warehouse',
        city: 'Chennai',
        address: 'OMR, Chennai',
      },
    })

  // =========================
  // PRODUCTS
  // =========================

  const iphone =
    await prisma.product.create({
      data: {
        name: 'iPhone 16 Pro',
        sku: 'IPHONE16PRO',
        description:
          'Apple flagship smartphone',
        price: 129999,
      },
    })

  const macbook =
    await prisma.product.create({
      data: {
        name: 'MacBook Pro M4',
        sku: 'MACBOOKM4',
        description:
          'Apple M4 laptop',
        price: 249999,
      },
    })

  const airpods =
    await prisma.product.create({
      data: {
        name: 'AirPods Pro',
        sku: 'AIRPODSPRO',
        description:
          'Apple earbuds',
        price: 24999,
      },
    })

  const samsung =
    await prisma.product.create({
      data: {
        name: 'Samsung S25 Ultra',
        sku: 'SAMSUNGS25',
        description:
          'Samsung flagship phone',
        price: 119999,
      },
    })

  const ipad =
    await prisma.product.create({
      data: {
        name: 'iPad Pro',
        sku: 'IPADPRO',
        description:
          'Apple tablet',
        price: 89999,
      },
    })

  const sony =
    await prisma.product.create({
      data: {
        name: 'Sony WH1000XM5',
        sku: 'SONYXM5',
        description:
          'Sony headphones',
        price: 34999,
      },
    })

  // =========================
  // INVENTORY
  // =========================

  await prisma.inventory.createMany({
    data: [

      {
        productId: iphone.id,
        warehouseId: bangalore.id,
        totalStock: 10,
        reservedStock: 0,
      },
      {
        productId: iphone.id,
        warehouseId: mumbai.id,
        totalStock: 5,
        reservedStock: 0,
      },

      {
        productId: macbook.id,
        warehouseId: bangalore.id,
        totalStock: 7,
        reservedStock: 0,
      },
      {
        productId: macbook.id,
        warehouseId: delhi.id,
        totalStock: 3,
        reservedStock: 0,
      },

      {
        productId: airpods.id,
        warehouseId: mumbai.id,
        totalStock: 20,
        reservedStock: 0,
      },
      {
        productId: airpods.id,
        warehouseId: hyderabad.id,
        totalStock: 15,
        reservedStock: 0,
      },

      {
        productId: samsung.id,
        warehouseId: delhi.id,
        totalStock: 8,
        reservedStock: 0,
      },
      {
        productId: samsung.id,
        warehouseId: chennai.id,
        totalStock: 6,
        reservedStock: 0,
      },

      {
        productId: ipad.id,
        warehouseId: bangalore.id,
        totalStock: 12,
        reservedStock: 0,
      },
      {
        productId: ipad.id,
        warehouseId: hyderabad.id,
        totalStock: 9,
        reservedStock: 0,
      },

      {
        productId: sony.id,
        warehouseId: mumbai.id,
        totalStock: 14,
        reservedStock: 0,
      },
      {
        productId: sony.id,
        warehouseId: chennai.id,
        totalStock: 11,
        reservedStock: 0,
      },
    ],
  })

  console.log(
    '✅ Database seeded successfully!'
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })