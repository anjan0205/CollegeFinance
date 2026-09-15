---
trigger: always_on
description: System Architecture Documentation and Mapping Rules for the Codebase
---

# System Architecture Documentation Standards 🗺️

All contributors and AI agents working on this codebase must adhere to the following architecture documentation principles and workflows.

## 1. Core Architecture Documentation Principles

System architecture documentation captures the structure, relationships, and principles of the software system. It serves as both a map and a story:
- **Convey the big picture**: Maintain high-level conceptual clarity without drowning in transient implementation details.
- **Highlight relationships**: Clearly document how components, services, and databases interact.
- **Capture design rationale**: Explain *why* architectural decisions were made, not just *what* was built.
- **Support mindful evolution**: Enable safe refactoring, scaling, and onboarding through living documentation.

---

## 2. Mandatory Architecture Components

When documenting system architecture, include the following standard sections:

### 2.1 System Overview 🌐
- **Purpose Statement**: Clear description of the problem the system solves.
- **Core Concepts**: Fundamental domain models and operational paradigms.
- **Key Stakeholders**: Roles (e.g., Faculty, HOD, Finance Controller, Principal, CEO, System Admin).
- **System Boundaries**: Explicitly defining what is in scope vs. out of scope.
- **External Dependencies**: Third-party APIs, Firebase, SQLite/Postgres DBs, auth providers.

### 2.2 Architecture Diagrams (C4 Model) 📊
Use Mermaid diagrams to visualize:
- **Context Diagram**: High-level boundaries and external actors.
- **Container Diagram**: Web frontend (Vite React), API server (Express Node.js), storage & databases.
- **Component Diagram**: Domain-specific modules (P2P, Master Data, 2-Tier Approval, Budget Ledger).
- **Data Flow / Sequence Diagrams**: Critical workflows (e.g., PR -> PO -> GRN -> Invoice 3-Way Match, 2-Tier Email Approval).

### 2.3 Component Catalog 📚
Document each architectural component with:
- **Purpose**: Why the component exists.
- **Responsibilities**: What it handles and what it explicitly delegates.
- **Interfaces**: REST endpoints, internal service contracts, types/interfaces.
- **Dependencies**: Upstream and downstream module requirements.
- **Quality Attributes**: Security posture, performance benchmarks, error recovery.

### 2.4 Data Architecture 💾
- **Entity Relationship Models**: Schemas for Vendors, PRs, POs, Invoices, Budget Heads, Approvals.
- **State Transition Matrices**: Lifecycle states (e.g., `PENDING_PRINCIPAL` -> `PENDING_CEO` -> `APPROVED`).
- **Persistence Strategy**: Relational SQLite/Postgres tables alongside NoSQL Firestore caches.

### 2.5 Cross-Cutting Concerns ✂️
- **Security & RBAC**: Role-based access control, JWT verification, tokenized one-click approval links.
- **Error Handling & Resilience**: Unified error handling middleware, client-side fallback states (Offline, 404, 500).
- **Audit & Logging**: Timestamped immutable audit trails for financial and administrative actions.

---

## 3. Maintenance & AI-Assisted Architecture Workflow

- **Living Documentation**: Architecture documentation must be updated in `docs/architecture.md` whenever major structural changes, new modules, or API endpoints are added.
- **Architectural Decision Records (ADRs)**: Document significant architectural trade-offs and decisions.
- **Avoid Documentation Anti-Patterns**:
  - *No Ghost Towns*: Review and refresh diagrams during development cycles.
  - *No Utopia*: Document the actual active system state, not unbuilt theoretical ideals.
  - *No Secret Maps*: Ensure shared mental models exist in documentation, not individual memory.
