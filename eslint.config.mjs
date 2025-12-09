import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    files: ['**/*.{ts,js}'],
    ignores: ['tests/**/*'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        projectService: true, // Verbessert Performance durch Caching - ersetzt 'project'
        sourceType: 'module',
      tsconfigRootDir: import.meta.dirname || process.cwd()
    }
  },
  plugins: {
    '@typescript-eslint': typescript,
    'import': importPlugin
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
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

      // 👇 Domänengrenzen-Prüfung (Clean Architecture)
      // Unterstützt sowohl relative Pfade (./src/...) als auch @/ Aliase
      // Hinweis: Arrays in target/from werden möglicherweise nicht unterstützt,
      // daher separate Zone-Einträge für @/ Aliase
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // Domain Layer darf NICHT von anderen Layern abhängen (relative Pfade)
            {
              target: './src/domain/**',
              from: './src/application/**',
              message: 'Domain Layer darf nicht von Application Layer abhängen (Clean Architecture Verletzung)',
            },
            {
              target: './src/domain/**',
              from: './src/infrastructure/**',
              message: 'Domain Layer darf nicht von Infrastructure Layer abhängen (Clean Architecture Verletzung)',
            },
            {
              target: './src/domain/**',
              from: './src/framework/**',
              message: 'Domain Layer darf nicht von Framework Layer abhängen (Clean Architecture Verletzung)',
            },
            // Domain Layer darf NICHT von anderen Layern abhängen (@/ Aliase)
            {
              target: '@/domain/**',
              from: '@/application/**',
              message: 'Domain Layer darf nicht von Application Layer abhängen (Clean Architecture Verletzung)',
            },
            {
              target: '@/domain/**',
              from: '@/infrastructure/**',
              message: 'Domain Layer darf nicht von Infrastructure Layer abhängen (Clean Architecture Verletzung)',
            },
            {
              target: '@/domain/**',
              from: '@/framework/**',
              message: 'Domain Layer darf nicht von Framework Layer abhängen (Clean Architecture Verletzung)',
            },
            // Application Layer darf NICHT von Infrastructure/Framework abhängen (Clean Architecture)
            {
              target: './src/application/**',
              from: './src/infrastructure/**',
              message: 'Application Layer darf nicht direkt von Infrastructure Layer abhängen (Clean Architecture Verletzung)',
            },
            {
              target: './src/application/**',
              from: './src/framework/**',
              message: 'Application Layer darf nicht von Framework Layer abhängen (Clean Architecture Verletzung)',
            },
            // Application Layer darf NICHT von Infrastructure/Framework abhängen (Clean Architecture)
            {
              target: '@/application/**',
              from: '@/infrastructure/**',
              message: 'Application Layer darf nicht direkt von Infrastructure Layer abhängen (Clean Architecture Verletzung)',
            },
            {
              target: '@/application/**',
              from: '@/framework/**',
              message: 'Application Layer darf nicht von Framework Layer abhängen (Clean Architecture Verletzung)',
            },
            // Infrastructure Layer darf NICHT von Framework abhängen - relative Pfade
            {
              target: './src/infrastructure/**',
              from: './src/framework/**',
              message: 'Infrastructure Layer darf nicht von Framework Layer abhängen (Clean Architecture Verletzung)',
            },
            // Infrastructure Layer darf NICHT von Framework abhängen - @/ Aliase
            {
              target: '@/infrastructure/**',
              from: '@/framework/**',
              message: 'Infrastructure Layer darf nicht von Framework Layer abhängen (Clean Architecture Verletzung)',
            },
          ],
        },
      ],

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
  // Test-Dateien: Verwende tests/tsconfig.json
  // In Tests ist `any` erlaubt, da wir mit Foundry's globalen Objekten arbeiten
  // Test-Dateien dürfen auch direkt aus Infrastructure importieren (für Testing)
  {
    files: ['**/__tests__/**/*.{ts,js}', '**/*.test.ts', '**/*.spec.ts', 'tests/**/*.{ts,js}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        projectService: true, // Verbessert Performance durch Caching - ersetzt 'project'
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
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        }
      ],
      '@typescript-eslint/no-explicit-any': 'off', // any ist in Tests erlaubt (Foundry Globals)
      '@typescript-eslint/explicit-function-return-type': 'off', // Optional für Tests
      'import/no-restricted-paths': 'off', // Tests dürfen direkt aus Infrastructure importieren (für Testing)
    }
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
  },

  // Deprecated Barrel-Exports: Warnung bei Import von deprecated Token-Barrel-Exports
  {
    files: ['**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: '@/infrastructure/shared/tokens',
              message:
                'Please import tokens from specific files (e.g., @/infrastructure/shared/tokens/core.tokens) for better tree-shaking.',
            },
            {
              name: '@/infrastructure/shared/tokens/index',
              message:
                'Please import tokens from specific files (e.g., @/infrastructure/shared/tokens/core.tokens) for better tree-shaking.',
            },
            {
              name: '@/application/tokens',
              message:
                'Please import tokens from specific files (e.g., @/application/tokens/application.tokens) for better tree-shaking.',
            },
            {
              name: '@/application/tokens/index',
              message:
                'Please import tokens from specific files (e.g., @/application/tokens/application.tokens) for better tree-shaking.',
            },
          ],
        },
      ],
    },
  }
];

