# Tiefenanalyse: Erweiterbarkeits-Strategie - Strategische Entscheidungen

**Status:** Diskussionsdokument
**Datum:** 2026-01-11
**Kontext:** Langfristige Projektausrichtung - Entscheidungen mit langfristigen Konsequenzen

---

## Einleitung

Diese Analyse untersucht tiefgreifend die Erweiterbarkeits-Strategie für das Relationship Graph Modul. Während die Node-Daten-Erweiterbarkeit bereits analysiert wurde, fehlt noch eine umfassende Betrachtung des Plugin/Module-Systems, der Public API-Strategie und der Extension-Points.

**Wichtige Überlegung:** Erweiterbarkeit ermöglicht Community-Entwicklungen und langfristiges Wachstum. Die Entscheidungen hier prägen die Entwickler-Erfahrung und Community-Adoption.

---

## Aktuelle Situation

### Was ist bereits implementiert/entschieden?

**Node-Erweiterbarkeit:**
- ✅ Analyse vorhanden (siehe `node-data-extension-deep-analysis.md`)
- ✅ Empfehlung: Hybrid-Ansatz (Core-Schema + Extensions)

**Architektur:**
- ✅ Clean Architecture implementiert
- ✅ Port-Adapter-Pattern für Foundry-Kompatibilität
- ✅ DI-Container vorhanden

**Public API:**
- ⚠️ Noch nicht definiert
- ⚠️ Keine klare API-Strategie
- ✅ Deprecation-Mechanismus vorhanden (`deprecated-token.ts`)

**Plugin-System:**
- ⚠️ Noch nicht implementiert
- ⚠️ Keine Extension-Points definiert
- ✅ Registry-Pattern bereits vorhanden (HealthCheckRegistry, RendererRegistry, etc.)

**Code-Referenzen:**
- `src/domain/` - Domain Layer (potentiell erweiterbar)
- `src/application/` - Application Layer
- `src/infrastructure/` - Infrastructure Layer

### Was funktioniert gut/schlecht?

**Gut:**
- ✅ Clean Architecture ermöglicht Erweiterbarkeit
- ✅ Port-Adapter-Pattern ist erweiterbar
- ✅ DI-Container unterstützt Plugins

**Schlecht:**
- ⚠️ Keine klare Public API
- ⚠️ Keine Extension-Points definiert
- ⚠️ Keine Plugin-Registry
- ⚠️ Keine Dokumentation für Erweiterungen

---

## Optionen & Alternativen

### Ansatz 1: Minimal Public API (konservativ)

#### Vollständige Beschreibung

**Prinzip:** Sehr begrenzte Public API, primär für Datenzugriff, keine Plugin-Mechanismen.

**Implementation-Details:**

```typescript
// Minimale Public API
export const RelationshipGraphAPI = {
  // Nur essenzielle Funktionen
  getGraph(pageUuid: string): Promise<GraphModel>,
  // ...
};
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Stabil:** Wenige Breaking Changes
- ✅ **Einfach:** Niedrige Komplexität
- ✅ **Wartbar:** Weniger Code zu warten

**Nachteile:**
- ❌ **Begrenzt:** Kaum Erweiterungsmöglichkeiten
- ❌ **Community:** Schwer für Community-Entwicklungen
- ❌ **Features:** Müssen im Core implementiert werden

---

### Ansatz 2: Extension-Points System (moderat)

#### Vollständige Beschreibung

**Prinzip:** Definierte Extension-Points für Erweiterungen, aber kein vollständiges Plugin-System.

**Implementation-Details:**

```typescript
// Extension-Points
interface ExtensionPoints {
  nodeRenderers: NodeRendererRegistry;
  edgeRenderers: EdgeRendererRegistry;
  nodeValidators: NodeValidatorRegistry;
  // ...
}

// Registrierung
RelationshipGraphAPI.registerExtension('nodeRenderer', myRenderer);
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Kontrolliert:** Definierte Erweiterungsmöglichkeiten
- ✅ **Typsicher:** TypeScript-Unterstützung
- ✅ **Wartbar:** Klare Grenzen

**Nachteile:**
- ❌ **Begrenzt:** Nur definierte Points erweiterbar
- ❌ **Komplexität:** Registry-System nötig

---

### Ansatz 3: Vollständiges Plugin-System (aggressiv)

#### Vollständige Beschreibung

**Prinzip:** Vollständiges Plugin-System mit Plugin-Registry, Lifecycle, Events.

**Implementation-Details:**

```typescript
// Plugin-System
interface Plugin {
  id: string;
  version: string;
  initialize(): void;
  onGraphLoaded?(graph: GraphModel): void;
  // ...
}

// Registrierung
RelationshipGraphAPI.registerPlugin(myPlugin);
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Mächtig:** Maximale Erweiterbarkeit
- ✅ **Community:** Ermöglicht komplexe Erweiterungen
- ✅ **Flexibel:** Vielseitige Anwendungen

**Nachteile:**
- ❌ **Komplex:** Hohe Komplexität
- ❌ **Wartung:** Viel Code zu warten
- ❌ **Breaking Changes:** Höheres Risiko

---

## Public API Strategie

### Option A: Stable API (Semantic Versioning)

**Prinzip:** Public API mit Semantic Versioning, Breaking Changes nur bei Major-Versionen.

**Vorteile:**
- Vorhersehbare Breaking Changes
- Stabile API für Community

**Nachteile:**
- Langsamere Evolution

### Option B: Evolving API (Frequent Changes)

**Prinzip:** API kann sich häufig ändern, Breaking Changes möglich.

**Vorteile:**
- Schnellere Evolution
- Mehr Flexibilität

**Nachteile:**
- Frustration für Community
- Häufige Updates nötig

### Option C: Internal API + Public Subset

**Prinzip:** Interne API kann sich ändern, Public Subset bleibt stabil.

**Vorteile:**
- Balance zwischen Stabilität und Flexibilität
- Interne Evolution möglich

**Nachteile:**
- Zwei API-Ebenen zu warten

---

## Offene Fragen & Entscheidungspunkte

### 1. Plugin-System-Strategie

**Frage:** Wie aggressiv soll Erweiterbarkeit sein?

**Optionen:**
- A: Minimal (konservativ)
- B: Extension-Points (moderat)
- C: Vollständiges Plugin-System (aggressiv)

**Entscheidungspunkt:** Welche Strategie?

---

### 2. Public API-Strategie

**Frage:** Wie soll die Public API verwaltet werden?

**Optionen:**
- A: Stable API (Semantic Versioning)
- B: Evolving API (Frequent Changes)
- C: Internal + Public Subset

**Entscheidungspunkt:** Welche Strategie?

---

### 3. Extension-Points

**Frage:** Welche Extension-Points sollen angeboten werden?

**Empfehlung - Konkrete Bereiche:**

1. **Window-System:**
   - Renderer-Registry (bereits vorhanden als Pattern)
   - Window-Definition-Registry
   - Custom Controls/Actions in Window-Definitions

2. **Graph-Editor:**
   - Node/Edge-Renderer (Custom Visualisierungen für Node-Typen)
   - Layout-Algorithmen (Custom Layouts)
   - Filter/Clustering (Custom Filter-Logik)

3. **Validierung/Transformation:**
   - Node/Edge-Validatoren (Custom Validation-Rules)
   - Graph-Transformation (Pre/Post-Processing bei Load/Save)

4. **Health-Checks:**
   - HealthCheckRegistry (bereits vorhanden als Beispiel für Registry-Pattern)

**Bereiche, wo Extension-Points NICHT nötig sind:**
- Core-Datenmodell (Node/Edge-Struktur) - nutzt bereits Extensions-Pattern
- Foundry-Ports (bereits abstrahiert durch Port-Adapter-Pattern)
- Caching (intern, keine Erweiterung nötig)

**✅ Entscheidung: Automatisch durch Service-Exposure**

**Klarstellung:**
- Extension-Points sind automatisch verfügbar, sobald der entsprechende Service in der API exposed ist
- Sobald ein Service fertig ist: 1) Im Composition Root verdrahten, 2) In der API exposed machen → Extension-Point ist verfügbar
- Registry-Methoden (`registerServiceOverride`, `registerServiceExtension`) sind einmalig in der API vorhanden
- Keine separate Priorisierung nötig - ergibt sich automatisch aus der Service-Implementierung

---

## Empfehlung & Begründung

### Empfehlung: Extension-Points System (moderat) + Stable Public API

**Komponenten:**
1. **Extension-Points:** Definierte Registry-basierte Extension-Points
   - Window-System (Renderer, Controls, Actions)
   - Graph-Editor (Node/Edge-Renderer, Layouts, Filter)
   - Validierung/Transformation (Validatoren, Pre/Post-Processing)
2. **Public API:** Stable API mit Semantic Versioning
3. **Plugin-Registry:** Einfache Registry für Erweiterungen (Pattern bereits vorhanden)
4. **Deprecation-Mechanismus:** Bereits vorhanden (`deprecated-token.ts`) für API-Evolution

**Begründung:**

**Für MVP:**
- ✅ Extension-Points sind ausreichend für erste Erweiterungen
- ✅ Registry-Pattern bereits vorhanden (HealthCheckRegistry, etc.)
- ✅ Nicht zu komplex (kein vollständiges Plugin-System)
- ✅ Klare Grenzen für Wartbarkeit
- ✅ Deprecation-Mechanismus vorhanden für sichere API-Evolution

**Für Langzeit:**
- ✅ Kann zu Plugin-System erweitert werden
- ✅ Stable API gibt Community Sicherheit
- ✅ Extension-Points ermöglichen kontrollierte Erweiterungen
- ✅ Deprecation-Mechanismus ermöglicht schrittweise API-Änderungen

**Risiken:**
- ⚠️ Extension-Points können begrenzt sein
- ⚠️ Public API kann sich langsam entwickeln
- ⚠️ Registry-System benötigt Wartung

**Mitigation:**
- **Erweiterbare Extension-Points:** Neue Points können hinzugefügt werden
- **API-Evolution:** Post-MVP kann API erweitert werden (mit Deprecation-Mechanismus)
- **Dokumentation:** Klare Dokumentation für Extension-Points
- **Registry-Pattern wiederverwenden:** Bestehende Registry-Patterns nutzen

**Abweichungskriterien:**
- Wenn Extension-Points zu begrenzt → Plugin-System evaluieren
- Wenn Public API zu restriktiv → Evolving API evaluieren

---

## Nächste Schritte

1. **Extension-Points definieren:** Welche Points sind nötig?
2. **Registry-System:** Extension-Registry implementieren
3. **Public API:** API-Definition erstellen
4. **Dokumentation:** Extension-Guide schreiben
5. **Beispiele:** Beispiel-Erweiterungen erstellen

---

## Referenzen

- [Node-Daten-Erweiterbarkeit Analyse](./node-data-extension-deep-analysis.md)
- `src/domain/` - Domain Layer
- `src/application/` - Application Layer
