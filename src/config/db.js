import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'ledgerdb',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: process.env.POSTGRES_PORT || 5432
});

export default pool;
