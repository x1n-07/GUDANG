import { PrismaClient } from './generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), 'database', 'warehouse.db');
const databaseUrl = `file:${dbPath}`;
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting data migration to uppercase...');

  // 1. User table (name, role, contact)
  await prisma.$executeRawUnsafe(`UPDATE "User" SET "name" = UPPER(TRIM("name")), "role" = UPPER(TRIM("role")), "contact" = UPPER(TRIM("contact"))`);
  
  // 2. Company table (name)
  await prisma.$executeRawUnsafe(`UPDATE "Company" SET "name" = UPPER(TRIM("name"))`);

  // 3. Technician table (name, role, phone)
  await prisma.$executeRawUnsafe(`UPDATE "Technician" SET "name" = UPPER(TRIM("name")), "role" = UPPER(TRIM("role")), "phone" = UPPER(TRIM("phone"))`);

  // 4. GoodsItem table (name, category, unit)
  await prisma.$executeRawUnsafe(`UPDATE "GoodsItem" SET "name" = UPPER(TRIM("name")), "category" = UPPER(TRIM("category")), "unit" = UPPER(TRIM("unit"))`);

  // 5. GoodsTransaction table (pic)
  await prisma.$executeRawUnsafe(`UPDATE "GoodsTransaction" SET "pic" = UPPER(TRIM("pic")) WHERE "pic" IS NOT NULL`);

  // 6. EquipmentItem table (name, condition, status)
  await prisma.$executeRawUnsafe(`UPDATE "EquipmentItem" SET "name" = UPPER(TRIM("name")), "condition" = UPPER(TRIM("condition")), "status" = UPPER(TRIM("status"))`);

  // 7. EquipmentLog table (user, action, condition)
  await prisma.$executeRawUnsafe(`UPDATE "EquipmentLog" SET "user" = UPPER(TRIM("user")), "action" = UPPER(TRIM("action")), "condition" = UPPER(TRIM("condition"))`);

  // 8. VehicleItem table (name, plateNumber, status)
  await prisma.$executeRawUnsafe(`UPDATE "VehicleItem" SET "name" = UPPER(TRIM("name")), "plateNumber" = UPPER(TRIM("plateNumber")), "status" = UPPER(TRIM("status"))`);

  // 9. VehicleLog table (driver, status)
  await prisma.$executeRawUnsafe(`UPDATE "VehicleLog" SET "driver" = UPPER(TRIM("driver")), "status" = UPPER(TRIM("status"))`);

  // 10. VehicleNeed table (pic, type)
  await prisma.$executeRawUnsafe(`UPDATE "VehicleNeed" SET "pic" = UPPER(TRIM("pic")), "type" = UPPER(TRIM("type"))`);

  console.log('Migration completed successfully.');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });