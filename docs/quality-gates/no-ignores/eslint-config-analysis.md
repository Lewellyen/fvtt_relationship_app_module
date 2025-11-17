# Analyse: ESLint-Disable Marker durch Konfiguration ersetzen

**Datum:** 2025-01-27  
**Ziel:** Prüfung, welche `eslint-disable` Marker durch ESLint-Konfiguration ersetzt werden können

## Zusammenfassung

| Kategorie | Gesamt | Durch Config ersetzbar | Nicht ersetzbar | Begründung |
|-----------|--------|------------------------|-----------------|------------|
| `@typescript-eslint/naming-convention` | 5 | 5 | 0 | File-level overrides möglich |
| `@typescript-eslint/no-explicit-any` | 4 | 4 | 0 | File-level overrides möglich |
| `@typescript-eslint/no-unused-vars` | 3 | 3 | 0 | `argsIgnorePattern` möglich |
| `@typescript-eslint/no-deprecated` | 1 | 1 | 0 | File-level override für `.d.ts` möglich |
| **Gesamt** | **13** | **13** | **0** | **100% ersetzbar** |

**Ergebnis:** Alle 13 `eslint-disable` Marker im Produktivcode können durch ESLint-Konfiguration ersetzt werden!

---

## 1. `@typescript-eslint/naming-convention` Marker (5)

### ✅ Ersetzbar durch File-Level Overrides

#### 1.1. Valibot-Schemas (3 Marker in `schemas.ts`)

**Aktuell:**
```typescript
// eslint-disable-next-line @typescript-eslint/naming-convention -- Schemas use PascalCase
export const JournalEntrySchema = v.object({...});
```

**Lösung:**
```javascript
{
  files: ['**/schemas.ts', '**/validation/schemas.ts'],
  rules: {
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variable',
        modifiers: ['const', 'export'],
        format: ['PascalCase', 'camelCase'], // Erlaubt PascalCase für Schema-Exports
      },
      // ... andere Regeln beibehalten
    ]
  }
}
```

**Vorteil:** Alle Valibot-Schema-Exports können PascalCase verwenden, ohne inline-disable

#### 1.2. console.table Kompatibilität (2 Marker in `metrics-collector.ts`)

**Aktuell:**
```typescript
/* eslint-disable @typescript-eslint/naming-convention */
interface MetricsTableData {
  "Total Resolutions": number;
  Errors: number;
}
/* eslint-enable @typescript-eslint/naming-convention */
```

**Lösung:**
```javascript
{
  files: ['**/metrics-collector.ts'],
  rules: {
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'property',
        filter: {
          // Erlaubt String-Literal-Keys für console.table Kompatibilität
          regex: '^".*"$|^\'.*\'$',
          match: true
        },
        format: null, // Keine Format-Prüfung für String-Literal-Keys
      },
      // ... andere Regeln beibehalten
    ]
  }
}
```

**Alternative:** Interface-spezifische Regel:
```javascript
{
  selector: 'property',
  filter: {
    // Nur in Interfaces, die für console.table verwendet werden
    regex: 'MetricsTableData',
    match: true
  },
  format: null,
}
```

**Vorteil:** String-Literal-Keys in Interfaces für console.table erlaubt

---

## 2. `@typescript-eslint/no-explicit-any` Marker (4)

### ✅ Ersetzbar durch File-Level Overrides

#### 2.1. Heterogene Service-Typen (3 Marker in `TypeSafeRegistrationMap.ts`)

**Aktuell:**
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Heterogeneous service types require any storage
private readonly map: Map<symbol, ServiceRegistration<any>> = new Map();
```

**Lösung:**
```javascript
{
  files: ['**/TypeSafeRegistrationMap.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off' // Oder 'warn'
  }
}
```

**Vorteil:** Datei-spezifische Ausnahme, keine inline-disables nötig

#### 2.2. Variadische Konstruktoren (1 Marker in `serviceclass.ts`)

**Aktuell:**
```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
new (...args: any[]): T;
/* eslint-enable @typescript-eslint/no-explicit-any */
```

**Lösung:**
```javascript
{
  files: ['**/serviceclass.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off' // Oder 'warn'
  }
}
```

**Vorteil:** Datei-spezifische Ausnahme für variadische Konstruktoren

---

## 3. `@typescript-eslint/no-unused-vars` Marker (3)

### ✅ Ersetzbar durch Regel-Option `argsIgnorePattern`

#### 3.1. Interface-Kompatibilität (3 Marker in TranslationHandlers)

**Aktuell:**
```typescript
protected doHandle(
  key: string,
  data?: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _fallback?: string
): string | null {
```

**Lösung:**
```javascript
{
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_', // Ignoriert Parameter die mit _ beginnen
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }
    ]
  }
}
```

**Vorteil:** Alle Parameter mit `_` Prefix werden automatisch ignoriert, keine inline-disables nötig

**Betroffene Dateien:**
- `src/services/i18n/FallbackTranslationHandler.ts`
- `src/services/i18n/LocalTranslationHandler.ts`
- `src/services/i18n/FoundryTranslationHandler.ts`

---

## 4. `@typescript-eslint/no-deprecated` Marker (1)

### ✅ Ersetzbar durch File-Level Override für `.d.ts`

#### 4.1. Type-Definitionen (1 Marker in `custom.d.ts`)

**Aktuell:**
```typescript
// eslint-disable-next-line @typescript-eslint/no-deprecated
```

**Lösung:**
```javascript
{
  files: ['**/*.d.ts'],
  rules: {
    '@typescript-eslint/no-deprecated': 'off' // Type-Definitionen können deprecated APIs referenzieren
  }
}
```

**Vorteil:** Alle `.d.ts` Dateien können deprecated APIs referenzieren

---

## 5. Implementierungsvorschlag

### ESLint-Konfiguration erweitern

```javascript
// eslint.config.mjs
export default [
  // ... bestehende Konfiguration ...
  
  // Valibot-Schemas: PascalCase für Schema-Exports erlauben
  {
    files: ['**/schemas.ts', '**/validation/schemas.ts'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          modifiers: ['const', 'export'],
          format: ['PascalCase', 'camelCase'],
        },
        // ... andere Regeln aus Hauptkonfiguration übernehmen
      ]
    }
  },
  
  // console.table Kompatibilität: String-Literal-Keys in Interfaces erlauben
  {
    files: ['**/metrics-collector.ts'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'property',
          filter: {
            // Erlaubt String-Literal-Keys für console.table
            regex: '^".*"$|^\'.*\'$',
            match: true
          },
          format: null,
        },
        // ... andere Regeln
      ]
    }
  },
  
  // Heterogene Service-Typen: any erlauben
  {
    files: ['**/TypeSafeRegistrationMap.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn' // Oder 'off'
    }
  },
  
  // Variadische Konstruktoren: any erlauben
  {
    files: ['**/serviceclass.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn' // Oder 'off'
    }
  },
  
  // Type-Definitionen: deprecated APIs erlauben
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-deprecated': 'off'
    }
  },
  
  // Hauptkonfiguration: argsIgnorePattern für unused vars
  {
    files: ['**/*.{ts,js}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_', // Parameter mit _ Prefix ignorieren
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        }
      ]
    }
  }
];
```

---

## 6. Vorteile der Konfigurationslösung

### ✅ Vorteile

1. **Zentralisierte Konfiguration:** Alle Ausnahmen an einem Ort
2. **Weniger Code-Noise:** Keine inline `eslint-disable` Kommentare
3. **Konsistenz:** Gleiche Ausnahmen werden automatisch angewendet
4. **Wartbarkeit:** Änderungen nur in einer Datei nötig
5. **Dokumentation:** Konfiguration dokumentiert die Ausnahmen

### ⚠️ Nachteile

1. **Weniger explizit:** Ausnahmen sind nicht direkt im Code sichtbar
2. **Komplexere Config:** Mehr Overrides in `eslint.config.mjs`
3. **Potenzielle Über-Erlaubnis:** File-level Overrides gelten für ganze Dateien

---

## 7. Empfehlung

### ✅ Empfohlen: Konfiguration verwenden

**Für:**
- Valibot-Schemas (PascalCase) – Klare Datei-Pattern
- console.table Kompatibilität – Klare Datei-Pattern
- Type-Definitionen (`.d.ts`) – Klare Datei-Pattern
- Unused vars mit `_` Prefix – Standard-Pattern

### ⚠️ Abwägung: File-Level Overrides

**Für:**
- `TypeSafeRegistrationMap.ts` – Nur 3 Zeilen betroffen, aber klare Begründung
- `serviceclass.ts` – Nur 1 Zeile betroffen, aber klare Begründung

**Alternative:** Inline-Kommentare beibehalten, wenn:
- Ausnahme sehr spezifisch ist (nur 1-2 Zeilen)
- Begründung direkt im Code sichtbar sein soll

---

## 8. Statistik nach Implementierung

**Vorher:**
- 13 `eslint-disable` Marker im Produktivcode

**Nachher (mit Konfiguration):**
- 0 `eslint-disable` Marker im Produktivcode (alle durch Config ersetzt)
- 5-7 File-Level Overrides in `eslint.config.mjs`
- 1 Regel-Option (`argsIgnorePattern`) in Hauptkonfiguration

**Ergebnis:** 100% der `eslint-disable` Marker können durch Konfiguration ersetzt werden!

