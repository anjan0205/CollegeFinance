# PR & PO Management System — Build Spec

## 1. What you're building

A Procure-to-Pay (P2P) web app that takes a purchase request from creation through
multi-level approval, vendor sourcing, PO issuance, delivery confirmation, and
payment sign-off — with a full audit trail at every step. Think a lightweight,
purpose-built version of what TYASuite/SAP Ariba do, scoped for a
college club, department, or small org.

**Core promise the system must keep:** no PO gets issued without an approved PR,
no PR gets approved without passing every required approval level, and every
state change is logged with who/when/why.

---

## 2. Roles

| Role | Can do |
|---|---|
| **Requester** | Create PR, attach specs/quotes, track status, respond to rejection comments |
| **Approver (L1, L2, L3...)** | Approve/reject/send-back PRs and POs at their tier, add comments, delegate to a backup approver |
| **Procurement officer** | Convert approved PR → RFQ, manage vendors, compare quotes, issue PO |
| **Finance/Budget owner** | Set department budgets, validate spend against budget, release payment |
| **Vendor (external, optional portal)** | View POs addressed to them, submit quotes, confirm delivery dates |
| **Admin** | Configure approval matrix, departments, budget periods, user roles |

A single person can hold multiple roles (e.g., a club lead might be both
Requester and L1 Approver for a different club's requests — never their own).

---

## 3. Core entities (data model)

```
User
  id, name, email, role[], department_id, manager_id, is_active

Department
  id, name, budget_period_id, allocated_budget, spent_amount

BudgetPeriod
  id, name (e.g. "FY2026-27"), start_date, end_date

Vendor
  id, name, contact_email, phone, gst_number, category[],
  rating (avg from past POs), is_approved, bank_details (encrypted)

PurchaseRequisition (PR)
  id, pr_number (auto, e.g. PR-2026-0042), requester_id, department_id,
  title, justification, items[] (see LineItem), priority,
  estimated_total, status, current_approval_level,
  approval_matrix_id, created_at, updated_at

LineItem
  id, pr_id (or po_id), description, quantity, unit, unit_price_est,
  category

ApprovalMatrix (configurable, not hardcoded)
  id, name, applies_to (PR/PO), rules[]:
    - condition (e.g. amount <= 10000)
    - levels[]: { level_number, approver_role or specific_user_id,
                  is_parallel (bool), sla_hours }

ApprovalAction
  id, pr_id or po_id, level_number, approver_id, action (approve/reject/
  send_back/delegate), comment, acted_at

RFQ (Request for Quote)
  id, pr_id, vendor_ids[], due_date, status

Quote
  id, rfq_id, vendor_id, line_items[] (with quoted price), total,
  delivery_days, submitted_at, is_selected

PurchaseOrder (PO)
  id, po_number, pr_id, vendor_id, line_items[] (final prices),
  total_amount, status, current_approval_level, expected_delivery,
  created_at

GoodsReceiptNote (GRN)
  id, po_id, received_items[] (qty received vs ordered), received_by,
  received_at, condition_notes, discrepancy_flag

Invoice
  id, po_id, vendor_invoice_number, amount, invoice_file_url,
  match_status (matched/mismatched), matched_at

Payment
  id, invoice_id, amount, authorized_by, paid_at, payment_reference

AuditLog
  id, entity_type, entity_id, action, actor_id, old_value, new_value,
  timestamp
```

---

## 4. Status state machines

**PR status flow:**
```
DRAFT → SUBMITTED → UNDER_APPROVAL (L1) → UNDER_APPROVAL (L2) → ... →
APPROVED → CONVERTED_TO_RFQ → CLOSED
                ↓ (any level)
            REJECTED (terminal, requester notified with comment)
                ↓ (any level)
            SENT_BACK (returns to DRAFT for requester to edit, resubmit)
```

**PO status flow:**
```
DRAFT → PENDING_APPROVAL → APPROVED → SENT_TO_VENDOR →
PARTIALLY_RECEIVED → FULLY_RECEIVED → INVOICED → MATCHED → PAID → CLOSED
                ↓
            REJECTED / CANCELLED
```

**Rule:** a PR can only move to `CONVERTED_TO_RFQ` if status = `APPROVED`.
A PO can only move to `SENT_TO_VENDOR` if status = `APPROVED` AND its
budget check passed. A payment can only be authorized if `match_status = matched`
(3-way match: PO amount, GRN quantities, invoice amount all reconcile within
a configurable tolerance, e.g. 2%).

---

## 5. Multi-level approval logic — the part that has to be bulletproof

This is the highest-risk part of the system. Build it as a **rules engine**, not
hardcoded if/else chains.

**Design:**
1. When a PR/PO is submitted, look up the applicable `ApprovalMatrix` rule based
   on amount, department, and category.
2. Generate an ordered list of required approval levels for that specific
   request (snapshot it onto the PR/PO record at submission time — don't
   re-evaluate the matrix later if the rules change mid-flight).
3. Move through levels sequentially by default. Support parallel levels
   (e.g., both Finance AND HOD must approve at level 2, any order) via
   `is_parallel`.
4. Each level's approver sees only requests where `current_approval_level`
   matches their level AND they're mapped to that role/department.
5. On approve: increment `current_approval_level`. If that was the last
   level, set status = APPROVED.
6. On reject: set status = REJECTED immediately, skip remaining levels,
   notify requester with the comment.
7. On send-back: set status = SENT_BACK, reset `current_approval_level` to 0,
   requester edits and resubmits (goes through all levels again — don't
   let it skip levels already cleared, since the content changed).
8. **Delegation:** an approver can nominate a backup for a date range. Route
   pending approvals to the backup automatically; log both names.
9. **SLA / escalation:** if a level sits unactioned past its `sla_hours`,
   auto-notify the approver's manager or auto-escalate to the next level
   (configurable per matrix).
10. **Amount changes mid-flow:** if the estimated total changes after
    partial approval (e.g., during RFQ, actual vendor price is higher),
    re-run the matrix check — if the new amount crosses into a higher
    approval tier, restart approval from the level where the tier changed,
    not from scratch.

**Example matrix (seed data):**
| Amount | Levels |
|---|---|
| ≤ ₹5,000 | Club coordinator only |
| ₹5,001–₹25,000 | Club coordinator → HOD |
| ₹25,001–₹1,00,000 | Club coordinator → HOD → Finance |
| > ₹1,00,000 | Club coordinator → HOD → Finance → Principal/Director |

---

## 6. Vendor management — the other core piece

- **Vendor master:** onboarding form with GST/tax ID validation, category
  tagging (stationery, electronics, catering, printing, etc.), bank details
  for payment, and an `is_approved` flag so procurement can only send RFQs
  to vetted vendors.
- **RFQ broadcast:** procurement selects 3+ vendors per category (configurable
  minimum), sends an RFQ with the PR's line items, sets a response deadline.
- **Quote comparison view:** side-by-side table — vendor name, per-line
  price, total, delivery time, past rating. Highlight lowest total and
  fastest delivery automatically; let the procurement officer pick any
  vendor (not forced to pick lowest — but require a comment if not lowest).
- **Vendor scoring:** after each PO closes, capture a 1–5 rating on
  price accuracy, delivery timeliness, and quality. Roll into a running
  average shown on the vendor profile — surfaces reliability over time.
- **Blacklist/hold:** admin can suspend a vendor; suspended vendors can't
  receive new RFQs but existing POs still complete.

---

## 7. Screens / pages

1. **Dashboard** — role-aware: requester sees their PR statuses; approver
   sees a pending-approval queue with amount, requester, days-waiting;
   procurement sees open RFQs and POs in flight.
2. **New PR form** — line items (add/remove rows), category, justification,
   attach quotes/specs, live budget check against department's remaining
   allocation before submit.
3. **PR detail / approval screen** — full item breakdown, approval timeline
   (who approved when, comments), action buttons for the current approver.
4. **RFQ builder** — pick vendors, set line items and deadline.
5. **Quote comparison** — table view described above.
6. **PO detail** — items, vendor, delivery status, linked GRN and invoice.
7. **GRN entry** — checklist against PO line items, quantity received vs
   ordered, discrepancy notes, photo upload optional.
8. **Invoice matching** — auto-highlight mismatches between PO/GRN/invoice
   amounts beyond tolerance.
9. **Vendor directory** — list, filters by category/rating, profile page
   with PO history.
10. **Admin console** — approval matrix editor, department/budget setup,
    user role assignment.
11. **Audit log viewer** — filterable by entity, actor, date range.

---

## 8. Suggested stack (matches your existing toolkit)

- **Frontend:** React + TypeScript + Tailwind CSS. React Hook Form for the
  PR/RFQ forms (many dynamic line-item rows). TanStack Table for the quote
  comparison and dashboards.
- **Backend:** Node.js + Express or Next.js API routes. Keep the approval
  engine as an isolated service/module (`approvalEngine.evaluate(pr)`,
  `approvalEngine.advance(pr, action)`) so it's independently testable —
  this is the piece you'll write the most unit tests against.
- **Database:** PostgreSQL (relational integrity matters a lot here —
  foreign keys between PR→PO→GRN→Invoice→Payment, and you want transactions
  around status changes). Prisma or Drizzle as the ORM.
- **Auth:** role-based access control (RBAC) middleware checking
  role + department scope on every endpoint, not just the UI.
- **Notifications:** email (or in-app) on: PR submitted, approval pending,
  approved/rejected, RFQ deadline approaching, PO sent, goods received,
  payment released.
- **File storage:** S3-compatible bucket for quote attachments, GRN photos,
  invoice PDFs.

---

## 9. Key API endpoints (REST sketch)

```
POST   /api/prs                     create PR (draft)
POST   /api/prs/:id/submit          submit for approval (snapshots matrix)
POST   /api/prs/:id/approve         current-level approver action
POST   /api/prs/:id/reject
POST   /api/prs/:id/send-back
GET    /api/prs?status=&department= filtered list

POST   /api/rfqs                    create RFQ from an approved PR
POST   /api/rfqs/:id/quotes         vendor submits a quote
POST   /api/rfqs/:id/select-vendor  procurement picks winner → generates PO

POST   /api/pos/:id/approve
POST   /api/pos/:id/send-to-vendor
POST   /api/pos/:id/grn             log goods receipt
POST   /api/pos/:id/invoice         attach invoice, triggers match check
POST   /api/pos/:id/pay             finance releases payment

GET    /api/vendors
POST   /api/vendors
POST   /api/vendors/:id/rate

GET    /api/audit-log?entity_type=&entity_id=
```

Every mutating endpoint writes an `AuditLog` row inside the same DB
transaction as the state change — never as a fire-and-forget side effect,
or you'll get gaps under failure.

---

## 10. Build order (don't build it all at once)

1. Auth + roles + department/user setup
2. PR CRUD + single-level approval (prove the state machine works)
3. Extend to configurable multi-level approval matrix
4. Budget tracking + live validation on PR submit
5. Vendor master + RFQ + quote comparison
6. PO generation from approved PR + PO approval reusing the same engine
7. GRN entry
8. Invoice + 3-way match + payment
9. Audit log viewer + dashboards last — they're read-only views over data
   you'll already have once 1–8 are solid

Reusing the same approval engine for both PR and PO approval (step 3 and 6)
saves you from building and maintaining two parallel state machines.
