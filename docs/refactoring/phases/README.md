# Clean Architecture Multi-Platform Refactoring - Phase Plans

**Datum:** 2025-01-27  
**Status:** ⏳ Bereit zur Umsetzung  
**Gesamtaufwand:** 40-62 Stunden (5-6 Wochen)

---

## 📋 Phasen-Übersicht

| Phase | Priorität | Aufwand | Komplexität | Status |
|-------|-----------|---------|-------------|--------|
| [Phase 1: Event-System](#phase-1-event-system) | 🔴 Höchste | 16-24h | Hoch | ❌ Zu tun |
| [Phase 2: Entity-Collections](#phase-2-entity-collections) | 🟠 Hoch | 8-12h | Mittel | ❌ Zu tun |
| [Phase 3: Settings-System](#phase-3-settings-system) | 🟠 Hoch | 8-12h | Mittel | ❌ Zu tun |
| [Phase 4: UI-Operations](#phase-4-ui-operations) | 🟡 Mittel | 4-8h | Niedrig | ❌ Zu tun |
| [Phase 5: Dokumentation & Cleanup](#phase-5-dokumentation--cleanup) | 🟢 Abschluss | 4-6h | Niedrig | ❌ Zu tun |

**Gesamt:** 40-62 Stunden

---

## 🎯 Phase 1: Event-System

**Priorität:** 🔴 HÖCHSTE (Start hier!)  
**Aufwand:** 16-24 Stunden  
**Dokument:** [phase-1-event-system-refactoring.md](./phase-1-event-system-refactoring.md)

### Ziel

Event-System von direkten Foundry-Abhängigkeiten befreien:

- ✅ Generischer `PlatformEventPort<T>`
- ✅ Spezialisierter `JournalEventPort`
- ✅ `FoundryJournalEventAdapter`
- ✅ Use-Cases statt Hooks
- ✅ Tests ohne Foundry-Globals

### Key Deliverables

- `PlatformEventPort<T>` Interface
- `JournalEventPort` Interface
- `FoundryJournalEventAdapter` Implementierung
- `InvalidateJournalCacheOnChangeUseCase`
- `ProcessJournalDirectoryOnRenderUseCase`
- Löschen: `RenderJournalDirectoryHook`, `JournalCacheInvalidationHook`

### Dependencies

Keine - kann sofort starten!

---

## 🎯 Phase 2: Entity-Collections

**Priorität:** 🟠 HOCH  
**Aufwand:** 8-12 Stunden  
**Dokument:** [phase-2-entity-collections-refactoring.md](./phase-2-entity-collections-refactoring.md)

### Ziel

Entity-Collections wiederverwendbar und platform-agnostisch machen:

- ✅ Generischer `PlatformEntityCollectionPort<T>`
- ✅ Spezialisierter `JournalCollectionPort`
- ✅ `FoundryJournalCollectionAdapter`
- ✅ Services von `FoundryGame` entkoppeln

### Key Deliverables

- `PlatformEntityCollectionPort<T>` Interface
- `JournalCollectionPort` Interface
- `FoundryJournalCollectionAdapter` Implementierung
- `JournalVisibilityService` refactored (nutzt Port)
- Facades aktualisiert oder gelöscht

### Dependencies

Phase 1 empfohlen (aber nicht zwingend)

---

## 🎯 Phase 3: Settings-System

**Priorität:** 🟠 HOCH  
**Aufwand:** 8-12 Stunden  
**Dokument:** [phase-3-settings-system-refactoring.md](./phase-3-settings-system-refactoring.md)

### Ziel

Settings-System platform-agnostisch machen:

- ✅ Generischer `PlatformSettingsPort`
- ✅ `FoundrySettingsAdapter`
- ✅ `ModuleSettingsRegistrar` von FoundrySettings entkoppeln

### Key Deliverables

- `PlatformSettingsPort` Interface
- `FoundrySettingsAdapter` Implementierung
- `ModuleSettingsRegistrar` refactored (nutzt Port)
- Valibot-Integration für Runtime-Validation

### Dependencies

Keine - parallel zu Phase 1+2 möglich

---

## 🎯 Phase 4: UI-Operations

**Priorität:** 🟡 MITTEL  
**Aufwand:** 4-8 Stunden  
**Dokument:** [phase-4-ui-operations-refactoring.md](./phase-4-ui-operations-refactoring.md)

### Ziel

UI-Operationen platform-agnostisch machen:

- ✅ Generischer `PlatformUIPort`
- ✅ `FoundryUIAdapter`
- ✅ UIChannel und Services von FoundryUI entkoppeln

### Key Deliverables

- `PlatformUIPort` Interface
- `FoundryUIAdapter` Implementierung
- `UIChannel` refactored (nutzt Port)
- `JournalVisibilityService` UI-Operations refactored

### Dependencies

Keine - parallel zu Phase 1-3 möglich

---

## 🎯 Phase 5: Dokumentation & Cleanup

**Priorität:** 🟢 ABSCHLUSS  
**Aufwand:** 4-6 Stunden  
**Dokument:** [phase-5-documentation-and-cleanup.md](./phase-5-documentation-and-cleanup.md)

### Ziel

Refactoring dokumentieren und aufräumen:

- ✅ CHANGELOG.md aktualisieren
- ✅ ARCHITECTURE.md aktualisieren
- ✅ API.md aktualisieren
- ✅ Alte Code-Dateien löschen
- ✅ Migration-Guide erstellen

### Key Deliverables

- CHANGELOG.md vollständig aktualisiert
- ARCHITECTURE.md beschreibt Clean Architecture
- API.md dokumentiert alle Ports
- MIGRATION_GUIDE.md für Entwickler
- Alter Code gelöscht
- Alle Tests grün

### Dependencies

**Phase 1-4 müssen abgeschlossen sein!**

---

## 📊 Empfohlene Reihenfolge

### Option 1: Sequenziell (sicher)

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
(16-24h)  (8-12h)   (8-12h)   (4-8h)    (4-6h)
```

**Vorteile:**
- ✅ Klare Abhängigkeiten
- ✅ Einfacher zu tracken
- ✅ Weniger Merge-Konflikte

**Nachteile:**
- ❌ Langsamer (5-6 Wochen)
- ❌ Nur eine Person kann arbeiten

### Option 2: Parallel (schnell)

```
Phase 1 + Phase 3 + Phase 4 (parallel)
    ↓
Phase 2 (benötigt Phase 1 Patterns)
    ↓
Phase 5 (benötigt alles)
```

**Vorteile:**
- ✅ Schneller (3-4 Wochen)
- ✅ Mehrere Personen können arbeiten
- ✅ Phase 3+4 unabhängig

**Nachteile:**
- ❌ Mögliche Merge-Konflikte
- ❌ Mehr Koordination nötig

---

## 🚀 Quick-Start

### Sofort beginnen mit Phase 1:

```bash
# Ordner erstellen
mkdir -p src/domain/ports/events
mkdir -p src/infrastructure/adapters/foundry/event-adapters
mkdir -p src/application/use-cases

# Plan öffnen
cat docs/refactoring/phases/phase-1-event-system-refactoring.md

# Erste Datei erstellen
touch src/domain/ports/events/platform-event-port.interface.ts
```

---

## 📚 Weitere Ressourcen

- [Gesamt-Refactoring-Plan](../Clean-Architecture-Multi-Platform-Refactoring-Plan.md)
- [ARCHITECTURE.md](../../ARCHITECTURE.md)
- [DEPENDENCY_MAP.md](../../DEPENDENCY_MAP.md)
- [PROJECT_ANALYSIS.md](../../PROJECT_ANALYSIS.md)

---

## ✅ Fortschritt tracken

### Phase 1: Event-System
- [ ] Ordnerstruktur erstellt
- [ ] `PlatformEventPort<T>` erstellt
- [ ] `JournalEventPort` erstellt
- [ ] `FoundryJournalEventAdapter` implementiert
- [ ] DI-Token registriert
- [ ] Use-Cases erstellt
- [ ] Alte Hooks gelöscht
- [ ] Tests geschrieben
- [ ] `npm run check:all` ✅

### Phase 2: Entity-Collections
- [ ] Ordnerstruktur erstellt
- [ ] `PlatformEntityCollectionPort<T>` erstellt
- [ ] `JournalCollectionPort` erstellt
- [ ] `FoundryJournalCollectionAdapter` implementiert
- [ ] DI-Token registriert
- [ ] Services refactored
- [ ] Tests geschrieben
- [ ] `npm run check:all` ✅

### Phase 3: Settings-System
- [ ] Ordnerstruktur erstellt
- [ ] `PlatformSettingsPort` erstellt
- [ ] `FoundrySettingsAdapter` implementiert
- [ ] DI-Token registriert
- [ ] `ModuleSettingsRegistrar` refactored
- [ ] Tests geschrieben
- [ ] `npm run check:all` ✅

### Phase 4: UI-Operations
- [ ] Ordnerstruktur erstellt
- [ ] `PlatformUIPort` erstellt
- [ ] `FoundryUIAdapter` implementiert
- [ ] DI-Token registriert
- [ ] `UIChannel` refactored
- [ ] Services refactored
- [ ] Tests geschrieben
- [ ] `npm run check:all` ✅

### Phase 5: Dokumentation & Cleanup
- [ ] CHANGELOG.md aktualisiert
- [ ] ARCHITECTURE.md aktualisiert
- [ ] API.md aktualisiert
- [ ] PROJECT_ANALYSIS.md aktualisiert
- [ ] DEPENDENCY_MAP.md aktualisiert
- [ ] MIGRATION_GUIDE.md erstellt
- [ ] Alter Code gelöscht
- [ ] Final Review abgeschlossen
- [ ] `npm run check:all` ✅

---

**Status:** ⏳ Bereit zur Umsetzung  
**Nächster Schritt:** [Phase 1 starten](./phase-1-event-system-refactoring.md)  
**Letzte Aktualisierung:** 2025-01-27

