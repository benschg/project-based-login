import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Only create the connection on the server side
let db: ReturnType<typeof drizzle>;

if (typeof window === 'undefined') {
  // Server-side only
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString, { prepare: false });
  db = drizzle(client, { schema });
} else {
  // Browser-side - this should not be used directly
  // Components should call API routes that use the server-side db
  throw new Error('Database connection should only be used server-side');
}

export { db };
export * from './schema';