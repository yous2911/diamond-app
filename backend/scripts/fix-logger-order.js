const fs = require('fs');
const path = require('path');

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

function fixLoggerOrder(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Pattern: logger.error({ err: error }, 'message') -> logger.error('message', { err: error })
  const pattern = /logger\.error\(\{\s*err:\s*error\s*\},\s*(['"`])([^'"`]+)\1\)/g;
  
  content = content.replace(pattern, (match, quote, message) => {
    modified = true;
    return `logger.error(${quote}${message}${quote}, { err: error })`;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

const srcDir = path.join(__dirname, '../src');
const files = findTsFiles(srcDir);
let fixed = 0;

files.forEach(file => {
  if (fixLoggerOrder(file)) {
    fixed++;
    console.log(`Fixed: ${file}`);
  }
});

console.log(`\nFixed ${fixed} files`);

