import pkg from 'pg';
const { Pool } = pkg;

const db = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ledgerdb',
  password: '1234',
  port: 5432
});

export default db;
