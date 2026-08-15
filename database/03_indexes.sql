-- ============================================================================
-- College Budget & PR Management System
-- Database Indexes for Query Optimization
-- File: 03_indexes.sql
-- ============================================================================

-- Index on PRS for fast filtering by department, budget head, date, status
CREATE INDEX idx_prs_dept ON PRS(department_id);
CREATE INDEX idx_prs_budget_head ON PRS(budget_head_id);
CREATE INDEX idx_prs_date ON PRS(pr_date);
CREATE INDEX idx_prs_status ON PRS(status);
CREATE INDEX idx_prs_approval_status ON PRS(approval_status);
CREATE INDEX idx_prs_number ON PRS(pr_number);

-- Index on PR_ITEMS for pr_id lookups
CREATE INDEX idx_pr_items_pr ON PR_ITEMS(pr_id);

-- Index on BUDGET_ALLOCATIONS for lookup by dept and head
CREATE INDEX idx_alloc_dept_head ON BUDGET_ALLOCATIONS(department_id, budget_head_id);
CREATE INDEX idx_alloc_source_code ON BUDGET_ALLOCATIONS(source_budget_code);

-- Index on EXPENDITURES for aggregations
CREATE INDEX idx_exp_pr ON EXPENDITURES(pr_id);
CREATE INDEX idx_exp_dept ON EXPENDITURES(department_id);
CREATE INDEX idx_exp_head ON EXPENDITURES(budget_head_id);
