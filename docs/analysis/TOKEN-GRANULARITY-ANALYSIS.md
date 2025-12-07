# Token-Granularität Analyse: Ein Token pro Datei

**Erstellt:** 2025-01-XX
**Zweck:** Analyse der Vor- und Nachteile einer feingranularen Token-Struktur

---

## Aktuelle Struktur

**Token-Dateien (thematisch gruppiert):**
- `core.tokens.ts` - 10 Tokens
- `observability.tokens.ts` - 8 Tokens
- `foundry.tokens.ts` - ~15 Tokens
- `i18n.tokens.ts` - 5 Tokens
- `infrastructure.tokens.ts` - 5 Tokens
- `notifications.tokens.ts` - 2 Tokens
- `ports.tokens.ts` - 1 Token
- `validation.tokens.ts` - 1 Token

**Gesamt:** ~47 Tokens in 8 Dateien

---

## Feingranulare Struktur (Ein Token pro Datei)

### Beispiel-Struktur

```
src/infrastructure/shared/tokens/
├── core/
│   ├── logger.token.ts
│   ├── environment-config.token.ts
│   ├── module-health-service.token.ts
│   ├── health-check-registry.token.ts
│   └── ...
├── observability/
│   ├── metrics-collector.token.ts
│   ├── metrics-recorder.token.ts
│   ├── metrics-sampler.token.ts
│   ├── metrics-reporter.token.ts
│   └── ...
├── foundry/
│   ├── foundry-game.token.ts
│   ├── foundry-hooks.token.ts
│   └── ...
└── index.ts (re-exports)
```

---

## Vorteile

### ✅ 1. Keine Zirkulären Abhängigkeiten mehr möglich

**Aktuell:**
```typescript
// observability.tokens.ts
import type { MetricsReporter } from "./metrics-reporter"; // ← Zirkularität möglich
export const metricsReporterToken = createInjectionToken<MetricsReporter>("MetricsReporter");

// metrics-reporter.ts
import { metricsCollectorToken } from "./observability.tokens"; // ← Zirkularität!
```

**Feingranular:**
```typescript
// metrics-reporter.token.ts
// Keine Imports von Services möglich - nur Token-Factory
export const metricsReporterToken = createInjectionToken<any>("MetricsReporter");

// metrics-reporter.ts
import { metricsCollectorToken } from "./tokens/observability/metrics-collector.token";
// Keine Zirkularität möglich, da Token-Datei keine Service-Imports hat
```

**Ergebnis:** ✅ **Zirkuläre Abhängigkeiten strukturell unmöglich**

---

### ✅ 2. Klarere Dependency-Grenzen

**Aktuell:**
- Token-Dateien können Service-Types importieren
- Unklar, welche Abhängigkeiten erlaubt sind
- Risiko von Zirkularität durch versehentliche Imports

**Feingranular:**
- Jede Token-Datei ist isoliert
- Keine Service-Imports möglich (nur Token-Factory)
- Klare Regel: Token-Dateien = keine Service-Abhängigkeiten

---

### ✅ 3. Einfacheres Dependency-Management

**Aktuell:**
```typescript
// Service importiert viele Tokens aus einer Datei
import {
  metricsCollectorToken,
  metricsRecorderToken,
  metricsSamplerToken,
  metricsReporterToken,
} from "@/infrastructure/shared/tokens/observability.tokens";
```

**Feingranular:**
```typescript
// Service importiert nur benötigte Tokens
import { metricsCollectorToken } from "@/infrastructure/shared/tokens/observability/metrics-collector.token";
import { metricsReporterToken } from "@/infrastructure/shared/tokens/observability/metrics-reporter.token";
```

**Vorteil:** Tree-shaking kann besser optimieren (nur benötigte Tokens werden gebündelt)

---

### ✅ 4. Bessere Testbarkeit

**Aktuell:**
- Mock eines Tokens kann andere Tokens in derselben Datei beeinflussen
- Schwerer, einzelne Tokens zu isolieren

**Feingranular:**
- Jedes Token ist isoliert testbar
- Einfachere Mock-Strategien

---

### ✅ 5. Parallele Entwicklung

**Aktuell:**
- Merge-Konflikte bei Token-Dateien (mehrere Entwickler arbeiten an derselben Datei)
- Risiko von versehentlichen Änderungen an anderen Tokens

**Feingranular:**
- Jedes Token in eigener Datei = weniger Merge-Konflikte
- Klarere Git-Historie pro Token

---

## Nachteile

### ❌ 1. Viele kleine Dateien

**Aktuell:** 8 Token-Dateien
**Feingranular:** ~47 Token-Dateien

**Auswirkungen:**
- Mehr Datei-System-Overhead
- Schwerer zu überblicken
- Mehr Navigation im IDE nötig

---

### ✅ 2. Mehr Imports nötig

**Aktuell:**
```typescript
import {
  metricsCollectorToken,
  metricsReporterToken,
} from "@/infrastructure/shared/tokens/observability.tokens";
```

**Feingranular:**
```typescript
import { metricsCollectorToken } from "@/infrastructure/shared/tokens/observability/metrics-collector.token";
import { metricsReporterToken } from "@/infrastructure/shared/tokens/observability/metrics-reporter.token";
```

**Auswirkungen:**
- Längere Import-Listen
- Mehr Tipparbeit
- **Lösung:** Index-Dateien für Re-Exports

---

### ✅ 3. Index-Dateien nötig

**Notwendig:**
```typescript
// tokens/observability/index.ts
export { metricsCollectorToken } from "./metrics-collector.token";
export { metricsRecorderToken } from "./metrics-recorder.token";
export { metricsSamplerToken } from "./metrics-sampler.token";
export { metricsReporterToken } from "./metrics-reporter.token";
```

**Auswirkungen:**
- Zusätzliche Wartung
- Aber: Ermöglicht beides (feingranular ODER gruppiert)

---

### ⚠️ 4. Potentiell mehr Bundle-Size

**Aktuell:**
- Alle Tokens einer Gruppe werden zusammen gebündelt

**Feingranular:**
- Tree-shaking kann besser optimieren
- Aber: Mehr kleine Module = potentiell mehr Overhead

**Realität:** Moderne Bundler (Vite, esbuild) optimieren das gut

---

## Hybrid-Ansatz (Empfohlen)

### Struktur

```
src/infrastructure/shared/tokens/
├── core/
│   ├── logger.token.ts
│   ├── environment-config.token.ts
│   └── index.ts (re-exports)
├── observability/
│   ├── metrics-collector.token.ts
│   ├── metrics-reporter.token.ts
│   └── index.ts (re-exports)
└── index.ts (re-exports alle)
```

### Verwendung

**Option 1: Feingranular (für kritische Tokens)**
```typescript
import { metricsReporterToken } from "@/infrastructure/shared/tokens/observability/metrics-reporter.token";
```

**Option 2: Gruppiert (für Convenience)**
```typescript
import { metricsReporterToken } from "@/infrastructure/shared/tokens/observability";
```

**Option 3: Root-Level (für Backward-Compatibility)**
```typescript
import { metricsReporterToken } from "@/infrastructure/shared/tokens";
```

---

## Empfehlung

### ✅ Für Feingranularität

**Wann es Sinn macht:**
1. **Zirkuläre Abhängigkeiten sind ein Problem** (aktuell der Fall bei `MetricsReporter`)
2. **Viele Tokens in einer Datei** (>10 Tokens)
3. **Häufige Merge-Konflikte** bei Token-Dateien
4. **Klarere Dependency-Grenzen** gewünscht

**Konkrete Kandidaten:**
- `observability.tokens.ts` (8 Tokens, hatte Zirkularität)
- `foundry.tokens.ts` (~15 Tokens)
- `core.tokens.ts` (10 Tokens)

---

### ❌ Gegen Feingranularität

**Wann es nicht Sinn macht:**
1. **Wenige Tokens** (<5 Tokens pro Datei)
2. **Keine Zirkularitäts-Probleme**
3. **Team bevorzugt gruppierte Struktur**

**Beispiele:**
- `notifications.tokens.ts` (2 Tokens) - OK so
- `ports.tokens.ts` (1 Token) - OK so

---

## Migration-Strategie

### Schritt 1: Problematische Dateien zuerst

1. **`observability.tokens.ts`** → `tokens/observability/*.token.ts`
   - Grund: Hatte Zirkularität
   - 8 Tokens → 8 Dateien

2. **`foundry.tokens.ts`** → `tokens/foundry/*.token.ts`
   - Grund: Viele Tokens (~15)
   - Bessere Übersicht

3. **`core.tokens.ts`** → `tokens/core/*.token.ts`
   - Grund: Viele Tokens (10)
   - Häufig genutzt

### Schritt 2: Index-Dateien erstellen

```typescript
// tokens/observability/index.ts
export { metricsCollectorToken } from "./metrics-collector.token";
export { metricsRecorderToken } from "./metrics-recorder.token";
// ... etc
```

### Schritt 3: Backward-Compatibility

```typescript
// tokens/index.ts
export * from "./core";
export * from "./observability";
export * from "./foundry";
// ... etc
```

### Schritt 4: Services migrieren

**Option A: Schrittweise**
- Neue Services nutzen feingranulare Imports
- Alte Services bleiben bei gruppierten Imports
- Langsam migrieren

**Option B: Komplett**
- Alle Services auf einmal migrieren
- Mehr Arbeit, aber konsistenter

---

## Code-Beispiel: Feingranulare Token-Datei

```typescript
/**
 * Injection token for the MetricsReporter service.
 *
 * WICHTIG: Diese Datei importiert KEINE Service-Types!
 * Token-Generics werden erst beim resolve() aufgelöst.
 * Dies verhindert zirkuläre Dependencies strukturell.
 *
 * @example
 * ```typescript
 * const reporter = container.resolve(metricsReporterToken);
 * reporter.logSummary();
 * ```
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createInjectionToken } from "@/infrastructure/di/token-factory";

export const metricsReporterToken = createInjectionToken<any>("MetricsReporter");
```

**Vorteile:**
- ✅ Keine Service-Imports möglich
- ✅ Zirkularität strukturell unmöglich
- ✅ Klare Regel: Token-Dateien = keine Dependencies

---

## Fazit

### ✅ Empfehlung: **Hybrid-Ansatz**

1. **Problematische Dateien feingranular aufteilen:**
   - `observability.tokens.ts` (hatte Zirkularität)
   - `foundry.tokens.ts` (viele Tokens)
   - `core.tokens.ts` (viele Tokens)

2. **Kleine Dateien bleiben gruppiert:**
   - `notifications.tokens.ts` (2 Tokens)
   - `ports.tokens.ts` (1 Token)

3. **Index-Dateien für Convenience:**
   - Ermöglicht beides: feingranular ODER gruppiert

4. **Regel etablieren:**
   - Token-Dateien importieren **NIE** Service-Types
   - Nur Token-Factory und Interfaces (wenn nötig)

**Ergebnis:**
- ✅ Zirkuläre Abhängigkeiten strukturell unmöglich
- ✅ Klarere Dependency-Grenzen
- ✅ Flexibilität (feingranular ODER gruppiert)
- ✅ Backward-Compatibility möglich

---

## Referenzen

- **Aktuelle Token-Struktur:** `src/infrastructure/shared/tokens/`
- **Zirkularitäts-Analyse:** `docs/refactoring/SRP-REFACTORING-06-PORT-SELECTOR-CIRCULAR-DEPENDENCY-ANALYSIS.md`
- **Circular Dependency Solutions:** `docs/archive/CIRCULAR-DEPENDENCY-SOLUTIONS.md`

