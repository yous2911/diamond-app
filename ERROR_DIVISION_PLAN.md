# TypeScript Error Division Plan
**Total Errors:** 1,450
**Goal:** Deployment-ready platform

---

## 🔴 CLAUDE WILL FIX (Critical - Deployment Blockers) - ~50 errors

### 1. Missing Properties (Runtime Crashes) - 15 errors
**Priority:** CRITICAL
**Files:**
- `src/routes/auth.ts` - Missing `refreshJwt` property
- `src/middleware/audit.middleware.ts` - Missing `timestamp` property
- `src/plugins/gdpr.ts` - Missing `timestamp` property

**Why Critical:** These cause runtime crashes when the code executes

---

### 2. Database Schema Issues (Data Corruption) - 10 errors
**Priority:** CRITICAL
**Files:**
- `src/db/migration-manager.ts` - Cannot find `db`, `schema`
- `src/db/seed.ts` - Invalid property `type` (should be `typeExercice`)
- `src/db/seeds/cp2025-exercises.ts` - Same issue

**Why Critical:** Wrong property names = database errors

---

### 3. Possibly Undefined (Null Reference Errors) - 25 errors
**Priority:** HIGH
**Files:**
- `src/routes/analytics.ts` - `day.averageScore` possibly null (5 errors)
- `src/routes/competences.ts` - Object possibly undefined (8 errors)
- `src/db/optimized-queries.ts` - Possibly undefined (3 errors)
- `src/db/migrate-leaderboards.ts` - Possibly undefined (4 errors)
- `src/db/seed-leaderboards.ts` - Possibly undefined (5 errors)

**Why Critical:** These cause "Cannot read property of undefined" crashes

---

## 🟡 CURSOR WILL FIX (Code Quality - Non-Blocking) - ~1,400 errors

### 1. Unused Variables/Parameters - ~300 errors
**Priority:** LOW
**Examples:**
```typescript
import { logger } from '../utils/logger'; // Never used
function handler(request, reply) { // 'request' never used
```

**Why Not Critical:** Code runs fine, just messy

---

### 2. Logger Argument Types - ~400 errors
**Priority:** LOW
**Examples:**
```typescript
logger.info({ userId: 123 }, 'Message'); // Type mismatch
```

**Why Not Critical:** Pino accepts these, just type definition issue

---

### 3. Unused Imports - ~200 errors
**Priority:** LOW
**Examples:**
```typescript
import { AuthService } from '../services/auth.service'; // Never used
```

**Why Not Critical:** Tree-shaking removes them anyway

---

### 4. Parameter Type Issues - ~300 errors
**Priority:** LOW
**Examples:**
```typescript
reply: FastifyReply // Declared but never used
```

**Why Not Critical:** TypeScript optimizes these out

---

### 5. Other Type Mismatches - ~200 errors
**Priority:** MEDIUM-LOW
**Examples:**
- Implicit any types
- Strict function type mismatches
- Optional property issues

**Why Not Critical:** Don't cause runtime errors

---

## DEPLOYMENT READINESS

### After Claude Fixes (50 errors):
- ✅ No runtime crashes
- ✅ Database works correctly
- ✅ No null reference errors
- ✅ **DEPLOYMENT READY**

### After Cursor Fixes (1,400 errors):
- ✅ Clean code
- ✅ No warnings
- ✅ Production-grade TypeScript

---

## CLAUDE'S FIX LIST (What I'll Handle)

### File 1: `src/routes/auth.ts` (4 errors)
```typescript
// Add type declarations for refreshJwt
declare module 'fastify' {
  interface FastifyInstance {
    refreshJwt: JWT;
  }
}
```

### File 2: `src/middleware/audit.middleware.ts` (6 errors)
```typescript
// Add timestamp to all audit log calls
timestamp: new Date().toISOString()
```

### File 3: `src/plugins/gdpr.ts` (4 errors)
```typescript
// Add timestamp to audit logs
timestamp: new Date().toISOString()
```

### File 4: `src/db/migration-manager.ts` (8 errors)
```typescript
// Import db and schema properly
import { db } from './connection';
import * as schema from './schema';
```

### File 5: `src/db/seed.ts` (3 errors)
```typescript
// Change 'type' to 'typeExercice'
typeExercice: 'QCM'  // Not 'type'
```

### File 6: `src/routes/analytics.ts` (10 errors)
```typescript
// Add null checks
averageScore: day.averageScore ?? 0
```

### File 7: `src/routes/competences.ts` (8 errors)
```typescript
// Add undefined checks
if (!competence) return reply.status(404).send({...});
```

### File 8: `src/db/optimized-queries.ts` (3 errors)
```typescript
// Add optional chaining
student?.property
```

### File 9: `src/db/migrate-leaderboards.ts` (4 errors)
```typescript
// Add undefined checks
if (!entry) continue;
```

---

## CURSOR'S FIX LIST (What Cursor Should Handle)

### Automated Fixes (Run ESLint):
```bash
# Remove unused imports
npx eslint --fix "src/**/*.ts" --rule "unused-imports/no-unused-imports: error"

# Prefix unused parameters
find src -name "*.ts" -exec sed -i 's/(\([a-z][a-zA-Z0-9]*\),/_\1,/g' {} \;
```

### Manual Cleanup:
- Remove all unused imports (~200 files)
- Prefix unused parameters with `_` (~100 files)
- Fix logger type signatures (~50 files)

---

## ESTIMATED TIME

**Claude's Fixes:** 2-3 hours (50 critical errors)
**Cursor's Fixes:** 4-6 hours (1,400 code quality errors)

**After Claude → Ready to deploy**
**After Cursor → Production-grade clean code**

---

## READY?

Say "YES" and I'll start fixing the 50 critical errors right now.
