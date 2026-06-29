#!/bin/bash

# Production Readiness Verification Script
# GenZ Restaurant POS - June 30, 2026

echo "🔍 Starting Production Readiness Verification..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# 1. Check TypeScript
echo "1️⃣ Checking TypeScript..."
if npm run type-check > /dev/null 2>&1; then
  echo -e "${GREEN}✅ TypeScript: PASSED${NC}"
else
  echo -e "${RED}❌ TypeScript: FAILED${NC}"
  ((ERRORS++))
fi

# 2. Check Prisma Schema
echo "2️⃣ Checking Prisma Schema..."
if npx prisma validate > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Prisma Schema: VALID${NC}"
else
  echo -e "${RED}❌ Prisma Schema: INVALID${NC}"
  ((ERRORS++))
fi

# 3. Check for hardcoded secrets
echo "3️⃣ Checking for hardcoded secrets..."
if grep -r "genz-final-handoff" src/ > /dev/null 2>&1; then
  echo -e "${RED}❌ Found hardcoded secrets in code${NC}"
  ((ERRORS++))
else
  echo -e "${GREEN}✅ No hardcoded secrets found${NC}"
fi

# 4. Check for dangerous endpoints
echo "4️⃣ Checking for dangerous endpoints..."
DANGEROUS_FILES=(
  "src/app/api/handoff-reset/route.ts"
  "src/app/api/reset-passwords/route.ts"
)

FOUND_DANGEROUS=0
for file in "${DANGEROUS_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${RED}❌ Dangerous endpoint still exists: $file${NC}"
    ((ERRORS++))
    FOUND_DANGEROUS=1
  fi
done

if [ $FOUND_DANGEROUS -eq 0 ]; then
  echo -e "${GREEN}✅ No dangerous endpoints found${NC}"
fi

# 5. Check .gitignore for .env files
echo "5️⃣ Checking .gitignore..."
if grep -q "^\.env" .gitignore; then
  echo -e "${GREEN}✅ .gitignore properly configured${NC}"
else
  echo -e "${RED}❌ .gitignore missing .env exclusions${NC}"
  ((ERRORS++))
fi

# 6. Check for excessive console.log (sample check)
echo "6️⃣ Checking for debug logging..."
CONSOLE_COUNT=$(grep -r "console\.log" src/components/kds/KDSDisplay.tsx 2>/dev/null | wc -l | tr -d ' ')
if [ "$CONSOLE_COUNT" -lt 5 ]; then
  echo -e "${GREEN}✅ Debug logging cleaned (${CONSOLE_COUNT} statements)${NC}"
else
  echo -e "${YELLOW}⚠️ Still has ${CONSOLE_COUNT} console.log statements${NC}"
  ((WARNINGS++))
fi

# 7. Check for production cleanup endpoint
echo "7️⃣ Checking for production cleanup endpoint..."
if [ -f "src/app/api/admin/production-cleanup/route.ts" ]; then
  echo -e "${GREEN}✅ Production cleanup endpoint exists${NC}"
else
  echo -e "${YELLOW}⚠️ Production cleanup endpoint not found${NC}"
  ((WARNINGS++))
fi

# 8. Check node_modules
echo "8️⃣ Checking dependencies..."
if [ -d "node_modules" ]; then
  echo -e "${GREEN}✅ Dependencies installed${NC}"
else
  echo -e "${RED}❌ Dependencies not installed (run: npm install)${NC}"
  ((ERRORS++))
fi

# 9. Check for required documentation
echo "9️⃣ Checking documentation..."
REQUIRED_DOCS=(
  "README.md"
  "PRODUCTION_READY_CHECKLIST.md"
  "AUDIT_REPORT_2026-06-30.md"
)

for doc in "${REQUIRED_DOCS[@]}"; do
  if [ -f "$doc" ]; then
    echo -e "${GREEN}  ✅ $doc exists${NC}"
  else
    echo -e "${YELLOW}  ⚠️ $doc missing${NC}"
    ((WARNINGS++))
  fi
done

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VERIFICATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ Errors: $ERRORS${NC}"
else
  echo -e "${RED}❌ Errors: $ERRORS${NC}"
fi

if [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ Warnings: $WARNINGS${NC}"
else
  echo -e "${YELLOW}⚠️ Warnings: $WARNINGS${NC}"
fi

echo ""

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}🎉 PRODUCTION READY!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Configure environment variables in Vercel"
  echo "2. Deploy to production"
  echo "3. Clean test data using /api/admin/production-cleanup"
  echo "4. Run smoke tests"
  echo ""
  echo "See PRODUCTION_READY_CHECKLIST.md for details."
  exit 0
else
  echo -e "${RED}❌ NOT READY FOR PRODUCTION${NC}"
  echo ""
  echo "Please fix the $ERRORS error(s) above before deploying."
  exit 1
fi
