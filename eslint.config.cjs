const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const sveltePlugin = require('eslint-plugin-svelte');
const svelteParser = require('svelte-eslint-parser');

module.exports = [
  {
    files: ['**/*.{ts,js}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-deprecated': 'warn', // Warn on usage of @deprecated methods
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always'],

      // 👇 Namenskonventionen für lesbaren, konsistenten Code
      '@typescript-eslint/naming-convention': [
        'error',

      // 1️⃣ Klassen, Interfaces, Typen, Enums, Namespaces
      {
        selector: ['class', 'interface', 'typeAlias', 'enum'],
        format: ['PascalCase'],
      },

      // 2️⃣ Generics (Type-Parameter) -> sprechende PascalCase-Namen, keine T/K/V/E
      {
        selector: 'typeParameter',
        format: ['PascalCase'],
        filter: {
          regex: '^(T|K|V|E)$',
          match: false,
        },
      },

      // 3️⃣ Variablen und Funktionen -> camelCase
      {
        selector: ['variable', 'function'],
        format: ['camelCase'],
        leadingUnderscore: 'allow', // _temp ok
      },

      // 4️⃣ Konstanten in UPPER_CASE
      {
        selector: 'variable',
        modifiers: ['const'],
        format: ['UPPER_CASE', 'camelCase'], // erlaubt beides, bevorzugt UPPER_CASE
        leadingUnderscore: 'allow',
      },

      // 5️⃣ Member von Objekten/Klassen (Properties, Methods)
      {
        selector: ['property', 'method'],
        format: ['camelCase', 'PascalCase', 'UPPER_CASE'], // erlaubt beide (z. B. Event-Handler in Pascal)
        leadingUnderscore: 'allow',
      },

      // Exception: Type-Branding Properties (nur Compile-Zeit, kein Laufzeit-Property)
      {
        selector: 'property',
        format: null, // keine Format-Prüfung
        filter: {
          regex: '^__.*', // Properties, die mit __ beginnen
          match: true
        }
      },

      // 6️⃣ Private Felder (#scope etc.)
      {
        selector: 'memberLike',
        modifiers: ['private'],
        format: ['camelCase'],
      },
      ]
    }
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: typescriptParser,
        extraFileExtensions: ['.svelte']
      }
    },
    plugins: {
      svelte: sveltePlugin
    },
    rules: {
      ...sveltePlugin.configs.recommended.rules,
      'svelte/no-unused-svelte-ignore': 'error',
      'svelte/no-at-html-tags': 'error'
    }
  },
  {
    ignores: ['node_modules/', 'dist/', 'packs/', 'assets/', 'tailwind.config.js', 'postcss.config.js']
  },
  {
    // Exception für Cytoscape Polyfill (benötigt loose equality)
    files: ['src/polyfills/cytoscape-assign-fix.ts'],
    rules: {
      'eqeqeq': 'off' // Deaktiviert für absichtlichen Patch
    }
  }
]; 