#!/usr/bin/env node
/**
 * Check for forbidden ignore directives in No-Ignores zones.
 * 
 * Verbotene Bereiche (laut docs/quality-gates/no-ignores/):
 * - src/core/** (ohne init-solid.ts)
 * - src/services/**
 * - src/utils/**
 * - src/types/**
 * 
 * Sucht nach:
 * - c8 ignore
 * - type-coverage:ignore
 * - eslint-disable
 * - ts-ignore
 * 
 * Exits with error code 1 if any forbidden ignores are found.
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

// Verbotene Bereiche (patterns für ripgrep)
const FORBIDDEN_PATHS = [
  'src/core/**',
  'src/services/**',
  'src/utils/**',
  'src/types/**',
];

// Ausnahmen (Dateien, die ausgenommen sind)
const EXCEPTIONS = [
  'src/core/init-solid.ts',
];

// Ignore-Marker, nach denen gesucht wird
const IGNORE_PATTERNS = [
  { pattern: /c8\s+ignore/i, name: 'c8 ignore' },
  { pattern: /type-coverage:ignore/i, name: 'type-coverage:ignore' },
  { pattern: /eslint-disable/i, name: 'eslint-disable' },
  { pattern: /ts-ignore/i, name: 'ts-ignore' },
  { pattern: /@ts-ignore/i, name: '@ts-ignore' },
];

/**
 * Check if a file path matches any exception.
 */
function isException(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return EXCEPTIONS.some(exception => normalized === exception || normalized.endsWith(exception));
}

/**
 * Find files in forbidden paths using ripgrep or fallback to Node.js.
 */
function findFilesInForbiddenPaths() {
  try {
    // Try to use ripgrep (rg) if available
    const rgAvailable = execSync('rg --version', { encoding: 'utf-8', stdio: 'pipe' }).includes('ripgrep');
    
    if (rgAvailable) {
      const files = new Set();
      for (const pathPattern of FORBIDDEN_PATHS) {
        try {
          // Find all .ts/.js files in the pattern
          const result = execSync(
            `rg --files --type ts --type js "${pathPattern.replace('**', '*')}"`,
            { cwd: repoRoot, encoding: 'utf-8', stdio: 'pipe' }
          );
          result.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !isException(trimmed)) {
              files.add(trimmed);
            }
          });
        } catch (e) {
          // Pattern might not match - continue
        }
      }
      return Array.from(files);
    }
  } catch (e) {
    // ripgrep not available, fall back to manual search
  }

  // Fallback: manual file search
  const files = [];
  
  function walkDir(dir, basePattern) {
    if (!existsSync(dir)) return;
    
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = resolve(dir, entry.name);
      const relPath = fullPath.replace(repoRoot + '/', '').replace(/\\/g, '/');
      
      if (entry.isDirectory()) {
        walkDir(fullPath, basePattern);
      } else if ((entry.name.endsWith('.ts') || entry.name.endsWith('.js')) && !isException(relPath)) {
        // Check if file matches any forbidden path pattern
        const matches = FORBIDDEN_PATHS.some(pattern => {
          const patternBase = pattern.replace('/**', '').replace('**', '');
          return relPath.startsWith(patternBase);
        });
        if (matches) {
          files.push(relPath);
        }
      }
    }
  }
  
  for (const pattern of FORBIDDEN_PATHS) {
    const baseDir = pattern.replace('/**', '').replace('**', '');
    walkDir(resolve(repoRoot, baseDir), pattern);
  }
  
  return files;
}

/**
 * Search for ignore patterns in a file.
 */
function searchIgnoresInFile(filePath) {
  const fullPath = resolve(repoRoot, filePath);
  
  if (!existsSync(fullPath)) {
    return [];
  }
  
  const content = readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');
  const matches = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const { pattern, name } of IGNORE_PATTERNS) {
      if (pattern.test(line)) {
        matches.push({
          file: filePath,
          line: i + 1,
          content: line.trim(),
          pattern: name,
        });
      }
    }
  }
  
  return matches;
}

/**
 * Main check function.
 */
async function checkNoIgnores() {
  console.log('Checking for forbidden ignore directives in No-Ignores zones...\n');
  
  try {
    // Try using ripgrep for pattern search (faster and more reliable)
    const rgAvailable = execSync('rg --version', { encoding: 'utf-8', stdio: 'pipe' }).includes('ripgrep');
    
    let allMatches = [];
    
    if (rgAvailable) {
      // Use ripgrep to search for ignore patterns directly
      for (const { pattern, name } of IGNORE_PATTERNS) {
        const rgPattern = pattern.source.replace(/\\s/g, '\\s+');
        
        for (const pathPattern of FORBIDDEN_PATHS) {
          try {
            const searchPath = pathPattern.replace('**', '*');
            const result = execSync(
              `rg -n "${rgPattern}" --type ts --type js "${searchPath}"`,
              { cwd: repoRoot, encoding: 'utf-8', stdio: 'pipe', maxBuffer: 10 * 1024 * 1024 }
            );
            
            const lines = result.split('\n').filter(Boolean);
            for (const line of lines) {
              const match = line.match(/^(.+?):(\d+):(.+)$/);
              if (match) {
                const [, filePath, lineNum, content] = match;
                if (!isException(filePath)) {
                  allMatches.push({
                    file: filePath,
                    line: parseInt(lineNum, 10),
                    content: content.trim(),
                    pattern: name,
                  });
                }
              }
            }
          } catch (e) {
            // No matches or pattern not found - continue
          }
        }
      }
    } else {
      // Fallback: manual file search and pattern matching
      console.log('Warning: ripgrep (rg) not available, using slower fallback method.\n');
      const files = await findFilesInForbiddenPaths();
      
      for (const file of files) {
        const matches = searchIgnoresInFile(file);
        allMatches.push(...matches);
      }
    }
    
    if (allMatches.length > 0) {
      console.error('❌ Forbidden ignore directives found in No-Ignores zones:\n');
      
      // Group by file
      const byFile = {};
      for (const match of allMatches) {
        if (!byFile[match.file]) {
          byFile[match.file] = [];
        }
        byFile[match.file].push(match);
      }
      
      for (const [file, matches] of Object.entries(byFile)) {
        console.error(`  ${file}:`);
        for (const match of matches) {
          console.error(`    Line ${match.line}: ${match.pattern}`);
          console.error(`      ${match.content.substring(0, 80)}${match.content.length > 80 ? '...' : ''}`);
        }
        console.error('');
      }
      
      console.error(`Total: ${allMatches.length} forbidden ignore directive(s) found.`);
      console.error('\nForbidden zones:');
      FORBIDDEN_PATHS.forEach(path => console.error(`  - ${path}`));
      console.error('\nAllowed exceptions:');
      EXCEPTIONS.forEach(exception => console.error(`  - ${exception}`));
      console.error('\nThese ignores must be removed and replaced with proper tests or type improvements.');
      
      process.exit(1);
    } else {
      console.log('✓ No forbidden ignore directives found in No-Ignores zones.');
      process.exit(0);
    }
  } catch (error) {
    if (error.status === 1 && error.stdout === '') {
      // ripgrep returns exit code 1 when no matches found - this is OK
      console.log('✓ No forbidden ignore directives found in No-Ignores zones.');
      process.exit(0);
    } else {
      console.error('Error running no-ignores check:', error.message);
      process.exit(1);
    }
  }
}

checkNoIgnores();

