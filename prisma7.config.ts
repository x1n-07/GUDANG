import "dotenv/config";
import { defineConfig, env } from "prisma/config";
import path from "node:path";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: `file:${path.resolve(process.cwd(), "database", "warehouse.db")}`,
  },
});