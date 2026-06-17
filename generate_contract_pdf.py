#!/usr/bin/env python3
"""
Generate contract PDF using WeasyPrint
"""
import os

CONTRACT_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Agreement - RAGSPRO</title>
    <style>
        @page {
            margin: 40px;
            @bottom-center {
                content: "RAGSPRO Technologies | ragspro.com";
                font-size: 10px;
                color: #666;
            }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a1a2e; }
        .border-frame { border: 3px solid #1a1a2e; padding: 30px; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 28px; color: #1a1a2e; margin: 20px 0 10px; }
        .contract-no { color: #666; font-size: 14px; }
        .section { margin: 25px 0; }
        .section-title { font-size: 18px; font-weight: 600; color: #1a1a2e; border-bottom: 2px solid #1a1a2e; padding-bottom: 8px; margin-bottom: 15px; }
        .parties-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .parties-table th, .parties-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .parties-table th { background: #f5f5f5; width: 50%; }
        .feature-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .feature-table th, .feature-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        .feature-table th { background: #f0f4ff; }
        .cost-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .cost-table th, .cost-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        .cost-table th { background: #fff4e6; }
        .cost-table tr:last-child td { font-weight: 600; background: #f0f4ff; }
        .code-block { background: #f5f5f5; padding: 15px; font-family: monospace; font-size: 11px; border-radius: 4px; margin: 15px 0; }
        .note-box { background: #fff9e6; border-left: 4px solid #f0ad4e; padding: 12px; margin: 15px 0; font-size: 12px; }
        .warning-box { background: #ffe6e6; border-left: 4px solid #d9534f; padding: 12px; margin: 15px 0; font-size: 12px; }
        .signatures { margin-top: 50px; }
        .signature-table { width: 100%; margin-top: 30px; }
        .signature-table td { padding: 20px; vertical-align: top; }
        .signature-line { border-top: 1px solid #1a1a2e; width: 200px; height: 40px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; color: #666; font-size: 11px; }
        .highlight { background: #fff4e6; padding: 2px 6px; }
        code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 12px; }
        h2 { font-size: 16px; margin: 20px 0 12px; }
        h3 { font-size: 14px; margin: 15px 0 8px; color: #444; }
        ul { margin-left: 20px; margin-bottom: 10px; }
        li { margin: 5px 0; font-size: 13px; }
        .diagram { font-family: monospace; font-size: 10px; background: #f9f9f9; padding: 15px; margin: 15px 0; white-space: pre; }
    </style>
</head>
<body>
    <div class="border-frame">
        <div class="header">
            <h1>SERVICE AGREEMENT</h1>
            <p class="contract-no">Contract No: RGS-2026-0042 | Date: June 16, 2026</p>
        </div>

        <div class="section">
            <h2 class="section-title">1. PARTIES TO AGREEMENT</h2>
            <table class="parties-table">
                <tr>
                    <th><strong>SERVICE PROVIDER</strong></th>
                    <th><strong>CLIENT</strong></th>
                </tr>
                <tr>
                    <td><strong>RAGSPRO Technologies</strong><br>New Delhi, India<br>Email: raghav@ragspro.com<br>Website: ragspro.com</td>
                    <td><strong>GEN-Z Restaurant</strong><br>New Delhi, India<br>Contact: [To be filled]<br>Phase: 1 (POS System)</td>
                </tr>
            </table>
        </div>

        <div class="section">
            <h2 class="section-title">2. PROJECT SCOPE</h2>
            <h3>2.1 System Overview</h3>
            <p style="margin-bottom: 10px;">Development and deployment of a <strong>cloud-native Restaurant POS System</strong> with the following modules:</p>
            <table class="feature-table">
                <tr><th>Module</th><th>Components</th></tr>
                <tr><td><strong>Point of Sale (POS)</strong></td><td>Table management, Order creation, Cart operations, Payment integration</td></tr>
                <tr><td><strong>Kitchen Order Tickets (KOT)</strong></td><td>Real-time KOT generation, Status tracking, Queue management</td></tr>
                <tr><td><strong>Billing System</strong></td><td>Invoice generation, GST compliance, Multiple payment modes</td></tr>
                <tr><td><strong>Inventory Management</strong></td><td>Stock tracking, Low-stock alerts, Item categorization</td></tr>
                <tr><td><strong>Dashboard & Analytics</strong></td><td>Sales reports, Order analytics, Revenue tracking</td></tr>
            </table>
        </div>

        <div class="section">
            <h3>2.2 Technical Architecture</h3>
            <div class="diagram">┌─────────────────────────────────────────────────────────┐
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
└─────────────────────────────────────────────────────────┘</div>
        </div>

        <div class="section">
            <h2 class="section-title">3. COMMERCIAL TERMS</h2>
            <h3>3.1 Total Project Value</h3>
            <table class="cost-table" style="max-width: 400px;">
                <tr><th>Component</th><th>Amount (₹)</th></tr>
                <tr><td><strong>Total Contract Value</strong></td><td><strong>₹18,000</strong></td></tr>
            </table>

            <h3>3.2 Payment Schedule</h3>
            <table class="cost-table">
                <tr><th>Milestone</th><th>Amount (₹)</th><th>Timeline</th></tr>
                <tr><td><strong>Advance Payment (50%)</strong></td><td>₹9,000</td><td>Upon signing</td></tr>
                <tr><td><strong>Final Payment (50%)</strong></td><td>₹9,000</td><td>On delivery & acceptance</td></tr>
            </table>
        </div>

        <div class="section">
            <h2 class="section-title">4. COST BREAKDOWN</h2>
            <h3>4.1 Development Cost Allocation</h3>
            <p style="margin-bottom: 10px; font-size: 13px;">The total project cost of ₹18,000 is allocated as follows:</p>
            <table class="cost-table">
                <tr><th>Cost Head</th><th>Description</th><th>Amount (₹)</th></tr>
                <tr><td><strong>Backend API Development</strong></td><td>FastAPI/Next.js API routes, authentication middleware, JWT token management</td><td>4,500</td></tr>
                <tr><td><strong>Database Architecture</strong></td><td>Prisma schema design, PostgreSQL setup, connection pooling, migrations</td><td>3,000</td></tr>
                <tr><td><strong>Frontend Development</strong></td><td>React components, Tailwind styling, responsive UI/UX</td><td>3,500</td></tr>
                <tr><td><strong>Infrastructure Setup</strong></td><td>Vercel deployment, CI/CD pipeline, environment configuration</td><td>2,000</td></tr>
                <tr><td><strong>Security Implementation</strong></td><td>bcrypt password hashing, session management, CORS, rate limiting</td><td>2,000</td></tr>
                <tr><td><strong>Testing & QA</strong></td><td>Unit tests, integration tests, E2E testing</td><td>1,500</td></tr>
                <tr><td><strong>Documentation</strong></td><td>API docs, deployment guides, user manuals</td><td>1,500</td></tr>
                <tr><td><strong>TOTAL</strong></td><td></td><td><strong>₹18,000</strong></td></tr>
            </table>
        </div>

        <div class="section">
            <h3>4.2 Client-Borne Costs (Not Included)</h3>
            <p style="margin-bottom: 10px; font-size: 13px;">The following costs are <strong>NOT included</strong> in the contract value and shall be paid directly by the client:</p>
            <table class="cost-table">
                <tr><th>Service</th><th>Provider</th><th>Estimated Cost</th></tr>
                <tr><td><strong>Database Hosting</strong></td><td>Vercel Postgres / Neon</td><td>~₹500-1,000/month</td></tr>
                <tr><td><strong>Application Hosting</strong></td><td>Vercel Platform</td><td>Free tier / ~₹0-500/month</td></tr>
                <tr><td><strong>Domain & SSL</strong></td><td>Namecheap / Cloudflare</td><td>~₹800/year</td></tr>
                <tr><td><strong>Third-party APIs</strong></td><td>Payment Gateway, SMS</td><td>As per usage</td></tr>
            </table>
            <div class="note-box">
                <strong>Note:</strong> Above costs are approximate and may vary based on actual usage and provider pricing changes.
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">5. MAINTENANCE & SUPPORT</h2>
            <h3>5.1 Monthly Maintenance Package</h3>
            <table class="cost-table">
                <tr><th>Service</th><th>Description</th><th>Monthly Cost (₹)</th></tr>
                <tr><td><strong>Code Review & Auditing</strong></td><td>Periodic code health checks, security audits</td><td>Included</td></tr>
                <tr><td><strong>Database Health Monitoring</strong></td><td>Connection pool optimization, query performance review</td><td>Included</td></tr>
                <tr><td><strong>Bug Fixes</strong></td><td>Critical bug resolution, error handling improvements</td><td>Included</td></tr>
                <tr><td><strong>Security Updates</strong></td><td>Dependency updates, vulnerability patches</td><td>Included</td></tr>
                <tr><td><strong>Technical Support</strong></td><td>Email/WhatsApp support for technical issues</td><td>Included</td></tr>
                <tr><td colspan="3" style="text-align: right; background: #fff4e6;"><strong>Monthly Maintenance Fee: ₹3,000 - ₹5,000</strong></td></tr>
            </table>
            <div class="note-box">
                <strong>Note:</strong> Maintenance fee may vary based on complexity of issues and system modifications requested.
            </div>

            <h3>5.2 Maintenance Exclusions</h3>
            <div class="warning-box">
                The following are <strong>NOT covered</strong> under standard maintenance:
                <ul style="margin-top: 8px;">
                    <li>New feature development</li>
                    <li>UI/UX redesigns</li>
                    <li>Integration with new third-party services</li>
                    <li>Data migration from external systems</li>
                </ul>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">6. DELIVERY TIMELINE</h2>
            <h3>6.1 Project Schedule</h3>
            <table class="cost-table">
                <tr><th>Phase</th><th>Deliverables</th><th>Timeline</th></tr>
                <tr><td><strong>Phase 1: Setup</strong></td><td>Project scaffolding, Database schema, Auth system</td><td>Day 1-2</td></tr>
                <tr><td><strong>Phase 2: Core Development</strong></td><td>POS module, KOT system, Billing</td><td>Day 3-5</td></tr>
                <tr><td><strong>Phase 3: Testing & Polish</strong></td><td>Bug fixes, UI polish, E2E testing</td><td>Day 6-7</td></tr>
                <tr><td><strong>Final Delivery</strong></td><td>Production deployment, Handover</td><td><strong>Day 7</strong></td></tr>
            </table>

            <h3>6.2 Delivery Date</h3>
            <p><strong>Expected Completion:</strong> 7 (seven) calendar days from the date of advance payment receipt.</p>
        </div>

        <div class="section">
            <h2 class="section-title">7. TERMS & CONDITIONS</h2>
            <h3>7.1 Intellectual Property</h3>
            <p style="margin-bottom: 12px; font-size: 13px;">All source code, designs, and documentation shall remain the intellectual property of <strong>RAGSPRO Technologies</strong> until full payment is received. Upon final payment, all rights and source code shall be transferred to the client.</p>

            <h3>7.2 Confidentiality</h3>
            <p style="margin-bottom: 12px; font-size: 13px;">Both parties agree to maintain confidentiality of proprietary information shared during the project.</p>

            <h3>7.3 Termination</h3>
            <p style="margin-bottom: 12px; font-size: 13px;">Either party may terminate this agreement with written notice. In case of termination, client shall pay for work completed up to termination date.</p>

            <h3>7.4 Liability</h3>
            <p style="margin-bottom: 12px; font-size: 13px;">RAGSPRO Technologies shall not be liable for any indirect, incidental, or consequential damages arising from the use of the software.</p>
        </div>

        <div class="section">
            <h2 class="section-title">8. ACCEPTANCE & SIGNATURES</h2>
            <p style="margin-bottom: 15px; font-size: 13px;">By signing below, both parties agree to the terms and conditions outlined in this agreement.</p>
            <table class="signature-table">
                <tr>
                    <td>
                        <div class="signature-line"></div>
                        <p style="margin-top: 8px;"><strong>Raghav Shah</strong><br>Founder, RAGSPRO Technologies<br>Date: _______________</p>
                    </td>
                    <td>
                        <div class="signature-line"></div>
                        <p style="margin-top: 8px;"><strong>[Authorized Signatory]</strong><br>GEN-Z Restaurant<br>Date: _______________</p>
                    </td>
                </tr>
            </table>
        </div>

        <div class="footer">
            <p><strong>RAGSPRO Technologies</strong></p>
            <p>Email: raghav@ragspro.com | Website: ragspro.com</p>
            <p>Contract No: RGS-2026-0042 | Generated: June 16, 2026</p>
        </div>
    </div>
</body>
</html>
"""

def main():
    output_path = "/Users/raghavshah/GenZ_Restaurant_POS/proposals/GenZ_Contract_RAGSPRO.pdf"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    try:
        from weasyprint import HTML
        HTML(string=CONTRACT_HTML).write_pdf(output_path)
        print(f"✅ PDF generated successfully!")
        print(f"   📁 {output_path}")
    except ImportError:
        print("❌ weasyprint not installed. Install with: pip3 install weasyprint")
        return 1
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1

    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())