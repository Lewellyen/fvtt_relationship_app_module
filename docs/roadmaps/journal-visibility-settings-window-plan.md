# Umsetzungsplan: Journal Visibility Settings-Fenster

**Version:** 1.0
**Datum:** 2024
**Basis:** Dynamic-Window-Framework v2.1
**Status:** Planungsphase

---

## 1. Zielbild & Nicht-Ziele

### Was das Fenster können muss (MVP)

- **Alle Journale listen** (auch aktuell ausgeblendete)
  - Datenquelle: `game.journal.contents` (Foundry-Daten, nicht Sidebar/DOM)
  - Anzeige: Name, Folder-Pfad (optional), aktueller Sichtbarkeitsstatus
- **Pro Journal Sichtbarkeit toggeln**
  - Toggle-Button/Checkbox pro Journal-Eintrag
  - Verwendet bestehende Services (`journalRepository.setFlag()` / `unsetFlag()`)
  - Optimistic UI-Update (sofortiges Feedback)
- **Filter/Suche**
  - MVP: Textsuche nach Journal-Namen
  - Optional: "Nur versteckte anzeigen" Filter
- **Keine Render-Loops**
  - `render:false` in Update-Options
  - Window-scoped Origin-Tracking (nur Updates aus demselben WindowHandle ignorieren)
  - Reaktive UI-Updates über StatePort (Svelte RuneState)

### Was ausdrücklich *nicht* Teil des MVP ist

- **Permissions/Ownership-Manipulation**: Keine Änderung von Journal-Berechtigungen
- **Massenaktionen**: "Alle ausblenden/alle einblenden" optional (Phase 2)
- **Folder-Management**: Keine Erstellung/Löschung von Foldern
- **Journal-Erstellung/Löschung**: Nur Sichtbarkeit, keine CRUD-Operationen
- **Bulk-Import/Export**: Keine CSV/JSON-Import-Funktionen
- **Sortierung nach Metadaten**: MVP nur alphabetisch nach Namen

---

## 2. Bestandsaufnahme (Discovery Steps)

### Schritt 1: Bestehende Services identifizieren

**Ziel:** Vollständige API-Dokumentation der existierenden Journal-Hide/Unhide-Services

**✅ Verfügbare Services als Datenquellen:**

#### 1. **PlatformJournalCollectionPort** (Read-Only Collection)
- **Token:** `platformJournalCollectionPortToken`
- **Interface:** `src/domain/ports/collections/platform-journal-collection-port.interface.ts`
- **Implementierung:** `FoundryJournalCollectionAdapter`
- **Methoden:**
  - `getAll(): Result<JournalEntry[], EntityCollectionError>` - **Hauptdatenquelle für Liste**
  - `getById(id: string): Result<JournalEntry | null, EntityCollectionError>`
  - `getByIds(ids: string[]): Result<JournalEntry[], EntityCollectionError>`
  - `exists(id: string): Result<boolean, EntityCollectionError>`
  - `count(): Result<number, EntityCollectionError>`
  - `search(query: EntitySearchQuery<JournalEntry>): Result<JournalEntry[], EntityCollectionError>`
  - `query(): EntityQueryBuilder<JournalEntry>` - Fluent API für komplexe Queries
- **Domain-Modell:** `JournalEntry { id: string, name: string | null }`
- **Hinweis:** Domain-Modell enthält nur `id` und `name` (kein `folder`). Folder-Info müsste über Foundry-API direkt geholt werden, falls benötigt.

#### 2. **PlatformJournalRepository** (Full CRUD + Flags)
- **Token:** `platformJournalRepositoryToken`
- **Interface:** `src/domain/ports/repositories/platform-journal-repository.interface.ts`
- **Implementierung:** `FoundryJournalRepositoryAdapter`
- **Flag-Methoden (für Toggle):**
  - `getFlag(id, scope, key): Result<unknown | null, EntityRepositoryError>` - **Flag-Status lesen**
  - `setFlag(id, scope, key, value): Promise<Result<void, EntityRepositoryError>>` - **Flag setzen (für Toggle)**
  - `unsetFlag(id, scope, key): Promise<Result<void, EntityRepositoryError>>` - **Flag entfernen**
- **Konstanten:**
  - Scope: `MODULE_METADATA.ID` (`"fvtt_relationship_app_module"`)
  - Key: `DOMAIN_FLAGS.HIDDEN` (`"hidden"`)
  - Value: `true` (versteckt) / `false` (sichtbar) / `unsetFlag()` für Löschen
- **Hinweis:** `setFlag()` unterstützt aktuell **keine Options** (z.B. `render:false`). Muss erweitert werden oder Wrapper-Service erstellen.

#### 3. **JournalVisibilityService** (Business Logic + Cache)
- **Token:** `journalVisibilityServiceToken`
- **Datei:** `src/application/services/JournalVisibilityService.ts`
- **Methoden:**
  - `getHiddenJournalEntries(): Result<JournalEntry[], JournalVisibilityError>` - **Nur versteckte Journale**
- **Features:**
  - Caching (CacheReaderPort/CacheWriterPort)
  - Filtert automatisch nach Flag-Status
  - Logging/Notifications
- **Verwendung:** Optional für "Nur versteckte anzeigen" Filter, aber nicht zwingend nötig (kann auch direkt über Collection + Repository implementiert werden)

#### 4. **BatchUpdateContextService** (Re-render-Optimierung) ⭐
- **Token:** `batchUpdateContextServiceToken`
- **Datei:** `src/application/services/BatchUpdateContextService.ts`
- **Zweck:** Verhindert einzelne Re-renders während Batch-Updates, optimiert Performance
- **Methoden:**
  - `addToBatch(...journalIds: string[]): void` - Journal-IDs zu Batch hinzufügen
  - `removeFromBatch(...journalIds: string[]): void` - Journal-IDs aus Batch entfernen
  - `isInBatch(journalId: string): boolean` - Prüft, ob Journal-ID im Batch ist
  - `isEmpty(): boolean` - Prüft, ob Batch leer ist
  - `clearBatch(): void` - Batch leeren (für Error-Handling)
- **Verwendung:**
  ```typescript
  // Vor Batch-Updates: IDs registrieren
  batchContext.addToBatch(...journalIds);

  // Updates durchführen (TriggerJournalDirectoryReRenderUseCase überspringt Re-renders)
  for (const id of journalIds) {
    await repository.setFlag(id, ...);
  }

  // Nach Batch-Updates: IDs entfernen → Re-render wird ausgelöst
  batchContext.removeFromBatch(...journalIds);
  ```
- **Integration:** `TriggerJournalDirectoryReRenderUseCase` prüft `isInBatch()` und überspringt Re-renders während Batch-Updates
- **Vorteil für Settings-Fenster:** Bei schnellen Toggles (z.B. "Alle ausblenden") wird nur einmal re-rendert, nicht pro Journal

#### 5. **ShowAllHiddenJournalsUseCase** (Referenz-Implementierung)
- **Token:** `showAllHiddenJournalsUseCaseToken`
- **Datei:** `src/application/use-cases/show-all-hidden-journals.use-case.ts`
- **Verwendung:** Referenz für Batch-Updates (optional für Phase 2: "Alle ausblenden/einblenden")
- **Pattern:**
  - Nutzt `journalRepository.setFlag()` mit `false` (nicht `unsetFlag()`)
  - Nutzt `BatchUpdateContextService` für optimierte Re-renders
  - **Ablauf:**
    1. Alle zu updatenden Journal-IDs sammeln
    2. `batchContext.addToBatch(...journalIds)` - Batch starten
    3. Updates durchführen (Re-renders werden übersprungen)
    4. `batchContext.removeFromBatch(...journalIds)` - Batch beenden → Re-render wird ausgelöst
  - **Hinweis:** Für einzelne Toggles ist BatchContext optional (aber kann trotzdem genutzt werden für konsistentes Verhalten)

#### 6. **JournalVisibilityConfig** (Konfiguration)
- **Token:** `journalVisibilityConfigToken`
- **Datei:** `src/application/services/JournalVisibilityConfig.ts`
- **Properties:**
  - `moduleNamespace: string` → `MODULE_METADATA.ID`
  - `hiddenFlagKey: string` → `DOMAIN_FLAGS.HIDDEN`
  - `cacheKeyFactory: (resource: string) => DomainCacheKey`
  - `unknownName: string` → `APP_DEFAULTS.UNKNOWN_NAME`
- **Verwendung:** Für Flag-Konstanten (kann auch direkt Konstanten verwenden)

**✅ Zusammenfassung der Datenquellen-Strategie:**

**Für Journal-Liste:**
- **Primär:** `PlatformJournalCollectionPort.getAll()` - Gibt alle Journale zurück (inkl. versteckte)
- **Alternative:** `JournalVisibilityService.getHiddenJournalEntries()` - Nur für "Nur versteckte" Filter

**Für Flag-Status pro Journal:**
- **Primär:** `PlatformJournalRepository.getFlag(id, MODULE_METADATA.ID, DOMAIN_FLAGS.HIDDEN)` - Pro Journal einzeln abfragen
- **Optimierung:** Alle Journale + alle Flags in einem Loop (wie in `JournalVisibilityService`)

**Für Toggle-Operation:**
- **Primär:** `PlatformJournalRepository.setFlag(id, MODULE_METADATA.ID, DOMAIN_FLAGS.HIDDEN, true/false)`
- **Problem:** Unterstützt aktuell keine Options (`render:false`, `windowFrameworkOrigin`)
- **Lösung:** Repository-Adapter erweitern oder Wrapper-Service erstellen

**Für Re-render-Optimierung (optional, aber empfohlen):**
- **Primär:** `BatchUpdateContextService` - Verhindert einzelne Re-renders bei schnellen Toggles
- **⚠️ WICHTIG:** Service ist nur **lokal** (in-memory), andere Clients sehen Batch-Info nicht
- **Verwendung:**
  - Bei einzelnen Toggles: Optional (kann genutzt werden für konsistentes Verhalten)
  - Bei Batch-Updates (Phase 2: "Alle ausblenden/einblenden"): **Zwingend erforderlich** (lokal)
- **Integration:** `TriggerJournalDirectoryReRenderUseCase` prüft automatisch `isInBatch()` und überspringt Re-renders
- **Multi-Client-Optimierung (Phase 3):** World-Scoped Setting für Batch-Liste (siehe Risiko 6)

### Schritt 2: Hook-System analysieren

**Ziel:** Verstehen, welche Hooks für Journal-Flag-Updates gefeuert werden

**Konkrete Schritte:**

1. **Foundry Hook-Dokumentation prüfen**
   - Hook: `updateJournalEntry` (spezifisch) oder `updateDocument` (generisch)
   - **Erforderliche Informationen:**
     - Welcher Hook wird bei Flag-Änderungen gefeuert?
     - Welche Daten sind im Update-Objekt enthalten?
     - Wie wird `render:false` in Options übergeben?

2. **Bestehende Hook-Handler analysieren**
   - Datei: `src/infrastructure/adapters/foundry/hooks/window-hooks.ts` (wenn existiert)
   - **Erforderliche Informationen:**
     - Wie wird `RemoteSyncGate.isFromWindow()` verwendet?
     - Wie wird `isRelevant()` für Journal-Updates implementiert?

### Schritt 3: Dynamic-Window-Framework-Status prüfen

**Ziel:** Verifizieren, welche v2.1-Komponenten bereits implementiert sind

**Konkrete Schritte:**

1. **WindowFactory/WindowRegistry prüfen**
   - Existieren bereits Implementierungen?
   - Wo werden WindowDefinitions registriert?
   - **Erforderliche Informationen:**
     - Registrierungs-Mechanismus (Config-Datei, Bootstrapper, etc.)
     - Beispiel-WindowDefinition (falls vorhanden)

2. **StatePortFactory prüfen**
   - Existiert bereits `RuneStateFactory`?
   - Wo wird die Factory gebunden (Composition Root)?
   - **Erforderliche Informationen:**
     - Token/Interface für StatePortFactory
     - Binding-Strategie (Renderer-gebunden oder global)

3. **HookBridge prüfen**
   - Existiert bereits `WindowHooksBridge`?
   - Wie wird Relevanz-Prüfung implementiert?
   - **Erforderliche Informationen:**
     - DependencyDescriptor-Format für Journal-Updates
     - `isRelevant()` Logik für Flag-Updates

---

## 3. Architektur-Integration (Dynamic-Window v2.1)

### Komponenten-Übersicht

| Komponente | Verantwortlichkeit | Verwendung im Settings-Fenster |
|------------|-------------------|--------------------------------|
| **WindowFactory** | Erzeugt WindowController + Foundry-App | `createWindow("journal-visibility-settings")` |
| **WindowController** | Orchestriert Lifecycle, Bindings, Actions | State-Management, Action-Dispatch |
| **WindowRegistry** | Verwaltet Definitions + Instances | Lookup, Multi-Instance-Support |
| **RendererRegistry** | Verwaltet Render-Engine-Implementierungen | `get("svelte")` → SvelteRenderer |
| **StatePortFactory** | Erstellt StatePort (RuneState für Svelte) | Window-Local State (Filter, Selection) |
| **HookBridge** | Foundry Hooks → WindowController | `updateJournalEntry` → `applyRemotePatch()` |
| **RemoteSyncGate** | Origin-Tracking (window-scoped) | `isFromWindow()` verhindert Ping-Pong |
| **ActionDispatcher** | Führt Actions aus (Command-Pattern) | `toggleJournalVisibility(journalId)` |
| **BindingEngine** | Optional: Bindings für externe Sync | Nicht nötig für MVP (Svelte-first) |

### Zuständigkeiten

**WindowController:**
- State-Management (Window-Local: Filter, Selection, UI-State)
- Action-Dispatch (`toggleJournalVisibility`)
- Remote-Patch-Anwendung (Hook-Updates)

**Services (Application Layer):**
- `JournalCollection.getAll()` - Datenquelle für Liste
- `JournalRepository.setFlag()` / `unsetFlag()` - Flag-Änderungen
- `JournalVisibilityService` (optional) - Cache für versteckte Journale
- `BatchUpdateContextService` - **Optimiert Re-renders bei Batch-Updates** (siehe unten)

**Renderer (Svelte):**
- UI-Rendering (Liste, Toggle-Buttons)
- Reaktive Updates via RuneState (automatisch)

**HookBridge:**
- `updateJournalEntry` Hook abonnieren
- Relevanz-Prüfung (betrifft dieses Fenster?)
- `applyRemotePatch()` aufrufen (wenn relevant

---

## 4. Datenmodell & State-Design

### Window UI State (Window-Local, StatePort)

```typescript
interface JournalVisibilityWindowState {
  // Filter/Suche
  searchQuery: string; // Textsuche nach Journal-Namen
  onlyHidden: boolean; // Filter: nur versteckte anzeigen

  // Sortierung
  sortBy: "name" | "folder" | "visibility"; // MVP: nur "name"
  sortDirection: "asc" | "desc";

  // Selection (optional für zukünftige Massenaktionen)
  selectedJournalIds: string[]; // MVP: leer, für Phase 2

  // UI-State
  isLoading: boolean; // Initial-Loading
  error: string | null; // Fehler-Message
}
```

### ViewModel-Struktur (Computed)

```typescript
interface JournalEntryViewModel {
  id: string;
  name: string;
  folderPath: string | null; // Optional: Folder-Pfad
  isHidden: boolean; // Aktueller Flag-Status
  canToggle: boolean; // Permission-Check (optional)
}
```

**Computed-Liste:**
- `filteredJournals: JournalEntryViewModel[]`
  - Filtert nach `searchQuery` und `onlyHidden`
  - Sortiert nach `sortBy` und `sortDirection`
  - Wird reaktiv aktualisiert (Svelte Runes)

### Datenquelle

**Primär:** `game.journal.contents` (Foundry-Daten)

**Alternative (falls benötigt):**
- `JournalCollection.getAll()` (Domain-Port, platform-agnostisch)
- **Vorteil:** Testbar, platform-agnostisch
- **Nachteil:** Zusätzliche Abstraktion

**Empfehlung:** `JournalCollection.getAll()` verwenden (Clean Architecture)

### Idempotente Patch-Regeln

**StatePort.patch():**
- Nur ändern, wenn `value !== currentValue`
- Verhindert unnötige Reaktionen (Svelte-Reaktivität)

**Beispiel:**
```typescript
// Nur patchen, wenn sich Wert geändert hat
if (state.searchQuery !== newQuery) {
  statePort.patch({ searchQuery: newQuery });
}
```

---

## 5. Actions & Usecase-Orchestrierung

### Action: `toggleJournalVisibility(journalId)`

**Ablauf:**

1. **Optimistic Update (UI)**
   ```typescript
   // StatePort.patch() - sofortiges UI-Feedback
   const currentJournal = viewModel.filteredJournals.find(j => j.id === journalId);
   if (currentJournal) {
     currentJournal.isHidden = !currentJournal.isHidden; // Optimistic
   }
   ```

2. **Usecase Call**
   ```typescript
   // Action-Handler ruft Repository
   const currentFlag = await journalRepository.getFlag(
     journalId,
     MODULE_METADATA.ID,
     DOMAIN_FLAGS.HIDDEN
   );

   const newValue = currentFlag.value === true ? false : true;

   // Persist mit Origin-Meta
   const meta = remoteSyncGate.makePersistMeta(windowInstanceId);
   const result = await journalRepository.setFlag(
     journalId,
     MODULE_METADATA.ID,
     DOMAIN_FLAGS.HIDDEN,
     newValue,
     { render: false, windowFrameworkOrigin: meta } // Options
   );
   ```

3. **Error Handling / Rollback**
   ```typescript
   if (!result.ok) {
     // Rollback: Optimistic Update rückgängig machen
     currentJournal.isHidden = !currentJournal.isHidden;

     // Fehler anzeigen
     statePort.patch({ error: result.error.message });
   }
   ```

**Hinweis zu BatchUpdateContextService:**
- **⚠️ WICHTIG:** BatchUpdateContextService Multi-Client-Fix muss VOR Fenster-Implementierung abgeschlossen sein (siehe M-1)
- **Nach M-1:** Service funktioniert Multi-Client, kann für alle Batch-Updates genutzt werden
- **Integration:** `TriggerJournalDirectoryReRenderUseCase` prüft automatisch `isInBatch()` (World-Setting) und überspringt Re-renders während Batch-Updates

### OriginMeta-Erzeugung

**RemoteSyncGate.makePersistMeta():**
```typescript
{
  originClientId: game.userId,
  originWindowInstanceId: "journal-visibility-settings:uuid-123",
  render: false
}
```

**Integration in Repository:**
- `setFlag()` / `unsetFlag()` akzeptieren `options?: Record<string, unknown>`
- Options werden an `document.update()` / `document.setFlag()` weitergegeben
- **Hinweis:** Prüfen, ob `FoundryJournalRepositoryAdapter.setFlag()` bereits Options unterstützt

### `render:false` und Options/Meta

**Strategie:**
- Options werden direkt an `journalRepository.setFlag()` übergeben
- Repository-Adapter extrahiert `windowFrameworkOrigin` und `render` aus Options
- Foundry `document.setFlag()` erhält `{ render: false, windowFrameworkOrigin: meta }`

**Alternative (falls Repository keine Options unterstützt):**
- Usecase erstellt Wrapper, der Options hinzufügt
- Oder: Repository-Adapter erweitern (besser für Clean Architecture)

---

## 6. Sync & Hooks (kein Render-Loop)

### Hook-Auswahl

**Option 1: Spezifisch (`updateJournalEntry`)**
- **Vorteil:** Nur Journal-Updates, bessere Performance
- **Nachteil:** Muss für jeden Document-Type separat registriert werden

**Option 2: Generisch (`updateDocument`)**
- **Vorteil:** Ein Hook für alle Document-Types
- **Nachteil:** Mehr Overhead (Filter-Logik nötig)

**Empfehlung:** **Option 1** (`updateJournalEntry`) für MVP, später auf `updateDocument` migrieren wenn Framework es unterstützt

### Relevanzprüfung

**Wann betrifft ein Update dieses Fenster?**

1. **Document-Type Check:**
   ```typescript
   if (document.constructor.name !== "JournalEntry") {
     return false; // Nicht relevant
   }
   ```

2. **Flag-Key Check:**
   ```typescript
   const update = options.update as Record<string, unknown>;
   const flagPath = `flags.${MODULE_METADATA.ID}.${DOMAIN_FLAGS.HIDDEN}`;
   if (!(flagPath in update)) {
     return false; // Nicht relevant (anderes Flag geändert)
   }
   ```

3. **DependencyDescriptor (Framework):**
   ```typescript
   dependencies: [
     {
       type: "document",
       documentType: "JournalEntry"
     },
     {
       type: "flag",
       namespace: MODULE_METADATA.ID,
       key: DOMAIN_FLAGS.HIDDEN
     }
   ]
   ```

### Filterregel: Window-scoped Origin

**Regel:**
```typescript
if (remoteSyncGate.isFromWindow(options, thisWindowInstanceId)) {
  // Ignorieren: Update kommt von diesem Window
  return;
}

// Anwenden: Update kommt von anderem Window oder anderem Client
await controller.applyRemotePatch(extractedPatch);
```

**Wichtig:**
- **Window-scoped**, nicht Client-scoped!
- Updates aus anderen Fenstern desselben Clients **müssen durchschlagen**
- Nur Updates aus **demselben WindowHandle** werden ignoriert

### Umgang mit Updates aus anderen Fenstern

**Szenario:** User hat zwei Settings-Fenster offen (z.B. zwei Browser-Tabs)

**Verhalten:**
- Window 1: User toggelt Journal A → Update mit `originWindowInstanceId = "window-1"`
- Window 2: **Sollte Update erhalten** (nicht ignorieren, da `originWindowInstanceId !== "window-2"`)
- Window 2: `applyRemotePatch()` → State aktualisiert → UI re-rendert (Svelte-Reaktivität)

**Ergebnis:** Beide Fenster bleiben synchron, kein Ping-Pong

---

## 7. UI/UX Plan (MVP → Optional)

### MVP UI

**Layout:**
```
┌─────────────────────────────────────────┐
│ Journal Visibility Settings        [X] │
├─────────────────────────────────────────┤
│ [🔍 Suche...] [☑ Nur versteckte]      │
├─────────────────────────────────────────┤
│ Journal Name          │ Folder │ Status│
├─────────────────────────────────────────┤
│ 📄 Quest Log          │ /     │ [👁]  │
│ 📄 NPC Notes          │ /NPCs │ [👁]  │
│ 📄 Hidden Journal     │ /     │ [🚫]  │
│ ...                                    │
└─────────────────────────────────────────┘
```

**Komponenten:**
1. **Suchfeld** (Text-Input)
   - Binding: `state.searchQuery`
   - Debounced (optional, 300ms)

2. **Filter-Checkbox** ("Nur versteckte anzeigen")
   - Binding: `state.onlyHidden`

3. **Journal-Liste** (Table/List)
   - Spalten: Name, Folder (optional), Toggle-Button
   - Toggle-Button: Icon (👁 = sichtbar, 🚫 = versteckt)
   - Click → `toggleJournalVisibility(journalId)`

4. **Loading-State**
   - Spinner während Initial-Load

5. **Error-State**
   - Fehler-Message bei Fehlern

### Optional (Phase 2)

1. **Massenaktionen**
   - Button: "Alle ausblenden" / "Alle einblenden"
   - Mit Confirm-Dialog
   - Nutzt `BatchUpdateContextService` für Re-render-Optimierung (nach M-1 Fix)
   - Pattern wie `ShowAllHiddenJournalsUseCase`: `addToBatch()` → Updates → `removeFromBatch()` → Re-render

2. **Folder-Gruppierung**
   - Journale nach Foldern gruppieren
   - Expand/Collapse pro Folder

3. **Virtualization**
   - Für sehr viele Journale (>100)
   - Virtuelles Scrolling (z.B. `svelte-virtual-list`)

4. **Sortierung**
   - Dropdown: "Nach Name", "Nach Folder", "Nach Status"
   - Sort-Direction Toggle (↑/↓)

### Öffnungsweg

**Option 1: Settings-Button**
- In Foundry Settings (Modul-Settings)
- Button: "Journal Visibility verwalten"

**Option 2: Command**
- Foundry Command-Palette (`Ctrl+F`)
- Command: "Journal Visibility Settings"

**Option 3: Directory-Button**
- Im Journal-Directory (neben "Alle Journale einblenden")
- Button: "Visibility Settings"

**Empfehlung:** **Option 1** (Settings-Button) für MVP, Option 3 als Alternative

---

## 8. Implementierungsreihenfolge (Milestones)

### M-1: BatchUpdateContextService Multi-Client-Fix (VORAUSSETZUNG) ⚠️

**Status:** Muss VOR allen anderen Milestones abgeschlossen sein

**Problem:** `BatchUpdateContextService` funktioniert nur lokal (in-memory), andere Clients wissen nicht, dass ein Batch läuft → Jeder Client re-rendert einzeln statt einmal am Ende.

**Tasks:**
- [ ] World-Scoped Setting für Batch-Liste registrieren
  - Key: `journalBatchUpdateIds` (oder ähnlich)
  - Scope: `"world"` (alle Clients sehen es)
  - Type: `String` (JSON: `string[]`)
  - Config: `false` (nicht in UI anzeigen)
- [ ] `BatchUpdateContextService` erweitern oder Wrapper erstellen
  - Nutzt World-Setting statt nur lokalem Memory
  - Methoden: `addToBatch()`, `removeFromBatch()`, `isInBatch()`, `clearBatch()`
  - Setting-Read/Write über `PlatformSettingsPort`
- [ ] `TriggerJournalDirectoryReRenderUseCase` anpassen
  - Prüft World-Setting statt nur lokalem Service
  - Setting-Value cachen (nur bei `settingChange`-Hook aktualisieren)
- [ ] Race Condition-Handling implementieren
  - Setting als "Lock" verwenden (nur setzen wenn leer)
  - Oder: UUID-basierte Batch-IDs für parallele Batches
- [ ] Fehlerbehandlung implementieren
  - Timeout-Mechanismus (Setting nach X Sekunden automatisch leeren)
  - Cleanup bei Fehler (try/finally)
- [ ] Letzter Update identifizieren
  - Counter im Setting: `{ ids: [...], remaining: N }`
  - Oder: Nach allen Updates explizit Setting löschen (besser)
- [ ] `settingChange`-Hook registrieren
  - Aktualisiert gecachten Setting-Value
  - Löst finalen Re-render aus, wenn Batch leer wird
- [ ] Tests schreiben
  - Unit-Tests: BatchUpdateContextService mit World-Setting
  - Integration-Tests: Multi-Client-Szenario (2 Clients, Batch-Update)
  - Edge Cases: Race Conditions, Fehlerbehandlung, Timeout

**Deliverable:**
- BatchUpdateContextService funktioniert Multi-Client
- Alle Clients sehen Batch-Status
- Re-renders werden für alle Clients optimiert (einmal am Ende statt pro Journal)

**Abhängigkeiten:**
- `PlatformSettingsPort (world-scoped)`
- `TriggerJournalDirectoryReRenderUseCase` (muss angepasst werden)

**Risiken:**
- Race Conditions bei parallelen Batches
- Performance-Overhead durch Setting-Reads
- Komplexität der "Letzter Update"-Erkennung

**Siehe auch:**
- Abschnitt 9, Risiko 6 für Details
- **Separater Plan:** `docs/roadmaps/multi-client-batch-updater.md` (vollständige Implementierungsdetails)

---

### M0: Discovery abgeschlossen + API geklärt

**Tasks:**
- [ ] JournalRepository-API dokumentiert (setFlag/unsetFlag mit Options)
- [ ] Hook-System verstanden (updateJournalEntry vs updateDocument)
- [ ] Dynamic-Window-Framework-Status geprüft (welche Komponenten existieren?)
- [ ] Beispiel-WindowDefinition gefunden/erstellt

**Deliverable:** Discovery-Dokument mit API-Signaturen

### M1: WindowDefinition + Registrierung + leeres Fenster renderbar

**Tasks:**
- [ ] WindowDefinition erstellen (`journal-visibility-settings`)
- [ ] Svelte-Component erstellen (leer, nur Titel)
- [ ] WindowDefinition registrieren (Config/Bootstrapper)
- [ ] Öffnungsweg implementieren (Settings-Button/Command)
- [ ] Fenster öffnet sich korrekt (Foundry ApplicationV2)

**Deliverable:** Leeres Fenster öffnet sich

### M2: Journalliste read-only korrekt (inkl. versteckte)

**Tasks:**
- [ ] JournalCollection.getAll() aufrufen
- [ ] Flag-Status pro Journal lesen (getFlag)
- [ ] ViewModel erstellen (JournalEntryViewModel[])
- [ ] Svelte-Component: Liste rendern (Name, Folder, Status-Icon)
- [ ] Loading-State während Initial-Load

**Deliverable:** Liste zeigt alle Journale mit korrektem Status

### M3: Toggle via Usecase + optimistic UI

**Tasks:**
- [ ] Action `toggleJournalVisibility` erstellen
- [ ] Action-Handler: Repository.setFlag() aufrufen
- [ ] Optimistic Update (StatePort.patch)
- [ ] Error Handling / Rollback
- [ ] OriginMeta erzeugen (RemoteSyncGate)
- [ ] `render:false` in Options übergeben

**Deliverable:** Toggle funktioniert, UI aktualisiert sofort

**Hinweis:** BatchUpdateContextService wird in M-1 implementiert und ist dann automatisch verfügbar

### M4: Hook-Sync + window-origin gating

**Tasks:**
- [ ] HookBridge: `updateJournalEntry` Hook registrieren
- [ ] Relevanzprüfung implementieren (Document-Type + Flag-Key)
- [ ] `isFromWindow()` prüfen (RemoteSyncGate)
- [ ] `applyRemotePatch()` aufrufen (wenn relevant + nicht von diesem Window)
- [ ] State aktualisiert → UI re-rendert (Svelte-Reaktivität)

**Deliverable:** Sync funktioniert, kein Ping-Pong, Updates von anderen Fenstern/Clients kommen an

### M5: UX polishing + edge cases

**Tasks:**
- [ ] Suche implementieren (Filter nach Name)
- [ ] "Nur versteckte" Filter implementieren
- [ ] Sortierung implementieren (alphabetisch)
- [ ] Error-States (Fehler-Messages)
- [ ] Edge Cases: Sehr viele Journale, Permissions, etc.

**Deliverable:** MVP-Funktionalität vollständig

### M6: Tests + Doku

**Tasks:**
- [ ] Unit-Tests: Action-Handler, State-Management
- [ ] Integration-Tests: Window öffnen, Toggle, Sync
- [ ] E2E-Tests: User-Flow (öffnen → toggle → schließen)
- [ ] Dokumentation: README, API-Docs

**Deliverable:** Tests geschrieben, Dokumentation aktualisiert

---

## 9. Risiken & Edge Cases

### Risiko 1: setFlag/unsetFlag vs update() Optionen

**Problem:** `FoundryJournalRepositoryAdapter.setFlag()` unterstützt möglicherweise keine Options

**Lösung:**
- Option A: Repository-Adapter erweitern (besser für Clean Architecture)
- Option B: Wrapper-Service erstellen, der Options hinzufügt
- **Empfehlung:** Option A (Repository erweitern)

**Discovery:** In M0 prüfen, ob Options bereits unterstützt werden

### Risiko 2: Fehlerfälle / Race Conditions

**Problem:** Schnelle Toggles können Race Conditions verursachen

**Szenario:**
1. User toggelt Journal A (Request 1)
2. User toggelt Journal A erneut (Request 2, bevor Request 1 fertig)
3. Request 1: setFlag(true)
4. Request 2: setFlag(false)
5. Ergebnis: Unvorhersehbar (je nach Reihenfolge)

**Lösung:**
- **Optimistic Update mit Queue:**
  - Pending-Operations in Queue
  - Nur eine Operation pro Journal gleichzeitig
  - Rollback bei Fehler
- **Oder:** Disable Toggle während Operation läuft

**Empfehlung:** Disable Toggle während Operation (einfacher für MVP)

### Risiko 3: GM/Permission Grenzen

**Problem:** User ohne Rechte kann Flags nicht setzen

**Szenario:**
- Player (nicht GM) öffnet Settings-Fenster
- Versucht Journal zu toggeln
- Foundry wirft Permission-Error

**Lösung:**
- **Permission-Check vor Toggle:**
  ```typescript
  const canEdit = journal.canUserModify(game.user);
  if (!canEdit) {
    // Disable Toggle-Button oder Fehler anzeigen
    return;
  }
  ```
- **UI-Feedback:** Disabled-State für Toggle-Buttons ohne Rechte

**Empfehlung:** Permission-Check in Action-Handler, UI zeigt disabled-State

### Risiko 4: Performance bei sehr vielen Journalen

**Problem:** 1000+ Journale können UI langsam machen

**Lösung:**
- **Virtualization** (Phase 2)
- **Lazy Loading:** Nur sichtbare Journale rendern
- **Debounced Search:** Suche nicht bei jedem Keystroke

**Empfehlung:** Für MVP: Einfache Liste (Performance-Optimierung in Phase 2)

### Risiko 5: Hook-Timing

**Problem:** Hook wird gefeuert, bevor Window gerendert ist

**Szenario:**
1. User toggelt Journal (anderes Fenster)
2. Hook wird gefeuert
3. Settings-Fenster ist noch nicht gerendert
4. `applyRemotePatch()` schlägt fehl

**Lösung:**
- **Guard in HookBridge:**
  ```typescript
  if (!controller.isMounted) {
    return; // Ignorieren, Window noch nicht bereit
  }
  ```
- **Oder:** Updates in Queue sammeln, nach Render anwenden

**Empfehlung:** Guard in HookBridge (einfacher)

### Risiko 6: BatchUpdateContextService nur lokal (kritisch für Multi-Client) ⚠️

**Problem:** `BatchUpdateContextService` ist nur in-memory (lokal), andere Clients wissen nicht, dass ein Batch läuft

**Szenario:**
1. Client A: Startet Batch-Update (100 Journale)
2. Client A: `batchContext.addToBatch(...ids)` → Lokal gespeichert
3. Client A: Führt Updates durch → `TriggerJournalDirectoryReRenderUseCase` überspringt Re-renders (lokale Prüfung)
4. **Client B:** Bekommt Flag-Updates via Hooks → Prüft `batchContext.isInBatch()` → **false** (lokaler Service, Batch-Info nicht synchronisiert)
5. **Client B:** Re-rendert Directory **pro Journal** (100x Re-render statt 1x)
6. **Ergebnis:** Performance-Problem auf anderen Clients, inkonsistentes Verhalten

**Lösung: World-Scoped Batch-Setting**

**Strategie:**
1. **Batch-Liste in World-Setting speichern** (alle Clients sehen es)
2. **Alle Clients prüfen Setting vor Re-render** (nicht nur lokaler Service)
3. **Letzter Flag-Update löscht Setting** → Löst finalen Re-render für alle aus

**Implementierung:**

```typescript
// 1. World-Setting für Batch-Liste registrieren
settings.register(MODULE_METADATA.ID, "journalBatchUpdateIds", {
  name: "Journal Batch Update IDs (internal)",
  scope: "world", // WICHTIG: world-scoped für alle Clients
  config: false, // Nicht in UI anzeigen
  type: String, // JSON-String: string[]
  default: "[]"
});

// 2. Batch starten: Setting setzen
const batchIds = ["journal-1", "journal-2", ...];
await settings.set(
  MODULE_METADATA.ID,
  "journalBatchUpdateIds",
  JSON.stringify(batchIds)
);

// 3. TriggerJournalDirectoryReRenderUseCase prüft Setting (nicht nur lokalen Service)
const batchSetting = await settings.get(
  MODULE_METADATA.ID,
  "journalBatchUpdateIds",
  stringSchema
);
const batchIds = JSON.parse(batchSetting.value || "[]");
if (batchIds.includes(journalId)) {
  // Skip Re-render während Batch
  return;
}

// 4. Updates durchführen
for (const id of batchIds) {
  await repository.setFlag(id, ...);
}

// 5. Letzter Update: Setting löschen (leeres Array)
await settings.set(
  MODULE_METADATA.ID,
  "journalBatchUpdateIds",
  "[]"
);
// → settingChange-Hook wird gefeuert → Alle Clients sehen leeres Array
// → TriggerJournalDirectoryReRenderUseCase prüft: nicht mehr im Batch
// → Re-render wird ausgelöst (einmal für alle)
```

**Herausforderungen:**

1. **Race Conditions:**
   - **Problem:** Zwei Clients starten gleichzeitig Batch-Updates
   - **Lösung:** Setting als "Lock" verwenden (nur setzen wenn leer), oder UUID-basierte Batch-IDs

2. **Fehlerbehandlung:**
   - **Problem:** Batch schlägt fehl, Setting bleibt gesetzt
   - **Lösung:** Timeout-Mechanismus (Setting nach X Sekunden automatisch leeren), oder Cleanup bei Fehler

3. **Letzter Update identifizieren:**
   - **Problem:** Wie weiß man, welcher Update der letzte ist?
   - **Lösung A:** Counter im Setting (z.B. `{ ids: [...], remaining: 100 }`)
   - **Lösung B:** Vor jedem Update prüfen: "Bin ich der letzte?" (Race Condition möglich)
   - **Lösung C:** Nach allen Updates explizit Setting löschen (besser)

4. **Setting-Change-Hook:**
   - **Problem:** `settingChange`-Hook muss für alle Clients gefeuert werden
   - **Lösung:** World-Scoped Settings lösen automatisch `settingChange` für alle Clients aus

5. **Performance:**
   - **Problem:** Setting-Read bei jedem Journal-Update (Overhead)
   - **Lösung:** Setting-Value cachen, nur bei `settingChange`-Hook aktualisieren

**⚠️ WICHTIG: Muss VOR Fenster-Implementierung gelöst werden**

**Empfehlung:**
- **M-1 (VORAUSSETZUNG):** World-Scoped Batch-Setting implementieren
- **Begründung:** Fenster-Implementierung (insbesondere Massenaktionen) benötigt funktionierenden Multi-Client-Batch-Service
- **Alternative:** Ohne Fix würde jeder Client einzeln re-rendern → Performance-Problem bei großen Batches

---

## 10. Akzeptanzkriterien (Definition of Done)

### Funktionale Kriterien

- [ ] **Korrekte Liste:** Alle Journale werden angezeigt (inkl. versteckte)
- [ ] **Toggle wirkt global:** Flag-Änderung wird in Foundry gespeichert
- [ ] **Kein Flackern:** UI aktualisiert sich reaktiv, kein ständiges Re-render
- [ ] **Keine Foundry-Renderloops:** `render:false` wird korrekt übergeben
- [ ] **Sync über Fenster/Clients:** Updates von anderen Fenstern/Clients kommen an
- [ ] **Kein Ping-Pong:** Updates aus demselben Window werden ignoriert

### Technische Kriterien

- [ ] **Clean Architecture:** Domain/Application agnostisch, Infrastructure-spezifisch
- [ ] **TypeScript:** Vollständig typisiert, keine `any`
- [ ] **Error Handling:** Alle Fehler werden abgefangen und angezeigt
- [ ] **Performance:** Initial-Load < 1s für 100 Journale

### Test-Kriterien

- [ ] **Unit-Tests:** Action-Handler, State-Management (Coverage > 80%)
- [ ] **Integration-Tests:** Window öffnen, Toggle, Sync (mind. 3 Szenarien)
- [ ] **E2E-Tests:** User-Flow komplett (öffnen → toggle → schließen)

### Dokumentation

- [ ] **README:** Kurze Beschreibung des Features
- [ ] **API-Docs:** WindowDefinition, Actions dokumentiert
- [ ] **Architektur-Doku:** Integration in Dynamic-Window-Framework dokumentiert

---

## Anhang: Referenzen

### Bestehende Services

- `HideJournalContextMenuHandler`: `src/application/handlers/hide-journal-context-menu-handler.ts`
- `ShowAllHiddenJournalsUseCase`: `src/application/use-cases/show-all-hidden-journals.use-case.ts`
- `JournalVisibilityService`: `src/application/services/JournalVisibilityService.ts`
- `FoundryJournalRepositoryAdapter`: `src/infrastructure/adapters/foundry/repository-adapters/foundry-journal-repository-adapter.ts`

### Konstanten

- `MODULE_METADATA.ID`: `"fvtt_relationship_app_module"` (aus `src/application/constants/app-constants.ts`)
- `DOMAIN_FLAGS.HIDDEN`: `"hidden"` (aus `src/domain/constants/domain-constants.ts`)

### Architektur-Dokumentation

- Dynamic-Window-Framework v2.1: `docs/architecture/dynamic-window-framework-v2.1.md`

### Roadmaps

- Multi-Client BatchUpdater: `docs/roadmaps/multi-client-batch-updater.md`

---

**Ende des Umsetzungsplans**
