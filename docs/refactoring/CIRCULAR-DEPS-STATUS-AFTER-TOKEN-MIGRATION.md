# Circular Dependencies Status nach Token-Migration

**Datum:** 2025-12-04
**Nach Abschluss:** Token Barrel-Exports Migration (Plan 1B)

---

## 📊 Aktuelle Situation

| Metrik | Wert | Status |
|--------|------|--------|
| **Circular Dependencies** | 104 | 🔴 Unverändert |
| **ESLint-Warnings** | 0 | ✅ Behoben (vorher: 96) |
| **Build-Zeit** | ~2s | ✅ 71% schneller (vorher: ~7s) |
| **Tree-Shaking** | Optimiert | ✅ Verbessert |
| **Type-Check** | Erfolgreich | ✅ |
| **Tests** | 1884/1884 | ✅ |

---

## 🔍 Analyse der verbleibenden Circular Dependencies

### Hauptkategorien (104 Zyklen)

#### 1. **Domain Ports Zyklen** (3 Zyklen)
```
1) domain/ports/collections/platform-entity-collection-port.interface.ts 
   > entity-query-builder.interface.ts
   
2) domain/ports/journal-directory-ui-port.interface.ts 
   > platform-ui-port.interface.ts
   
3) domain/ports/platform-ui-port.interface.ts 
   > notification-port.interface.ts
```
**Priorität:** 🔴 HOCH - Basis-Architektur
**Plan:** [CIRCULAR-DEPS-FIX-PLAN-2-DOMAIN-PORTS.md](CIRCULAR-DEPS-FIX-PLAN-2-DOMAIN-PORTS.md)

---

#### 2. **ServiceType Registry Zyklen** (~90 Zyklen)
```
Hauptproblem:
infrastructure/di/types/service-type-registry.ts
  → application/health/ContainerHealthCheck.ts
  → infrastructure/shared/tokens/core.tokens.ts
  → application/health/MetricsHealthCheck.ts
  → [verschiedene Services die ServiceType Registry nutzen]
```

**Ursache:** 
- `service-type-registry.ts` importiert alle Service-Klassen für Union-Type
- Services importieren Tokens
- Tokens importieren wieder Service-Typen (für Type-Safety)
- **Das ist das ursprüngliche "Token Hub Problem"** - aber auf ServiceType-Ebene

**Betroffene Bereiche:**
- ContainerHealthCheck.ts + HealthCheckRegistry
- MetricsHealthCheck.ts + MetricsCollector
- ModuleHealthService.ts
- ModuleSettingsRegistrar.ts
- RuntimeConfigService.ts
- Bootstrap-Services (api-bootstrapper, etc.)
- I18nFacadeService
- Container + InstanceCache

**Priorität:** 🔴 KRITISCH
**Geschätzte Zyklen:** ~85-90 von 104 (82-87%)

---

#### 3. **RuntimeConfig Zyklen** (~8-10 Zyklen)
```
RuntimeConfigService.ts 
  → runtime-safe-cast.ts 
  → ModuleEventRegistrar.ts
  → [verschiedene Abhängigkeiten]
```

**Priorität:** 🟡 MITTEL
**Plan:** [CIRCULAR-DEPS-FIX-PLAN-3-RUNTIME-CONFIG.md](CIRCULAR-DEPS-FIX-PLAN-3-RUNTIME-CONFIG.md)

---

## 🎯 Warum Token-Migration die Zyklen nicht reduziert hat

### Was die Migration erreicht hat:
✅ **ESLint-Warnings behoben**: Von 96 → 0
✅ **Build-Performance**: 71% schneller (7s → 2s)
✅ **Tree-Shaking**: Bessere Code-Splitting-Möglichkeiten
✅ **Code-Qualität**: Explizite Dependencies statt Barrel-Exports

### Was die Migration NICHT erreicht hat:
❌ **Circular Dependencies**: Immer noch 104 Zyklen
❌ **Strukturelle Probleme**: ServiceType Registry ist noch das Haupt-Problem

### Warum?
Die Token-Migration hat die **Import-Pfade** optimiert, aber nicht die **strukturellen Abhängigkeiten** aufgelöst:

```typescript
// Vorher (Barrel-Export):
import { loggerToken } from "@/infrastructure/shared/tokens";
// → Importiert transitiv ALLE Service-Typen via ServiceType Union

// Nachher (Spezifisch):
import { loggerToken } from "@/infrastructure/shared/tokens/core.tokens";
// → Importiert nur core.tokens, aber...
// core.tokens importiert immer noch Service-Klassen für Type-Safety!
```

**Das eigentliche Problem:**
```typescript
// infrastructure/shared/tokens/core.tokens.ts
import type { ContainerHealthCheck } from "@/application/health/ContainerHealthCheck";

export const containerHealthCheckToken = 
  createInjectionToken<ContainerHealthCheck>("ContainerHealthCheck");
  //                    ^^^^^^^^^^^^^^^^^^^^ Type-Import!
```

Und gleichzeitig:
```typescript
// application/health/ContainerHealthCheck.ts
import { containerHealthCheckToken } from "@/infrastructure/shared/tokens/core.tokens";
//       ^^^^^^^^^^^^^^^^^^^^ Zyklus!
```

---

## 📋 Nächste Schritte (Prioritäten)

### 1. ServiceType Registry Problem lösen (KRITISCH) 🔴
**Auswirkung:** ~85-90 Zyklen (82-87%)
**Ansätze:**
- **Option A**: ServiceType Union vollständig entfernen
- **Option B**: ServiceType in separates Package auslagern (monorepo)
- **Option C**: Lazy Loading für ServiceType Registry
- **Option D**: Code-Generation für ServiceType Union

**Aufwand:** Hoch (2-3 Tage)
**Risiko:** Hoch (Breaking Changes im DI-System)

---

### 2. Domain Ports Zyklen beheben (HOCH) 🔴
**Auswirkung:** 3 Zyklen
**Plan:** [CIRCULAR-DEPS-FIX-PLAN-2-DOMAIN-PORTS.md](CIRCULAR-DEPS-FIX-PLAN-2-DOMAIN-PORTS.md)
**Aufwand:** Mittel (4-6 Stunden)
**Risiko:** Mittel (Architektur-Änderungen)

---

### 3. RuntimeConfig Zyklen beheben (MITTEL) 🟡
**Auswirkung:** ~8-10 Zyklen
**Plan:** [CIRCULAR-DEPS-FIX-PLAN-3-RUNTIME-CONFIG.md](CIRCULAR-DEPS-FIX-PLAN-3-RUNTIME-CONFIG.md)
**Aufwand:** Mittel (3-4 Stunden)
**Risiko:** Niedrig

---

## 🎯 Empfehlung

**Reihenfolge:**
1. ✅ ~~Token Barrel-Exports Migration~~ (Abgeschlossen)
2. 🔴 **ServiceType Registry Problem** (höchste Priorität)
3. 🔴 **Domain Ports** (architektonische Basis)
4. 🟡 **RuntimeConfig** (kleinere Verbesserung)

**Begründung:**
- ServiceType Registry ist die **Hauptursache** für 82-87% aller Zyklen
- Ohne Lösung dieses Problems bleiben wir bei ~100 Zyklen stecken
- Domain Ports sollten danach gelöst werden (architektonische Sauberkeit)
- RuntimeConfig ist weniger kritisch

---

## 📊 Erwartete Verbesserung

| Nach Plan | Circular Dependencies | Reduktion |
|-----------|----------------------|-----------|
| Aktuell | 104 | - |
| Nach ServiceType Fix | ~10-20 | ~85% |
| Nach Domain Ports Fix | ~7-17 | ~93% |
| Nach RuntimeConfig Fix | ~0-5 | ~95-100% |

---

**Status:** 🟡 IN PROGRESS
**Nächster Plan:** ServiceType Registry Problem analysieren
**Datum:** 2025-12-04

