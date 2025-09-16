import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Alternative config using Supabase REST API
export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  // Use this if you prefer REST API approach
  dbCredentials: {
    url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
    connectionString: undefined,
  },
  verbose: true,
  strict: true,
});