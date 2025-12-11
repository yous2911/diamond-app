const fs = require('fs');
const path = require('path');

// Files with specific fixes needed
const specificFixes = {
  'src/db/migration-manager.ts': (content) => {
    // Remove unused imports
    content = content.replace(/import\s*{\s*writeFile\s*}\s*from\s*['"]fs\/promises['"];?\s*/g, '');
    content = content.replace(/import\s*{\s*boolean\s*}\s*from\s*['"]zod['"];?\s*/g, '');
    // Remove unused variable
    content = content.replace(/const\s+_migrations\s*=\s*\[.*?\];/gs, '// Removed unused _migrations');
    return content;
  },
  'src/db/schema-mysql.ts': (content) => {
    content = content.replace(/import\s*{\s*sql\s*}\s*from\s*['"]drizzle-orm['"];?\s*/g, '');
    return content;
  },
  'src/db/schema.ts': (content) => {
    content = content.replace(/import\s*{\s*sql\s*}\s*from\s*['"]drizzle-orm['"];?\s*/g, '');
    return content;
  },
  'src/middleware/auth.middleware.ts': (content) => {
    content = content.replace(/,\s*reply\s*:\s*FastifyReply/g, ', _reply: FastifyReply');
    return content;
  },
  'src/plugins/auth.ts': (content) => {
    content = content.replace(/import\s*{\s*AuthService\s*}\s*from\s*['"][^'"]+['"];?\s*/g, '');
    content = content.replace(/import\s*{\s*logger\s*}\s*from\s*['"][^'"]+['"];?\s*/g, '');
    return content;
  },
  'src/plugins/cors.ts': (content) => {
    content = content.replace(/import\s*{\s*CorsOptions\s*}\s*from\s*['"][^'"]+['"];?\s*/g, '');
    content = content.replace(/const\s+_corsService\s*=/g, '// const _corsService =');
    content = content.replace(/,\s*reply\s*:\s*FastifyReply/g, ', _reply: FastifyReply');
    content = content.replace(/,\s*request\s*:\s*FastifyRequest/g, ', _request: FastifyRequest');
    content = content.replace(/const\s+_preflightKey\s*=/g, '// const _preflightKey =');
    return content;
  },
  'src/plugins/database.ts': (content) => {
    content = content.replace(/,\s*request\s*:\s*FastifyRequest/g, ', _request: FastifyRequest');
    return content;
  },
  'src/plugins/file-upload.ts': (content) => {
    content = content.replace(/,\s*request\s*:\s*FastifyRequest/g, ', _request: FastifyRequest');
    return content;
  }
};

function processFile(filePath) {
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  
  if (specificFixes[relativePath]) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = specificFixes[relativePath](content);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${relativePath}`);
    return true;
  }
  return false;
}

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

const srcDir = path.join(__dirname, '../src');
const files = findTSFiles(srcDir);

let fixed = 0;
files.forEach(file => {
  if (processFile(file)) fixed++;
});

console.log(`\nFixed ${fixed} files`);






