import { PrismaPg } from "@prisma/adapter-pg";

import { handlePrismaError } from "@packages/errors";

import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const basePrisma = new PrismaClient({ adapter });

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        try {
          return await query(args);
        } catch (error) {
          handlePrismaError(error, model ?? "Record");
        }
      },
    },
  },
});
