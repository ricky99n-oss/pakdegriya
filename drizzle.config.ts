import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// Pastikan membaca tepat dari file .env di root folder
config({ path: '.env' });

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
});