-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    account_type text NOT NULL,
    currency text NOT NULL,
    balance numeric(20,6) DEFAULT 0,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    type text NOT NULL,
    source_account_id uuid,
    destination_account_id uuid,
    amount numeric(20,6) NOT NULL CHECK (amount > 0),
    currency text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    description text,
    created_at timestamptz DEFAULT now(),
    completed_at timestamptz
);

-- Ledger entries table
CREATE TABLE IF NOT EXISTS ledger_entries (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id uuid REFERENCES accounts(id) NOT NULL,
    transaction_id uuid REFERENCES transactions(id) NOT NULL,
    entry_type text NOT NULL CHECK (entry_type IN ('debit','credit')),
    amount numeric(20,6) NOT NULL CHECK (amount >= 0),
    created_at timestamptz DEFAULT now()
);

INSERT INTO users (name, email) VALUES ('Test User', 'test@example.com');

INSERT INTO accounts (user_id, account_type, currency, balance)
VALUES (
    (SELECT id FROM users WHERE email='test@example.com'),
    'checking',
    'USD',
    1000
);


-- Indexes
CREATE INDEX IF NOT EXISTS idx_ledger_account_created ON ledger_entries (account_id, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status);
