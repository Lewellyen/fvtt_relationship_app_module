# Roadmap-Varianten-Analyse: Variante 1 vs. Variante 2

**Zweck:** Vergleichsanalyse der beiden MVP-Roadmap-Varianten
**Zielgruppe:** Maintainer, Architekten, Entscheider
**Letzte Aktualisierung:** 2026-01-XX
**Projekt-Version:** 0.55.3 → MVP (1.0.0)

---

## Übersicht

Diese Analyse vergleicht die beiden vorgeschlagenen Roadmap-Varianten für das MVP der Beziehungsnetzwerk-Funktionalität:

- **Variante 1:** Einfache Graph-Struktur mit globaler Aggregation
- **Variante 2:** Wissensobjekt-Modell mit Node/Graph-Trennung und Player-Kollaboration
- **Basis:** Variante 2 basiert auf [Lastenheft v1](../ideas/lastenheft%20v1.md)

---

## Kernunterschiede

### 1. Datenmodell-Architektur

#### Variante 1: Einfache Graph-Struktur

**Konzept:**
- **Ein Page Type:** `relationship_app_graph`
- Graph enthält Nodes + Edges direkt
- Nodes referenzieren Foundry-Entitäten (Actor, Journal, etc.)
- Einfache Struktur: `GraphData { nodes, edges, metadata }`

**Struktur:**
```
Journal
  └── JournalEntryPage (type: "relationship_app_graph")
       └── GraphData {
             nodes: GraphNode[],  // Referenzen zu Foundry-Entitäten
             edges: GraphEdge[],
             metadata: GraphMetadata
           }
```

#### Variante 2: Wissensobjekt-Modell (Tabellenmodell)

**Konzept:**
- **Zwei Page Types:** `relationship_app_node` + `relationship_app_graph`
- Nodes sind eigenständige Wissensobjekte mit reichhaltigen Metadaten
- Graphs referenzieren Nodes über Keys
- Trennung: Wissensobjekt-Daten (Node) vs. Beziehungsstruktur (Graph)

**Struktur:**
```
Journal
  ├── JournalEntryPage (type: "relationship_app_node")
  │    └── RelationshipNodeData {
  │          nodeKey, name, kind, factionId,
  │          relation, descriptions, reveal, effects, ...
  │        }
  └── JournalEntryPage (type: "relationship_app_graph")
       └── RelationshipGraphData {
             graphKey, nodeKeys[], edges[], layout
           }
```

**Unterschied:**
- ✅ **V2:** Reichhaltiges Datenmodell (Lastenheft-basiert)
- ✅ **V2:** Trennung von Daten (Node) und Struktur (Graph)
- ✅ **V1:** Einfacher, direkter Ansatz
- ⚠️ **V1:** Weniger Metadaten pro Node

---

### 2. Scope & Features

#### Variante 1

**Im MVP:**
- ✅ Globale Zusammensicht (Aggregation aller Teilnetzwerke)
- ✅ Einfache Graph-Struktur
- ✅ Dual Editor (UI + Text)
- ✅ Berechtigungen (Foundry-Standard)

**Nicht im MVP:**
- ❌ Player-Kollaboration
- ❌ Overlay-System
- ❌ Erweiterte Metadaten (Art, Fraktion, etc.)

#### Variante 2

**Im MVP:**
- ✅ Node-Datenmodell nach Lastenheft (Art, Fraktion, Verhältnis, Beschreibungen)
- ✅ Player View + Overlay (Kollaboration)
- ✅ Autosave (debounced)
- ✅ Wissens-Level-System (public/hidden/secret)
- ✅ Dual Editor (UI + Text)

**Nicht im MVP:**
- ❌ Globale Aggregation (Post-MVP: v1.1+)
- ❌ Karten-Pins / Scene-Integration
- ❌ Fraktions-Editor

**Unterschied:**
- ✅ **V2:** Fokussiert auf Player-Kollaboration und Wissensobjekt-Modell
- ✅ **V1:** Fokussiert auf globale Übersicht und einfache Struktur
- ⚠️ **V2:** Komplexeres Datenmodell, aber besser für Wissensverwaltung
- ⚠️ **V1:** Einfacher, aber weniger Features für Kollaboration

---

### 3. Player-Kollaboration

#### Variante 1

**Ansatz:**
- Alle Spieler können verwalten (mit Foundry-Berechtigungen)
- Keine Unterscheidung zwischen GM-Master-Daten und Player-Ergänzungen
- Einfaches Berechtigungsmodell

**Nachteile:**
- ❌ Keine Player-spezifischen Ergänzungen
- ❌ Keine Freigabe-Kontrolle (public/hidden/secret)
- ❌ Master-Daten können von Spielern verändert werden

#### Variante 2

**Ansatz:**
- **Master-Daten:** GM pflegt Nodes/Graphs
- **Player Overlay:** Spieler können eigene Notes ergänzen (Delta-only)
- **Freigabe-System:** Nodes/Edges haben `reveal` und `knowledge`-Level
- **Filterung:** Player sehen nur freigegebenes Wissen

**Vorteile:**
- ✅ Master-Daten geschützt (GM-only)
- ✅ Player können persönliche Notizen hinzufügen
- ✅ Granulare Freigabe-Kontrolle
- ✅ Keine Daten-Leaks (harte Filterung)

**Nachteile:**
- ⚠️ Komplexeres System (Master + Overlay)
- ⚠️ Overlay-Storage muss implementiert werden

**Unterschied:**
- ✅ **V2:** Professionelles Kollaborationsmodell
- ✅ **V1:** Einfacher, aber weniger kontrolliert

---

### 4. Autosave & Datenpersistenz

#### Variante 1

**Ansatz:**
- Explizites Speichern (User-Trigger)
- Kein Autosave geplant

**Nachteile:**
- ❌ Datenverlust bei Browser-Crash möglich
- ❌ Layout-Änderungen müssen manuell gespeichert werden

#### Variante 2

**Ansatz:**
- **Autosave (debounced):** Layout + Struktur
- **Layout:** on dragend + debounce
- **Struktur:** debounced bei Änderungen

**Vorteile:**
- ✅ Datenverlust vermieden
- ✅ Bessere UX (kein "Speichern"-Button nötig)
- ✅ Debouncing verhindert zu häufige Saves

**Unterschied:**
- ✅ **V2:** Professioneller Umgang mit Datenverlust
- ⚠️ **V1:** Einfacher, aber riskanter

---

### 5. Marker-Flags (Performance-Optimierung)

#### Variante 1

**Ansatz:**
- Keine Marker-Flags geplant
- Queries müssen alle Pages durchsuchen

**Nachteile:**
- ❌ Langsamere Queries (alle Pages scannen)
- ❌ Keine schnelle Prüfung "enthält Graph-Daten?"

#### Variante 2

**Ansatz:**
- **Marker-Flags:** `hasRelationshipNode/Graph` am JournalEntry/Page
- Flags nur als Marker (kein Index im MVP)
- Schnelle Prüfung ohne alle Pages zu laden

**Vorteile:**
- ✅ Schnellere Queries (Filter über Flags)
- ✅ Best-Effort-Optimierung (optional, nicht kritisch)

**Unterschied:**
- ✅ **V2:** Performance-Optimierung berücksichtigt
- ⚠️ **V1:** Einfacher, aber langsamer bei vielen Pages

---

### 6. Zeitplan & Aufwand

#### Variante 1

**Phasen:** 7 Phasen über 8 Wochen
- Phase 1-2: Foundation & Infrastructure (3 Wochen)
- Phase 3: Application Layer (1 Woche)
- Phase 4: UI (2 Wochen)
- Phase 5: Integration & Global View (1 Woche)
- Phase 6-7: Testing & Docs (1 Woche)

**Aufwand:** ~8 Wochen (1 Entwickler, Vollzeit)

#### Variante 2

**Phasen:** 6 Phasen (keine explizite Zeitangabe)
- Phase 1: Foundation (Document Types, Schemas)
- Phase 2: Infrastructure (Adapters, DI)
- Phase 3: Application (UseCases, Services)
- Phase 4: UI (Graph Editor, Dual Editor, Autosave)
- Phase 5: Player View + Overlay
- Phase 6: MVP Hardening

**Geschätzter Aufwand:** ~8-10 Wochen (1 Entwickler, Vollzeit)
- Komplexeres Datenmodell (+1 Woche)
- Overlay-System (+1 Woche)
- Player-View-Filterung (+0.5 Woche)
- Autosave-Implementierung (+0.5 Woche)

**Unterschied:**
- ⚠️ **V2:** Etwas mehr Aufwand (komplexeres Datenmodell, Overlay)
- ✅ **V1:** Schneller umsetzbar

---

## Vergleichsmatrix

| Kriterium | Variante 1 | Variante 2 | Gewinner |
|-----------|------------|------------|----------|
| **Datenmodell-Komplexität** | ⭐⭐ Einfach | ⭐⭐⭐⭐ Komplex | V1 (einfacher) |
| **Wissensobjekt-Modell** | ❌ Kein reichhaltiges Modell | ✅ Lastenheft-basiert | V2 |
| **Player-Kollaboration** | ⭐⭐ Einfach (alle verwalten) | ⭐⭐⭐⭐⭐ Professionell (Master+Overlay) | V2 |
| **Globale Aggregation** | ✅ Im MVP | ❌ Post-MVP | V1 |
| **Autosave** | ❌ Nicht geplant | ✅ Debounced Autosave | V2 |
| **Marker-Flags** | ❌ Nicht geplant | ✅ Performance-Optimierung | V2 |
| **Freigabe-Kontrolle** | ⭐⭐ Foundry-Standard | ⭐⭐⭐⭐⭐ Granular (reveal/knowledge) | V2 |
| **Implementierungsaufwand** | ⭐⭐⭐⭐⭐ ~8 Wochen | ⭐⭐⭐ ~8-10 Wochen | V1 (schneller) |
| **Wartbarkeit** | ⭐⭐⭐⭐ Einfach | ⭐⭐⭐ Komplexer | V1 |
| **Erweiterbarkeit** | ⭐⭐⭐ Gut | ⭐⭐⭐⭐⭐ Sehr gut (Schema-Versioning) | V2 |
| **UX (GM)** | ⭐⭐⭐⭐ Gut | ⭐⭐⭐⭐⭐ Sehr gut | V2 |
| **UX (Player)** | ⭐⭐⭐ OK | ⭐⭐⭐⭐⭐ Sehr gut (Overlay, Filterung) | V2 |

---

## Empfehlungen nach Use Case

### Empfehlung für Variante 1, wenn:

✅ **Priorität: Schnelle MVP-Freigabe**
- MVP soll schnell verfügbar sein
- Einfache Graph-Struktur reicht aus
- Globale Übersicht ist wichtig

✅ **Priorität: Einfache Wartbarkeit**
- Codebase soll einfach bleiben
- Weniger Komplexität = weniger Bugs

✅ **Priorität: Flexibilität**
- Datenmodell kann später erweitert werden
- Fokus auf Kernfunktionalität (Graph-Visualisierung)

### Empfehlung für Variante 2, wenn:

✅ **Priorität: Professionelle Kollaboration**
- Player-Kollaboration ist zentral
- Granulare Freigabe-Kontrolle notwendig
- Master-Daten müssen geschützt werden

✅ **Priorität: Wissensobjekt-Verwaltung**
- Reichhaltiges Datenmodell notwendig (Lastenheft)
- Trennung von Daten (Node) und Struktur (Graph) wichtig
- Art, Fraktion, Verhältnis, Beschreibungen benötigt

✅ **Priorität: UX & Datenverlust-Vermeidung**
- Autosave ist wichtig
- Player-Overlay für persönliche Notizen
- Professionelle Freigabe-Mechanismen

✅ **Priorität: Langfristige Architektur**
- Schema-Versioning für zukünftige Erweiterungen
- Saubere Trennung (Node/Graph)
- Erweiterbarkeit wichtiger als Einfachheit

---

## Hybrid-Empfehlung

### Option: Variante 2 Basis + Variante 1 Ergänzungen

**Kern:** Variante 2 (Node/Graph-Trennung, Player-Kollaboration)

**Ergänzungen aus Variante 1:**
- Globale Aggregation bereits im MVP (nicht Post-MVP)
- Marker-Flags optional (Performance-Optimierung)

**Begründung:**
- Variante 2 bietet bessere Grundlage für professionelles System
- Globale Aggregation ist relativ einfach (Use Case aus V1)
- Beste aus beiden Welten kombinieren

**Aufwand:** ~9-10 Wochen (1 Entwickler, Vollzeit)

---

## Kritische Entscheidungspunkte

### 1. Player-Kollaboration notwendig?

**Frage:** Sollen Spieler eigene Notizen ergänzen können, oder reicht gemeinsames Bearbeiten?

- **Ja → Variante 2:** Overlay-System notwendig
- **Nein → Variante 1:** Einfacheres Modell reicht

### 2. Wissensobjekt-Modell notwendig?

**Frage:** Reicht einfache Entity-Referenz, oder braucht man Art/Fraktion/Verhältnis/Beschreibungen?

- **Ja → Variante 2:** Node-Data-Modell notwendig
- **Nein → Variante 1:** Einfache Referenzen reichen

### 3. Globale Aggregation im MVP?

**Frage:** Soll globale Zusammensicht im MVP enthalten sein?

- **Ja → Variante 1 oder Hybrid:** Aggregation notwendig
- **Nein → Variante 2:** Post-MVP ist ok

### 4. Autosave notwendig?

**Frage:** Ist Autosave für Datenverlust-Vermeidung wichtig?

- **Ja → Variante 2:** Autosave implementieren
- **Nein → Variante 1:** Explizites Speichern reicht

---

## Fazit

### Variante 1: Einfach & Schnell

**Stärken:**
- ✅ Schnell umsetzbar (~8 Wochen)
- ✅ Einfache Architektur
- ✅ Globale Aggregation im MVP
- ✅ Gute Wartbarkeit

**Schwächen:**
- ❌ Keine Player-Kollaboration
- ❌ Kein reichhaltiges Datenmodell
- ❌ Kein Autosave
- ❌ Weniger Features für professionelle Nutzung

**Geeignet für:**
- Schnelles MVP
- Einfache Graph-Visualisierung
- Wenn Player-Kollaboration nicht kritisch ist

---

### Variante 2: Professionell & Feature-Reich

**Stärken:**
- ✅ Professionelles Kollaborationsmodell
- ✅ Reichhaltiges Datenmodell (Lastenheft)
- ✅ Autosave verhindert Datenverlust
- ✅ Granulare Freigabe-Kontrolle
- ✅ Gute Erweiterbarkeit (Schema-Versioning)

**Schwächen:**
- ❌ Komplexere Architektur
- ❌ Längere Implementierungszeit (~8-10 Wochen)
- ❌ Globale Aggregation erst Post-MVP
- ❌ Höhere Wartungskosten

**Geeignet für:**
- Professionelles Wissensmanagement
- Player-Kollaboration erforderlich
- Langfristige Architektur-Planung
- Wenn Lastenheft-Anforderungen erfüllt werden müssen

---

### Lastenheft-Erfüllungsanalyse

**Basis:** [Lastenheft v1](../ideas/lastenheft%20v1.md) definiert ein Tabellenmodell mit:
- Name/Bezeichnung, Art (Person/Ort/Gegenstand), Fraktion, Verhältnis (Freund/Feind/Neutral)
- Bild/Icon, Beschreibungen (Public/Hidden/GM)
- Auswirkungen im Spiel (freundlich/feindlich/neutral)
- Verbindungen mit Wissens-Level (Allgemeinwissen/Verborgenes Wissen/Geheimwissen)

#### Variante 1 vs. Lastenheft

**Erfüllt:**
- ✅ Graph-Visualisierung (Netzplan)
- ❌ Kein Tabellenmodell
- ❌ Keine reichhaltigen Node-Metadaten (Art, Fraktion, Verhältnis, Beschreibungen)
- ❌ Keine Auswirkungen im Spiel
- ❌ Keine granularer Freigabe-Kontrolle (nur Foundry-Standard)

**Erfüllungsgrad:** ~30% der Lastenheft-Anforderungen

#### Variante 2 vs. Lastenheft

**Erfüllt (MVP):**
- ✅ Graph-Visualisierung (Netzplan)
- ✅ Node-Datenmodell mit Art (`kind: "person" | "place" | "object"`)
- ✅ Fraktion (`factionId`)
- ✅ Verhältnis (`relation: "friend" | "enemy" | "neutral"`)
- ✅ Icon (`icon`)
- ✅ Beschreibungen (`descriptions: { public, hidden, gm }`)
- ✅ Auswirkungen (`effects: { friend, enemy, neutral }`)
- ✅ Wissens-Level (`knowledge: "public" | "hidden" | "secret"`)
- ✅ Granulare Freigabe (`reveal: { public, hidden }`)
- ✅ Player-View mit Filterung

**Nicht im MVP (Post-MVP):**
- ❌ Tabellenansicht (nur Netzplan im MVP)
- ❌ Hauptknotenpunkte mit Unternoten (Vererbung)
- ❌ Fraktions-Editor (CRUD UI)
- ❌ Karten-Pins / Scene-Integration
- ❌ Auswirkungs-Automation (Economy)

**Erfüllungsgrad:** ~70% der Lastenheft-Anforderungen im MVP, ~90% inkl. Post-MVP

**Fazit:** Variante 2 erfüllt die Kernanforderungen des Lastenhefts deutlich besser als Variante 1.

---

### Empfehlung

**Für MVP:** **Variante 2 (mit Hybrid-Ergänzungen)**

**Begründung:**
1. **Lastenheft-Anforderungen:** Variante 2 erfüllt das Lastenheft deutlich besser (70% vs. 30%)
   - Wissensobjekt-Modell mit allen erforderlichen Feldern (Art, Fraktion, Verhältnis, Beschreibungen, Auswirkungen)
   - Granulare Freigabe-Kontrolle (public/hidden/secret)
   - Player-View mit Filterung
2. **Player-Kollaboration:** Professionelles System für Langzeitnutzung
3. **Erweiterbarkeit:** Schema-Versioning ermöglicht zukünftige Anpassungen
4. **UX:** Autosave und Overlay verbessern die Nutzererfahrung erheblich

**Kompensationsvorschlag:**
- Globale Aggregation in Phase 3 oder 4 ergänzen (nicht Post-MVP)
- Marker-Flags optional implementieren (Performance-Optimierung)

**Ergebnis:** Professionelles System, das den Anforderungen des Lastenhefts entspricht und langfristig wartbar ist.

---

## Lastenheft-Mapping (Detailliert)

### Lastenheft-Anforderungen vs. Variante 2 MVP

| Lastenheft-Anforderung | Variante 2 MVP | Status | Notizen |
|------------------------|----------------|--------|---------|
| **Name/Bezeichnung** | `name: string` | ✅ | Direkt erfüllt |
| **Art (Person/Ort/Gegenstand)** | `kind: "person" \| "place" \| "object"` | ✅ | Direkt erfüllt |
| **Fraktion** | `factionId?: string` | ✅ | ID-Referenz (Editor Post-MVP) |
| **Verhältnis (Freund/Feind/Neutral)** | `relation: "friend" \| "enemy" \| "neutral"` | ✅ | Direkt erfüllt |
| **Bild/Icon** | `icon?: string` | ✅ | Optional, Path-String |
| **Beschreibungen (Public/Hidden/GM)** | `descriptions: { public?, hidden?, gm? }` | ✅ | Direkt erfüllt |
| **Auswirkungen (freundlich/feindlich/neutral)** | `effects?: { friend?, enemy?, neutral? }` | ✅ | Optional, Text-String (Automatisierung Post-MVP) |
| **Verbindungen (Wissens-Level)** | `edges[].knowledge: "public" \| "hidden" \| "secret"` | ✅ | Direkt erfüllt |
| **Freigabe-Kontrolle** | `reveal: { public, hidden }` | ✅ | Granulare Kontrolle |
| **Eingabe im Netzknoten** | Graph Editor (Cytoscape) | ✅ | UI-Editor |
| **Eingabe in Tabelle** | ❌ | Post-MVP | Nur Graph-View im MVP |
| **Wechsel Tabellen/Netzplan** | ❌ | Post-MVP | Nur Netzplan im MVP |
| **Hauptknoten mit Unternoten** | ❌ | Post-MVP | Vererbung nicht im MVP |
| **Fraktionen anlegen/ändern** | ❌ | Post-MVP | Nur ID-Referenz im MVP |
| **Farben zuordnen** | ❌ | Post-MVP | Cytoscape-Default im MVP |
| **Karten-Pins** | ❌ | Post-MVP | Scene-Integration später |
| **SL-Freigabe (Stück für Stück)** | ✅ | ✅ | Granulare Freigabe (`reveal`) |

**Erfüllungsgrad:** 11/18 Anforderungen im MVP (~61%), 15/18 inkl. Post-MVP (~83%)

---

## Nächste Schritte

1. **Entscheidung:** Variante 1, Variante 2, oder Hybrid?
2. **Anpassungen:** Falls Hybrid → Roadmap entsprechend anpassen
3. **ADR erstellen:** Architecture Decision Record für gewählte Variante
4. **Roadmap finalisieren:** Detaillierte Tasks für gewählte Variante
5. **Lastenheft-Review:** Überprüfung, ob MVP-Scope mit Lastenheft-Anforderungen übereinstimmt

---

**Letzte Aktualisierung:** 2026-01-XX
