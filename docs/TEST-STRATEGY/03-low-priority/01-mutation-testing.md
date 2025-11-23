# Mutation Testing

**Status:** ⚠️ TODO  
**Priorität:** 🥉 Niedrige Priorität  
**Aufwand:** 4-6 Stunden Setup + Laufzeit  
**Tool:** Stryker (neu installieren)

---

## Übersicht

Mutation Testing misst die Qualität der Tests, nicht nur Coverage. Es findet unzureichende Tests, die grün bleiben, obwohl Code falsch ist.

**Warum wichtig:**
- Misst Test-Qualität, nicht nur Coverage
- Findet unzureichende Tests
- Verbessert Test-Robustheit
- Findet "False Positives"

---

## Was wird getestet?

### 1. Test-Qualität

**Szenario:** Code wird mutiert → Tests sollten rot werden

**Schritte:**
1. Stryker mutiert Code automatisch
2. Tests laufen gegen mutierten Code
3. Prüfen ob Tests mutierten Code erkennen

**Erwartetes Ergebnis:**
- Mutation Score > 80%
- Tests erkennen mutierten Code

---

### 2. Test-Robustheit

**Szenario:** Tests sind zu schwach (bleiben grün bei falschem Code)

**Schritte:**
1. Stryker findet "Surviving Mutations"
2. Tests verbessern für besseren Score

**Erwartetes Ergebnis:**
- Mutation Score steigt
- Tests werden robuster

---

## Warum wichtig?

- ✅ Misst Test-Qualität
- ✅ Findet unzureichende Tests
- ✅ Verbessert Test-Robustheit
- ✅ Findet "False Positives"

---

## Implementierungsanleitung

### Voraussetzungen

**Installation:**
```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/vitest-runner
```

**Tools:**
- ✅ Stryker (neu installieren)
- ✅ Vitest (bereits vorhanden)

---

### Konfiguration

**`stryker.conf.json`:**

```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "packageManager": "npm",
  "reporters": ["html", "clear-text", "progress"],
  "testRunner": "vitest",
  "coverageAnalysis": "perTest",
  "mutate": [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/__tests__/**"
  ],
  "thresholds": {
    "high": 80,
    "low": 70,
    "break": 60
  },
  "vitest": {
    "configFile": "vitest.config.ts"
  }
}
```

---

### Pattern 1: Mutation Testing ausführen

```bash
# Mutation Tests ausführen
npx stryker run

# HTML-Report öffnen
open reports/mutation/mutation.html
```

---

## Detaillierte Implementierung

### Schritt 1: Stryker installieren

```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/vitest-runner
```

---

### Schritt 2: Konfiguration erstellen

**Datei:** `stryker.conf.json`

```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "packageManager": "npm",
  "reporters": ["html", "clear-text", "progress"],
  "testRunner": "vitest",
  "coverageAnalysis": "perTest",
  "mutate": [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/__tests__/**",
    "!src/test/**",
    "!src/**/*.d.ts"
  ],
  "thresholds": {
    "high": 80,
    "low": 70,
    "break": 60
  },
  "vitest": {
    "configFile": "vitest.config.ts"
  },
  "ignorePatterns": [
    "node_modules",
    "dist",
    "coverage"
  ]
}
```

---

### Schritt 3: NPM-Script hinzufügen

**`package.json`:**

```json
{
  "scripts": {
    "test:mutation": "stryker run",
    "test:mutation:ci": "stryker run --reporters json --reporters html"
  }
}
```

---

### Schritt 4: Mutation Tests ausführen

```bash
# Lokal ausführen
npm run test:mutation

# CI/CD (JSON + HTML Report)
npm run test:mutation:ci
```

---

## Was wird mutiert?

**Beispiel-Mutationen:**

```typescript
// Original
if (value > 0) return true;

// Mutiert 1: > zu >=
if (value >= 0) return true;

// Mutiert 2: > zu <
if (value < 0) return true;

// Mutiert 3: true zu false
if (value > 0) return false;
```

**Wenn Tests weiterhin grün sind → Test ist zu schwach!**

---

## Referenzen

**Stryker:**
- [Stryker Documentation](https://stryker-mutator.io/docs/)
- [Stryker Vitest Runner](https://stryker-mutator.io/docs/stryker-js/vitest-runner)

---

## Checkliste

### Vorbereitung
- [ ] Stryker installiert
- [ ] Konfiguration erstellt
- [ ] NPM-Script hinzugefügt

### Implementierung
- [ ] Mutation Tests ausführen
- [ ] Mutation Score prüfen
- [ ] Tests verbessern (falls Score < 80%)

### Validierung
- [ ] Mutation Score > 80%
- [ ] Tests erkennen mutierten Code
- [ ] CI/CD-Integration (optional)

---

**Nächste Schritte:** Nach Implementierung zu `02-bundle-size-analysis.md` weitergehen.

