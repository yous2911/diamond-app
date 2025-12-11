const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const fixes = [];

// Fix unused imports and variables
function fixUnusedImportsAndVars(content, filePath) {
  let modified = content;
  let count = 0;

  // Remove unused imports (TS6192)
  modified = modified.replace(/^import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?\s*$/gm, (match) => {
    // Check if all imports are unused (prefixed with _)
    const imports = match.match(/\{([^}]+)\}/)?.[1];
    if (imports && imports.split(',').every(imp => imp.trim().startsWith('_'))) {
      count++;
      return `// ${match.trim()} // Removed unused import`;
    }
    return match;
  });

  // Fix unused variables by prefixing with _
  const unusedVarPattern = /(\w+)\s*:\s*(\w+)\s*[=,;\)]/g;
  modified = modified.replace(unusedVarPattern, (match, varName, type) => {
    if (varName && !varName.startsWith('_') && varName !== 'error' && varName !== 'request' && varName !== 'reply') {
      // Check if it's actually unused by looking for usage
      const usageCount = (content.match(new RegExp(`\\b${varName}\\b`, 'g')) || []).length;
      if (usageCount <= 1) {
        count++;
        return match.replace(varName, `_${varName}`);
      }
    }
    return match;
  });

  return { modified, count };
}

// Fix unknown error types
function fixUnknownErrorTypes(content) {
  let modified = content;
  let count = 0;

  // Fix catch blocks with unknown error
  modified = modified.replace(/catch\s*\(\s*error\s*:\s*unknown\s*\)/g, (match) => {
    count++;
    return 'catch (error: unknown)';
  });

  // Add error type guards where needed
  modified = modified.replace(/logger\.(error|warn|info)\([^,]+,\s*\{\s*err:\s*error\s*\}\)/g, (match) => {
    // Already fixed
    return match;
  });

  // Fix direct error.message access
  modified = modified.replace(/(\w+)\.message/g, (match, varName) => {
    if (varName === 'error') {
      const beforeMatch = content.substring(0, content.indexOf(match));
      const catchBlock = beforeMatch.match(/catch\s*\([^)]*\)/);
      if (catchBlock && catchBlock[0].includes('unknown')) {
        count++;
        return `(${varName} instanceof Error ? ${varName}.message : String(${varName}))`;
      }
    }
    return match;
  });

  return { modified, count };
}

// Fix property doesn't exist errors
function fixPropertyErrors(content) {
  let modified = content;
  let count = 0;

  // Fix _students -> students
  modified = modified.replace(/schema\._students/g, () => {
    count++;
    return 'schema.students';
  });

  modified = modified.replace(/schema\._modules/g, () => {
    count++;
    return 'schema.modules';
  });

  return { modified, count };
}

// Fix type comparison issues
function fixTypeComparisons(content) {
  let modified = content;
  let count = 0;

  // Fix boolean vs string comparisons
  modified = modified.replace(/(\w+)\s*===\s*['"]true['"]/g, (match, varName) => {
    count++;
    return `${varName} === true`;
  });

  modified = modified.replace(/(\w+)\s*===\s*['"]false['"]/g, (match, varName) => {
    count++;
    return `${varName} === false`;
  });

  return { modified, count };
}

// Process a single file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let totalFixes = 0;

    // Apply all fixes
    const unusedFix = fixUnusedImportsAndVars(content, filePath);
    content = unusedFix.modified;
    totalFixes += unusedFix.count;

    const errorFix = fixUnknownErrorTypes(content);
    content = errorFix.modified;
    totalFixes += errorFix.count;

    const propertyFix = fixPropertyErrors(content);
    content = propertyFix.modified;
    totalFixes += propertyFix.count;

    const comparisonFix = fixTypeComparisons(content);
    content = comparisonFix.modified;
    totalFixes += comparisonFix.count;

    if (totalFixes > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      fixes.push({ file: filePath, count: totalFixes });
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Find all TypeScript files
function findTSFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.includes('.git')) {
      files.push(...findTSFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Main execution
console.log('Starting comprehensive error fix...');
const srcDir = path.join(__dirname, '../src');
const files = findTSFiles(srcDir);

console.log(`Found ${files.length} TypeScript files to process`);

files.forEach(processFile);

console.log(`\nFixed ${fixes.length} files:`);
fixes.forEach(fix => {
  console.log(`  ${fix.file}: ${fix.count} fixes`);
});

console.log(`\nTotal fixes applied: ${fixes.reduce((sum, f) => sum + f.count, 0)}`);






