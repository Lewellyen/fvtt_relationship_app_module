# OCP-Plan: ModuleSettingsRegistrar – registrierbare Settings

**Erstellungsdatum:** 2025-12-10
**Status:** Abgeschlossen ✅
**Abgeschlossen:** 2025-12-11
**Priorität:** Mittel
**Betroffene Datei:** `src/application/services/ModuleSettingsRegistrar.ts`

---

## Problem-Beschreibung
- `registerAll()` enthält eine fest verdrahtete Liste aller Settings.
- RuntimeConfig-Bindings sind über Konstanten gekoppelt.
- Jede neue Einstellung oder Binding erzwingt Codeänderungen in der Klasse und verletzt damit das Open/Closed Principle.

---

## Ziel-Architektur
- `ModuleSettingsRegistrar` konsumiert eine injizierte `SettingDefinitionRegistry` (Interface) statt fester Arrays.
- Bindings zwischen Settings und RuntimeConfig werden als registrierte `RuntimeConfigBinding`-Einträge injiziert.
- Die Klasse iteriert nur über bereitgestellte Registries → offen für neue Settings/Bindings, geschlossen für Kernänderungen.

### Verantwortlichkeiten
| Komponente | Aufgabe |
| --- | --- |
| `ModuleSettingsRegistrar` | Iteriert über injizierte Definitions-/Binding-Registries und ruft Foundry-Registrierung auf. |
| `SettingDefinitionRegistry` (neu, Interface) | Liefert `SettingDefinition[]` für die Registrierung. |
| `RuntimeConfigBindingRegistry` (neu, Interface) | Liefert Bindings zwischen Settings und RuntimeConfig-Schlüsseln. |

---

## Schritt-für-Schritt Refactoring-Plan
1. **Interfaces definieren**
   - `SettingDefinitionRegistry` mit `getAll(): SettingDefinition[]`.
   - `RuntimeConfigBindingRegistry` mit `getAll(): RuntimeConfigBinding[]`.

2. **DI-Vertrag ergänzen**
   - Registries in den DI-Container aufnehmen (Factory + Token).
   - `ModuleSettingsRegistrar` erwartet die Registries via Konstruktor.

3. **Logik umstellen**
   - `registerAll()` iteriert über `SettingDefinitionRegistry.getAll()`.
   - `attachBinding`/`syncInitialValue` nutzen `RuntimeConfigBindingRegistry.getAll()` statt statischer Konstanten.

4. **Tests anpassen/ergänzen**
   - Sicherstellen, dass neue Settings/Bindings allein durch Registry-Erweiterung registriert werden.
   - Negative Tests: leere Registry, doppelte Keys → validierte Fehlerfälle.

5. **Migrationspfad**
   - Bestehende statische Arrays in separate Registry-Implementierungen überführen.
   - Kompatibilitätslayer: optional temporäre Adapter, die die bisherigen Arrays kapseln.

---

## Erfolgskriterien
- Neue Settings oder Bindings können ausschließlich über Registry-Erweiterungen ergänzt werden.
- `ModuleSettingsRegistrar` enthält keine hartkodierten Setting- oder Binding-Listen mehr.
- Bestehende SRP-Trennung bleibt erhalten (Error-Mapping/Synchronisation bleiben delegiert).
- Tests decken den Registry-basierten Flow ab (positiv/negativ).
