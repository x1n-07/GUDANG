import { PrismaClient } from './generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();

const dbPath = path.resolve(process.cwd(), 'database', 'warehouse.db');
const databaseUrl = `file:${dbPath}`;

const adapter = new PrismaBetterSqlite3({
  url: databaseUrl,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const hashed = await bcrypt.hash('123', 10);

  console.log('Seeding data...');

  // 1. Superadmin
  await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      password: hashed,
      role: 'superadmin',
      name: 'Super Administrator',
    },
  });

  // 2. Companies
  const companyA = await prisma.company.upsert({
    where: { id: 'c1' },
    update: {},
    create: { id: 'c1', name: 'PT Logistik A', disabled: false },
  });

  const companyB = await prisma.company.upsert({
    where: { id: 'c2' },
    update: {},
    create: { id: 'c2', name: 'PT Logistik B', disabled: false },
  });

  // 3. Admins & Others
  const users = [
    { username: 'admin1', role: 'admin', name: 'Admin Gudang A', companyId: companyA.id, contact: '081234567890' },
    { username: 'admin2', role: 'admin', name: 'Admin Gudang B', companyId: companyB.id, contact: '081234567891' },
    { username: 'peng1', role: 'pengawas', name: 'Pengawas A', companyId: companyA.id, contact: '081234567892' },
    { username: 'tek1', role: 'teknisi', name: 'Teknisi A', companyId: companyA.id, contact: '081234567893' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        ...u,
        password: hashed,
        disabled: false,
      },
    });
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });