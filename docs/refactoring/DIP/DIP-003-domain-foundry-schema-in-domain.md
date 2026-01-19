---
id: DIP-003
prinzip: DIP
schweregrad: hoch
layer: domain
status: Proposed
reviewed: 2026-01-19
relevance: still-relevant
notes: Evidence verified in `src/domain/types/relationship-graph-data.interface.ts` and `src/domain/types/relationship-node-data.interface.ts` (foundry.data.fields.*).
---

# 1. Problem
Die Domain-Modelle fuer Relationship Graph/Node enthalten Foundry DataSchema Typen. Damit haengt die Domain direkt vom Foundry Framework ab und verliert Plattform-Unabhaengigkeit. Das erschwert Tests, Wiederverwendbarkeit und Migration auf andere Plattformen.

# 2. Evidence (Belege)
`src/domain/types/relationship-graph-data.interface.ts`:
```
type GraphEdgeField = foundry.data.fields.SchemaField<{
  id: foundry.data.fields.StringField;
  source: foundry.data.fields.StringField;
  target: foundry.data.fields.StringField;
  knowledge: foundry.data.fields.StringField;
  label: foundry.data.fields.StringField;
}>;
...
export interface RelationshipGraphDataSchema extends foundry.data.fields.DataSchema {
  schemaVersion: foundry.data.fields.NumberField;
  graphKey: foundry.data.fields.StringField;
  nodeKeys: foundry.data.fields.ArrayField<foundry.data.fields.StringField>;
  edges: foundry.data.fields.ArrayField<GraphEdgeField>;
  layout: GraphLayoutField;
  lastVersion: GraphLastVersionField;
}
```

`src/domain/types/relationship-node-data.interface.ts`:
```
type NodeDescriptionsField = foundry.data.fields.SchemaField<{
  public: foundry.data.fields.StringField;
  hidden: foundry.data.fields.StringField;
  gm: foundry.data.fields.StringField;
}>;
...
export interface RelationshipNodeDataSchema extends foundry.data.fields.DataSchema {
  schemaVersion: foundry.data.fields.NumberField;
  nodeKey: foundry.data.fields.StringField;
  name: foundry.data.fields.StringField;
  kind: foundry.data.fields.StringField;
  factionId: foundry.data.fields.StringField;
  relation: foundry.data.fields.StringField;
  icon: foundry.data.fields.StringField;
  descriptions: NodeDescriptionsField;
  reveal: NodeRevealField;
  effects: NodeEffectsField;
  linkedEntityUuid: foundry.data.fields.StringField;
  lastVersion: NodeLastVersionField;
}
```

# 3. SOLID-Analyse
Verstoss gegen DIP: High-level Domain-Modelle sollen nicht von Low-level Framework-Typen (Foundry) abhaengen. Folge: Domain kann nicht ohne Foundry gebaut/validiert werden, Type-Checks koppeln an globale `foundry` Typen, und Platform-Schemas werden zu Domain-Contracts.

# 4. Zielbild
Domain enthaelt nur plattform-agnostische Modelle (`RelationshipGraphData`, `RelationshipNodeData`). Foundry-spezifische Schema-Definitionen liegen in Infrastructure/Framework und mappen auf Domain-Modelle.

# 5. Loesungsvorschlag
**Approach A (empfohlen):**
- Verschiebe `RelationshipGraphDataSchema`/`RelationshipNodeDataSchema` nach `src/infrastructure/adapters/foundry/schemas`.
- Fuehre Mapper ein (Domain <-> Foundry DataSchema).
- Domain exportiert nur reine Datenstrukturen ohne Foundry-Typen.

**Approach B (Alternative):**
- Erzeuge separate `platform`-Layer-Typen (z.B. `src/framework/foundry/schema`) und lass Infrastructure darauf zugreifen.
- Domain kennt nur `SchemaVersion` und Validierungsports.

Trade-offs: Mehr Mappings/Boilerplate, aber klare Layer-Grenzen und testbare Domain.

# 6. Refactoring-Schritte
1. Neue Schema-Dateien in Infrastructure anlegen und Foundry-Typen dorthin verschieben.
2. Domain-Typen bereinigen (entferne `foundry.data.fields` aus Domain).
3. Mapper/Adapter fuer Schema-zu-Domain und Domain-zu-Schema einfuehren.
4. Alle Imports in Infrastructure/Framework aktualisieren.
5. Type-Checks und Tests anpassen.

# 7. Beispiel-Code
**Before (Domain):**
```
export interface RelationshipNodeDataSchema extends foundry.data.fields.DataSchema { ... }
```

**After (Infrastructure):**
```
export interface RelationshipNodeDataSchema extends foundry.data.fields.DataSchema { ... }
export function toDomainNodeData(schemaData: unknown): RelationshipNodeData { ... }
```

# 8. Tests & Quality Gates
- Type-Check fuer Domain ohne Foundry Types.
- Adapter-Tests fuer Schema-Mapping.
- Migration-Tests, die Domain-Validierung ohne Foundry verwenden.

# 9. Akzeptanzkriterien
- `src/domain/**` importiert keine `foundry.*` Typen mehr.
- Foundry DataSchema Typen existieren nur in Infrastructure/Framework.
- Domain-Tests laufen ohne Foundry Typendefinitionen.
