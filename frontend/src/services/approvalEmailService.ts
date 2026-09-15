export interface EmailMessage {
  id: string;
  to: string;
  from: string;
  subject: string;
  bodyHtml: string;
  timestamp: string;
  recipientRole: 'PRINCIPAL' | 'CEO' | 'ADMIN';
  recordId: string;
  recordType: string;
  recordName: string;
  approvalLevel?: 'principal' | 'ceo';
  token?: string;
  status: 'DELIVERED' | 'ACTIONED';
}

export interface TwoTierApprovalRecord {
  id: string;
  type: string;
  record: any;
  submittedBy: string;
  submittedAt: string;
  status: 'PENDING_PRINCIPAL' | 'PENDING_CEO' | 'APPROVED' | 'REJECTED';
  principalApproval: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    email: string;
    approverName: string;
    token: string;
    actionedAt?: string;
    channel?: 'EMAIL' | 'PORTAL';
    remarks?: string;
  };
  ceoApproval: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    email: string;
    approverName: string;
    token: string;
    actionedAt?: string;
    channel?: 'EMAIL' | 'PORTAL';
    remarks?: string;
  };
  adminNotification: {
    sent: boolean;
    to: string;
    sentAt?: string;
    summary?: string;
  };
  auditTrail: {
    timestamp: string;
    actor: string;
    action: string;
    channel: 'EMAIL' | 'PORTAL' | 'SYSTEM';
    notes: string;
  }[];
}

const STORAGE_KEY_APPROVALS = 'viit_master_2tier_approvals';
const STORAGE_KEY_EMAILS = 'viit_sent_approval_emails';

// Initial Demo Seed Records
const INITIAL_DEMO_APPROVALS: TwoTierApprovalRecord[] = [
  {
    id: 'MAPP-2026-001',
    type: 'vendors',
    record: {
      id: 'VEN-501',
      code: 'VEN433',
      name: 'Vignan Advanced Technologies Pvt Ltd',
      category: 'IT Hardware & Peripherals',
      gstNo: '36AAACV1234A1Z5',
      contactPerson: 'Suresh Kumar',
      email: 'suresh@vignanadvtech.in',
      phone: '+91 98480 22334',
      bankName: 'State Bank of India',
      accountNumber: '39018290123',
      status: 'PENDING_APPROVAL',
      createdAt: '2026-03-14'
    },
    submittedBy: 'Purchase Officer (CSE Dept)',
    submittedAt: '2026-03-14 10:30 AM',
    status: 'PENDING_PRINCIPAL',
    principalApproval: {
      status: 'PENDING',
      email: 'principal@vignan.ac.in',
      approverName: 'Dr. B. V. Ramana Murthy (Principal)',
      token: 'tok_princ_88190'
    },
    ceoApproval: {
      status: 'PENDING',
      email: 'ceo@vignan.ac.in',
      approverName: 'Dr. L. Rathaiah (Chairman & CEO)',
      token: 'tok_ceo_99214'
    },
    adminNotification: {
      sent: false,
      to: 'admin@vignan.ac.in'
    },
    auditTrail: [
      {
        timestamp: '2026-03-14 10:30 AM',
        actor: 'Purchase Officer (CSE Dept)',
        action: 'Master Record Submitted',
        channel: 'PORTAL',
        notes: 'Submitted new vendor for institutional Maker-Checker workflow.'
      },
      {
        timestamp: '2026-03-14 10:31 AM',
        actor: 'VIIT Mail Engine',
        action: 'Email Dispatched to Principal',
        channel: 'EMAIL',
        notes: 'One-Click approval link sent to principal@vignan.ac.in'
      }
    ]
  },
  {
    id: 'MAPP-2026-002',
    type: 'items',
    record: {
      id: 'ITEM-802',
      itemCode: 'LAB-AI-SERVER-01',
      name: 'NVIDIA DGX Station A100 AI Supercomputer',
      category: 'Lab & Scientific Equipment',
      uom: 'NOS',
      unitPrice: 1850000,
      hsnSacCode: '84715000',
      status: 'PENDING_APPROVAL',
      createdAt: '2026-03-14'
    },
    submittedBy: 'HOD CSE (Dr. A. B. Patil)',
    submittedAt: '2026-03-14 11:15 AM',
    status: 'PENDING_CEO',
    principalApproval: {
      status: 'APPROVED',
      email: 'principal@vignan.ac.in',
      approverName: 'Dr. B. V. Ramana Murthy (Principal)',
      token: 'tok_princ_44021',
      actionedAt: '2026-03-14 11:45 AM',
      channel: 'EMAIL',
      remarks: 'Verified technical requirements and budget feasibility for AI CoE.'
    },
    ceoApproval: {
      status: 'PENDING',
      email: 'ceo@vignan.ac.in',
      approverName: 'Dr. L. Rathaiah (Chairman & CEO)',
      token: 'tok_ceo_11094'
    },
    adminNotification: {
      sent: false,
      to: 'admin@vignan.ac.in'
    },
    auditTrail: [
      {
        timestamp: '2026-03-14 11:15 AM',
        actor: 'HOD CSE (Dr. A. B. Patil)',
        action: 'Master Record Submitted',
        channel: 'PORTAL',
        notes: 'New High-Value AI Supercomputer catalog item submitted.'
      },
      {
        timestamp: '2026-03-14 11:45 AM',
        actor: 'Dr. B. V. Ramana Murthy (Principal)',
        action: 'Principal Approved via Email',
        channel: 'EMAIL',
        notes: 'One-Click email approval executed. Forwarded to CEO for final signoff.'
      },
      {
        timestamp: '2026-03-14 11:46 AM',
        actor: 'VIIT Mail Engine',
        action: 'Email Dispatched to CEO',
        channel: 'EMAIL',
        notes: 'One-Click approval link sent to ceo@vignan.ac.in'
      }
    ]
  }
];

export const approvalEmailService = {
  getApprovals(): TwoTierApprovalRecord[] {
    const data = localStorage.getItem(STORAGE_KEY_APPROVALS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_APPROVALS, JSON.stringify(INITIAL_DEMO_APPROVALS));
      this.syncInitialEmails(INITIAL_DEMO_APPROVALS);
      return INITIAL_DEMO_APPROVALS;
    }
    return JSON.parse(data);
  },

  saveApprovals(records: TwoTierApprovalRecord[]) {
    localStorage.setItem(STORAGE_KEY_APPROVALS, JSON.stringify(records));
  },

  getSentEmails(): EmailMessage[] {
    const data = localStorage.getItem(STORAGE_KEY_EMAILS);
    return data ? JSON.parse(data) : [];
  },

  saveSentEmail(email: EmailMessage) {
    const emails = this.getSentEmails();
    emails.unshift(email);
    localStorage.setItem(STORAGE_KEY_EMAILS, JSON.stringify(emails));
  },

  syncInitialEmails(records: TwoTierApprovalRecord[]) {
    records.forEach(rec => {
      if (rec.status === 'PENDING_PRINCIPAL') {
        this.dispatchPrincipalEmail(rec, false);
      } else if (rec.status === 'PENDING_CEO') {
        this.dispatchCEOEmail(rec, false);
      }
    });
  },

  // Dispatch Email to Principal (Level 1)
  dispatchPrincipalEmail(record: TwoTierApprovalRecord, saveToLog = true): EmailMessage {
    const approveUrl = `${window.location.origin}/master-approval/action?id=${record.id}&type=${record.type}&level=principal&action=APPROVE&token=${record.principalApproval.token}`;
    const rejectUrl = `${window.location.origin}/master-approval/action?id=${record.id}&type=${record.type}&level=principal&action=REJECT&token=${record.principalApproval.token}`;

    const email: EmailMessage = {
      id: `EMAIL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      to: record.principalApproval.email,
      from: 'erp-approvals@vignan.ac.in',
      subject: `[ACTION REQUIRED] Master Approval Request: ${record.type.toUpperCase()} - ${record.record.name}`,
      recipientRole: 'PRINCIPAL',
      recordId: record.id,
      recordType: record.type,
      recordName: record.record.name,
      approvalLevel: 'principal',
      token: record.principalApproval.token,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'DELIVERED',
      bodyHtml: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: #1e1b4b; padding: 24px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px;">Vignan's Institute of Information Technology</h2>
            <p style="margin: 6px 0 0; font-size: 12px; color: #a5b4fc;">ERP Institutional Master Data Approval Workflow</p>
          </div>
          
          <div style="padding: 24px; color: #1e293b;">
            <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">
              <span style="font-size: 11px; font-weight: bold; color: #4338ca; text-transform: uppercase;">Tier 1 Approval Required</span>
              <h3 style="margin: 4px 0 0; font-size: 16px; color: #0f172a;">Review: ${record.record.name}</h3>
            </div>

            <p style="font-size: 13px; line-height: 1.5; color: #334155;">
              Dear <strong>Principal (Dr. B. V. Ramana Murthy)</strong>,<br/><br/>
              A new <strong>${record.type.toUpperCase()}</strong> master record has been submitted by <strong>${record.submittedBy}</strong> on <em>${record.submittedAt}</em> and requires your primary verification before proceeding to the CEO signoff.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px;">
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px; font-weight: bold; color: #64748b;">Record Code:</td><td style="padding: 8px; font-family: monospace; font-weight: bold;">${record.record.code || record.record.itemCode || record.record.id}</td></tr>
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px; font-weight: bold; color: #64748b;">Entity Name:</td><td style="padding: 8px; font-weight: bold; color: #0f172a;">${record.record.name}</td></tr>
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px; font-weight: bold; color: #64748b;">Category:</td><td style="padding: 8px;">${record.record.category || 'Standard Master'}</td></tr>
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px; font-weight: bold; color: #64748b;">Details:</td><td style="padding: 8px;">${record.record.gstNo ? `GST: ${record.record.gstNo}` : ''} ${record.record.unitPrice ? `Price: ₹${record.record.unitPrice.toLocaleString('en-IN')}` : ''}</td></tr>
            </table>

            <div style="background: #eef2ff; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
              <p style="margin: 0 0 12px; font-size: 12px; font-weight: bold; color: #3730a3;">Select an action below to instantly update the portal live:</p>
              <div style="display: flex; justify-content: center; gap: 12px;">
                <a href="${approveUrl}" style="background: #16a34a; color: #ffffff; text-decoration: none; padding: 10px 24px; font-size: 13px; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">✅ Approve via Email</a>
                <a href="${rejectUrl}" style="background: #dc2626; color: #ffffff; text-decoration: none; padding: 10px 24px; font-size: 13px; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">❌ Reject via Email</a>
              </div>
            </div>

            <p style="font-size: 11px; color: #64748b; margin-top: 20px;">
              * Note: Upon your approval, the system will automatically forward the signoff notification to the CEO (Dr. L. Rathaiah).
            </p>
          </div>
        </div>
      `
    };

    if (saveToLog) {
      this.saveSentEmail(email);
    }
    return email;
  },

  // Dispatch Email to CEO (Level 2)
  dispatchCEOEmail(record: TwoTierApprovalRecord, saveToLog = true): EmailMessage {
    const approveUrl = `${window.location.origin}/master-approval/action?id=${record.id}&type=${record.type}&level=ceo&action=APPROVE&token=${record.ceoApproval.token}`;
    const rejectUrl = `${window.location.origin}/master-approval/action?id=${record.id}&type=${record.type}&level=ceo&action=REJECT&token=${record.ceoApproval.token}`;

    const email: EmailMessage = {
      id: `EMAIL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      to: record.ceoApproval.email,
      from: 'erp-approvals@vignan.ac.in',
      subject: `[FINAL SIGN-OFF REQUIRED] Master Approval: ${record.type.toUpperCase()} - ${record.record.name}`,
      recipientRole: 'CEO',
      recordId: record.id,
      recordType: record.type,
      recordName: record.record.name,
      approvalLevel: 'ceo',
      token: record.ceoApproval.token,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'DELIVERED',
      bodyHtml: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px;">Vignan's Institute of Information Technology</h2>
            <p style="margin: 6px 0 0; font-size: 12px; color: #cbd5e1;">CEO Executive Final Master Authorization</p>
          </div>
          
          <div style="padding: 24px; color: #1e293b;">
            <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">
              <span style="font-size: 11px; font-weight: bold; color: #15803d; text-transform: uppercase;">Principal Approved & Verified ✅</span>
              <h3 style="margin: 4px 0 0; font-size: 16px; color: #0f172a;">Final Sign-off: ${record.record.name}</h3>
            </div>

            <p style="font-size: 13px; line-height: 1.5; color: #334155;">
              Respected <strong>Chairman & CEO (Dr. L. Rathaiah)</strong>,<br/><br/>
              The Principal (Dr. B. V. Ramana Murthy) has verified and recommended the following <strong>${record.type.toUpperCase()}</strong> master record. Your executive sign-off is required to activate this record into the live ERP system.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px;">
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px; font-weight: bold; color: #64748b;">Entity Name:</td><td style="padding: 8px; font-weight: bold; color: #0f172a;">${record.record.name}</td></tr>
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px; font-weight: bold; color: #64748b;">Code / ID:</td><td style="padding: 8px; font-family: monospace;">${record.record.code || record.record.itemCode || record.record.id}</td></tr>
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px; font-weight: bold; color: #64748b;">Principal Approval:</td><td style="padding: 8px; color: #16a34a; font-weight: bold;">Verified on ${record.principalApproval.actionedAt || 'Today'}</td></tr>
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px; font-weight: bold; color: #64748b;">Principal Remarks:</td><td style="padding: 8px; font-style: italic;">"${record.principalApproval.remarks || 'Recommended for activation'}"</td></tr>
            </table>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
              <p style="margin: 0 0 12px; font-size: 12px; font-weight: bold; color: #1e293b;">Click to authorize live activation:</p>
              <div style="display: flex; justify-content: center; gap: 12px;">
                <a href="${approveUrl}" style="background: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 24px; font-size: 13px; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">✅ Authorize & Activate (CEO)</a>
                <a href="${rejectUrl}" style="background: #dc2626; color: #ffffff; text-decoration: none; padding: 10px 24px; font-size: 13px; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">❌ Reject Request</a>
              </div>
            </div>

            <p style="font-size: 11px; color: #64748b; margin-top: 20px;">
              * Note: Upon your final approval, a confirmation email will be automatically transmitted to the System Admin (admin@vignan.ac.in).
            </p>
          </div>
        </div>
      `
    };

    if (saveToLog) {
      this.saveSentEmail(email);
    }
    return email;
  },

  // Dispatch Confirmation Email to Admin (Upon Final Approval or Rejection)
  dispatchAdminConfirmationEmail(record: TwoTierApprovalRecord): EmailMessage {
    const isApproved = record.status === 'APPROVED';

    const email: EmailMessage = {
      id: `EMAIL-ADMIN-${Date.now()}`,
      to: 'admin@vignan.ac.in',
      from: 'erp-system@vignan.ac.in',
      subject: `[SYSTEM NOTIFICATION] Master Data ${isApproved ? 'ACTIVATED & APPROVED' : 'REJECTED'}: ${record.record.name}`,
      recipientRole: 'ADMIN',
      recordId: record.id,
      recordType: record.type,
      recordName: record.record.name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'DELIVERED',
      bodyHtml: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: ${isApproved ? '#065f46' : '#991b1b'}; padding: 24px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px;">Master Data Authorization Completed</h2>
            <p style="margin: 6px 0 0; font-size: 12px; color: #d1fae5;">Notification Transmitted to System Administrator</p>
          </div>
          
          <div style="padding: 24px; color: #1e293b;">
            <p style="font-size: 13px; line-height: 1.5; color: #334155;">
              Dear <strong>System Administrator</strong>,<br/><br/>
              The Master Data change request for <strong>${record.record.name}</strong> (${record.type.toUpperCase()}) has concluded the 2-tier approval workflow and has been <strong>${record.status}</strong>.
            </p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 12px;">
              <p style="margin: 4px 0;"><strong>Principal Approval:</strong> ✅ ${record.principalApproval.status} by ${record.principalApproval.approverName} (${record.principalApproval.actionedAt || 'N/A'})</p>
              <p style="margin: 4px 0;"><strong>CEO Approval:</strong> ${isApproved ? '✅ APPROVED' : '❌ REJECTED'} by ${record.ceoApproval.approverName} (${record.ceoApproval.actionedAt || 'N/A'})</p>
              <p style="margin: 4px 0;"><strong>Live Master Status:</strong> <span style="font-weight: bold; color: ${isApproved ? '#16a34a' : '#dc2626'};">${record.status}</span></p>
            </div>

            <p style="font-size: 12px; color: #64748b;">
              This record is now updated in the live ERP database registry and ready for institutional transactions.
            </p>
          </div>
        </div>
      `
    };

    this.saveSentEmail(email);
    return email;
  },

  // Process Action via Token / Link
  processApprovalAction(
    id: string,
    level: 'principal' | 'ceo',
    action: 'APPROVE' | 'REJECT',
    token?: string,
    remarks?: string,
    channel: 'EMAIL' | 'PORTAL' = 'EMAIL'
  ): { success: boolean; message: string; record?: TwoTierApprovalRecord } {
    const approvals = this.getApprovals();
    const target = approvals.find(a => a.id === id);

    if (!target) {
      return { success: false, message: 'Approval record not found.' };
    }

    const now = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

    if (level === 'principal') {
      if (token && target.principalApproval.token !== token) {
        return { success: false, message: 'Security token invalid or expired.' };
      }

      target.principalApproval.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      target.principalApproval.actionedAt = now;
      target.principalApproval.channel = channel;
      target.principalApproval.remarks = remarks || (action === 'APPROVE' ? 'Approved via Email One-Click' : 'Rejected via Email');

      if (action === 'APPROVE') {
        target.status = 'PENDING_CEO';
        target.auditTrail.push({
          timestamp: now,
          actor: target.principalApproval.approverName,
          action: `Principal Approved (${channel})`,
          channel,
          notes: target.principalApproval.remarks
        });

        // Automatically dispatch Email to CEO!
        this.dispatchCEOEmail(target);
        target.auditTrail.push({
          timestamp: now,
          actor: 'VIIT Mail Engine',
          action: 'CEO Approval Email Dispatched',
          channel: 'EMAIL',
          notes: 'One-Click approval link sent to ceo@vignan.ac.in'
        });
      } else {
        target.status = 'REJECTED';
        target.auditTrail.push({
          timestamp: now,
          actor: target.principalApproval.approverName,
          action: `Principal Rejected (${channel})`,
          channel,
          notes: target.principalApproval.remarks
        });

        // Notify Admin of rejection
        this.dispatchAdminConfirmationEmail(target);
      }
    } else if (level === 'ceo') {
      if (token && target.ceoApproval.token !== token) {
        return { success: false, message: 'Security token invalid or expired.' };
      }

      target.ceoApproval.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      target.ceoApproval.actionedAt = now;
      target.ceoApproval.channel = channel;
      target.ceoApproval.remarks = remarks || (action === 'APPROVE' ? 'Final Executive Authorization granted via Email' : 'Rejected by CEO');

      if (action === 'APPROVE') {
        target.status = 'APPROVED';
        target.record.status = 'APPROVED';
        target.auditTrail.push({
          timestamp: now,
          actor: target.ceoApproval.approverName,
          action: `CEO Final Signoff (${channel})`,
          channel,
          notes: target.ceoApproval.remarks
        });

        // Automatically send confirmation email to Admin!
        target.adminNotification.sent = true;
        target.adminNotification.sentAt = now;
        target.adminNotification.summary = `Approved by Principal & CEO. Master Record ${target.record.name} activated.`;
        this.dispatchAdminConfirmationEmail(target);

        target.auditTrail.push({
          timestamp: now,
          actor: 'VIIT Mail Engine',
          action: 'Admin Confirmation Email Sent',
          channel: 'EMAIL',
          notes: 'Confirmation dispatched to admin@vignan.ac.in'
        });
      } else {
        target.status = 'REJECTED';
        target.record.status = 'REJECTED';
        target.auditTrail.push({
          timestamp: now,
          actor: target.ceoApproval.approverName,
          action: `CEO Rejected (${channel})`,
          channel,
          notes: target.ceoApproval.remarks
        });

        // Notify Admin of rejection
        this.dispatchAdminConfirmationEmail(target);
      }
    }

    this.saveApprovals(approvals);

    return {
      success: true,
      message: `Approval action (${action}) successfully recorded for ${level.toUpperCase()}.`,
      record: target
    };
  }
};
