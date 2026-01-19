---
ID: DIP-010
Prinzip: DIP
Schweregrad: Mittel
Module/Layer: infrastructure/ui
Status: Proposed
Reviewed: 2026-01-19
---

# 1. Problem

Die Infrastructure-Schicht dupliziert lokale Type-Definitionen für Teile der `ModuleApi`, um „Domain-Boundary-Verletzungen“ zu vermeiden (Infrastructure darf nicht von Framework importieren). Das ist ein Architektur-Smell: **Die Grenzen sind so geschnitten, dass selbst Type-Only Nutzung nicht möglich ist**, und als Workaround entsteht Type-Duplikation.

Risiko: Divergenz der Typen zwischen Framework und Infrastructure (stille Compile-Time/Runtime Mismatches).

# 2. Evidence (Belege)

**Pfade & Knoten**
- `src/infrastructure/ui/window-system/JournalEntryPageWindowSystemBridgeMixin.ts`

**Minimierter Codeauszug**

```ts
// src/infrastructure/ui/window-system/JournalEntryPageWindowSystemBridgeMixin.ts
// Lokale Type-Definition für ModuleApi (Sub-Interface)
interface ServiceResolutionApi {
  resolve: <TServiceType>(token: ApiSafeToken<TServiceType>) => TServiceType;
  resolveWithError: <TServiceType>(token: ApiSafeToken<TServiceType>) => Result<TServiceType, ContainerError>;
  tokens: {
    platformContainerPortToken: ApiSafeToken<PlatformContainerPort>;
    platformNotificationPortToken: ApiSafeToken<PlatformNotificationPort>;
  };
}
```

# 3. SOLID-Analyse

**DIP-Verstoß (architektonisch):** Infrastructure ist gezwungen, Framework-API-Verträge zu duplizieren, weil die Module/Layer so geschnitten sind, dass „Contracts“ nicht als shared abstraction konsumiert werden können. Dadurch wird das System anfälliger für Änderungen (jede API-Änderung muss an mehreren Stellen nachgezogen werden).

**Nebenwirkungen**
- Erhöht SRP-Verstöße in Bridge/Glue-Code (mehr Verantwortung: Mapping + Typpflege).
- Erschwert Evolution der Public API.

# 4. Zielbild

- Ein eindeutiger, stabiler **API-Contract** Ort (Type-only), den Framework und Infrastructure konsumieren können, ohne Runtime-Zyklen.
- Keine „lokalen Kopien“ von Framework-Verträgen.

# 5. Lösungsvorschlag

**Approach A (empfohlen): Shared API Contract Modul**
- Introduce `src/shared/api-contract/` (oder `src/framework/api-contract/`), ausschließlich `export type`/`export interface` (keine Runtime-Imports).
- Framework implementiert diesen Vertrag; Infrastructure importiert nur types.

**Approach B (Alternative): .d.ts Contract**
- Lege einen `.d.ts` Contract unter `src/framework/types/public-api.d.ts` ab und exportiere ihn für type-only Nutzung.

Trade-offs:
- A ist sauberer und tool-freundlicher, erfordert aber eine neue Ordner-/Boundary-Regel.
- B ist minimal-invasiv, aber `.d.ts` kann schwieriger zu refactoren sein.

# 6. Refactoring-Schritte

1. Contract extrahieren: `ServiceResolutionApi` / `ModuleApi` Subset als shared type exportieren.
2. Framework: `ModuleApi` implementiert/extends diesen shared contract.
3. Infrastructure: ersetzt lokale Interface-Kopie durch type-import aus shared contract.
4. Arch-Gate: verbietet `interface ServiceResolutionApi` lokale Kopien in Infrastructure.

**Breaking Changes**
- Nur interne Type-Import-Pfade; keine Runtime-API-Änderung nötig (wenn sauber type-only).

# 7. Beispiel-Code

```ts
// src/shared/api-contract/module-api.contract.ts
export interface ServiceResolutionApiContract {
  resolve<T>(token: symbol): T;
  resolveWithError<T>(token: symbol): Result<T, unknown>;
  tokens: Record<string, symbol>;
}
```

# 8. Tests & Quality Gates

- Typecheck: Infrastructure kompiliert ohne lokale API-Interface-Kopie.
- Optional: Contract snapshot test (API Tokens shape).

# 9. Akzeptanzkriterien

- Keine duplizierten ModuleApi-Vertrags-Typen in `src/infrastructure/**`.
- Ein zentraler API-Contract-Ort existiert und wird von Framework/Infrastructure genutzt.
