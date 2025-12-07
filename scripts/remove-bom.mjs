#!/usr/bin/env node
/**
 * Remove UTF-8 BOM from all source files.
 * Scans src and docs directories for .ts and .md files and removes BOM if present.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const patterns = ['src/**/*.ts', 'docs/**/*.md'];
const UTF8_BOM = Buffer.from([0xEF, 0xBB, 0xBF]);

function globSync(pattern, cwd) {
  const results = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(cwd, fullPath).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        // Simple pattern matching for **/*.ext
        const ext = pattern.split('.').pop();
        if (relPath.endsWith(`.${ext}`)) {
          results.push(relPath);
        }
      }
    }
  }
  const baseDir = pattern.startsWith('src/') ? path.join(cwd, 'src') : path.join(cwd, 'docs');
  if (fs.existsSync(baseDir)) {
    walk(baseDir);
  }
  return results;
}

async function removeBOM() {
  let totalFiles = 0;
  let filesWithBOM = 0;
  const fixedFiles = [];

  for (const pattern of patterns) {
    const files = globSync(pattern, rootDir);
    for (const file of files) {
      totalFiles++;
      const fullPath = path.resolve(rootDir, file);
      const buffer = fs.readFileSync(fullPath);

      // Check for BOM (UTF-8 BOM is EF BB BF)
      if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        filesWithBOM++;
        // Remove BOM by writing file without first 3 bytes
        const contentWithoutBOM = buffer.slice(3);
        fs.writeFileSync(fullPath, contentWithoutBOM, 'utf8');
        fixedFiles.push(file);
        console.log(`✓ Removed BOM from: ${file}`);
      }
    }
  }

  if (filesWithBOM === 0) {
    console.log(`✓ No BOMs found in ${totalFiles} files`);
  } else {
    console.log(`\n✓ Removed BOM from ${filesWithBOM} file(s) out of ${totalFiles} total:`);
    fixedFiles.forEach(file => console.log(`  - ${file}`));
  }
}

removeBOM().catch(err => {
  console.error('Error removing BOMs:', err);
  process.exit(1);
});

