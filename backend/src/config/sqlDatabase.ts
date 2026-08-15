import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { getSeedDepartments, getSeedBudgetHeads, getSeedBudgetAllocations, getSeedPRRecords, getSeedUsers } from '../utils/seedData';

const dbPath = path.resolve(__dirname, '../../database/temp_college_budget.sqlite');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const sqliteDb = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[SQLite DB] Error opening temporary SQL database:', err);
  } else {
    console.log(`[SQLite DB] Temporary SQL Database initialized at: ${dbPath}`);
  }
});

function runSqlAsync(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function querySqlAsync<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

export async function initializeSqlDatabase(): Promise<void> {
  try {
    // 1. Create Tables
    await runSqlAsync(`
      CREATE TABLE IF NOT EXISTS DEPARTMENTS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        category TEXT DEFAULT 'Academic' NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await runSqlAsync(`
      CREATE TABLE IF NOT EXISTS USERS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'DEPARTMENT_USER' NOT NULL,
        department_id INTEGER,
        is_active INTEGER DEFAULT 1 NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES DEPARTMENTS(id)
      );
    `);

    await runSqlAsync(`
      CREATE TABLE IF NOT EXISTS BUDGET_HEADS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code INTEGER NOT NULL UNIQUE,
        name TEXT NOT NULL,
        category TEXT DEFAULT 'Recurring' NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await runSqlAsync(`
      CREATE TABLE IF NOT EXISTS BUDGET_ALLOCATIONS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        department_id INTEGER NOT NULL,
        budget_head_id INTEGER NOT NULL,
        source_budget_code TEXT NOT NULL,
        financial_year TEXT DEFAULT '2026-27' NOT NULL,
        allocated_amount REAL DEFAULT 0.00 NOT NULL,
        committed_amount REAL DEFAULT 0.00 NOT NULL,
        actual_utilized_amount REAL DEFAULT 0.00 NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES DEPARTMENTS(id),
        FOREIGN KEY (budget_head_id) REFERENCES BUDGET_HEADS(id)
      );
    `);

    await runSqlAsync(`
      CREATE TABLE IF NOT EXISTS PRS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pr_number TEXT NOT NULL UNIQUE,
        pr_date TEXT NOT NULL,
        department_id INTEGER NOT NULL,
        budget_head_id INTEGER NOT NULL,
        requested_by TEXT NOT NULL,
        purpose TEXT,
        total_amount REAL DEFAULT 0.00 NOT NULL,
        status TEXT DEFAULT 'Open' NOT NULL,
        approval_status TEXT DEFAULT 'Pending' NOT NULL,
        pr_po_status TEXT DEFAULT 'Open' NOT NULL,
        approval_1 TEXT,
        approval_2 TEXT,
        approval_3 TEXT,
        source_budget_code TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES DEPARTMENTS(id),
        FOREIGN KEY (budget_head_id) REFERENCES BUDGET_HEADS(id)
      );
    `);

    await runSqlAsync(`
      CREATE TABLE IF NOT EXISTS PR_ITEMS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pr_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        product_code TEXT,
        product_type TEXT DEFAULT 'goods',
        product_description TEXT,
        unit_type_name TEXT DEFAULT 'Numbers',
        quantity REAL DEFAULT 1 NOT NULL,
        unit_price REAL DEFAULT 0.00 NOT NULL,
        total_value REAL DEFAULT 0.00 NOT NULL,
        current_stock REAL DEFAULT 0,
        preferred_vendor TEXT,
        product_required_by TEXT,
        item_remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pr_id) REFERENCES PRS(id) ON DELETE CASCADE
      );
    `);

    await runSqlAsync(`
      CREATE TABLE IF NOT EXISTS EXPENDITURES (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pr_id INTEGER NOT NULL,
        department_id INTEGER NOT NULL,
        budget_head_id INTEGER NOT NULL,
        expenditure_date TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        amount REAL NOT NULL,
        payment_status TEXT DEFAULT 'Paid' NOT NULL,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await runSqlAsync(`
      CREATE TABLE IF NOT EXISTS IMPORT_BATCHES (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_type TEXT NOT NULL,
        filename TEXT NOT NULL,
        total_rows INTEGER DEFAULT 0 NOT NULL,
        imported_count INTEGER DEFAULT 0 NOT NULL,
        updated_count INTEGER DEFAULT 0 NOT NULL,
        skipped_count INTEGER DEFAULT 0 NOT NULL,
        error_count INTEGER DEFAULT 0 NOT NULL,
        imported_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await runSqlAsync(`
      CREATE TABLE IF NOT EXISTS IMPORT_ERRORS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id INTEGER NOT NULL,
        row_number INTEGER NOT NULL,
        pr_number TEXT,
        error_message TEXT NOT NULL,
        raw_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES IMPORT_BATCHES(id) ON DELETE CASCADE
      );
    `);

    await runSqlAsync(`
      CREATE TABLE IF NOT EXISTS AUDIT_LOGS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('[SQLite DB] All 10 relational SQL tables created successfully.');

    // 2. Check if initial departments & admin user exist
    const deptRows = await querySqlAsync<{ count: number }>('SELECT COUNT(*) as count FROM DEPARTMENTS');
    if (deptRows[0].count === 0) {
      console.log('[SQLite DB] Populating initial departments and users into database...');
      
      const depts = getSeedDepartments();
      for (const d of depts) {
        await runSqlAsync(
          'INSERT INTO DEPARTMENTS (id, code, name, category) VALUES (?, ?, ?, ?)',
          [d.id, d.code, d.name, d.category]
        );
      }

      const users = getSeedUsers();
      for (const u of users) {
        const defaultHash = '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVym507x8z5S8d5Y9v2wzL8G';
        await runSqlAsync(
          'INSERT INTO USERS (id, name, email, password_hash, role, department_id) VALUES (?, ?, ?, ?, ?, ?)',
          [u.id, u.name, u.email, defaultHash, u.role, u.departmentId || null]
        );
      }

      const heads = getSeedBudgetHeads();
      for (const h of heads) {
        await runSqlAsync(
          'INSERT INTO BUDGET_HEADS (id, code, name, category, description) VALUES (?, ?, ?, ?, ?)',
          [h.id, h.code, h.name, h.category, '']
        );
      }

      const allocs = getSeedBudgetAllocations();
      for (const a of allocs) {
        await runSqlAsync(
          'INSERT INTO BUDGET_ALLOCATIONS (id, department_id, budget_head_id, source_budget_code, financial_year, allocated_amount, committed_amount, actual_utilized_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [a.id, a.departmentId, a.budgetHeadId, a.sourceBudgetCode, a.financialYear || '2026-27', a.allocatedAmount, a.committedAmount, a.actualUtilizedAmount]
        );
      }

      const prs = getSeedPRRecords();
      for (const p of prs) {
        await runSqlAsync(
          'INSERT INTO PRS (id, pr_number, pr_date, department_id, budget_head_id, requested_by, purpose, total_amount, status, approval_status, pr_po_status, source_budget_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [p.id, p.prNumber, p.prDate, p.departmentId, p.budgetHeadId, p.requestedBy, p.purpose || '', p.totalAmount, p.status, p.approvalStatus, p.prPoStatus, p.sourceBudgetCode]
        );

        if (p.items && p.items.length > 0) {
          for (const item of p.items) {
            await runSqlAsync(
              'INSERT INTO PR_ITEMS (pr_id, product_name, product_code, product_type, product_description, unit_type_name, quantity, unit_price, total_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [p.id, item.productName, item.productCode || '', item.productType || 'goods', item.productDescription || '', item.unitTypeName || 'Numbers', item.quantity, item.unitPrice, item.totalValue]
            );
          }
        }
      }

      console.log('[SQLite DB] Initial database population completed.');
    }
  } catch (err) {
    console.error('[SQLite DB Setup Error]', err);
  }
}

export { runSqlAsync, querySqlAsync };
