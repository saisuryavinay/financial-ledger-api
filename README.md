# Financial Ledger API

A robust financial ledger system implementing **double-entry bookkeeping**, supporting deposits, withdrawals, and internal transfers between accounts.  
This project demonstrates **ACID-compliant transactions**, balance integrity, immutable ledger entries, and correct financial modeling.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Setup Instructions](#setup-instructions)
3. [API Endpoints](#api-endpoints)
4. [Design Decisions](#design-decisions)
5. [Architecture Diagram](diagrams/architecture-diagram.png)
6. [Database Schema (ERD)](diagrams/database-schema-erd.jpeg)
7. [Postman Collection](#postman-collection)
8. [Testing and Verification](#testing-and-verification)

---

## Project Overview
This API provides a backend for a mock banking system:

- Accounts with dynamically calculated balances  
- Double-entry bookkeeping model  
- Immutable ledger entries  
- Full ACID transaction guarantees  
- Prevention of overdrafts  
- Safe concurrent operations with row-level locks  

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/financial-ledger-api.git
cd financial-ledger-api
