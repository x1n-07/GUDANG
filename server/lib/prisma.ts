import 'dotenv/config';
import { PrismaClient } from '../../prisma/generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'node:path';

// Resolve database path: file:./database/warehouse.db relative to project root
const dbPath = path.resolve(process.cwd(), 'database', 'warehouse.db');
const databaseUrl = `file:${dbPath}`;

const adapter = new PrismaBetterSqlite3({
  url: databaseUrl,
});

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;