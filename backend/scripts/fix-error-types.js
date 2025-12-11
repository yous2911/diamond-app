const fs = require('fs');
const path = require('path');

// Find all TypeScript files
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Fix error.message patterns
function fixErrorTypes(content) {
  let fixed = content;
  let count = 0;
  
  // Pattern 1: error.message in catch blocks
  const patterns = [
    // error.message standalone
    {
      regex: /(\s+)(error: unknown[^}]*?)(\s+error\.message)/g,
      replacement: (match, indent, before, after) => {
        count++;
        return `${indent}${before}${indent}${after.replace('error.message', 'error instanceof Error ? error.message : \'Unknown error\'')}`;
      }
    },
    // error.message in object literals
    {
      regex: /error:\s*error\.message/g,
      replacement: () => {
        count++;
        return 'error: error instanceof Error ? error.message : \'Unknown error\'';
      }
    },
    // error.message in template strings
    {
      regex: /\$\{error\.message\}/g,
      replacement: () => {
        count++;
        return '${error instanceof Error ? error.message : \'Unknown error\'}';
      }
    },
    // Direct error.message access after catch (error: unknown)
    {
      regex: /(catch\s*\([^)]*error:\s*unknown[^)]*\)\s*\{[^}]*?)(error\.message)/g,
      replacement: (match, before, msgAccess) => {
        count++;
        return before + msgAccess.replace('error.message', 'error instanceof Error ? error.message : \'Unknown error\'');
      }
    }
  ];
  
  // More specific: catch (error: unknown) { ... error.message
  const catchBlockRegex = /(catch\s*\([^)]*error:\s*unknown[^)]*\)\s*\{[\s\S]*?)(error\.message)([\s\S]*?\})/g;
  fixed = fixed.replace(catchBlockRegex, (match, before, msgAccess, after) => {
    // Only replace if it's not already wrapped in instanceof check
    if (!before.includes('instanceof Error')) {
      count++;
      return before + msgAccess.replace('error.message', 'error instanceof Error ? error.message : \'Unknown error\'') + after;
    }
    return match;
  });
  
  // Fix specific patterns
  fixed = fixed.replace(/(\s+error:\s*)error\.message/g, (match, prefix) => {
    count++;
    return prefix + '(error instanceof Error ? error.message : \'Unknown error\')';
  });
  
  return { fixed, count };
}

// Main execution
const srcDir = path.join(__dirname, '../src');
const files = findTsFiles(srcDir);

let totalFixed = 0;
const fixedFiles = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const { fixed, count } = fixErrorTypes(content);
  
  if (count > 0) {
    fs.writeFileSync(file, fixed, 'utf8');
    totalFixed += count;
    fixedFiles.push({ file: path.relative(srcDir, file), count });
  }
});

console.log(`✅ Fixed ${totalFixed} error.message accesses in ${fixedFiles.length} files`);
fixedFiles.forEach(({ file, count }) => {
  console.log(`  - ${file}: ${count} fixes`);
});






