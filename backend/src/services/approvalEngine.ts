export interface ApprovalLevel {
  levelNumber: number;
  role: string; // e.g. 'CLUB_COORDINATOR', 'HOD', 'FINANCE_CONTROLLER', 'PRINCIPAL'
  label: string;
  isParallel?: boolean;
  slaHours: number;
}

export interface ApprovalMatrixRule {
  id: string;
  name: string;
  appliesTo: 'PR' | 'PO';
  minAmount: number;
  maxAmount: number;
  levels: ApprovalLevel[];
}

export interface ApprovalActionRecord {
  id: string;
  entityType: 'PR' | 'PO';
  entityId: string;
  levelNumber: number;
  approverId: string;
  approverName: string;
  approverRole: string;
  action: 'APPROVE' | 'REJECT' | 'SEND_BACK' | 'DELEGATE';
  comment?: string;
  actedAt: string;
  delegatedToId?: string;
}

export interface DelegatedApprover {
  id: string;
  originalApproverId: string;
  delegatedApproverId: string;
  delegatedApproverName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// Default Approval Matrix Rulebook according to pr-po-system-spec.md
export const DEFAULT_APPROVAL_MATRIX: ApprovalMatrixRule[] = [
  {
    id: 'matrix-tier-1',
    name: 'Micro Spend Tier (<= 15,000)',
    appliesTo: 'PR',
    minAmount: 0,
    maxAmount: 15000,
    levels: [
      { levelNumber: 1, role: 'CLUB_COORDINATOR', label: 'Club Coordinator / Lead', slaHours: 24 }
    ]
  },
  {
    id: 'matrix-tier-2',
    name: 'Department Spend Tier (15,001 - 125,000)',
    appliesTo: 'PR',
    minAmount: 15001,
    maxAmount: 125000,
    levels: [
      { levelNumber: 1, role: 'CLUB_COORDINATOR', label: 'Club Coordinator / Lead', slaHours: 24 },
      { levelNumber: 2, role: 'HOD', label: 'Head of Department (HOD)', slaHours: 48 }
    ]
  },
  {
    id: 'matrix-tier-3',
    name: 'Institutional Spend Tier (125,001 - 1,100,000)',
    appliesTo: 'PR',
    minAmount: 125001,
    maxAmount: 1100000,
    levels: [
      { levelNumber: 1, role: 'CLUB_COORDINATOR', label: 'Club Coordinator / Lead', slaHours: 24 },
      { levelNumber: 2, role: 'HOD', label: 'Head of Department (HOD)', slaHours: 48 },
      { levelNumber: 3, role: 'FINANCE_CONTROLLER', label: 'Finance Controller', slaHours: 48 }
    ]
  },
  {
    id: 'matrix-tier-4',
    name: 'Major Capital Spend Tier (> 1,100,000)',
    appliesTo: 'PR',
    minAmount: 1100001,
    maxAmount: Infinity,
    levels: [
      { levelNumber: 1, role: 'CLUB_COORDINATOR', label: 'Club Coordinator / Lead', slaHours: 24 },
      { levelNumber: 2, role: 'HOD', label: 'Head of Department (HOD)', slaHours: 48 },
      { levelNumber: 3, role: 'FINANCE_CONTROLLER', label: 'Finance Controller', slaHours: 48 },
      { levelNumber: 4, role: 'PRINCIPAL', label: 'Principal / Director', slaHours: 72 }
    ]
  }
];

export class ApprovalEngine {
  private static activeMatrixRules: ApprovalMatrixRule[] = [...DEFAULT_APPROVAL_MATRIX];

  /**
   * Evaluate the matrix to find matching levels for a given amount and entity type
   */
  public static evaluateMatrix(amount: number, entityType: 'PR' | 'PO' = 'PR'): ApprovalLevel[] {
    const matchingRule = this.activeMatrixRules.find(
      (rule) => rule.appliesTo === entityType && amount >= rule.minAmount && amount <= rule.maxAmount
    );

    if (matchingRule) {
      return [...matchingRule.levels];
    }

    // Default fallback to tier 4 for very high amounts or unmatched
    return [...DEFAULT_APPROVAL_MATRIX[DEFAULT_APPROVAL_MATRIX.length - 1].levels];
  }

  /**
   * Snapshot approval levels for a PR or PO at creation time
   */
  public static snapshotApprovalFlow(amount: number, entityType: 'PR' | 'PO' = 'PR') {
    const levels = this.evaluateMatrix(amount, entityType);
    return {
      totalLevels: levels.length,
      currentLevel: 1,
      levelsSnapshot: levels,
      status: 'PENDING_APPROVAL' as const
    };
  }

  /**
   * Advance or process approval action on a request
   */
  public static processAction(
    currentLevel: number,
    totalLevels: number,
    action: 'APPROVE' | 'REJECT' | 'SEND_BACK',
    comment?: string
  ): { nextLevel: number; newStatus: string; isComplete: boolean } {
    if (action === 'REJECT') {
      return { nextLevel: currentLevel, newStatus: 'REJECTED', isComplete: true };
    }

    if (action === 'SEND_BACK') {
      return { nextLevel: 1, newStatus: 'SENT_BACK', isComplete: false };
    }

    if (action === 'APPROVE') {
      if (currentLevel >= totalLevels) {
        return { nextLevel: currentLevel, newStatus: 'APPROVED', isComplete: true };
      }
      return { nextLevel: currentLevel + 1, newStatus: `PENDING_L${currentLevel + 1}`, isComplete: false };
    }

    return { nextLevel: currentLevel, newStatus: 'PENDING', isComplete: false };
  }

  /**
   * Update configurable approval matrix rules
   */
  public static updateMatrixRules(rules: ApprovalMatrixRule[]) {
    this.activeMatrixRules = rules;
  }

  /**
   * Get active approval matrix rules
   */
  public static getMatrixRules(): ApprovalMatrixRule[] {
    return this.activeMatrixRules;
  }
}
