# Financial Ledger API

A robust financial ledger system implementing **double-entry bookkeeping**, supporting deposits, withdrawals, and internal transfers between accounts. This project demonstrates **ACID-compliant transactions**, balance integrity, immutable ledger entries, and correct financial modeling.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Setup Instructions](#setup-instructions)
3. [API Endpoints](#api-endpoints)
4. [Design Decisions](#design-decisions)
5. [Architecture Diagram](#architecture-diagram)
6. [Database Schema (ERD)](#database-schema-erd)
7. [Postman Collection](#postman-collection)
8. [Testing and Verification](#testing-and-verification)

---

## Project Overview

This API provides a backend for a mock banking system with the following features:

- **Accounts** with dynamically calculated balances
- **Double-entry bookkeeping** model for financial accuracy
- **Immutable ledger entries** as the source of truth
- **Full ACID transaction guarantees** for reliability
- **Overdraft prevention** via balance checks
- **Concurrent operation safety** with row-level locks
- **RESTful API** for account and transaction management

### Key Features
- ✅ No stored balance column - calculated on-demand from ledger entries
- ✅ Transactional integrity with row-level locks (SELECT...FOR UPDATE)
- ✅ Proper error handling and rollback on failures
- ✅ Immutable ledger entries (INSERT only, no UPDATE/DELETE)
- ✅ Docker-based deployment ready

---

## Setup Instructions

### Prerequisites
- Node.js 14+ (or use Docker)
- PostgreSQL 12+ (or use Docker)
- npm or yarn

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/financial-ledger-api.git
   cd financial-ledger-api
   ```

2. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

3. **Verify the application**
   - API should be running at `http://localhost:5000`
   - Database available at `localhost:5432`

### Option 2: Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/financial-ledger-api.git
   cd financial-ledger-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=ledgerdb
   DATABASE_HOST=localhost
   POSTGRES_PORT=5432
   PORT=5000
   ```

4. **Set up the database**
   ```bash
   # Create database
   createdb ledgerdb
   
   # Run migrations
   psql -U postgres -d ledgerdb -f migrations/001_create_schema.sql
   ```

5. **Start the application**
   ```bash
   npm start
   ```

6. **Verify the application**
   - API should be running at `http://localhost:5000`
   - Test endpoint: `curl http://localhost:5000/`

---

## API Endpoints

### Base URL
```
http://localhost:5000
```

### Account Management

#### 1. Create Account
**POST** `/accounts`

Request body:
```json
{
  "user_id": "uuid-of-user",
  "account_type": "checking",
  "currency": "USD",
  "status": "active"
}
```

Response:
```json
{
  "id": "account-uuid",
  "user_id": "user-uuid",
  "account_type": "checking",
  "currency": "USD",
  "status": "active",
  "created_at": "2024-01-14T10:00:00Z"
}
```

#### 2. Get Account Details
**GET** `/accounts/{accountId}`

Response includes calculated balance:
```json
{
  "id": "account-uuid",
  "user_id": "user-uuid",
  "account_type": "checking",
  "currency": "USD",
  "status": "active",
  "balance": 1000.00,
  "created_at": "2024-01-14T10:00:00Z"
}
```

#### 3. Get Account Ledger
**GET** `/accounts/{accountId}/ledger`

Response (chronological list of entries):
```json
[
  {
    "id": "entry-uuid",
    "account_id": "account-uuid",
    "transaction_id": "transaction-uuid",
    "entry_type": "credit",
    "amount": 500.00,
    "created_at": "2024-01-14T10:05:00Z"
  },
  {
    "id": "entry-uuid",
    "account_id": "account-uuid",
    "transaction_id": "transaction-uuid",
    "entry_type": "debit",
    "amount": 100.00,
    "created_at": "2024-01-14T10:10:00Z"
  }
]
```

### Financial Transactions

#### 4. Transfer Money
**POST** `/transfer`

Request body:
```json
{
  "source_account_id": "source-uuid",
  "destination_account_id": "dest-uuid",
  "amount": 100.00,
  "currency": "USD",
  "description": "Payment for services"
}
```

Response:
```json
{
  "message": "Transfer successful",
  "transaction_id": "transaction-uuid"
}
```

#### 5. Deposit Money
**POST** `/accounts/deposits`

Request body:
```json
{
  "account_id": "account-uuid",
  "amount": 500.00,
  "description": "Initial deposit"
}
```

Response:
```json
{
  "message": "Deposit successful",
  "transaction_id": "transaction-uuid"
}
```

#### 6. Withdraw Money
**POST** `/withdrawal`

Request body:
```json
{
  "account_id": "account-uuid",
  "amount": 100.00,
  "description": "Cash withdrawal"
}
```

Response:
```json
{
  "message": "Withdrawal successful",
  "transaction_id": "transaction-uuid",
  "new_balance": 900.00
}
```

---

## Design Decisions

### 1. Double-Entry Bookkeeping Implementation

The system implements the fundamental principle of double-entry bookkeeping: **every transaction creates at least two ledger entries - one debit and one credit**.

**Architecture:**
- **Accounts Table**: Stores account metadata (no balance column)
- **Ledger Entries Table**: Immutable records of debits and credits
- **Transactions Table**: Transaction metadata linking ledger entries

**Balance Calculation:**
```sql
SELECT COALESCE(SUM(
  CASE WHEN entry_type='credit' THEN amount ELSE -amount END
),0) AS balance
FROM ledger_entries
WHERE account_id = $1
```

**Example: Transfer of $100 from Account A to Account B**
1. Creates a transaction record
2. Inserts debit entry: -$100 to Account A
3. Inserts credit entry: +$100 to Account B
4. Both entries are immutable (no UPDATE/DELETE allowed)

**Benefits:**
- Complete audit trail of all financial movements
- Impossible to hide or alter historical transactions
- Balance always accurate by definition (mathematical property of double-entry bookkeeping)

---

### 2. ACID Properties Implementation

The system guarantees all ACID properties for financial transactions:

#### Atomicity (All-or-Nothing)
- **Implementation**: PostgreSQL `BEGIN...COMMIT/ROLLBACK` transactions
- **Code Pattern**:
  ```javascript
  await client.query('BEGIN');
  try {
    // All operations here
    await createTransaction(...);
    await createLedgerEntry(...);
    await client.query('COMMIT');
  } catch(err) {
    await client.query('ROLLBACK');
  }
  ```
- **Guarantee**: If any operation fails, ALL changes are rolled back
- **Example**: If deposit writes transaction but fails to write ledger entry, both are rolled back

#### Consistency (Valid State)
- **Row-Level Locks** (`SELECT...FOR UPDATE`):
  ```sql
  SELECT id FROM accounts WHERE id = $1 FOR UPDATE
  ```
- **Balance Integrity Checks**: Ensures no overdrafts
  ```javascript
  const balance = calculateBalanceFromLedger(accountId);
  if (balance < amount) throw new Error("Insufficient funds");
  ```
- **Constraints**: Database constraints prevent invalid states (e.g., `amount > 0`)

#### Isolation (Concurrency Control)
- **Transaction Isolation Level**: READ COMMITTED (PostgreSQL default)
- **Row-Level Locks**: Prevents dirty reads and lost updates
- **Lock Pattern**:
  ```javascript
  // Locks source and destination accounts during transfer
  await client.query('SELECT id FROM accounts WHERE id = $1 FOR UPDATE', [source_id]);
  await client.query('SELECT id FROM accounts WHERE id = $1 FOR UPDATE', [dest_id]);
  ```
- **Protection**: Two concurrent transfers on same account wait for each other

#### Durability (Persistence)
- **PostgreSQL WAL** (Write-Ahead Logging)
- **COMMIT** ensures data persisted to disk before returning
- **Recovery**: If system crashes, committed transactions are replayed from WAL

---

### 3. Transaction Isolation Level Rationale

**Chosen Level**: READ COMMITTED (PostgreSQL default)

**Rationale:**

| Isolation Level | Dirty Reads | Non-Repeatable Reads | Phantom Reads | Use Case |
|---|---|---|---|---|
| READ UNCOMMITTED | Yes | Yes | Yes | Not suitable for finance |
| **READ COMMITTED** | No | Yes | Yes | ✅ **Selected** |
| REPEATABLE READ | No | No | Yes | Too strict for this use case |
| SERIALIZABLE | No | No | No | Highest overhead |

**Why READ COMMITTED?**
1. **Prevents Dirty Reads**: Critical for financial accuracy
2. **Good Performance**: Minimal lock contention
3. **Sufficient for Ledger**: Combined with row-level locks, prevents race conditions
4. **Standard Practice**: Used by most financial systems

**Additional Protections in Code:**
- Explicit row-level locks (`FOR UPDATE`) provide serialization effect for our critical paths
- Lock ordering (always lock source before destination) prevents deadlocks
- Balance checks within transaction ensure real-time accuracy

---

### 4. Balance Calculation and Negative Balance Prevention

#### Balance Calculation Strategy

**No Stored Column**: The `accounts` table has NO `balance` column.

**On-Demand Calculation**:
```javascript
// Calculate from ledger entries
const balanceResult = await client.query(`
  SELECT COALESCE(SUM(
    CASE WHEN entry_type='credit' THEN amount ELSE -amount END
  ),0) AS balance
  FROM ledger_entries
  WHERE account_id = $1
`, [accountId]);

const balance = parseFloat(balanceResult.rows[0].balance);
```

**Advantages:**
- ✅ Impossible to desynchronize (derived value)
- ✅ Always accurate by mathematical definition
- ✅ Complete audit trail maintained
- ✅ No separate balance update logic to get out of sync

#### Overdraft Prevention

**Mechanism**: Strict checking before any debit operation

```javascript
// 1. Calculate current balance from ledger
const balance = calculateFromLedger(accountId);

// 2. Check against requested amount
if (balance < amount) {
  throw new Error("Insufficient funds");
}

// 3. Only then proceed with debit ledger entry
await createLedgerEntry({
  account_id: accountId,
  entry_type: 'debit',
  amount: amount
});
```

**Transaction Context**: This check happens inside a transaction with row-level locks:
```javascript
await client.query('BEGIN');
await client.query('SELECT id FROM accounts WHERE id = $1 FOR UPDATE', [accountId]);
// Balance check happens here
// Debit entry created here
await client.query('COMMIT');
```

**Concurrency Guarantee**:
- Two withdrawals cannot both succeed if combined > balance
- Lock ensures sequential processing even under concurrent requests

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT / POSTMAN                          │
└────────────┬────────────────────────────────────────────────────┘
             │ HTTP Requests (REST API)
             │
┌────────────▼────────────────────────────────────────────────────┐
│                     EXPRESS.JS SERVER                            │
├─────────────────────────────────────────────────────────────────┤
│  Routes Layer                                                     │
│  ├── POST /accounts          → accountController.create           │
│  ├── GET /accounts/:id       → accountController.getDetails       │
│  ├── GET /accounts/:id/ledger → accountController.getLedger       │
│  ├── POST /transfer          → transferController                 │
│  ├── POST /accounts/deposits → accountController.deposit          │
│  └── POST /withdrawal        → withdrawController                 │
└────────────┬────────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────────┐
│                   CONTROLLERS (Request Handlers)                 │
├─────────────────────────────────────────────────────────────────┤
│  - Parse & validate input                                        │
│  - Delegate to services                                          │
│  - Format & return responses                                     │
└────────────┬────────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────────┐
│                     SERVICE LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  Services (Business Logic)                                       │
│  ├── transferService()                                           │
│  ├── depositService()                                            │
│  ├── accountService()                                            │
│                                                                   │
│  Responsibilities:                                               │
│  - Initiate transactions (BEGIN/COMMIT/ROLLBACK)                │
│  - Calculate balances from ledger                               │
│  - Implement business rules                                     │
│  - Delegate to models                                           │
└────────────┬────────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────────┐
│                      MODEL LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  Data Access Functions                                           │
│  ├── accountModel.js                                             │
│  │   ├── createAccount()                                         │
│  │   └── getAccountById()                                        │
│  │                                                               │
│  ├── ledgerModel.js                                              │
│  │   └── getAccountBalance()                                     │
│  │                                                               │
│  └── transactionModel.js                                         │
│      ├── createTransaction()                                     │
│      └── updateTransactionStatus()                               │
└────────────┬────────────────────────────────────────────────────┘
             │ Pool.query() / Client.query()
┌────────────▼────────────────────────────────────────────────────┐
│                  POSTGRESQL DATABASE                             │
├─────────────────────────────────────────────────────────────────┤
│  Tables:                                                          │
│  ├── users        (id, name, email)                              │
│  ├── accounts     (id, user_id, account_type, currency, status)  │
│  ├── transactions (id, type, source_id, dest_id, amount, ...)    │
│  └── ledger_entries (id, account_id, tx_id, type, amount, ...)   │
└─────────────────────────────────────────────────────────────────┘
```

### Transfer Transaction Flow

```
1. Client Request
   ↓
2. transferController receives request
   ├─ Validates input (source, dest, amount)
   ├─ Calls transferService()
   │
3. transferService initiates transaction
   ├─ BEGIN transaction
   ├─ Lock source account (FOR UPDATE)
   ├─ Lock destination account (FOR UPDATE)
   ├─ Calculate source balance from ledger
   ├─ Check: balance >= amount? (Consistency)
   │
4. Create transaction record
   ├─ INSERT into transactions table
   │
5. Create ledger entries (Double-Entry)
   ├─ INSERT debit entry for source (-$100)
   ├─ INSERT credit entry for destination (+$100)
   │
6. COMMIT transaction
   ├─ All-or-nothing atomicity guaranteed
   │
7. Response to client
   ├─ 200 OK with transaction_id
   │ OR
   └─ 500 Error (all changes rolled back)
```

---

## Database Schema (ERD)

### Entity Relationship Diagram

```
┌──────────────┐
│    users     │
├──────────────┤
│ id (PK)      │◄────┐
│ name         │     │
│ email        │     │ (1:N)
│ created_at   │     │
└──────────────┘     │
                     │
                     │
┌──────────────────────┐
│   accounts           │
├──────────────────────┤
│ id (PK)              │────┐
│ user_id (FK)         │    │
│ account_type         │    │ (1:N)
│ currency             │    │
│ status               │    │
│ created_at           │    │
└──────────────────────┘    │
                            │
                     ┌──────────────────────┐
                     │ ledger_entries       │
                     ├──────────────────────┤
                     │ id (PK)              │
                     │ account_id (FK)◄─────┘
                     │ transaction_id (FK)──┐
                     │ entry_type           │
                     │ amount               │ (1:N)
                     │ created_at           │
                     │ Constraint:          │
                     │ - entry_type IN      │
                     │   ('debit','credit') │
                     │ - amount > 0         │
                     │ - Immutable          │
                     └──────────────────────┘
                            ▲
                            │
                            │ (1:N)
                            │
                     ┌──────────────────────┐
                     │  transactions        │
                     ├──────────────────────┤
                     │ id (PK)              │
                     │ type                 │
                     │ source_account_id    │
                     │ dest_account_id      │
                     │ amount               │
                     │ currency             │
                     │ status               │
                     │ description          │
                     │ created_at           │
                     │ completed_at         │
                     │ Constraint:          │
                     │ - amount > 0         │
                     └──────────────────────┘
```

### Table Specifications

#### Users Table
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

#### Accounts Table
```sql
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  account_type text NOT NULL,
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
  
  -- NO balance column: calculated on-demand from ledger_entries
);
```

#### Transactions Table
```sql
CREATE TABLE transactions (
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
```

#### Ledger Entries Table (Immutable)
```sql
CREATE TABLE ledger_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) NOT NULL,
  transaction_id uuid REFERENCES transactions(id) NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('debit','credit')),
  amount numeric(20,6) NOT NULL CHECK (amount >= 0),
  created_at timestamptz DEFAULT now()
  
  -- Immutability: Only INSERT allowed, no UPDATE/DELETE
  -- Index: For efficient balance queries
);

CREATE INDEX idx_ledger_account_created ON ledger_entries (account_id, created_at);
CREATE INDEX idx_transactions_status ON transactions (status);
```

**Key Design Decisions:**
- ✅ `accounts` table has NO `balance` column (calculated on-demand)
- ✅ `ledger_entries` is append-only (no UPDATE/DELETE)
- ✅ All amounts are `numeric(20,6)` for financial precision
- ✅ Unique constraint on `email` for users
- ✅ Cascading delete when user is deleted
- ✅ CHECK constraints prevent invalid amounts

---

## Postman Collection

A complete Postman collection is provided: [postman_collection.json](postman_collection.json)

### How to Use

1. **Open Postman**
   - Download from https://www.postman.com/downloads/

2. **Import Collection**
   - Click "Import" → Select `postman_collection.json`
   - Or drag and drop the file into Postman

3. **Update Variables** (if needed)
   - Replace UUIDs in requests with actual database values
   - Update base URL if not using default `http://localhost:5000`

4. **Run Tests**
   - Execute requests in order:
     1. Create Account 1
     2. Create Account 2
     3. Get Account Details
     4. Make a Transfer
     5. Get Ledger to verify entries
     6. Deposit Money
     7. Withdraw Money

5. **Verify Results**
   - Check response status codes
   - Verify balance calculations
   - Confirm ledger entries are created correctly

---

## Testing and Verification

### Manual Testing Steps

#### 1. Test Account Creation
```bash
curl -X POST http://localhost:5000/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "account_type": "checking",
    "currency": "USD",
    "status": "active"
  }'
```

#### 2. Test Balance Calculation
```bash
# Get account (should have balance calculated from ledger)
curl http://localhost:5000/accounts/{accountId}

# Expected response:
# {
#   "id": "...",
#   "balance": 0,
#   "..."
# }
```

#### 3. Test Double-Entry Transfer
```bash
# Transfer $100 from Account A to Account B
curl -X POST http://localhost:5000/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "source_account_id": "source-uuid",
    "destination_account_id": "dest-uuid",
    "amount": 100,
    "currency": "USD"
  }'

# Verify: Get ledger to see debit and credit entries
curl http://localhost:5000/accounts/source-uuid/ledger
curl http://localhost:5000/accounts/dest-uuid/ledger
```

#### 4. Test Overdraft Prevention
```bash
# Try to withdraw more than balance
curl -X POST http://localhost:5000/withdrawal \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "account-uuid",
    "amount": 99999.99
  }'

# Expected: 400 Error "Insufficient funds"
```

#### 5. Test Concurrency with Row Locks
Run multiple concurrent transfers on the same account to verify locks work.

### Verification Checklist

- [ ] ✅ Account created successfully
- [ ] ✅ Balance calculated from ledger entries
- [ ] ✅ Transfer creates debit entry in source and credit entry in destination
- [ ] ✅ Ledger entries are in chronological order
- [ ] ✅ Overdraft prevented (cannot withdraw more than balance)
- [ ] ✅ Concurrent transfers handled safely (no race conditions)
- [ ] ✅ Failed transactions fully rolled back
- [ ] ✅ Ledger entries are immutable

---

## Code Quality & Architecture

### Principles Applied

1. **Separation of Concerns**
   - Controllers: HTTP handling
   - Services: Business logic
   - Models: Data access
   - Routes: URL mapping

2. **SOLID Principles**
   - Single Responsibility: Each layer has one reason to change
   - Open/Closed: Extensible without modifying existing code
   - Liskov Substitution: Services can be swapped
   - Interface Segregation: Focused exports
   - Dependency Inversion: Depend on abstractions (pool, not db instance)

3. **Database Transaction Management**
   - Proper BEGIN/COMMIT/ROLLBACK
   - Row-level locks with FOR UPDATE
   - Lock ordering to prevent deadlocks
   - Error handling with rollback

4. **Financial System Best Practices**
   - Double-entry bookkeeping
   - Immutable audit trail
   - No stored balance (derived value)
   - Precision numeric types
   - ACID compliance

---

## Troubleshooting

### Database Connection Issues
**Problem**: "connect ECONNREFUSED 127.0.0.1:5432"
**Solution**:
- Ensure PostgreSQL is running
- Check DATABASE_HOST in docker-compose.yml or .env
- Verify database credentials

### Port Already in Use
**Problem**: "EADDRINUSE :::5000"
**Solution**:
- Change PORT in .env
- Or kill process: `lsof -i :5000`

### Module Not Found Errors
**Problem**: "Cannot find module 'pg'"
**Solution**:
- Run `npm install`
- Check node_modules exists

### Transaction Deadlock
**Problem**: "deadlock detected" error
**Solution**:
- Service layer locks accounts in consistent order (source before destination)
- Should not occur in normal operation

---

## License

MIT License - Feel free to use this project for educational or commercial purposes.

---

## Author

Built as a comprehensive financial system demonstrating ACID properties, double-entry bookkeeping, and robust backend architecture.

Last Updated: January 14, 2026
