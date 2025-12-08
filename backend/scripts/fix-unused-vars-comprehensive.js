const fs = require('fs');
const path = require('path');

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

// Fix unused imports and variables
function fixUnused(content, filePath) {
  let modified = content;
  let fixes = 0;

  // Remove unused imports (TS6192 - all imports unused)
  const importPattern = /^import\s+(\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"];?\s*$/gm;
  const imports = [];
  let match;
  while ((match = importPattern.exec(content)) !== null) {
    imports.push({ full: match[0], named: match[1], from: match[2], index: match.index });
  }

  // Check each import
  for (const imp of imports.reverse()) {
    const importContent = imp.named;
    // Extract individual imports
    if (importContent.startsWith('{')) {
      const namedImports = importContent.slice(1, -1).split(',').map(s => s.trim());
      const usedImports = [];
      
      for (const named of namedImports) {
        const importName = named.split(' as ')[0].trim();
        // Skip if it's already prefixed with _
        if (importName.startsWith('_')) continue;
        
        // Check if it's used in the file (excluding the import line itself)
        const usagePattern = new RegExp(`\\b${importName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        const matches = content.match(usagePattern) || [];
        // If used more than once (import counts as one), it's used
        if (matches.length > 1) {
          usedImports.push(named);
        }
      }
      
      // If no imports are used, remove the entire import
      if (usedImports.length === 0 && namedImports.length > 0) {
        modified = modified.substring(0, imp.index) + modified.substring(imp.index + imp.full.length);
        fixes++;
      } else if (usedImports.length < namedImports.length) {
        // Remove unused imports from the list
        const newImport = `import { ${usedImports.join(', ')} } from '${imp.from}';`;
        modified = modified.substring(0, imp.index) + newImport + modified.substring(imp.index + imp.full.length);
        fixes++;
      }
    }
  }

  // Fix unused variables by prefixing with _
  // Pattern: const/let/var variableName = ... or variableName: type
  const varPatterns = [
    /(const|let|var)\s+(\w+)\s*[:=]/g,
    /(\w+)\s*:\s*(\w+)\s*[=,;\)]/g
  ];

  for (const pattern of varPatterns) {
    modified = modified.replace(pattern, (match, p1, p2) => {
      const varName = p2 || p1;
      // Skip if already prefixed or is a common used name
      if (varName.startsWith('_') || ['error', 'request', 'reply', 'fastify', 'db', 'logger', 'config'].includes(varName)) {
        return match;
      }
      
      // Check if variable is used
      const usagePattern = new RegExp(`\\b${varName}\\b`, 'g');
      const matches = modified.match(usagePattern) || [];
      // If only appears once (the declaration), it's unused
      if (matches.length <= 1) {
        fixes++;
        if (p2) {
          return match.replace(varName, `_${varName}`);
        } else {
          return match.replace(p1, `_${p1}`);
        }
      }
      return match;
    });
  }

  return { modified, fixes };
}

// Process files
const srcDir = path.join(__dirname, '../src');
const files = findTSFiles(srcDir);

console.log(`Processing ${files.length} files...`);

let totalFixes = 0;
const fixedFiles = [];

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const result = fixUnused(content, file);
    
    if (result.fixes > 0) {
      fs.writeFileSync(file, result.modified, 'utf8');
      const relativePath = path.relative(srcDir, file);
      fixedFiles.push({ file: relativePath, fixes: result.fixes });
      totalFixes += result.fixes;
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

console.log(`\nFixed ${fixedFiles.length} files:`);
fixedFiles.slice(0, 20).forEach(f => {
  console.log(`  ${f.file}: ${f.fixes} fixes`);
});
if (fixedFiles.length > 20) {
  console.log(`  ... and ${fixedFiles.length - 20} more files`);
}

console.log(`\nTotal fixes: ${totalFixes}`);



