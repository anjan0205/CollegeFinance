export interface LegalSection {
  title: string;
  content: string[];
}

export interface LegalDocument {
  id: string;
  slug: string;
  title: string;
  category: string;
  lastUpdated: string;
  summary: string;
  iconName: string;
  sections: LegalSection[];
}

export const LEGAL_DOCUMENTS: Record<string, LegalDocument> = {
  privacy: {
    id: 'privacy',
    slug: 'privacy',
    title: 'Privacy Policy',
    category: 'Privacy & Data',
    lastUpdated: 'October 15, 2025',
    summary: 'Details on how VIIT College collects, uses, stores, and protects student, faculty, and vendor data across all institutional budget and PR management services.',
    iconName: 'Shield',
    sections: [
      {
        title: '1. Information We Collect',
        content: [
          'We collect information necessary to provide administrative, academic, and financial budget allocation services at VIIT College.',
          'Personal identification details: Name, institutional email (@viit.ac.in), employee ID, departmental affiliation, and phone contact.',
          'Financial & Procurement Data: Purchase requisition details, vendor invoices, sanctioned budgets, audit logs, and approval timestamps.'
        ]
      },
      {
        title: '2. How We Use Information',
        content: [
          'To process departmental budget proposals and multi-tier Purchase Requisitions (PRs).',
          'To maintain verifiable audit trails required by institutional governance and accreditation authorities (NAAC / NBA).',
          'To send automated email and portal notifications regarding PR approvals, budget threshold alerts, and compliance requests.'
        ]
      },
      {
        title: '3. Data Retention & Security',
        content: [
          'All institutional records are retained in compliance with college financial bylaws (minimum 7 fiscal years).',
          'Data is encrypted at rest using AES-256 and in transit via TLS 1.3 encryption protocols.'
        ]
      },
      {
        title: '4. Your Data Rights',
        content: [
          'Faculty and administrative users can request an export of their transaction logs or request rectification of personal profile information via the IT & Finance Office.'
        ]
      }
    ]
  },
  terms: {
    id: 'terms',
    slug: 'terms',
    title: 'Terms of Service',
    category: 'Legal Agreements',
    lastUpdated: 'November 1, 2025',
    summary: 'Rules, obligations, and terms of usage governing the VIIT College Budget & Purchase Requisition portal for staff, HODs, and administrators.',
    iconName: 'FileCheck',
    sections: [
      {
        title: '1. Acceptance of Terms',
        content: [
          'By accessing or using the VIIT College Budget & PR Management Platform, you agree to be bound by these Terms of Service and all applicable college regulations.',
          'Access is restricted to authorized personnel including Department Heads, Faculty Requisitioners, Finance Officers, and College Administrators.'
        ]
      },
      {
        title: '2. Account Responsibilities',
        content: [
          'Users must maintain the confidentiality of institutional credentials.',
          'Sharing account passwords or approving requisitions on behalf of unauthorized personnel is strictly prohibited and subject to disciplinary action.'
        ]
      },
      {
        title: '3. Purchase Requisitions & Financial Commitments',
        content: [
          'Submitting a Purchase Requisition constitutes an official departmental request subject to budget availability and administrative sanction.',
          'Approvals at any tier (HOD, Finance, Principal) are legally binding commitments within the college procurement framework.'
        ]
      },
      {
        title: '4. Limitation of Liability',
        content: [
          'VIIT College IT services are provided on an institutional basis. The college reserves the right to suspend or update system modules during designated maintenance windows.'
        ]
      }
    ]
  },
  cookies: {
    id: 'cookies',
    slug: 'cookies',
    title: 'Cookie Policy',
    category: 'Privacy & Data',
    lastUpdated: 'September 20, 2025',
    summary: 'Explanation of how session cookies, security tokens, and performance metrics are used within the budgeting portal.',
    iconName: 'Cookie',
    sections: [
      {
        title: '1. What Are Cookies',
        content: [
          'Cookies are small text files stored in your web browser that allow the system to recognize your authenticated session and preserve your preferences.'
        ]
      },
      {
        title: '2. Essential Cookies',
        content: [
          'Auth Token & Session Identity: Keeps you securely logged in across pages.',
          'CSRF Protection Token: Safeguards form submissions against malicious cross-site attacks.',
          'Role & Department Cache: Optimizes dashboard load times for active users.'
        ]
      },
      {
        title: '3. Analytical & Preference Cookies',
        content: [
          'UI Theme & View Preferences: Remembers grid layouts, table density, and filter states.',
          'Performance Monitoring: Measures API response times and page render speeds to diagnose system bottlenecks.'
        ]
      },
      {
        title: '4. Managing Cookie Choices',
        content: [
          'You can customize non-essential cookie permissions anytime via the Cookie Preferences portal or through your browser settings.'
        ]
      }
    ]
  },
  refund: {
    id: 'refund',
    slug: 'refund',
    title: 'Refund Policy',
    category: 'Commercial & Financial',
    lastUpdated: 'August 12, 2025',
    summary: 'Guidelines on budget reversals, vendor advances, cancelled requisitions, and institutional reimbursement processing.',
    iconName: 'RefreshCcw',
    sections: [
      {
        title: '1. Requisition Budget Restoration',
        content: [
          'When an approved or pending Purchase Requisition is cancelled before vendor disbursement, allocated budget heads are automatically credited back to the department within 24 hours.'
        ]
      },
      {
        title: '2. Vendor Advance Reversals',
        content: [
          'If an advance payment was released to an external supplier and goods/services fail delivery verification, the Finance Section initiates a formal recovery claim according to PO terms.'
        ]
      },
      {
        title: '3. Faculty & Staff Reimbursements',
        content: [
          'Reimbursement claims for urgent departmental expenses must be accompanied by valid tax invoices (GSTIN) and approved by the Dean of Finance.'
        ]
      }
    ]
  },
  cancellation: {
    id: 'cancellation',
    slug: 'cancellation',
    title: 'Cancellation Policy',
    category: 'Commercial & Financial',
    lastUpdated: 'July 5, 2025',
    summary: 'Policies governing PR withdrawal, multi-tier approval cancellation, and vendor contract terminations.',
    iconName: 'Ban',
    sections: [
      {
        title: '1. PR Withdrawal by Initiator',
        content: [
          'Requisitioners may cancel a pending PR at any stage prior to final Principal approval directly from their PR Management workspace.'
        ]
      },
      {
        title: '2. Administrative Cancellation',
        content: [
          'Finance Officers or the Principal hold the right to reject or cancel requisitions citing budgetary constraints, duplicate requests, or non-compliant quotations.'
        ]
      },
      {
        title: '3. Notice of Cancellation',
        content: [
          'Automated email notifications and system audit entries are generated upon any cancellation, noting the required justification.'
        ]
      }
    ]
  },
  shipping: {
    id: 'shipping',
    slug: 'shipping',
    title: 'Shipping Policy',
    category: 'Commercial & Financial',
    lastUpdated: 'June 18, 2025',
    summary: 'Institutional material handling, delivery protocols, central store receiving, and gate entry procedures.',
    iconName: 'Truck',
    sections: [
      {
        title: '1. Central Store Delivery',
        content: [
          'All physical goods ordered through college purchase orders must be consigned directly to VIIT Central Stores, Main Campus.'
        ]
      },
      {
        title: '2. Inward Gate Entry & Inspection',
        content: [
          'Goods Inward Note (GIN) is generated upon initial physical arrival and dock inspection.',
          'Consignments require Department Technical Verification within 3 working days prior to final store stock entry.'
        ]
      },
      {
        title: '3. Freight and Transit Insurance',
        content: [
          'Vendors must supply FOB Destination unless explicitly specified otherwise in the sanctioned Purchase Order.'
        ]
      }
    ]
  },
  returns: {
    id: 'returns',
    slug: 'returns',
    title: 'Return / Exchange Policy',
    category: 'Commercial & Financial',
    lastUpdated: 'May 30, 2025',
    summary: 'Procedures for defective lab equipment, damaged consignments, warranty replacements, and RMA tracking.',
    iconName: 'RotateCcw',
    sections: [
      {
        title: '1. Defective Material Reporting',
        content: [
          'If delivered items do not match technical specifications or exhibit shipping damage, a Rejection Memo is created in the system within 7 days of inspection.'
        ]
      },
      {
        title: '2. Warranty & Return Processing',
        content: [
          'Vendors are provided 14 business days to replace rejected hardware or software licensing keys at zero additional cost to the college.'
        ]
      },
      {
        title: '3. Asset Register Adjustments',
        content: [
          'The Central Asset Management ledger is updated immediately upon formal acceptance of replacement equipment.'
        ]
      }
    ]
  },
  disclaimer: {
    id: 'disclaimer',
    slug: 'disclaimer',
    title: 'Disclaimer',
    category: 'Legal Agreements',
    lastUpdated: 'January 10, 2026',
    summary: 'Legal disclaimers regarding real-time budget forecasting estimates, system availability, and third-party links.',
    iconName: 'AlertTriangle',
    sections: [
      {
        title: '1. Budget Estimates & Predictive Analytics',
        content: [
          'Projected budget utilizations and burn rates displayed on the analytics dashboard are computational estimates based on historical spending curves and pending PR states.',
          'Official financial sanctions are determined solely by approved ledger figures maintained by the Finance Department.'
        ]
      },
      {
        title: '2. System Availability',
        content: [
          'While we target 99.9% portal uptime, uninterrupted service during unscheduled infrastructure outages or external payment gateway disruptions cannot be guaranteed.'
        ]
      }
    ]
  },
  accessibility: {
    id: 'accessibility',
    slug: 'accessibility',
    title: 'Accessibility Statement',
    category: 'Compliance & Standards',
    lastUpdated: 'February 14, 2026',
    summary: 'Commitment to digital accessibility, WCAG 2.1 AA compliance, keyboard navigation, and assistive technologies.',
    iconName: 'Eye',
    sections: [
      {
        title: '1. Our Accessibility Commitment',
        content: [
          'VIIT College is committed to ensuring digital accessibility for people with disabilities in accordance with WCAG 2.1 Level AA standards.',
          'We continually improve the user experience for all faculty, staff, and auditors.'
        ]
      },
      {
        title: '2. Assistive Features Implemented',
        content: [
          'Full keyboard navigability across all data tables, budget modulators, and approval modals.',
          'High-contrast color modes and scalable typography compliant with screen readers (NVDA, JAWS, VoiceOver).',
          'Descriptive ARIA labels and structured semantic landmark tags on every view.'
        ]
      },
      {
        title: '3. Feedback & Assistance',
        content: [
          'If you encounter an accessibility barrier on our portal, please contact accessibility@viit.ac.in for immediate resolution.'
        ]
      }
    ]
  },
  dpa: {
    id: 'dpa',
    slug: 'dpa',
    title: 'Data Processing Agreement (DPA)',
    category: 'Compliance & Standards',
    lastUpdated: 'January 28, 2026',
    summary: 'Agreement governing processing of institutional data, sub-processors, encryption standards, and GDPR / DPDP compliance.',
    iconName: 'Database',
    sections: [
      {
        title: '1. Scope and Applicability',
        content: [
          'This DPA applies to all processing of institutional financial and identity records conducted by cloud hosting and software infrastructure providers.',
          'The College acts as the Data Controller; third-party service providers act strictly as Data Processors.'
        ]
      },
      {
        title: '2. Sub-processors and Cloud Infrastructure',
        content: [
          'Firebase & Google Cloud Platform are designated tier-1 sub-processors maintaining ISO 27001 and SOC 2 Type II certifications.',
          'Data is localized within domestic sovereign data center regions in compliance with National Data Governance policies.'
        ]
      },
      {
        title: '3. Incident Notification & Audit Rights',
        content: [
          'Any security anomaly or unauthorized access event must be communicated to the Chief Information Security Officer within 24 hours.'
        ]
      }
    ]
  },
  'acceptable-use': {
    id: 'acceptable-use',
    slug: 'acceptable-use',
    title: 'Acceptable Use Policy',
    category: 'Governance & Conduct',
    lastUpdated: 'November 15, 2025',
    summary: 'Mandatory rules of conduct, security hygiene, and authorized computational use of college financial systems.',
    iconName: 'CheckSquare',
    sections: [
      {
        title: '1. Permitted Uses',
        content: [
          'The budget portal is strictly for legitimate VIIT academic, research, departmental, and administrative procurement operations.'
        ]
      },
      {
        title: '2. Prohibited Activities',
        content: [
          'Attempting to circumvent role-based access controls (RBAC) or escalate privileges.',
          'Executing automated scraping, stress testing, or vulnerability probes without explicit written consent from the IT Security Committee.',
          'Fabricating quotation documents, inflating price values, or approving unauthorized personal expenditures.'
        ]
      },
      {
        title: '3. Enforcement & Penalties',
        content: [
          'Violations may lead to immediate account suspension, formal institutional inquiry, and reporting to the College Disciplinary Board.'
        ]
      }
    ]
  },
  security: {
    id: 'security',
    slug: 'security',
    title: 'Security Policy',
    category: 'Compliance & Standards',
    lastUpdated: 'December 5, 2025',
    summary: 'Technical and organizational security measures, firewall architecture, role separation, and vulnerability management.',
    iconName: 'Lock',
    sections: [
      {
        title: '1. Architecture & Threat Defense',
        content: [
          'Multi-layered defense with Cloudflare Web Application Firewall (WAF), rate limiting, and automated DDoS mitigation.',
          'Continuous vulnerability scanning and automated static code analysis across deployment pipelines.'
        ]
      },
      {
        title: '2. Access Controls & Session Hygiene',
        content: [
          'Strict Role-Based Access Control (RBAC) enforced on both client and database levels via Firestore Security Rules.',
          'Automatic session timeout after 30 minutes of inactivity and mandatory re-authentication for high-value financial actions.'
        ]
      },
      {
        title: '3. Backup & Disaster Recovery',
        content: [
          'Automated daily database snapshots with 30-day point-in-time recovery capabilities.',
          'Tested disaster recovery runbook ensuring a Recovery Point Objective (RPO) < 15 minutes and Recovery Time Objective (RTO) < 1 hour.'
        ]
      }
    ]
  },
  'responsible-disclosure': {
    id: 'responsible-disclosure',
    slug: 'responsible-disclosure',
    title: 'Responsible Disclosure Policy',
    category: 'Governance & Conduct',
    lastUpdated: 'January 19, 2026',
    summary: 'Guidelines for security researchers and ethical hackers to report vulnerabilities safely and receive acknowledgment.',
    iconName: 'Award',
    sections: [
      {
        title: '1. Safe Harbor Commitment',
        content: [
          'VIIT College supports responsible security research. We will not pursue legal action against researchers who adhere to this policy in good faith.'
        ]
      },
      {
        title: '2. Guidelines for Testing',
        content: [
          'Do not access, modify, or destroy real financial or user data. Use test accounts where possible.',
          'Do not execute denial of service attacks or degrade production services for college users.',
          'Report findings confidentially to security@viit.ac.in and provide reasonable time (minimum 30 days) to remediate before public disclosure.'
        ]
      },
      {
        title: '3. Recognition',
        content: [
          'Confirmed high-impact reports are eligible for listing on the VIIT Cyber Security Hall of Fame and official certificates of appreciation.'
        ]
      }
    ]
  },
  'community-guidelines': {
    id: 'community-guidelines',
    slug: 'community-guidelines',
    title: 'Community Guidelines',
    category: 'Governance & Conduct',
    lastUpdated: 'December 20, 2025',
    summary: 'Professional standards of communication, collaboration, transparency, and ethics among faculty and departments.',
    iconName: 'Users',
    sections: [
      {
        title: '1. Respectful Collaboration',
        content: [
          'All communication within requisition notes, remarks, and approval justifications must remain constructive, professional, and objective.'
        ]
      },
      {
        title: '2. Transparency and Integrity',
        content: [
          'Department members must provide honest justifications for budget allocations and disclose any potential conflicts of interest with commercial vendors.'
        ]
      },
      {
        title: '3. Promoting Fair Resource Distribution',
        content: [
          'Budget heads must be utilized equitably to support student learning, research advancements, and institutional development across all engineering branches.'
        ]
      }
    ]
  }
};
