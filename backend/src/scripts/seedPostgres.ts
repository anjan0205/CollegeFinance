import { runFullImport } from './importExcelData';
import { initializePostgres, executePgQuery } from '../config/postgresDatabase';
import crypto from 'crypto';

async function seedPostgres() {
  console.log('🏁 Starting PostgreSQL Seeding Script for Firebase Data Connect...');

  const initialized = await initializePostgres();
  if (!initialized) {
    console.error('❌ PostgreSQL failed to initialize.');
    process.exit(1);
  }

  try {
    // 1. Drop old custom case-sensitive tables if they exist
    console.log('🧹 Cleaning up custom case-sensitive tables...');
    await executePgQuery(`
      DROP TABLE IF EXISTS "ImporterErrorRecord" CASCADE;
      DROP TABLE IF EXISTS "ImportBatch" CASCADE;
      DROP TABLE IF EXISTS "PurchaseRequestItem" CASCADE;
      DROP TABLE IF EXISTS "PurchaseRequest" CASCADE;
      DROP TABLE IF EXISTS "BudgetAllocation" CASCADE;
      DROP TABLE IF EXISTS "BudgetHead" CASCADE;
      DROP TABLE IF EXISTS "User" CASCADE;
      DROP TABLE IF EXISTS "Department" CASCADE;
    `);

    // 2. Truncate official lowercase Data Connect tables
    console.log('🗑️ Truncating empty lowercase Data Connect tables...');
    await executePgQuery('TRUNCATE TABLE import_error_record, import_batch, purchase_request_item, purchase_request, budget_allocation, budget_head, "user", department CASCADE;');

    // 3. Parse Excel data
    console.log('📊 Parsing Excel workbook data...');
    const data = await runFullImport();
    
    const { departments, budgetHeads, allocations, prs } = data;

    const deptIdMap = new Map<number, string>();
    const headIdMap = new Map<number, string>();
    const prIdMap = new Map<number, string>();

    // 4. Seed Departments
    console.log('⚙️ Seeding Departments...');
    for (const d of departments) {
      const uuid = crypto.randomUUID();
      deptIdMap.set(d.id, uuid);
      await executePgQuery(
        'INSERT INTO department (id, dept_code, dept_name, category) VALUES ($1, $2, $3, $4)',
        [uuid, d.code, d.name, d.category]
      );
    }

    // 5. Seed Users
    console.log('👤 Seeding Users...');
    const defaultUsers = [
      { name: 'System Admin', email: 'admin@vignan.ac.in', role: 'ADMIN', departmentCode: 'DOA' },
      { name: 'Finance Officer', email: 'finance@vignan.ac.in', role: 'FINANCE', departmentCode: 'FINANCE' },
      { name: 'Dr. CSE HOD', email: 'hod.cse@vignan.ac.in', role: 'HOD', departmentCode: 'CSE' },
      { name: 'Dr. ECE HOD', email: 'hod.ece@vignan.ac.in', role: 'HOD', departmentCode: 'ECE' }
    ];
    
    let adminUuid = '';
    const deptCodeToUuidMap = new Map(departments.map((d: any) => [d.code, deptIdMap.get(d.id)]));
    for (const u of defaultUsers) {
      const uuid = crypto.randomUUID();
      if (u.role === 'ADMIN') {
        adminUuid = uuid;
      }
      const deptUuid = deptCodeToUuidMap.get(u.departmentCode) || null;
      await executePgQuery(
        'INSERT INTO "user" (id, name, email, role, department_id) VALUES ($1, $2, $3, $4, $5)',
        [uuid, u.name, u.email, u.role, deptUuid]
      );
    }

    // 6. Seed Budget Heads
    console.log('⚙️ Seeding Budget Heads...');
    for (const bh of budgetHeads) {
      const uuid = crypto.randomUUID();
      headIdMap.set(bh.id, uuid);
      await executePgQuery(
        'INSERT INTO budget_head (id, budget_head_code, name, category, description) VALUES ($1, $2, $3, $4, $5)',
        [uuid, bh.code, bh.name, bh.category, bh.description || '']
      );
    }

    // 7. Bulk Seed Budget Allocations
    console.log('⚙️ Bulk Seeding Budget Allocations...');
    const batchSize = 100;
    for (let i = 0; i < allocations.length; i += batchSize) {
      const chunk = allocations.slice(i, i + batchSize);
      const valuePlaceholders: string[] = [];
      const values: any[] = [];
      let paramCounter = 1;

      for (const a of chunk) {
        const uuid = crypto.randomUUID();
        const deptUuid = deptIdMap.get(a.departmentId);
        const headUuid = headIdMap.get(a.budgetHeadId);

        const rowPlaceholders = [
          `$${paramCounter++}`, `$${paramCounter++}`, `$${paramCounter++}`, `$${paramCounter++}`,
          `$${paramCounter++}`, `$${paramCounter++}`, `$${paramCounter++}`, `$${paramCounter++}`,
          `$${paramCounter++}`, `$${paramCounter++}`, `$${paramCounter++}`
        ];
        valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
        
        values.push(
          uuid, deptUuid, headUuid, a.sourceBudgetCode, a.financialYear,
          a.allocatedAmount, a.committedAmount, a.actualUtilizedAmount,
          a.remainingAmount, a.utilizationPercentage, a.alertStatus
        );
      }

      const query = `
        INSERT INTO budget_allocation 
          (id, department_id, budget_head_id, source_budget_code, financial_year, 
           allocated_amount, committed_amount, actual_utilized_amount, remaining_amount, 
           utilization_percentage, alert_status) 
        VALUES ${valuePlaceholders.join(', ')}
      `;
      await executePgQuery(query, values);
    }

    // 8. Seed PRs & PR Items
    console.log('⚙️ Bulk Seeding Purchase Requests (PRs)...');
    
    prs.forEach((p: any) => {
      prIdMap.set(p.id, crypto.randomUUID());
    });

    for (let i = 0; i < prs.length; i += batchSize) {
      const chunk = prs.slice(i, i + batchSize);
      const valuePlaceholders: string[] = [];
      const values: any[] = [];
      let paramCounter = 1;

      for (const p of chunk) {
        const prUuid = prIdMap.get(p.id);
        const deptUuid = deptIdMap.get(p.departmentId);
        const headUuid = headIdMap.get(p.budgetHeadId);

        const rowPlaceholders = [
          `$${paramCounter++}`, `$${paramCounter++}`, `$${paramCounter++}`, `$${paramCounter++}`,
          `$${paramCounter++}`, `$${paramCounter++}`, `$${paramCounter++}`, `$${paramCounter++}`,
          `$${paramCounter++}`, `$${paramCounter++}`, `$${paramCounter++}`, `$${paramCounter++}`,
          `$${paramCounter++}`, `$${paramCounter++}`, `$${paramCounter++}`
        ];
        valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
        
        values.push(
          prUuid, p.prNumber, p.prDate, deptUuid, headUuid, p.requestedBy,
          p.purpose || '', p.totalAmount, p.status, p.approvalStatus, p.prPoStatus,
          p.approval1 || '', p.approval2 || '', p.approval3 || '', p.sourceBudgetCode
        );
      }

      const query = `
        INSERT INTO purchase_request 
          (id, pr_number, pr_date, department_id, budget_head_id, requested_by, 
           purpose, total_amount, status, approval_status, pr_po_status, 
           approval1, approval2, approval3, source_budget_code) 
        VALUES ${valuePlaceholders.join(', ')}
      `;
      await executePgQuery(query, values);
    }

    // Seed PR Items
    console.log('⚙️ Bulk Seeding Purchase Request Items...');
    const allItems: any[] = [];
    prs.forEach((p: any) => {
      if (p.items && p.items.length > 0) {
        p.items.forEach((item: any) => {
          allItems.push({
            ...item,
            prUuid: prIdMap.get(item.prId)
          });
        });
      }
    });

    for (let i = 0; i < allItems.length; i += batchSize) {
      const chunk = allItems.slice(i, i + batchSize);
      const valuePlaceholders: string[] = [];
      const values: any[] = [];
      let paramCounter = 1;

    for (const item of chunk) {
      const itemUuid = crypto.randomUUID();
      const rowPlaceholders = [
        `$${paramCounter++}`, `$${paramCounter++}`, `$${paramCounter++}`, `$${paramCounter++}`,
        `$${paramCounter++}`, `$${paramCounter++}`, `$${paramCounter++}`, `$${paramCounter++}`,
        `$${paramCounter++}`, `$${paramCounter++}`, `$${paramCounter++}`, `$${paramCounter++}`,
        `$${paramCounter++}`, `$${paramCounter++}`
      ];
      valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
      
      const qty = Math.round(Number(item.quantity) || 0);
      const stock = Math.round(Number(item.currentStock) || 0);

      values.push(
        itemUuid, item.prUuid, item.productName, item.productCode || '', item.productType || 'goods',
        item.productDescription || '', item.unitTypeName || 'Numbers', qty,
        item.unitPrice, item.totalValue, stock, item.preferredVendor || '',
        item.productRequiredBy || '', item.itemRemarks || ''
      );
    }

      const query = `
        INSERT INTO purchase_request_item 
          (id, purchase_request_id, product_name, product_code, product_type, product_description, 
           unit_type_name, quantity, unit_price, total_value, current_stock, preferred_vendor, 
           product_required_by, item_remarks) 
        VALUES ${valuePlaceholders.join(', ')}
      `;
      await executePgQuery(query, values);
    }

    // 9. Initial Import Batch
    const batchUuid = crypto.randomUUID();
    const now = new Date().toISOString();
    await executePgQuery(
      'INSERT INTO import_batch (id, batch_type, filename, total_rows, imported_count, updated_count, skipped_count, error_count, imported_by_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [batchUuid, 'PR', 'reference_excel.xlsx', allItems.length, prs.length, 0, 0, 0, adminUuid, now]
    );

    console.log('\n============================================================');
    console.log(`🎉 POSTGRESQL CLOUD SQL SEEDING COMPLETED FOR DATA CONNECT!`);
    console.log(`   Seeded: ${departments.length} Depts, ${budgetHeads.length} Heads, ${allocations.length} Allocations, ${prs.length} PRs, ${allItems.length} Items.`);
    console.log('============================================================\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
}

seedPostgres();
