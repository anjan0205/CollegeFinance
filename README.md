# VIIT College Budget & Procure-to-Pay ERP

A centralized finance and ERP application for Vignan's Institute of Information Technology. It connects institutional budgets and departmental requisitions to vendor onboarding, quotation and RFQ workflows, purchase orders, goods receipt, inventory, invoice matching, payments, approvals, and audit reporting.

The frontend and backend include operational procurement modules. Production use depends on configuring the deployment database, authentication secrets, mail delivery, and institutional approval policy; local/demo behavior must not be treated as production authorization.

---

## 1. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Axios, React Router v6 (Deployed on **Cloudflare Pages**)
- **Backend**: Node.js, Express.js, TypeScript, JWT Authentication, bcrypt, Multer, SheetJS (`xlsx`)
- **Database Architecture**: Multi-Engine Support:
  - **Firebase Firestore** (Direct Cloud NoSQL Mode)
  - **Google Cloud SQL / PostgreSQL** (Relational Cloud Mode)
  - **SQLite** (local persistence mode)

---

## 2. System Architecture

```text
React + Vite Frontend (Cloudflare Pages)
         │
         │ REST API (JSON / JWT Bearer)
         ▼
Express.js Backend (Cloudflare Workers)
         │
         ├──► Firebase Firestore Cloud Database
         ├──► PostgreSQL / Google Cloud SQL
         └──► SQLite (Local Fallback)
```

> 📖 **System Architecture Map**: For current C4 models, component catalog, approval workflows, data lifecycles, RBAC, and persistence details, see [docs/architecture.md](docs/architecture.md).

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
- Firebase Cloud Firestore / PostgreSQL / SQLite Database

### 1. Database Setup
Firestore is the primary store when the backend has a Firebase Admin service account. Keep the credential in the ignored `backend/serviceAccountKey.json` file or configure `FIREBASE_SERVICE_ACCOUNT_JSON`, `FIREBASE_SERVICE_ACCOUNT_BASE64`, or `GOOGLE_APPLICATION_CREDENTIALS`; never commit service-account credentials. The frontend `.env` must contain the Firebase web app values from `frontend/.env.example`.

Start the backend and check `http://localhost:5000/health`. A connected local setup reports `"storage":"firebase"` and `"firebaseDatasetLoaded":true`. When Firebase is configured but cannot be reached, protected API requests return HTTP 503 instead of showing embedded demo figures as live data.

For the optional relational import/fallback database, execute SQL scripts in order:
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
