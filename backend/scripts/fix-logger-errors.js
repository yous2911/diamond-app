const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all TypeScript files
function findTsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('dist')) {
      results = results.concat(findTsFiles(filePath));
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Fix logger.error calls
function fixLoggerErrors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Pattern: logger.error('message:', error) -> logger.error({ err: error }, 'message')
  const patterns = [
    [/logger\.error\((['"`])([^'"`]+):\s*,\s*error\)/g, "logger.error({ err: error }, $1$2)"],
    [/logger\.error\((['"`])([^'"`]+):\s*error\)/g, "logger.error({ err: error }, $1$2)"],
    [/logger\.error\((['"`])([^'"`]+),\s*error\)/g, "logger.error({ err: error }, $1$2)"],
  ];
  
  patterns.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Main
const srcDir = path.join(__dirname, '../src');
const files = findTsFiles(srcDir);
let fixed = 0;

files.forEach(file => {
  if (fixLoggerErrors(file)) {
    fixed++;
    console.log(`Fixed: ${file}`);
  }
});

console.log(`\nFixed ${fixed} files`);

