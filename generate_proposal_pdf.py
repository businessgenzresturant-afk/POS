#!/usr/bin/env python3
"""
Generate professional PDF proposal for GenZ Restaurant POS
Uses md-to-pdf or weasyprint for conversion
"""

import subprocess
import os
import sys

PROJECT_DIR = "/Users/raghavshah/GenZ_Restaurant_POS"
OUTPUT_DIR = os.path.join(PROJECT_DIR, "proposals")
MD_FILE = os.path.join(PROJECT_DIR, "CLIENT_PROPOSAL.md")
OUTPUT_PDF = os.path.join(OUTPUT_DIR, "GenZ_Restaurant_POS_Proposal_RAGSPRO.pdf")

def main():
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Try md-to-pdf first (already installed)
    print("📄 Generating PDF proposal...")
    print(f"   Source: {MD_FILE}")
    print(f"   Output: {OUTPUT_PDF}")
    print()

    try:
        result = subprocess.run([
            "npx", "md-to-pdf", MD_FILE,
            "--output-file", OUTPUT_PDF
        ], capture_output=True, text=True, timeout=120)

        if result.returncode == 0:
            print("✅ PDF generated successfully!")
            print(f"   📁 {OUTPUT_PDF}")
            print()
            print("📋 Proposal includes:")
            print("   • Executive Summary")
            print("   • Problem/Solution Analysis")
            print("   • Features Overview (POS, KOT, Menu, Reports)")
            print("   • Technology Stack Details")
            print("   • Pricing: ₹55K/₹75K/₹95K packages")
            print("   • 3-Year Cost Comparison (₹1,08,200 savings)")
            print("   • 4-5 Week Implementation Timeline")
            print("   • Support & Maintenance Options")
            print("   • RAGSPRO Contact: +91-88260 73013")
            return 0
        else:
            print(f"⚠️  md-to-pdf error: {result.stderr}")
    except subprocess.TimeoutExpired:
        print("⚠️  Timeout during PDF generation")
    except Exception as e:
        print(f"⚠️  Error: {e}")

    # Fallback: suggest manual conversion
    print()
    print("💡 Alternative: Convert manually using:")
    print(f"   npx md-to-pdf {MD_FILE}")
    print()
    print("   Or use VS Code: Markdown PDF extension")
    print()
    return 1

if __name__ == "__main__":
    sys.exit(main())