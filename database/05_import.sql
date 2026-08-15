-- ============================================================================
-- College Budget & PR Management System
-- PL/SQL Stored Procedures & Import Helpers
-- File: 05_import.sql
-- ============================================================================

-- Stored Procedure to Update Allocation Totals
CREATE OR REPLACE PROCEDURE UPDATE_BUDGET_UTILIZATION IS
BEGIN
    -- Reset committed amounts to zero
    UPDATE BUDGET_ALLOCATIONS SET committed_amount = 0;
    
    -- Recalculate committed amounts from PRs
    MERGE INTO BUDGET_ALLOCATIONS ba
    USING (
        SELECT department_id, budget_head_id, SUM(total_amount) AS total_committed
        FROM PRS
        WHERE status != 'Rejected' AND approval_status != 'Rejected'
        GROUP BY department_id, budget_head_id
    ) pr_sum
    ON (ba.department_id = pr_sum.department_id AND ba.budget_head_id = pr_sum.budget_head_id)
    WHEN MATCHED THEN
        UPDATE SET ba.committed_amount = pr_sum.total_committed,
                   ba.updated_at = CURRENT_TIMESTAMP;
                   
    COMMIT;
END;
/
