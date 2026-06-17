---
title: "SERVICE AGREEMENT"
subtitle: "Restaurant POS System Development"
date: "June 16, 2026"
---

<div style="text-align: center; margin: 40px 0;">
<img src="public/images/ragspro-logo.svg" alt="RAGSPRO" style="width: 180px; margin-bottom: 20px;" />
<h1 style="color: #1a1a2e; font-size: 28px; margin: 20px 0;">SERVICE AGREEMENT</h1>
<p style="color: #666; font-size: 14px;">Contract No: RGS-2026-0042</p>
</div>

---

## 1. PARTIES TO AGREEMENT

| **SERVICE PROVIDER** | **CLIENT** |
|----------------------|------------|
| **RAGSPRO Technologies** | **GEN-Z Restaurant** |
| New Delhi, India | New Delhi, India |
| Email: raghav@ragspro.com | Contact: [To be filled] |
| Website: ragspro.com | Phase: 1 (POS System) |

---

## 2. PROJECT SCOPE

### 2.1 System Overview

Development and deployment of a **cloud-native Restaurant POS System** with the following modules:

| Module | Components |
|--------|------------|
| **Point of Sale (POS)** | Table management, Order creation, Cart operations, Payment integration |
| **Kitchen Order Tickets (KOT)** | Real-time KOT generation, Status tracking, Queue management |
| **Billing System** | Invoice generation, GST compliance, Multiple payment modes |
| **Inventory Management** | Stock tracking, Low-stock alerts, Item categorization |
| **Dashboard & Analytics** | Sales reports, Order analytics, Revenue tracking |

### 2.2 Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│              (Next.js 14 + TypeScript + Tailwind)       │
├─────────────────────────────────────────────────────────┤
│                    API LAYER                            │
│           (REST API + Server-Side Rendering)            │
├─────────────────────────────────────────────────────────┤
│                 DATABASE LAYER                          │
│      (PostgreSQL + Prisma ORM + Connection Pooling)     │
├─────────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE                         │
│    (Vercel Fluid Compute + Managed PostgreSQL)         │
└─────────────────────────────────────────────────────────┘
```

---

## 3. COMMERCIAL TERMS

### 3.1 Total Project Value

| Component | Amount (₹) |
|-----------|------------|
| **Total Contract Value** | **₹18,000** |

### 3.2 Payment Schedule

| Milestone | Amount (₹) | Timeline |
|-----------|------------|----------|
| **Advance Payment (50%)** | ₹9,000 | Upon signing |
| **Final Payment (50%)** | ₹9,000 | On delivery & acceptance |

---

## 4. COST BREAKDOWN

### 4.1 Development Cost Allocation

The total project cost of ₹18,000 is allocated as follows:

| Cost Head | Description | Amount (₹) |
|-----------|-------------|------------|
| **Backend API Development** | FastAPI/Next.js API routes, authentication middleware, JWT token management | 4,500 |
| **Database Architecture** | Prisma schema design, PostgreSQL setup, connection pooling, migrations | 3,000 |
| **Frontend Development** | React components, Tailwind styling, responsive UI/UX | 3,500 |
| **Infrastructure Setup** | Vercel deployment, CI/CD pipeline, environment configuration | 2,000 |
| **Security Implementation** | bcrypt password hashing, session management, CORS, rate limiting | 2,000 |
| **Testing & QA** | Unit tests, integration tests, E2E testing | 1,500 |
| **Documentation** | API docs, deployment guides, user manuals | 1,500 |
| **TOTAL** | | **₹18,000** |

### 4.2 Client-Borne Costs (Not Included)

The following costs are **NOT included** in the contract value and shall be paid directly by the client:

| Service | Provider | Estimated Cost |
|---------|----------|----------------|
| **Database Hosting** | Vercel Postgres / Neon | ~₹500-1,000/month |
| **Application Hosting** | Vercel Platform | Free tier / ~₹0-500/month |
| **Domain & SSL** | Namecheap / Cloudflare | ~₹800/year |
| **Third-party APIs** | Payment Gateway, SMS | As per usage |

> **Note:** Above costs are approximate and may vary based on actual usage and provider pricing changes.

---

## 5. MAINTENANCE & SUPPORT

### 5.1 Monthly Maintenance Package

| Service | Description | Monthly Cost (₹) |
|---------|-------------|------------------|
| **Code Review & Auditing** | Periodic code health checks, security audits | Included |
| **Database Health Monitoring** | Connection pool optimization, query performance review | Included |
| **Bug Fixes** | Critical bug resolution, error handling improvements | Included |
| **Security Updates** | Dependency updates, vulnerability patches | Included |
| **Technical Support** | Email/WhatsApp support for technical issues | Included |

**Monthly Maintenance Fee: ₹3,000 - ₹5,000**

> *Note: Maintenance fee may vary based on complexity of issues and system modifications requested.*

### 5.2 Maintenance Exclusions

The following are **NOT covered** under standard maintenance:
- New feature development
- UI/UX redesigns
- Integration with new third-party services
- Data migration from external systems

---

## 6. DELIVERY TIMELINE

### 6.1 Project Schedule

| Phase | Deliverables | Timeline |
|-------|--------------|----------|
| **Phase 1: Setup** | Project scaffolding, Database schema, Auth system | Day 1-2 |
| **Phase 2: Core Development** | POS module, KOT system, Billing | Day 3-5 |
| **Phase 3: Testing & Polish** | Bug fixes, UI polish, E2E testing | Day 6-7 |
| **Final Delivery** | Production deployment, Handover | **Day 7** |

### 6.2 Delivery Date

**Expected Completion:** 7 (seven) calendar days from the date of advance payment receipt.

---

## 7. TERMS & CONDITIONS

### 7.1 Intellectual Property

- All source code, designs, and documentation shall remain the intellectual property of **RAGSPRO Technologies** until full payment is received.
- Upon final payment, all rights and source code shall be transferred to the client.

### 7.2 Confidentiality

- Both parties agree to maintain confidentiality of proprietary information shared during the project.

### 7.3 Termination

- Either party may terminate this agreement with written notice.
- In case of termination, client shall pay for work completed up to termination date.

### 7.4 Liability

- RAGSPRO Technologies shall not be liable for any indirect, incidental, or consequential damages arising from the use of the software.

---

## 8. ACCEPTANCE

By signing below, both parties agree to the terms and conditions outlined in this agreement.

| **For RAGSPRO Technologies** | **For GEN-Z Restaurant** |
|------------------------------|--------------------------|
| | |
| ___________________________ | ___________________________ |
| **Raghav Shah** | [Authorized Signatory] |
| Founder | Date: _______________ |
| Date: _______________ | |

---

<div style="text-align: center; margin-top: 60px; padding-top: 20px; border-top: 2px solid #ddd; color: #666; font-size: 12px;">
<p><strong>RAGSPRO Technologies</strong></p>
<p>Email: raghav@ragspro.com | Website: ragspro.com</p>
<p>Contract No: RGS-2026-0042 | Generated: June 16, 2026</p>
</div>