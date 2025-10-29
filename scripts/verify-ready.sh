#!/bin/bash

# Script de verificación pre-publicación Docker Hub
# Verifica que todos los archivos estén listos para publicación

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   NapGenius - Pre-Publication Verification Script     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Contadores
PASSED=0
FAILED=0
WARNINGS=0

# Función para checks
check() {
    local description="$1"
    local command="$2"
    
    echo -n "Checking: $description... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

# Función para warnings
warn() {
    local description="$1"
    local command="$2"
    
    echo -n "Checking: $description... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ WARNING${NC}"
        ((WARNINGS++))
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Prerequisites"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "Docker is installed" "command -v docker"
check "Docker Compose is installed" "command -v docker-compose"
check "Docker daemon is running" "docker info"
warn "Logged in to Docker Hub" "docker info | grep -q 'Username:'"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Required Files Exist"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "Dockerfile exists" "test -f Dockerfile"
check "docker-compose.yml exists" "test -f docker-compose.yml"
check "docker-compose.public.yml exists" "test -f docker-compose.public.yml"
check ".env.public.example exists" "test -f .env.public.example"
check "DOCKER_QUICK_START.md exists" "test -f DOCKER_QUICK_START.md"
check "DOCKER_HUB_README.md exists" "test -f DOCKER_HUB_README.md"
check "build-and-push.sh exists" "test -f scripts/build-and-push.sh"
check "build-and-push.sh is executable" "test -x scripts/build-and-push.sh"
check "GitHub Actions workflow exists" "test -f .github/workflows/docker-publish.yml"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Configuration Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "Prisma schema exists" "test -f prisma/schema.prisma"
check "Next.js config exists" "test -f next.config.ts"
check "package.json exists" "test -f package.json"
check "Dockerfile has standalone output" "grep -q 'output.*standalone' next.config.ts"
check "Prisma uses PostgreSQL" "grep -q 'provider.*=.*\"postgresql\"' prisma/schema.prisma"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Documentation Quality"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

warn "No placeholder URLs in docker-compose.public.yml" "! grep -q 'tu-usuario' docker-compose.public.yml"
warn "No placeholder URLs in DOCKER_QUICK_START.md" "! grep -q 'tu-usuario' DOCKER_QUICK_START.md"
warn "No placeholder URLs in DOCKER_HUB_README.md" "! grep -q 'tu-usuario' DOCKER_HUB_README.md"
warn "No placeholder URLs in README.md" "! grep -q 'tu-usuario' README.md"
check "README has Docker installation section" "grep -q 'Docker Hub' README.md"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Security Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "No .env file in git" "! git ls-files | grep -q '^\.env$'"
check ".gitignore contains .env" "grep -q '^\.env$' .gitignore || grep -q '^\.env' .gitignore"
check ".dockerignore exists" "test -f .dockerignore"
check ".dockerignore excludes .env" "grep -q '\.env' .dockerignore"
check "No hardcoded secrets in docker-compose.public.yml" "! grep -E 'password.*[^=]=.*[^{]' docker-compose.public.yml"
check ".env.public.example has security warnings" "grep -iq 'CHANGE\|WARNING\|IMPORTANT' .env.public.example"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. Docker Build Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Building Docker image (this may take a while)..."
if docker build -t jorgeanzola-test:verify . > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker image builds successfully${NC}"
    ((PASSED++))
    
    # Get image size
    IMAGE_SIZE=$(docker images jorgeanzola-test:verify --format "{{.Size}}")
    echo -e "  Image size: ${BLUE}${IMAGE_SIZE}${NC}"
    
    # Cleanup
    docker rmi jorgeanzola-test:verify > /dev/null 2>&1
else
    echo -e "${RED}✗ Docker image build failed${NC}"
    ((FAILED++))
    echo -e "${YELLOW}  Run 'docker build -t jorgeanzola-test:verify .' to see errors${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "Passed:   ${GREEN}${PASSED}${NC}"
echo -e "Failed:   ${RED}${FAILED}${NC}"
echo -e "Warnings: ${YELLOW}${WARNINGS}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✓ ALL CHECKS PASSED - Ready for publication!        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ You have $WARNINGS warning(s). Review them before publishing.${NC}"
        echo ""
    fi
    
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Update placeholder URLs (tu-usuario → your-github-username)"
    echo "2. Create Docker Hub account if you haven't"
    echo "3. Run: ./scripts/build-and-push.sh 1.0.0"
    echo "4. Configure Docker Hub repository description"
    echo "5. Push to GitHub: git push origin main"
    echo ""
    echo "📖 See EXECUTIVE_SUMMARY.md for detailed steps"
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ✗ CHECKS FAILED - Fix errors before publishing       ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Please fix the failed checks and run this script again.${NC}"
    echo ""
    exit 1
fi
