# Deprecation Template - Code-Beispiele

**Model:** Claude Sonnet 4.5  
**Zweck:** Templates für Deprecation-Annotations (ab Version 1.0.0)

---

## ⚠️ Wichtig: Nur ab Version 1.0.0!

**Aktuell (0.x.x):**
- ❌ Keine Deprecation notwendig
- ✅ Legacy-Code sofort entfernen
- ✅ Aggressive Refactorings ohne Deprecation-Zeitraum

**Ab Version 1.0.0:**
- ⚠️ Deprecation verpflichtend vor Breaking Changes
- 📋 Migrationspfad erforderlich
- 🔔 Runtime-Warnings empfohlen
- 🗓️ Timeline: Mindestens 1 Main-Version Deprecated-Zeitraum

---

## 📝 JSDoc Deprecation Annotation

### Template: Deprecated Method

```typescript
/**
 * [Kurzbeschreibung der Methode]
 * 
 * @deprecated Since v[VERSION]. Use [alternativeMethod] instead.
 * This method will be removed in v[NEXT_MAJOR].0.
 * 
 * @see [alternativeMethod] - Recommended alternative
 * 
 * Migration:
 * ```typescript
 * // Old (deprecated)
 * const result = service.oldMethod(param1, param2);
 * 
 * // New (recommended)
 * const result = service.newMethod({ param1, param2 });
 * ```
 * 
 * @param [paramName] - [Beschreibung]
 * @returns [Rückgabe-Typ]
 */
async oldMethod(param1: string, param2: number): Promise<Result<T, E>> {
  // Optional: Runtime warning
  console.warn(
    `[DEPRECATED] ${this.constructor.name}.oldMethod() is deprecated since v[VERSION]. ` +
    `Use newMethod() instead. Will be removed in v[NEXT_MAJOR].0.`
  );
  
  // Delegate to new implementation
  return this.newMethod({ param1, param2 });
}
```

---

### Template: Deprecated Class

```typescript
/**
 * [Klassenbeschreibung]
 * 
 * @deprecated Since v[VERSION]. Use [NewClass] instead.
 * This class will be removed in v[NEXT_MAJOR].0.
 * 
 * @see [NewClass] - Recommended alternative
 * 
 * Migration:
 * ```typescript
 * // Old (deprecated)
 * const service = new OldClass(dep1, dep2);
 * 
 * // New (recommended)
 * const service = new NewClass({ dep1, dep2 });
 * ```
 */
export class OldClass {
  constructor(dep1: Dep1, dep2: Dep2) {
    console.warn(
      `[DEPRECATED] ${this.constructor.name} is deprecated since v[VERSION]. ` +
      `Use NewClass instead. Will be removed in v[NEXT_MAJOR].0.`
    );
  }
}
```

---

### Template: Deprecated Parameter

```typescript
/**
 * [Methodenbeschreibung]
 * 
 * @param options - Configuration options
 * @param options.newParam - [Beschreibung]
 * @param options.oldParam - @deprecated Since v[VERSION]. Use newParam instead.
 *                           Will be removed in v[NEXT_MAJOR].0.
 */
function method(options: {
  newParam?: string;
  oldParam?: string;  // Deprecated
}): Result<T, E> {
  // Support both parameters with deprecation warning
  if (options.oldParam !== undefined) {
    console.warn(
      `[DEPRECATED] options.oldParam is deprecated since v[VERSION]. ` +
      `Use options.newParam instead. Will be removed in v[NEXT_MAJOR].0.`
    );
    // Fallback to oldParam if newParam not provided
    options.newParam = options.newParam ?? options.oldParam;
  }
  
  // Use newParam
  return processWithNewParam(options.newParam);
}
```

---

### Template: Deprecated Property

```typescript
export class MyService {
  /**
   * @deprecated Since v[VERSION]. Use [newProperty] instead.
   * This property will be removed in v[NEXT_MAJOR].0.
   */
  private _oldProperty?: string;
  
  /**
   * @deprecated Since v[VERSION]. Use [newProperty] instead.
   * This property will be removed in v[NEXT_MAJOR].0.
   */
  get oldProperty(): string | undefined {
    console.warn(
      `[DEPRECATED] MyService.oldProperty is deprecated since v[VERSION]. ` +
      `Use newProperty instead. Will be removed in v[NEXT_MAJOR].0.`
    );
    return this._oldProperty;
  }
  
  /**
   * @deprecated Since v[VERSION]. Use [newProperty] instead.
   * This property will be removed in v[NEXT_MAJOR].0.
   */
  set oldProperty(value: string | undefined) {
    console.warn(
      `[DEPRECATED] MyService.oldProperty is deprecated since v[VERSION]. ` +
      `Use newProperty instead. Will be removed in v[NEXT_MAJOR].0.`
    );
    this._oldProperty = value;
  }
  
  // New property
  public newProperty?: string;
}
```

---

## 🔔 Runtime Warnings

### Einfaches Warning

```typescript
if (options.useLegacyApi) {
  console.warn(
    '[DEPRECATED] Legacy API is deprecated since v[VERSION]. ' +
    'Use new API instead. Will be removed in v[NEXT_MAJOR].0.'
  );
}
```

---

### Warning mit Stack Trace (Development only)

```typescript
if (options.useLegacyApi) {
  const warning = new Error(
    '[DEPRECATED] Legacy API is deprecated since v[VERSION]. ' +
    'Use new API instead. Will be removed in v[NEXT_MAJOR].0.'
  );
  
  if (ENV.isDevelopment) {
    // Stack trace nur in Development
    console.warn(warning);
  } else {
    // Production: Nur Message
    console.warn(warning.message);
  }
}
```

---

### Warning mit Counter (einmalig pro Session)

```typescript
export class MyService {
  private static deprecationWarnings = new Set<string>();
  
  private warnOnce(key: string, message: string): void {
    if (!MyService.deprecationWarnings.has(key)) {
      console.warn(`[DEPRECATED] ${message}`);
      MyService.deprecationWarnings.add(key);
    }
  }
  
  oldMethod(): void {
    this.warnOnce(
      'oldMethod',
      'oldMethod() is deprecated since v[VERSION]. Use newMethod() instead. ' +
      'Will be removed in v[NEXT_MAJOR].0.'
    );
    // Implementation
  }
}
```

---

## 📋 CHANGELOG Sections

### Template: Deprecated Section

```markdown
## [X.Y.0] - [Datum]

### ⚠️ Deprecated

#### [Component]: [Method/Class/Property]

- **What:** `[oldApi]` is deprecated
- **Why:** [Begründung - z.B. Type safety, Better architecture]
- **Alternative:** Use `[newApi]` instead
- **Timeline:** Will be removed in v[X+1].0
- **Migration:** See [Migration Guide](./docs/migrations/MIGRATION_X.x_to_X+1.0.md)

**Example:**
\```typescript
// Old (deprecated)
service.oldMethod(param1, param2);

// New (recommended)
service.newMethod({ param1, param2 });
\```
```

---

### Template: Breaking Change Section

```markdown
## [X+1.0.0] - [Datum]

### ⚠️ BREAKING CHANGES

#### [Component]: Removed [Method/Class/Property]

- **Removed:** `[oldApi]` (deprecated since v[X.Y])
- **Reason:** [Begründung]
- **Alternative:** Use `[newApi]` instead
- **Migration:** See [Migration Guide](./docs/migrations/MIGRATION_X.x_to_X+1.0.md)

**Migration Example:**
\```typescript
// Before (v[X.Y])
service.oldMethod(param);

// After (v[X+1].0+)
service.newMethod({ param });
\```

**Impact:**
- Code using `oldMethod()` will break
- TypeScript compilation errors will occur
- Runtime errors if method is called

**Action Required:**
1. Update all call sites to use `newMethod()`
2. Run `npm run type-check` to find affected code
3. Run tests to verify behavior
```

---

## 🎯 Verwendung dieses Templates

### Schritt 1: Kopieren
```bash
cp docs/templates/MIGRATION_GUIDE_TEMPLATE.md docs/migrations/MIGRATION_1.x_to_2.0.md
```

### Schritt 2: Anpassen
- [ ] Ersetze `[VERSION]` Platzhalter
- [ ] Fülle alle `[Beschreibung]` Felder
- [ ] Ergänze Code-Beispiele
- [ ] Teste alle Migrations-Beispiele

### Schritt 3: Verlinken
- [ ] CHANGELOG.md: Link zu Migration Guide
- [ ] README.md: Hinweis auf Breaking Changes
- [ ] API.md: Deprecated-Markierungen

### Schritt 4: Kommunizieren
- [ ] GitHub Release Notes
- [ ] Discord-Announcement
- [ ] Foundry VTT Forum Post (optional)

---

## 📚 Beispiele aus anderen Projekten

### Beispiel 1: TypeScript (strictNullChecks)

```typescript
/**
 * @deprecated Since v4.0. Use strict null checks instead.
 * This option will be removed in v5.0.
 */
interface CompilerOptions {
  strictNullChecks?: boolean;
}
```

---

### Beispiel 2: React (componentWillMount)

```typescript
/**
 * @deprecated Since v16.3. Use componentDidMount or constructor instead.
 * This lifecycle method will be removed in v17.0.
 * 
 * @see componentDidMount
 * @see https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html
 */
componentWillMount(): void {
  console.warn(
    'componentWillMount is deprecated. Use componentDidMount instead. ' +
    'See: https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html'
  );
}
```

---

**Hinweis:** Dieses Template ist für Version 1.0.0+ gedacht.  
**Aktuell (0.7.1):** Legacy-Codes ohne Deprecation sofort entfernen!

---

**Ende Deprecation Template**

