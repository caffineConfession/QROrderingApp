
import { PrismaClient } from '@prisma/client'

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL || DATABASE_URL.trim() === "") {
  throw new Error("DATABASE_URL is not set or is empty in environment variables. Please provide a valid PostgreSQL connection string in your .env file.");
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  })
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}
