const fs = require('fs');
const path = require('path');

// Files with specific fixes
const specificFixes = {
  'src/plugins/file-upload.ts': (content) => {
    // Fix TS18046: error.message where error is unknown
    content = content.replace(/error\.message/g, (match, offset) => {
      const before = content.substring(0, offset);
      const catchMatch = before.match(/catch\s*\([^)]*error[^)]*:\s*unknown/i);
      if (catchMatch) {
        return '(error instanceof Error ? error.message : String(error))';
      }
      return match;
    });
    return content;
  },
  'src/routes/gdpr.ts': (content) => {
    // Fix TS18046: request.body is unknown
    content = content.replace(/request\.body\[([^\]]+)\]/g, '((request.body as Record<string, unknown>)[$1])');
    return content;
  },
  'src/routes/students.ts': (content) => {
    // Fix TS2339: Property 'id' does not exist on type 'unknown'
    content = content.replace(/request\.params\.id/g, '(request.params as { id: string }).id');
    return content;
  },
  'src/routes/upload.ts': (content) => {
    // Fix TS2339: Property does not exist on type 'unknown'
    content = content.replace(/request\.body\.(fileId|variant|operation)/g, '((request.body as Record<string, unknown>).$1)');
    return content;
  },
  'src/routes/parents.ts': (content) => {
    // Fix TS18048: domainStat is possibly undefined
    content = content.replace(/domainStat\.(total|avgMastery|mastered)/g, 'domainStat?.$1');
    content = content.replace(/domainStat\.(total|avgMastery|mastered)\s*\+=/g, 'if (domainStat) domainStat.$1 +=');
    return content;
  }
};

// Fix unknown error types in catch blocks
function fixUnknownErrors(content) {
  // Fix catch (error: unknown) { ... error.message }
  content = content.replace(/catch\s*\((\w+):\s*unknown\s*\)\s*\{([^}]*?)\1\.message/g, (match, varName, before) => {
    return `catch (${varName}: unknown) {${before}(${varName} instanceof Error ? ${varName}.message : String(${varName}))`;
  });
  
  // Fix logger.error('msg', error) where error is unknown
  content = content.replace(/logger\.(error|warn|info)\(([^,]+),\s*(\w+)\)/g, (match, method, msg, varName, offset) => {
    const before = content.substring(0, offset);
    const catchMatch = before.match(new RegExp(`catch\\s*\\([^)]*${varName}[^)]*:\\s*unknown`, 'i'));
    if (catchMatch) {
      return `logger.${method}(${msg}, { err: ${varName} instanceof Error ? ${varName} : new Error(String(${varName})) })`;
    }
    return match;
  });
  
  return content;
}

// Fix possibly undefined
function fixPossiblyUndefined(content) {
  // Add optional chaining for array access
  content = content.replace(/(\w+)\[(\d+)\](?!\?)/g, (match, arr, idx) => {
    // Check if it's already safe
    if (content.indexOf(`${arr}[${idx}]?.`) !== -1) return match;
    return `${arr}[${idx}]`;
  });
  
  return content;
}

// Process files
const srcDir = path.join(__dirname, '../src');

// Apply specific fixes
Object.entries(specificFixes).forEach(([relativePath, fixFn]) => {
  const fullPath = path.join(srcDir, relativePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = fixFn(content);
    content = fixUnknownErrors(content);
    content = fixPossiblyUndefined(content);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed ${relativePath}`);
  }
});

console.log('Done!');






