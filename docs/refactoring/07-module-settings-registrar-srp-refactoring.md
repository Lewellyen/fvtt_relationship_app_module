# Refactoring-Plan: ModuleSettingsRegistrar SRP-Verletzung

**Erstellungsdatum:** 2025-12-10
**Status:** Geplant
**Priorität:** Mittel
**Betroffene Datei:** `src/application/services/ModuleSettingsRegistrar.ts`

---

## Problem-Beschreibung

Die `ModuleSettingsRegistrar`-Klasse verletzt das Single Responsibility Principle (SRP) mit 3 verschiedenen Verantwortlichkeiten:

1. **Settings-Registrierung** (`registerAll`, `registerDefinition`)
2. **RuntimeConfig-Synchronisation** (`attachBinding`, `syncInitialValue`)
3. **Error-Mapping** (`mapAndNotify` - bereits teilweise extrahiert zu SettingRegistrationErrorMapper, aber noch in `registerDefinition`)

**Aktuelle Architektur:**
- ModuleSettingsRegistrar registriert Settings bei Foundry
- Synchronisiert Settings mit RuntimeConfig
- Mappt Errors (teilweise über SettingRegistrationErrorMapper)

**Problem:** Registrierung, Synchronisation und Error-Handling sind unterschiedliche Verantwortlichkeiten, die getrennt werden sollten.

**Hinweis:** `SettingRegistrationErrorMapper` existiert bereits, aber wird noch nicht vollständig genutzt.

---

## Ziel-Architektur

### Neue Klassen-Struktur

```
ModuleSettingsRegistrar (nur Registrierung)
├── registerAll()
└── registerDefinition()

RuntimeConfigSettingsSync (nur Synchronisation)
├── attachBinding()
└── syncInitialValue()

SettingRegistrationErrorMapper (bereits vorhanden)
└── mapAndNotify()
```

### Verantwortlichkeiten

| Klasse | Verantwortlichkeit | Methoden |
|--------|-------------------|----------|
| `ModuleSettingsRegistrar` | Nur Settings-Registrierung | `registerAll()`, `registerDefinition()` |
| `RuntimeConfigSettingsSync` | Nur RuntimeConfig-Synchronisation | `attachBinding()`, `syncInitialValue()` |
| `SettingRegistrationErrorMapper` | Nur Error-Mapping | `mapAndNotify()` (bereits vorhanden) |

---

## Schritt-für-Schritt Refactoring-Plan

### Phase 1: Vorbereitung (Tests & Interfaces)

1. **Tests für aktuelle Funktionalität schreiben**
   - Alle Public-Methoden von ModuleSettingsRegistrar testen
   - RuntimeConfig-Synchronisation testen
   - Error-Mapping testen

2. **Interfaces definieren**
   ```typescript
   interface IRuntimeConfigSettingsSync {
     attachBinding(
       settingKey: string,
       runtimeConfigKey: RuntimeConfigKey,
       sync: RuntimeConfigSync
     ): void;
     syncInitialValue(
       settingKey: string,
       runtimeConfigKey: RuntimeConfigKey,
       sync: RuntimeConfigSync
     ): void;
   }
   ```

### Phase 2: RuntimeConfigSettingsSync erstellen

3. **RuntimeConfigSettingsSync erstellen**
   - Datei: `src/application/services/runtime-config-settings-sync.ts`
   - Implementiert `IRuntimeConfigSettingsSync`
   - Enthält `attachBinding()` und `syncInitialValue()` Logik aus ModuleSettingsRegistrar
   - Tests schreiben

### Phase 3: ModuleSettingsRegistrar refactoren

4. **ModuleSettingsRegistrar umbauen**
   - RuntimeConfig-Synchronisation entfernen → delegiert zu `RuntimeConfigSettingsSync`
   - Error-Mapping vollständig zu `SettingRegistrationErrorMapper` delegieren
   - ModuleSettingsRegistrar führt nur noch Settings-Registrierung durch
   - Dependencies injizieren: `RuntimeConfigSettingsSync`, `SettingRegistrationErrorMapper`

5. **registerDefinition() refactoren**
   - Settings-Registrierung bleibt in ModuleSettingsRegistrar
   - RuntimeConfig-Synchronisation delegiert zu RuntimeConfigSettingsSync
   - Error-Mapping delegiert zu SettingRegistrationErrorMapper

6. **Constructor anpassen**
   - RuntimeConfigSettingsSync als Parameter
   - SettingRegistrationErrorMapper als Parameter (bereits vorhanden)
   - Factory-Methoden anpassen

### Phase 4: Integration & Tests

7. **Integration Tests**
   - ModuleSettingsRegistrar + RuntimeConfigSettingsSync zusammen testen
   - ModuleSettingsRegistrar + SettingRegistrationErrorMapper zusammen testen
   - Vollständiger Flow: Register → Sync → Error-Handling

8. **Performance Tests**
   - Sicherstellen, dass keine Performance-Regression auftritt

---

## Migration-Strategie

### Backward Compatibility

- **Public API bleibt unverändert**: `registerAll()` bleibt erhalten
- **Interne Implementierung ändert sich**: Synchronisation und Error-Mapping werden extrahiert
- **Keine Breaking Changes**: Externe Consumer merken keine Änderung

### Rollout-Plan

1. **Feature Branch erstellen**: `refactor/module-settings-registrar-srp`
2. **RuntimeConfigSettingsSync implementieren**: Parallel zu bestehendem Code
3. **ModuleSettingsRegistrar refactoren**: Synchronisation und Error-Mapping extrahieren
4. **Tests durchlaufen lassen**: Alle Tests müssen grün sein
5. **Code Review**: Review der Refactoring-Änderungen
6. **Merge**: In Main-Branch mergen

---

## Tests

### Unit Tests

- **RuntimeConfigSettingsSync**
  - `attachBinding()` bindet korrekt
  - `syncInitialValue()` synchronisiert korrekt
  - Edge Cases (invalid keys, missing sync)

- **ModuleSettingsRegistrar (refactored)**
  - `registerAll()` registriert alle Settings
  - `registerDefinition()` registriert einzelnes Setting
  - Delegiert Synchronisation korrekt zu RuntimeConfigSettingsSync
  - Delegiert Error-Mapping korrekt zu SettingRegistrationErrorMapper

### Integration Tests

- **ModuleSettingsRegistrar + RuntimeConfigSettingsSync**
  - Settings-Registrierung → RuntimeConfig-Synchronisation funktioniert
  - Initial-Value-Synchronisation funktioniert

- **ModuleSettingsRegistrar + SettingRegistrationErrorMapper**
  - Error-Mapping funktioniert korrekt
  - Notifications werden korrekt gesendet

- **Vollständiger Flow**
  - Register → Sync → Error-Handling

### Regression Tests

- Alle bestehenden Tests müssen weiterhin funktionieren
- Keine Performance-Regression

---

## Breaking Changes

**Keine Breaking Changes erwartet**

- Public API bleibt unverändert
- Interne Implementierung ändert sich nur
- Externe Consumer merken keine Änderung

---

## Risiken

### Technische Risiken

1. **Performance-Regression**
   - **Risiko**: Zusätzliche Delegation-Layer könnten Performance beeinträchtigen
   - **Mitigation**: Performance Tests durchführen, ggf. optimieren

2. **Synchronisations-Fehler**
   - **Risiko**: RuntimeConfig-Synchronisation funktioniert nicht korrekt
   - **Mitigation**: Umfassende Integration Tests

3. **Error-Mapping-Fehler**
   - **Risiko**: Error-Mapping funktioniert nicht korrekt
   - **Mitigation**: Umfassende Tests für alle Error-Szenarien

### Projekt-Risiken

1. **Zeitaufwand**
   - **Risiko**: Refactoring dauert länger als erwartet
   - **Mitigation**: Schrittweise Vorgehen, Feature Branch

2. **Code-Review-Komplexität**
   - **Risiko**: Große PR mit vielen Änderungen
   - **Mitigation**: Kleine, inkrementelle Commits

---

## Erfolgs-Kriterien

- ✅ ModuleSettingsRegistrar führt nur noch Settings-Registrierung durch
- ✅ RuntimeConfigSettingsSync verwaltet RuntimeConfig-Synchronisation
- ✅ SettingRegistrationErrorMapper verwaltet Error-Mapping vollständig
- ✅ Alle Tests bestehen (Unit + Integration)
- ✅ Keine Performance-Regression
- ✅ Keine Breaking Changes
- ✅ Code Review bestanden
- ✅ Dokumentation aktualisiert

---

## Offene Fragen

1. Soll RuntimeConfigSettingsSync als Singleton oder pro Registrar-Instanz sein?
2. Wie wird Synchronisation mit mehreren Settings gehandhabt?
3. Soll RuntimeConfigSettingsSync auch für andere Settings verwendet werden?

---

## Referenzen

- [SOLID-Analyse: SRP](../Analyse/solid-01-single-responsibility-principle.md)
- [ModuleSettingsRegistrar Source Code](../../src/application/services/ModuleSettingsRegistrar.ts)
- [SettingRegistrationErrorMapper](../../src/application/services/SettingRegistrationErrorMapper.ts)
- [RuntimeConfigSync](../../src/application/services/RuntimeConfigSync.ts)

---

**Letzte Aktualisierung:** 2025-12-10

