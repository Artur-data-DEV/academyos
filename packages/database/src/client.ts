import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Configuração do WebSocket para uso em ambientes Node/Edge,
// pois o neondatabase/serverless requer WebSockets no edge.
neonConfig.webSocketConstructor = ws;

// Para garantir que o URL do banco exista
const connectionString = process.env.DATABASE_URL;

// Singleton helper para desenvolvimento com Next.js HMR
const prismaClientSingleton = () => {
  if (connectionString) {
    const pool = new Pool({ connectionString });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter });
  }
  
  // Fallback seguro caso não tenha connection string na geração de build (ex: Vercel)
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export * from '@prisma/client';
