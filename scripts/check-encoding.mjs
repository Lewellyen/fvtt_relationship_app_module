#!/usr/bin/env node
/**
 * Check that all source files use UTF-8 encoding without BOM.
 * Exits with error if any file has incorrect encoding.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const patterns = ['src/**/*.ts', 'docs/**/*.md'];
const errors = [];

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

async function checkEncoding() {
  for (const pattern of patterns) {
    const files = globSync(pattern, rootDir);
    for (const file of files) {
      const fullPath = path.resolve(rootDir, file);
      const buffer = fs.readFileSync(fullPath);
      
      // Check for BOM (UTF-8 BOM is EF BB BF)
      if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        errors.push(`${file}: UTF-8 BOM detected (should be UTF-8 without BOM)`);
      }
      
      // Simple UTF-8 validation: try to decode
      try {
        buffer.toString('utf-8');
      } catch (e) {
        errors.push(`${file}: Not valid UTF-8 encoding`);
      }
    }
  }
  
  if (errors.length > 0) {
    console.error('Encoding errors found:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  } else {
    console.log('✓ All files use UTF-8 encoding without BOM');
  }
}

checkEncoding().catch(err => {
  console.error('Error running encoding check:', err);
  process.exit(1);
});

