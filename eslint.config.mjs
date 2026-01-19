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

      // Exception: Numerische Property-Namen (Foundry-Versionen z.B. 11, 12, 13)
      {
        selector: 'property',
        format: null, // keine Format-Prüfung
        filter: {
          regex: '^\\d+$', // Properties, die nur aus Ziffern bestehen (Foundry-Versionen)
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

  // Runtime-Casts: any ist für Foundry API Type-Casts notwendig
  // Diese Datei ist bereits global von type-coverage ausgenommen
  {
    files: ['**/runtime-casts.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },

  // FoundryUtilsPort: any ist für Foundry utils API Type-Casts notwendig
  // Diese Datei ist bereits in der check-no-ignores Whitelist
  {
    files: ['**/FoundryUtilsPort.ts'],
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

  // WindowHooksService: Bootstrap-Service, der Application und Infrastructure verbindet
  {
    files: ['**/window-hooks-service.ts'],
    rules: {
      'import/no-restricted-paths': 'off'
    }
  },

  // FoundryApplicationWrapper: Verwendet neue Foundry API (render({ force }))
  // Basisklasse hat noch beide Overloads (deprecated + neu), daher Warnung
  {
    files: ['**/foundry-application-wrapper.ts'],
    rules: {
      '@typescript-eslint/no-deprecated': 'off'
    }
  },


  // Event-Map Interfaces: Event-Namen mit Doppelpunkt erlauben (z.B. "window:created")
  {
    files: ['**/event-map.interface.ts', '**/event-map.ts'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
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
          format: null, // Keine Format-Prüfung für Event-Namen (z.B. "window:created")
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
  ,

  // ============================
  // Architecture Gates (A+B+C+D)
  // ============================

  // A: Domain must not depend on Foundry/DOM/UI frameworks.
  {
    files: ['src/domain/**/*.{ts,js}'],
    ignores: ['src/domain/**/__tests__/**', 'src/domain/**/*.test.*', 'src/domain/**/*.spec.*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            // Keep the existing barrel-export guidance for these files too
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

            // A: Hard bans
            { name: 'svelte', message: 'Domain darf nicht von Svelte abhängen (A).' },
            { name: 'react', message: 'Domain darf nicht von React abhängen (A).' },
            { name: 'vue', message: 'Domain darf nicht von Vue abhängen (A).' },
          ],
          patterns: [
            { group: ['@sveltejs/*'], message: 'Domain darf nicht von Svelte Tooling abhängen (A).' },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        // A: Foundry global namespace usage (type/value)
        { selector: "Identifier[name='foundry']", message: 'Domain darf keine foundry.* Referenzen enthalten (A).' },
        // A: DOM type leaks
        { selector: "Identifier[name='HTMLElement']", message: 'Domain darf keinen DOM-Typ HTMLElement referenzieren (A).' },
        { selector: "Identifier[name='Event']", message: 'Domain darf keinen DOM-Typ Event referenzieren (A).' },
        // A: UI framework type-only imports like import(\"svelte\").Component
        { selector: "TSImportType Literal[value='svelte']", message: 'Domain darf keine Svelte Import-Typen verwenden (A).' },
        { selector: "TSImportType Literal[value='react']", message: 'Domain darf keine React Import-Typen verwenden (A).' },
        { selector: "TSImportType Literal[value='vue']", message: 'Domain darf keine Vue Import-Typen verwenden (A).' },
      ],
    },
  },

  // B: Application must not depend on UI frameworks or platform types.
  {
    files: ['src/application/**/*.{ts,js}'],
    ignores: [
      'src/application/**/__tests__/**',
      'src/application/**/*.test.*',
      'src/application/**/*.spec.*',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          // Keep existing barrel guidance here as well
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

            // B: Hard bans
            { name: 'svelte', message: 'Application darf nicht von Svelte abhängen (B).' },
            { name: 'react', message: 'Application darf nicht von React abhängen (B).' },
            { name: 'vue', message: 'Application darf nicht von Vue abhängen (B).' },
          ],
          patterns: [
            { group: ['@sveltejs/*'], message: 'Application darf nicht von Svelte Tooling abhängen (B).' },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        // B: Platform type leaks
        { selector: "Identifier[name='foundry']", message: 'Application darf keine foundry.* Referenzen enthalten (B).' },
        { selector: "Identifier[name='HTMLElement']", message: 'Application darf keinen DOM-Typ HTMLElement referenzieren (B).' },
        { selector: "Identifier[name='Event']", message: 'Application darf keinen DOM-Typ Event referenzieren (B).' },
        // B: Svelte type-only imports like import(\"svelte\").Component
        { selector: "TSImportType Literal[value='svelte']", message: 'Application darf keine Svelte Import-Typen verwenden (B).' },
      ],
    },
  },

  // C: No service locator calls inside window definitions (definitions must be declarative).
  {
    files: ['src/application/windows/definitions/**/*.{ts,js}'],
    ignores: [
      'src/application/windows/definitions/**/__tests__/**',
      'src/application/windows/definitions/**/*.test.*',
      'src/application/windows/definitions/**/*.spec.*',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.property.name='resolveWithError']",
          message:
            'Window-Definitions dürfen keine Container-Auflösung via resolveWithError() durchführen (C).',
        },
        {
          selector:
            "CallExpression[callee.type='ChainExpression'] MemberExpression[property.name='resolveWithError']",
          message:
            'Window-Definitions dürfen keine Container-Auflösung via resolveWithError() durchführen (C).',
        },
      ],
    },
  },

  // D: Foundry-instantiated entrypoints must behave like third-party modules and use module.api facades only.
  {
    files: [
      'src/infrastructure/adapters/foundry/sheets/**/*.{ts,js}',
      'src/infrastructure/ui/window-system/**/*.{ts,js}',
      'src/infrastructure/windows/adapters/foundry/**/*.{ts,js}',
    ],
    ignores: [
      '**/__tests__/**',
      '**/*.test.*',
      '**/*.spec.*',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/application/tokens/application.tokens',
              message:
                'Foundry-EntryPoints dürfen keine internen Application Tokens importieren. Nutze nur module.api Facade Tokens (D).',
            },
            {
              name: '@/application/tokens/application.tokens.ts',
              message:
                'Foundry-EntryPoints dürfen keine internen Application Tokens importieren. Nutze nur module.api Facade Tokens (D).',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "Identifier[name='platformContainerPortToken']",
          message:
            'Foundry-EntryPoints dürfen PlatformContainerPort nicht nutzen. Verwende eine API-safe Facade über module.api (D).',
        },
        {
          selector: "Identifier[name='PlatformContainerPort']",
          message:
            'Foundry-EntryPoints dürfen PlatformContainerPort nicht referenzieren. Verwende eine API-safe Facade über module.api (D).',
        },
      ],
    },
  },
];

