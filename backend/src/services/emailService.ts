import crypto from 'crypto';

export interface PREmailLog {
  id: string;
  to: string;
  recipientRole: 'Principal' | 'CEO';
  subject: string;
  actionToken: string;
  sentAt: string;
  status: 'SENT' | 'DELIVERED' | 'CLICKED';
}

/**
 * Simulates sending an email notification to Principal or CEO for PR Approval
 */
export function sendPREmailNotification(
  prId: string | number,
  prNumber: string,
  recipientEmail: string,
  role: 'Principal' | 'CEO',
  totalAmount: number,
  departmentName: string,
  purpose: string
): PREmailLog {
  const token = crypto.randomBytes(16).toString('hex');
  const now = new Date().toISOString();
  
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(totalAmount);

  const subject = `[ACTION REQUIRED] PR Approval Request ${prNumber} - ${departmentName} (${formattedAmount})`;

  console.log(`\n==================================================`);
  console.log(`📧 [MOCK EMAIL DISPATCH] To: ${recipientEmail} (${role})`);
  console.log(`📌 Subject: ${subject}`);
  console.log(`📝 Purpose: ${purpose}`);
  console.log(`🔗 Token Link: http://localhost:5173/prs/approve-token?token=${token}&prId=${prId}`);
  console.log(`==================================================\n`);

  return {
    id: `EML-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    to: recipientEmail,
    recipientRole: role,
    subject,
    actionToken: token,
    sentAt: now,
    status: 'SENT'
  };
}
