# Erweiterte Security Tests

**Status:** ⚠️ TODO  
**Priorität:** 🥈 Mittlere Priorität  
**Aufwand:** 2-3 Stunden  
**Tool:** Vitest (bereits vorhanden)

---

## Übersicht

Erweiterte Security-Tests prüfen OWASP Top 10 Vektoren und weitere Sicherheitsaspekte. Sie erweitern die bereits vorhandenen Security-Tests.

**Aktueller Stand:**
- ✅ `src/foundry/validation/__tests__/input-validators-security.test.ts` vorhanden
- ✅ `src/foundry/validation/__tests__/schemas.test.ts` (Sanitization-Tests) vorhanden
- ⚠️ Erweiterte Tests für OWASP Top 10 empfohlen

---

## Was wird getestet?

### 1. XSS-Injection-Schutz

**Szenario:** Script-Tags, Event-Handler, JavaScript-URLs

**Schritte:**
1. XSS-Payloads testen
2. Prüfen ob HTML-Sanitization funktioniert
3. Prüfen ob Script-Tags entfernt werden

**Erwartetes Ergebnis:**
- Script-Tags werden entfernt
- Event-Handler werden entfernt
- JavaScript-URLs werden neutralisiert

---

### 2. SQL-Injection-Schutz

**Szenario:** SQL-Injection-Payloads (defensive Programmierung)

**Schritte:**
1. SQL-Injection-Payloads testen
2. Prüfen ob Input-Validation funktioniert

**Erwartetes Ergebnis:**
- SQL-Injection-Payloads werden abgelehnt
- Input-Validation funktioniert

---

### 3. Prototype-Pollution-Schutz

**Szenario:** `__proto__`, `constructor.prototype` Manipulation

**Schritte:**
1. Prototype-Pollution-Payloads testen
2. Prüfen ob Objekte geschützt sind

**Erwartetes Ergebnis:**
- Prototype-Pollution wird verhindert
- Objekte bleiben sicher

---

### 4. Path-Traversal-Schutz

**Szenario:** `../`, `..\\`, absolute Pfade

**Schritte:**
1. Path-Traversal-Payloads testen
2. Prüfen ob Pfade validiert werden

**Erwartetes Ergebnis:**
- Path-Traversal wird verhindert
- Pfade werden validiert

---

### 5. Command-Injection-Schutz

**Szenario:** Shell-Commands, System-Calls

**Schritte:**
1. Command-Injection-Payloads testen
2. Prüfen ob Commands validiert werden

**Erwartetes Ergebnis:**
- Command-Injection wird verhindert
- Commands werden validiert

---

## Warum wichtig?

- ✅ Verhindert Sicherheitslücken
- ✅ Schützt vor Code-Injection
- ✅ Erfüllt Security-Best-Practices
- ✅ Kritisch für Module, die User-Input verarbeiten

---

## Implementierungsanleitung

### Voraussetzungen

**Tools:**
- ✅ Vitest (bereits vorhanden)
- ✅ Bestehende Security-Tests als Referenz

---

### Pattern 1: XSS-Payload-Test

```typescript
const xssPayloads = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  'javascript:alert(1)',
  '<iframe src="javascript:alert(1)"></iframe>',
];

xssPayloads.forEach(payload => {
  it(`should reject XSS payload: ${payload}`, () => {
    const result = validateInput(payload);
    expectResultErr(result);
    expect(result.error.code).toBe('INVALID_INPUT');
  });
});
```

---

### Pattern 2: Prototype-Pollution-Test

```typescript
it('should prevent prototype pollution', () => {
  const maliciousInput = {
    __proto__: { isAdmin: true },
    constructor: { prototype: { isAdmin: true } },
  };
  
  const result = processInput(maliciousInput);
  expectResultOk(result);
  
  // Prototype sollte nicht verändert sein
  expect(Object.prototype.isAdmin).toBeUndefined();
});
```

---

## Detaillierte Implementierung

### Test 1: XSS-Injection-Schutz

**Datei:** `src/foundry/validation/__tests__/xss-protection.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { validateJournalId, sanitizeHtml } from '@/foundry/validation/input-validators';
import { expectResultErr } from '@/test/utils/test-helpers';

describe('Security: XSS Protection', () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<script src="evil.js"></script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    'javascript:alert(1)',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<body onload=alert(1)>',
    '<input onfocus=alert(1) autofocus>',
    '<select onfocus=alert(1) autofocus>',
    '<textarea onfocus=alert(1) autofocus>',
    '<keygen onfocus=alert(1) autofocus>',
    '<video><source onerror=alert(1)>',
    '<audio src=x onerror=alert(1)>',
    '<details open ontoggle=alert(1)>',
    '<marquee onstart=alert(1)>',
    '<object data="javascript:alert(1)">',
    '<embed src="javascript:alert(1)">',
  ];

  xssPayloads.forEach(payload => {
    it(`should reject XSS script tag: ${payload}`, () => {
      const result = validateJournalId(payload);
      expectResultErr(result);
      expect(result.error.code).toBe('INVALID_INPUT');
    });
  });

  it('should sanitize HTML entities', () => {
    const malicious = '<img src=x onerror=alert(1)>';
    const sanitized = sanitizeHtml(malicious);
    
    expect(sanitized).not.toContain('<img');
    expect(sanitized).not.toContain('onerror=');
    expect(sanitized).not.toContain('alert(');
  });

  it('should remove event handlers', () => {
    const malicious = '<div onclick="alert(1)">Click me</div>';
    const sanitized = sanitizeHtml(malicious);
    
    expect(sanitized).not.toContain('onclick=');
    expect(sanitized).not.toContain('alert(');
  });
});
```

**Checkliste:**
- [ ] Datei erstellen
- [ ] XSS-Payloads testen
- [ ] HTML-Sanitization testen
- [ ] Event-Handler-Entfernung testen

---

### Test 2: SQL-Injection-Schutz

**Datei:** `src/foundry/validation/__tests__/sql-injection-protection.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { validateJournalId } from '@/foundry/validation/input-validators';
import { expectResultErr } from '@/test/utils/test-helpers';

describe('Security: SQL Injection Protection', () => {
  const sqlInjectionPayloads = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "' OR '1'='1' /*",
    "admin'--",
    "admin'/*",
    "' UNION SELECT * FROM users--",
    "'; DROP TABLE users--",
    "' OR 1=1--",
    "' OR 'a'='a",
    "') OR ('1'='1",
  ];

  sqlInjectionPayloads.forEach(payload => {
    it(`should reject SQL injection: ${payload}`, () => {
      const result = validateJournalId(payload);
      expectResultErr(result);
      expect(result.error.code).toBe('INVALID_INPUT');
    });
  });
});
```

**Checkliste:**
- [ ] Datei erstellen
- [ ] SQL-Injection-Payloads testen
- [ ] Input-Validation prüfen

---

### Test 3: Prototype-Pollution-Schutz

**Datei:** `src/foundry/validation/__tests__/prototype-pollution-protection.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { processInput } from '@/foundry/validation/input-validators';

describe('Security: Prototype Pollution Protection', () => {
  beforeEach(() => {
    // Prototype vor Test zurücksetzen
    delete (Object.prototype as any).isAdmin;
    delete (Object.prototype as any).polluted;
  });

  afterEach(() => {
    // Prototype nach Test aufräumen
    delete (Object.prototype as any).isAdmin;
    delete (Object.prototype as any).polluted;
  });

  it('should prevent __proto__ pollution', () => {
    const maliciousInput = {
      __proto__: { isAdmin: true },
    };
    
    const result = processInput(maliciousInput);
    expect(result.ok).toBe(true);
    
    // Prototype sollte nicht verändert sein
    expect(Object.prototype.isAdmin).toBeUndefined();
  });

  it('should prevent constructor.prototype pollution', () => {
    const maliciousInput = {
      constructor: { prototype: { polluted: true } },
    };
    
    const result = processInput(maliciousInput);
    expect(result.ok).toBe(true);
    
    // Prototype sollte nicht verändert sein
    expect(Object.prototype.polluted).toBeUndefined();
  });

  it('should prevent nested prototype pollution', () => {
    const maliciousInput = {
      a: {
        __proto__: { polluted: true },
      },
    };
    
    const result = processInput(maliciousInput);
    expect(result.ok).toBe(true);
    
    // Prototype sollte nicht verändert sein
    expect(Object.prototype.polluted).toBeUndefined();
  });
});
```

**Checkliste:**
- [ ] Datei erstellen
- [ ] __proto__ Pollution testen
- [ ] constructor.prototype Pollution testen
- [ ] Nested Pollution testen

---

### Test 4: Path-Traversal-Schutz

**Datei:** `src/foundry/validation/__tests__/path-traversal-protection.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { validatePath } from '@/foundry/validation/input-validators';
import { expectResultErr } from '@/test/utils/test-helpers';

describe('Security: Path Traversal Protection', () => {
  const pathTraversalPayloads = [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32',
    '/etc/passwd',
    'C:\\windows\\system32',
    '....//....//etc/passwd',
    '..%2F..%2F..%2Fetc%2Fpasswd',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
  ];

  pathTraversalPayloads.forEach(payload => {
    it(`should reject path traversal: ${payload}`, () => {
      const result = validatePath(payload);
      expectResultErr(result);
      expect(result.error.code).toBe('INVALID_INPUT');
    });
  });
});
```

**Checkliste:**
- [ ] Datei erstellen
- [ ] Path-Traversal-Payloads testen
- [ ] Pfad-Validation prüfen

---

### Test 5: Command-Injection-Schutz

**Datei:** `src/foundry/validation/__tests__/command-injection-protection.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { validateCommand } from '@/foundry/validation/input-validators';
import { expectResultErr } from '@/test/utils/test-helpers';

describe('Security: Command Injection Protection', () => {
  const commandInjectionPayloads = [
    '; ls -la',
    '| cat /etc/passwd',
    '&& rm -rf /',
    '`whoami`',
    '$(id)',
    '; cat /etc/passwd',
    '| whoami',
    '&& echo "injected"',
  ];

  commandInjectionPayloads.forEach(payload => {
    it(`should reject command injection: ${payload}`, () => {
      const result = validateCommand(payload);
      expectResultErr(result);
      expect(result.error.code).toBe('INVALID_INPUT');
    });
  });
});
```

**Checkliste:**
- [ ] Datei erstellen
- [ ] Command-Injection-Payloads testen
- [ ] Command-Validation prüfen

---

## Referenzen

**Bestehende Security-Tests:**
- `src/foundry/validation/__tests__/input-validators-security.test.ts` - XSS-Tests
- `src/foundry/validation/__tests__/schemas.test.ts` - Sanitization-Tests

**OWASP Top 10:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## Checkliste

### Vorbereitung
- [ ] OWASP Top 10 verstanden
- [ ] Bestehende Security-Tests gelesen
- [ ] Security-Patterns verstanden

### Implementierung
- [ ] Test 1: XSS-Injection-Schutz
- [ ] Test 2: SQL-Injection-Schutz
- [ ] Test 3: Prototype-Pollution-Schutz
- [ ] Test 4: Path-Traversal-Schutz
- [ ] Test 5: Command-Injection-Schutz

### Validierung
- [ ] Alle Tests laufen erfolgreich
- [ ] Security-Payloads werden abgelehnt
- [ ] Input-Validation funktioniert

---

**Nächste Schritte:** Nach Implementierung zu `03-low-priority/` weitergehen.

