-- ============================================================================
-- College Budget & PR Management System
-- Database Constraints
-- File: 02_constraints.sql
-- ============================================================================

-- Check Constraint for User Roles
ALTER TABLE USERS ADD CONSTRAINT chk_user_role 
CHECK (role IN ('ADMIN', 'FINANCE', 'HOD', 'DEPARTMENT_USER'));

-- Check Constraint for PR Status
ALTER TABLE PRS ADD CONSTRAINT chk_pr_status 
CHECK (status IN ('Open', 'Approved', 'Pending', 'Rejected', 'Closed'));

-- Check Constraint for PR Approval Status
ALTER TABLE PRS ADD CONSTRAINT chk_pr_approval_status 
CHECK (approval_status IN ('Approved', 'Pending', 'Rejected'));

-- Check Constraint for PR-PO Status
ALTER TABLE PRS ADD CONSTRAINT chk_pr_po_status 
CHECK (pr_po_status IN ('Open', 'Closed', 'In-Process'));

-- Check Constraint for Import Batch Type
ALTER TABLE IMPORT_BATCHES ADD CONSTRAINT chk_import_type 
CHECK (batch_type IN ('BUDGET', 'PR'));
