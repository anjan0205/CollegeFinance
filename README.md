# College Budget & PR Management System

A production-grade, centralized web application built for an engineering college (Vignan's Institute of Information Technology) to replace Excel-based budget analysis and PR tracking workflows.

The system normalizes raw financial Excel workbooks into an Oracle database schema and provides real-time financial dashboards, department utilization analytics, budget head monitoring, PR tracking, and Excel data import capabilities.

> [!NOTE]
> **Financial Monitoring Scope**: Per business requirements, this system is **NOT** a procurement transaction engine. It intentionally omits PR Creation, PR Editing, Vendor Management, and PO Generation. PRs are imported and tracked strictly for financial monitoring, budget commitment analysis, and reporting.

---

## 1. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Axios, React Router v6
- **Backend**: Node.js, Express.js, TypeScript, Oracle Database (`oracledb` Node.js driver), JWT Authentication, bcrypt, Multer, SheetJS (`xlsx`)
- **Database**: Oracle Database (DDL scripts: `VARCHAR2`, `NUMBER`, `TIMESTAMP`, `CLOB`, sequences/identity, constraints, PL/SQL procedures)

---

## 2. System Architecture

```text
React + Vite Frontend (Port 5173)
         │
         │ REST API (JSON / JWT Bearer)
         ▼
Express.js + Node.js Backend (Port 5000)
         │
         │ oracledb (Connection Pooling / createPool)
         ▼
  Oracle Database
```

---

## 3. Database SQL Scripts (`/database`)

- [`01_schema.sql`](file:///c:/Users/SAI%20SAMPATH/Desktop/Clg%20PR%20web/database/01_schema.sql): Creates `DEPARTMENTS`, `USERS`, `BUDGET_HEADS`, `BUDGET_ALLOCATIONS`, `PRS`, `PR_ITEMS`, `EXPENDITURES`, `IMPORT_BATCHES`, `IMPORT_ERRORS`, and `AUDIT_LOGS` tables.
- [`02_constraints.sql`](file:///c:/Users/SAI%20SAMPATH/Desktop/Clg%20PR%20web/database/02_constraints.sql): Adds Foreign Keys, Unique constraints, and Check constraints.
- [`03_indexes.sql`](file:///c:/Users/SAI%20SAMPATH/Desktop/Clg%20PR%20web/database/03_indexes.sql): Performance indexes on department, budget head, status, and PR number.
- [`04_seed.sql`](file:///c:/Users/SAI%20SAMPATH/Desktop/Clg%20PR%20web/database/04_seed.sql): Populates initial Admin, Finance, and HOD users.
- [`05_import.sql`](file:///c:/Users/SAI%20SAMPATH/Desktop/Clg%20PR%20web/database/05_import.sql): PL/SQL procedure `UPDATE_BUDGET_UTILIZATION` for recalculating commitments.

---

## 4. User Roles & Access Control Matrix

| Function / Module | Admin | Finance | HOD | Department User |
| :--- | :---: | :---: | :---: | :---: |
| **View Master Budget** | ✅ All | ✅ All | 🔒 Dept Only | 🔒 Dept Only |
| **View Departments** | ✅ All | ✅ All | 🔒 Dept Only | 🔒 Dept Only |
| **View PR Management** | ✅ All | ✅ All | 🔒 Dept Only | 🔒 Dept Only |
| **View Reports** | ✅ All | ✅ All | 🔒 Dept Only | 🔒 Dept Only |
| **Excel Data Import** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **User Management** | ✅ Yes | ❌ No | ❌ No | ❌ No |

### Default Credentials (for Quick Demo Switch)
- **Admin**: `admin@vignan.ac.in` / `Admin@123`
- **Finance**: `finance@vignan.ac.in` / `Admin@123`
- **CSE HOD**: `hod.cse@vignan.ac.in` / `Admin@123`
- **ECE HOD**: `hod.ece@vignan.ac.in` / `Admin@123`

---

## 5. API Documentation

### Authentication
- `POST /api/auth/login` - Authenticate user and issue JWT token
- `GET /api/auth/profile` - Fetch current user profile

### Dashboard Analytics
- `GET /api/dashboard/summary` - Aggregate financial KPIs (Total Budget, Utilized, Remaining, PR counts)
- `GET /api/dashboard/department-utilization` - Department budget comparison bar chart data
- `GET /api/dashboard/monthly-pr` - Monthly PR value trend data
- `GET /api/dashboard/pr-status` - PR status distribution pie chart data
- `GET /api/dashboard/top-spenders` - Ranked top spending departments
- `GET /api/dashboard/budget-alerts` - Categorized threshold alerts (<70%, 70-85%, 85-100%, >100%)

### Budget & Departments
- `GET /api/budgets` - Master Budget table (122 Budget Heads) with search, filter, pagination, export
- `GET /api/budgets/:id` - Budget head breakdown by department
- `GET /api/departments` - List of departments with allocation & utilization metrics
- `GET /api/departments/:id` - Department detail overview, budget head breakdown & department PRs

### PR Tracking
- `GET /api/prs` - PR table with search, multi-field filters, date range, amount range, sorting, pagination
- `GET /api/prs/:id` - Read-only PR details modal with header info, approval timeline & line items

### Reports & Data Import
- `GET /api/reports/departments` - Department financial report
- `GET /api/reports/budget-heads` - Budget Head financial report
- `GET /api/reports/monthly` - Monthly PR trend report
- `GET /api/reports/pr-status` - PR status summary report
- `POST /api/import/pr` - Upload and process PR Excel workbook (Admin & Finance)
- `POST /api/import/budget` - Upload and process Master Budget Excel workbook (Admin & Finance)

---

## 6. Setup & Installation

### Prerequisites
- Node.js v18+
- Oracle Database 19c/21c (or Oracle XE)

### 1. Database Setup
Execute SQL scripts in order:
```sql
@database/01_schema.sql
@database/02_constraints.sql
@database/03_indexes.sql
@database/04_seed.sql
@database/05_import.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open browser at `http://localhost:5173`.
