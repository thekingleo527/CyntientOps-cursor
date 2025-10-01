/**
 * Script to replace console.log/error/warn with Logger calls
 * Run with: node scripts/replace-console-logs.js
 */

const fs = require('fs');
const path = require('path');

// Directories to process
const dirs = [
  'packages/business-core/src/services',
  'packages/business-core/src/managers',
  'packages/ui-components/src/maps/services',
  'apps/mobile-rn/src/navigation/tabs',
  'apps/mobile-rn/src/screens',
];

let totalReplaced = 0;
let filesModified = 0;

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = content;
  let changed = false;

  // Check if Logger is already imported
  const hasLoggerImport = content.includes("from './LoggingService'") ||
                          content.includes("from '../services/LoggingService'") ||
                          content.includes("from '@cyntientops/business-core'") ||
                          content.includes('import { Logger }');

  // Add Logger import if not present and file has console statements
  if (!hasLoggerImport && /console\.(log|error|warn|info|debug)/.test(content)) {
    // Find the last import statement
    const importLines = content.split('\n');
    let lastImportIndex = -1;

    for (let i = 0; i < importLines.length; i++) {
      if (importLines[i].trim().startsWith('import ') && !importLines[i].includes('/*') && !importLines[i].includes('//')) {
        lastImportIndex = i;
      }
    }

    if (lastImportIndex >= 0) {
      // Determine the correct import path based on file location
      let importPath = './LoggingService';
      if (filePath.includes('/managers/')) {
        importPath = '../services/LoggingService';
      } else if (filePath.includes('ui-components')) {
        importPath = '@cyntientops/business-core';
      }

      importLines.splice(lastImportIndex + 1, 0, `import { Logger } from '${importPath}';`);
      modified = importLines.join('\n');
      changed = true;
    }
  }

  // Replace console.error with Logger.error
  const errorRegex = /console\.error\(['"](\[[\w\s]+\])\s*([^'"]+)['"],\s*(\w+)\)/g;
  modified = modified.replace(errorRegex, (match, prefix, message, errorVar) => {
    const cleanMessage = message.trim();
    const context = prefix.replace('[', '').replace(']', '');
    totalReplaced++;
    changed = true;
    return `Logger.error('${cleanMessage}', ${errorVar}, '${context}')`;
  });

  // Replace simple console.error
  const simpleErrorRegex = /console\.error\((['"][^'"]+['"])[^)]*\)/g;
  modified = modified.replace(simpleErrorRegex, (match) => {
    totalReplaced++;
    changed = true;
    const messageMatch = match.match(/['"]([^'"]+)['"]/);
    const message = messageMatch ? messageMatch[1] : 'Error occurred';
    const cleanMessage = message.replace(/^\[[^\]]+\]\s*/, '');
    const fileName = path.basename(filePath, '.ts');
    return `Logger.error('${cleanMessage}', undefined, '${fileName}')`;
  });

  // Replace console.warn with Logger.warn
  const warnRegex = /console\.warn\((['"][^'"]+['"])[^)]*\)/g;
  modified = modified.replace(warnRegex, (match) => {
    totalReplaced++;
    changed = true;
    const messageMatch = match.match(/['"]([^'"]+)['"]/);
    const message = messageMatch ? messageMatch[1] : 'Warning occurred';
    const cleanMessage = message.replace(/^\[[^\]]+\]\s*/, '');
    const fileName = path.basename(filePath, '.ts');
    return `Logger.warn('${cleanMessage}', undefined, '${fileName}')`;
  });

  // Replace console.log with Logger.debug (development only)
  const logRegex = /console\.log\((['"][^'"]+['"])[^)]*\)/g;
  modified = modified.replace(logRegex, (match) => {
    totalReplaced++;
    changed = true;
    const messageMatch = match.match(/['"]([^'"]+)['"]/);
    const message = messageMatch ? messageMatch[1] : 'Debug message';
    const cleanMessage = message.replace(/^\[[^\]]+\]\s*/, '');
    const fileName = path.basename(filePath, '.ts');
    return `Logger.debug('${cleanMessage}', undefined, '${fileName}')`;
  });

  if (changed) {
    fs.writeFileSync(filePath, modified, 'utf8');
    filesModified++;
    console.log(`✅ Modified: ${filePath}`);
  }
}

function processDirectory(dir) {
  const fullPath = path.join(__dirname, '..', dir);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Directory not found: ${fullPath}`);
    return;
  }

  const files = fs.readdirSync(fullPath);

  files.forEach(file => {
    if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.endsWith('.d.ts')) {
      const filePath = path.join(fullPath, file);
      processFile(filePath);
    }
  });
}

console.log('🔍 Replacing console statements with Logger calls...\n');

dirs.forEach(dir => {
  console.log(`📁 Processing: ${dir}`);
  processDirectory(dir);
});

console.log(`\n✨ Complete!`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Statements replaced: ${totalReplaced}`);
