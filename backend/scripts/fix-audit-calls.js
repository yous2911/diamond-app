const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/services/data-anonymization.service.ts',
  'src/services/data-retention.service.ts',
  'src/services/email.service.ts'
];

function fixAuditCalls(content) {
  // Add timestamp to all auditService.logAction calls that don't have it
  // Pattern: await this.auditService.logAction({ ... });
  let modified = content;
  let count = 0;

  // Fix pattern: logAction({ ... }); where timestamp is missing
  const logActionPattern = /(await\s+this\.auditService\.logAction\s*\(\s*\{[^}]*)(category:\s*['"][^'"]+['"])([^}]*\}\s*\))/gs;
  
  modified = modified.replace(logActionPattern, (match, before, category, after) => {
    // Check if timestamp is already present
    if (!match.includes('timestamp:')) {
      count++;
      return `${before}${category},${after.replace('})', 'timestamp: new Date()})')}`;
    }
    return match;
  });

  // Also fix cases where we need to add type assertion
  const logActionWithTypePattern = /(await\s+this\.auditService\.logAction\s*\(\s*\{[^}]*category:\s*['"][^'"]+['"][^}]*\}\s*\))/gs;
  
  modified = modified.replace(logActionWithTypePattern, (match) => {
    if (!match.includes('as Parameters')) {
      count++;
      return match.replace('})', '} as Parameters<typeof this.auditService.logAction>[0])');
    }
    return match;
  });

  return { modified, count };
}

const srcDir = path.join(__dirname, '..');
let totalFixes = 0;

filesToFix.forEach(relativePath => {
  const filePath = path.join(srcDir, relativePath);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const result = fixAuditCalls(content);
    if (result.count > 0) {
      fs.writeFileSync(filePath, result.modified, 'utf8');
      console.log(`Fixed ${result.count} audit calls in ${relativePath}`);
      totalFixes += result.count;
    }
  }
});

console.log(`\nTotal fixes: ${totalFixes}`);






