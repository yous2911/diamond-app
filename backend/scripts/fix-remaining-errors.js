const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript errors
function getErrors() {
  try {
    const output = execSync('npm run type-check 2>&1', { encoding: 'utf8', cwd: path.join(__dirname, '..') });
    const lines = output.split('\n');
    const errors = [];
    
    for (const line of lines) {
      const match = line.match(/src\/([^(]+)\((\d+),(\d+)\):\s+error\s+TS(\d+):\s+(.+)/);
      if (match) {
        errors.push({
          file: match[1],
          line: parseInt(match[2]),
          col: parseInt(match[3]),
          code: match[4],
          message: match[5]
        });
      }
    }
    
    return errors;
  } catch (error) {
    // Type-check always exits with error code when there are errors
    const output = error.stdout || error.stderr || '';
    const lines = output.split('\n');
    const errors = [];
    
    for (const line of lines) {
      const match = line.match(/src\/([^(]+)\((\d+),(\d+)\):\s+error\s+TS(\d+):\s+(.+)/);
      if (match) {
        errors.push({
          file: match[1],
          line: parseInt(match[2]),
          col: parseInt(match[3]),
          code: match[4],
          message: match[5]
        });
      }
    }
    
    return errors;
  }
}

// Fix TS18046: 'error' is of type 'unknown'
function fixUnknownError(content, filePath) {
  let modified = content;
  let fixes = 0;
  
  // Fix catch blocks: catch (error: unknown) { ... error.message ... }
  modified = modified.replace(/catch\s*\(([^)]+):\s*unknown\s*\)\s*\{([^}]*?)(\1)\.message/g, (match, varName, before, varRef) => {
    fixes++;
    return `catch (${varName}: unknown) {${before}(${varRef} instanceof Error ? ${varRef}.message : String(${varRef}))`;
  });
  
  // Fix logger.error('msg', error) where error is unknown
  modified = modified.replace(/logger\.(error|warn|info)\(([^,]+),\s*(\w+)\)/g, (match, method, msg, varName) => {
    // Check if varName is in a catch block with unknown type
    const beforeMatch = content.substring(0, content.indexOf(match));
    const catchMatch = beforeMatch.match(new RegExp(`catch\\s*\\([^)]*${varName}[^)]*:\\s*unknown`, 'i'));
    if (catchMatch) {
      fixes++;
      return `logger.${method}(${msg}, { err: ${varName} instanceof Error ? ${varName} : new Error(String(${varName})) })`;
    }
    return match;
  });
  
  return { modified, fixes };
}

// Fix TS18048: Object is possibly 'undefined'
function fixPossiblyUndefined(content) {
  let modified = content;
  let fixes = 0;
  
  // Add optional chaining for common patterns
  const patterns = [
    // array[index]
    /(\w+)\[(\d+)\]/g,
    // object.property
    /(\w+)\.(\w+)/g
  ];
  
  // This is complex, so we'll handle specific cases
  return { modified, fixes };
}

// Fix TS2339: Property does not exist
function fixPropertyNotExist(content, filePath) {
  let modified = content;
  let fixes = 0;
  
  // Common fixes based on file patterns
  if (filePath.includes('schema')) {
    // Fix schema property issues
    modified = modified.replace(/schema\._(\w+)/g, (match, prop) => {
      fixes++;
      return `schema.${prop}`;
    });
  }
  
  return { modified, fixes };
}

// Main fix function
function fixFile(filePath, errors) {
  const fileErrors = errors.filter(e => e.file === filePath);
  if (fileErrors.length === 0) return { fixed: false, fixes: 0 };
  
  let content = fs.readFileSync(filePath, 'utf8');
  let totalFixes = 0;
  
  // Apply fixes based on error codes
  const errorCodes = new Set(fileErrors.map(e => e.code));
  
  if (errorCodes.has('18046')) {
    const result = fixUnknownError(content, filePath);
    content = result.modified;
    totalFixes += result.fixes;
  }
  
  if (errorCodes.has('2339')) {
    const result = fixPropertyNotExist(content, filePath);
    content = result.modified;
    totalFixes += result.fixes;
  }
  
  if (totalFixes > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { fixed: true, fixes: totalFixes };
  }
  
  return { fixed: false, fixes: 0 };
}

// Process errors
console.log('Getting error list...');
const errors = getErrors();
console.log(`Found ${errors.length} errors`);

// Group by file
const filesToFix = new Set(errors.map(e => e.file));
console.log(`Files to fix: ${filesToFix.size}`);

const srcDir = path.join(__dirname, '../src');
let totalFixed = 0;
let filesFixed = 0;

filesToFix.forEach(relativeFile => {
  const fullPath = path.join(srcDir, relativeFile);
  if (fs.existsSync(fullPath)) {
    const result = fixFile(fullPath, errors);
    if (result.fixed) {
      totalFixed += result.fixes;
      filesFixed++;
      console.log(`Fixed ${relativeFile}: ${result.fixes} fixes`);
    }
  }
});

console.log(`\nFixed ${filesFixed} files with ${totalFixed} total fixes`);






