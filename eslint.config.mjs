import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

export default [
  {
    files: ['**/*.{ts,js}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_', // Parameter mit _ Prefix ignorieren
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        }
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-deprecated': 'warn', // Warn on usage of @deprecated methods
      '@typescript-eslint/explicit-function-return-type': ['warn', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowDirectConstAssertionInArrowFunctions: true,
      }],
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
  
  // Valibot-Schemas: PascalCase für Schema-Exports erlauben
  {
    files: ['**/schemas.ts', '**/validation/schemas.ts'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        // Alle Regeln aus Hauptkonfiguration kopieren und erweitern
        {
          selector: ['class', 'interface', 'typeAlias', 'enum'],
          format: ['PascalCase'],
        },
        {
          selector: 'typeParameter',
          format: ['PascalCase'],
          filter: {
            regex: '^(T|K|V|E)$',
            match: false,
          },
        },
        {
          selector: ['variable', 'function'],
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['UPPER_CASE', 'camelCase', 'PascalCase'], // Erlaubt PascalCase für Schema-Exports
          leadingUnderscore: 'allow',
        },
        {
          selector: ['property', 'method'],
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'property',
          format: null,
          filter: {
            regex: '^__.*',
            match: true
          }
        },
        {
          selector: 'memberLike',
          modifiers: ['private'],
          format: ['camelCase'],
        },
      ]
    }
  },
  
  // console.table Kompatibilität: String-Literal-Keys in Interfaces erlauben
  {
    files: ['**/metrics-collector.ts'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        // Alle Regeln aus Hauptkonfiguration kopieren und erweitern
        {
          selector: ['class', 'interface', 'typeAlias', 'enum'],
          format: ['PascalCase'],
        },
        {
          selector: 'typeParameter',
          format: ['PascalCase'],
          filter: {
            regex: '^(T|K|V|E)$',
            match: false,
          },
        },
        {
          selector: ['variable', 'function'],
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['UPPER_CASE', 'camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: ['property', 'method'],
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'property',
          format: null, // Keine Format-Prüfung für String-Literal-Keys
          filter: {
            // Erlaubt Properties mit Leerzeichen oder Sonderzeichen (String-Literal-Keys)
            regex: '.*[\\s\\-].*|^".*"$|^\'.*\'$',
            match: true
          }
        },
        {
          selector: 'property',
          format: null,
          filter: {
            regex: '^__.*',
            match: true
          }
        },
        {
          selector: 'memberLike',
          modifiers: ['private'],
          format: ['camelCase'],
        },
      ]
    }
  },
  
  // Heterogene Service-Typen: any ist architektonisch notwendig
  {
    files: ['**/TypeSafeRegistrationMap.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  
  // Variadische Konstruktoren: any[] ist für DI notwendig
  {
    files: ['**/serviceclass.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  
  // Type-Definitionen: deprecated APIs erlauben
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-deprecated': 'off'
    }
  }
];

