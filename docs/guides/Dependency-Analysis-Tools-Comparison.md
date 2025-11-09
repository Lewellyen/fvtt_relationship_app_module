# Dependency-Analyse-Tools - Vergleich & Bewertung

Dieser Vergleich hilft bei der Auswahl des optimalen Dependency-Analyse-Tools für das Projekt.

## Inhaltsverzeichnis

1. [Optionen im Überblick](#optionen-im-überblick)
2. [Detaillierter Vergleich](#detaillierter-vergleich)
3. [Projekt-spezifische Bewertung](#projekt-spezifische-bewertung)
4. [Empfehlung](#empfehlung)
5. [Implementierungsbeispiele](#implementierungsbeispiele)

---

## Optionen im Überblick

| Tool | Typ | Komplexität | TypeScript | DI-Support | Ausgabe | Maintenance |
|------|-----|-------------|-----------|------------|---------|-------------|
| **madge** | CLI | Niedrig | ✅ | ❌ | SVG, DOT, JSON | Aktiv |
| **dependency-cruiser** | CLI | Mittel | ✅ | ⚠️ | SVG, DOT, JSON, HTML | Sehr aktiv |
| **ts-morph + Custom** | Script | Hoch | ✅ | ✅ | Custom (Mermaid) | Self-maintained |
| **nx graph** | Framework | Hoch | ✅ | ❌ | Interactive Web | Sehr aktiv |
| **TypeDoc + Plugin** | Docs | Mittel | ✅ | ❌ | HTML Docs | Aktiv |

---

## Detaillierter Vergleich

### 1. madge

#### Beschreibung
Einfaches, schnelles CLI-Tool für JavaScript/TypeScript Dependency-Graphen.

#### Installation
```bash
npm install -D madge
```

#### Verwendung
```bash
# Dependency-Graph als SVG
npx madge --image docs/dependency-graph.svg src/

# Zirkuläre Dependencies finden
npx madge --circular src/

# Als JSON für weitere Verarbeitung
npx madge --json src/ > dependencies.json

# Nur bestimmte Dateien
npx madge src/services/
```

#### Vorteile ✅
- **Einfach zu verwenden** - keine Konfiguration nötig
- **Schnell** - analysiert große Codebases in Sekunden
- **Mehrere Ausgabeformate** - SVG, DOT, JSON, PlantUML
- **Zirkuläre Dependency-Erkennung** - findet problematische Abhängigkeiten
- **Gut dokumentiert** - viele Beispiele
- **Leichtgewichtig** - kleine Dependency-Footprint

#### Nachteile ❌
- **Keine DI-Awareness** - erkennt nur `import`/`require`, nicht `static dependencies`
- **Statische Analyse** - versteht keine Dependency Injection
- **Basis-Visualisierung** - einfache Graphen ohne Gruppierung
- **Keine Service-Token-Erkennung** - versteht dein Token-System nicht
- **Flache Struktur** - keine Schichten (Core/App/Infrastructure)

#### Projekt-Fit: ⭐⭐⭐☆☆ (3/5)
**Gut für**: Schnelle Übersicht über Import-Abhängigkeiten  
**Nicht gut für**: DI-Container-Analyse, Service-Lifecycle-Tracking

---

### 2. dependency-cruiser

#### Beschreibung
Mächtiges Dependency-Analyse-Tool mit Regelvalidierung und flexibler Konfiguration.

#### Installation
```bash
npm install -D dependency-cruiser
```

#### Verwendung
```bash
# Initialisierung mit Config
npx depcruise --init

# Graph erstellen
npx depcruise src/ --output-type dot | dot -T svg > docs/dependency-graph.svg

# Mit Custom-Regeln
npx depcruise src/ --validate

# Als interaktiver Report
npx depcruise src/ --output-type html > dependency-report.html
```

#### Konfigurationsbeispiel `.dependency-cruiser.js`
```javascript
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies are not allowed',
      from: {},
      to: { circular: true }
    },
    {
      name: 'no-utils-to-services',
      comment: 'Utils should not depend on services',
      severity: 'error',
      from: { path: '^src/utils' },
      to: { path: '^src/services' }
    },
    {
      name: 'layering',
      comment: 'Services should not depend on application layer',
      severity: 'error',
      from: { path: '^src/foundry/services' },
      to: { path: '^src/services/[^/]+\\.ts$' }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    }
  }
};
```

#### Vorteile ✅
- **Regelvalidierung** - definiere Architektur-Constraints
- **Sehr konfigurierbar** - granulare Kontrolle über Analyse
- **Mehrere Ausgabeformate** - DOT, SVG, JSON, HTML, Mermaid (!)
- **TypeScript-Integration** - nutzt tsconfig.json
- **Layering-Support** - kann Schichten validieren
- **CI/CD-Integration** - Exit-Codes für Violations
- **Detaillierte Reports** - zeigt Violations mit Context

#### Nachteile ❌
- **Komplexe Konfiguration** - Lernkurve erforderlich
- **Keine DI-Awareness** - erkennt nur Imports, nicht DI-Dependencies
- **Overhead** - mehr Setup als madge
- **Graphviz-Abhängigkeit** - für DOT→SVG Konvertierung

#### Projekt-Fit: ⭐⭐⭐⭐☆ (4/5)
**Gut für**: Architektur-Validierung, CI/CD-Integration, Layering-Enforcement  
**Nicht gut für**: DI-Container-spezifische Analyse, Service-Token-Tracking

---

### 3. Custom Script mit ts-morph

#### Beschreibung
Ein eigens entwickeltes TypeScript-Script, das die spezifische DI-Architektur des Projekts versteht.

#### Installation
```bash
npm install -D ts-morph
```

#### Implementierung (Konzept)
```typescript
// scripts/analyze-dependencies.ts
import { Project, SyntaxKind } from 'ts-morph';
import * as fs from 'fs';

interface ServiceInfo {
  name: string;
  file: string;
  token?: string;
  dependencies: string[];
  lifecycle?: string;
}

function analyzeDIContainer(): Map<string, ServiceInfo> {
  const project = new Project({ tsConfigFilePath: 'tsconfig.json' });
  const services = new Map<string, ServiceInfo>();

  // Finde alle Services mit static dependencies
  const sourceFiles = project.getSourceFiles('src/**/*.ts');
  
  for (const file of sourceFiles) {
    const classes = file.getClasses();
    
    for (const cls of classes) {
      const depsProperty = cls.getStaticProperty('dependencies');
      
      if (depsProperty) {
        const serviceName = cls.getName() || 'Unknown';
        const dependencies: string[] = [];
        
        // Parse dependencies array
        const initializer = depsProperty.getInitializer();
        if (initializer) {
          // Extract token names from array
          const tokens = extractTokensFromArray(initializer);
          dependencies.push(...tokens);
        }
        
        services.set(serviceName, {
          name: serviceName,
          file: file.getFilePath(),
          dependencies,
        });
      }
    }
  }
  
  return services;
}

function generateMermaidDiagram(services: Map<string, ServiceInfo>): string {
  let mermaid = 'graph TB\n';
  
  // Group by layer
  const coreServices = new Set(['ConsoleLoggerService', 'MetricsCollector', 'LocalI18nService']);
  const foundryServices = new Set([...services.keys()].filter(s => s.startsWith('Foundry')));
  
  // Generate nodes and edges
  for (const [name, info] of services) {
    for (const dep of info.dependencies) {
      mermaid += `  ${name} --> ${dep}\n`;
    }
  }
  
  return mermaid;
}

function analyzeAndReport() {
  console.log('🔍 Analyzing DI Container Dependencies...\n');
  
  const services = analyzeDIContainer();
  
  // Generate reports
  const mermaid = generateMermaidDiagram(services);
  fs.writeFileSync('docs/auto-generated-dependency-graph.md', `\`\`\`mermaid\n${mermaid}\n\`\`\``);
  
  // JSON for further processing
  const json = JSON.stringify(Array.from(services.entries()), null, 2);
  fs.writeFileSync('docs/dependency-data.json', json);
  
  // Statistics
  console.log(`✅ Found ${services.size} services`);
  console.log(`📊 Generating dependency graph...`);
  console.log(`📄 Output: docs/auto-generated-dependency-graph.md`);
}

analyzeAndReport();
```

#### Verwendung
```bash
# Als npm script
npm run analyze:deps

# Oder direkt
npx tsx scripts/analyze-dependencies.ts
```

#### Vorteile ✅
- **DI-Awareness** - versteht `static dependencies` und Tokens
- **Projekt-spezifisch** - passt perfekt zur Architektur
- **Vollständige Kontrolle** - jede gewünschte Analyse möglich
- **Mermaid-Ausgabe** - direkt in Markdown-Docs einbindbar
- **Token-Tracking** - kann Token-Definitionen verfolgen
- **Lifecycle-Analyse** - kann SINGLETON/TRANSIENT/SCOPED erkennen
- **Custom-Metriken** - jede gewünschte Metrik berechenbar
- **Dependency-Validierung** - kann Custom-Regeln prüfen

#### Nachteile ❌
- **Entwicklungsaufwand** - muss selbst entwickelt werden
- **Maintenance** - muss gepflegt werden bei Architektur-Änderungen
- **Testing** - Script selbst muss getestet werden
- **Komplexität** - AST-Parsing kann komplex sein
- **Keine Standard-Tool-Unterstützung** - keine Community/Updates

#### Projekt-Fit: ⭐⭐⭐⭐⭐ (5/5)
**Gut für**: DI-Container-Analyse, Service-Token-Tracking, Custom-Reports  
**Nicht gut für**: Schnelle Setup ohne Entwicklung

---

### 4. Nx Graph (nur erwähnenswert)

#### Beschreibung
Nx ist ein Monorepo-Tool mit eingebauter Dependency-Visualisierung.

#### Vorteile ✅
- **Interaktive Visualisierung** - Web-basierter Graph-Explorer
- **Build-Integration** - zeigt affected modules bei Changes
- **Task-Orchestration** - optimiert Builds basierend auf Dependencies

#### Nachteile ❌
- **Nx-Requirement** - ganzes Projekt muss auf Nx migrieren
- **Overhead** - sehr viel Setup für nur Dependency-Analyse
- **Overkill** - zu mächtig für ein einzelnes Modul

#### Projekt-Fit: ⭐☆☆☆☆ (1/5)
**Gut für**: Große Monorepos mit mehreren Apps  
**Nicht gut für**: Einzelnes Foundry-Modul

---

### 5. TypeDoc + Plugin

#### Beschreibung
Dokumentations-Generator mit Dependency-Graph-Plugins.

#### Vorteile ✅
- **Dokumentation + Graph** - kombiniert API-Docs mit Dependencies
- **TypeScript-Native** - versteht TypeScript vollständig

#### Nachteile ❌
- **Fokus auf Docs** - primär für API-Dokumentation
- **Begrenzte Graph-Features** - nicht primäres Feature
- **Keine DI-Awareness** - versteht DI-Container nicht

#### Projekt-Fit: ⭐⭐☆☆☆ (2/5)
**Gut für**: Projekte die auch API-Docs brauchen  
**Nicht gut für**: Reine Dependency-Analyse

---

## Projekt-spezifische Bewertung

### Anforderungen deines Projekts

1. **DI-Container-Awareness** ⚡ KRITISCH
   - Projekt nutzt custom DI mit `static dependencies`
   - Standard-Tools verstehen nur `import`/`require`
   - Token-basierte Dependency-Injection

2. **Service-Lifecycle-Tracking** 🔄 WICHTIG
   - SINGLETON, TRANSIENT, SCOPED müssen unterschieden werden
   - Wichtig für Performance-Analyse

3. **Layering-Validierung** 🏗️ WICHTIG
   - Core → Foundry → Application Layer
   - Ports & Versioning-Schicht
   - Utilities dürfen nicht auf Services zugreifen

4. **Mermaid-Ausgabe** 📊 NÜTZLICH
   - Bereits in Dokumentation verwendet
   - GitHub/Markdown-Kompatibilität

5. **CI/CD-Integration** 🔧 NÜTZLICH
   - Automatische Validierung bei PRs
   - Fail bei Architektur-Violations

### Bewertungsmatrix

| Anforderung | madge | dependency-cruiser | Custom Script | Nx | TypeDoc |
|-------------|-------|-------------------|---------------|-----|---------|
| **DI-Awareness** | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Lifecycle-Tracking** | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Layering-Validierung** | ⚠️ | ✅ | ✅ | ✅ | ❌ |
| **Mermaid-Ausgabe** | ❌ | ✅ | ✅ | ❌ | ❌ |
| **CI/CD-Integration** | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| **Setup-Aufwand** | ✅ | ⚠️ | ❌ | ❌ | ⚠️ |
| **Maintenance** | ✅ | ✅ | ❌ | ✅ | ✅ |

**Legende**: ✅ Gut | ⚠️ OK/Mittel | ❌ Schlecht/Nicht unterstützt

---

## Empfehlung

### 🏆 Hybrid-Ansatz: dependency-cruiser + Custom Script

#### Warum?

1. **dependency-cruiser für Import-Analyse**
   - Validiert Layering-Regeln (Utils → Services verboten)
   - Findet zirkuläre Import-Dependencies
   - CI/CD-Integration für Architektur-Enforcement
   - Kein Custom-Code nötig

2. **Custom Script für DI-Analyse**
   - Versteht dein DI-System
   - Trackt Service-Tokens und Dependencies
   - Generiert Mermaid-Diagramme für Docs
   - Analysiert Lifecycle (SINGLETON/TRANSIENT)

#### Implementierungsplan

**Phase 1: dependency-cruiser Setup** (2-3 Stunden)
- Installation und Basis-Config
- Layering-Regeln definieren
- CI/CD-Integration (GitHub Actions)

**Phase 2: Custom DI-Analyzer** (4-6 Stunden)
- TypeScript-Script mit ts-morph
- Parsing von `static dependencies`
- Mermaid-Graph-Generierung
- JSON-Export für weitere Analysen

**Phase 3: Automatisierung** (1-2 Stunden)
- npm scripts für beide Tools
- Pre-commit Hook (optional)
- GitHub Action für automatische Updates

---

## Implementierungsbeispiele

### Setup 1: dependency-cruiser

#### Installation
```bash
npm install -D dependency-cruiser
```

#### Konfiguration: `.dependency-cruiser.js`
```javascript
module.exports = {
  forbidden: [
    // Keine zirkulären Dependencies
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies are not allowed',
      from: {},
      to: { circular: true }
    },
    
    // Utils dürfen nicht auf Services zugreifen
    {
      name: 'no-utils-to-services',
      severity: 'error',
      comment: 'Utilities should not import services',
      from: { path: '^src/utils' },
      to: { 
        path: '^src/(services|foundry/services)',
        pathNot: '^src/utils'
      }
    },
    
    // Application Layer darf nicht auf DI Infrastructure zugreifen
    {
      name: 'no-app-to-di',
      severity: 'warn',
      comment: 'Application layer should use services, not DI directly',
      from: { path: '^src/services' },
      to: { path: '^src/di_infrastructure' }
    },
    
    // Foundry Services dürfen nicht auf Application Services zugreifen
    {
      name: 'foundry-isolation',
      severity: 'error',
      comment: 'Foundry services should not depend on app services',
      from: { path: '^src/foundry/services' },
      to: { 
        path: '^src/services/[^/]+\\.ts$',
        pathNot: '(LocalI18nService|consolelogger)'
      }
    }
  ],
  
  allowed: [
    // Core Services sind überall erlaubt
    {
      from: {},
      to: { path: '^src/services/(consolelogger|LocalI18nService)' }
    }
  ],
  
  options: {
    doNotFollow: {
      path: 'node_modules|coverage|dist'
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    },
    reporterOptions: {
      dot: {
        collapsePattern: '^src/(services|foundry/services|di_infrastructure)',
        theme: {
          graph: {
            rankdir: 'TB'
          }
        }
      }
    }
  }
};
```

#### NPM Scripts in `package.json`
```json
{
  "scripts": {
    "deps:validate": "depcruise src/ --validate",
    "deps:graph": "depcruise src/ --output-type dot | dot -T svg > docs/import-dependency-graph.svg",
    "deps:report": "depcruise src/ --output-type html > docs/dependency-report.html",
    "deps:mermaid": "depcruise src/ --output-type mermaid > docs/import-dependencies.mmd"
  }
}
```

#### GitHub Action: `.github/workflows/validate-architecture.yml`
```yaml
name: Validate Architecture

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  validate-dependencies:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Validate dependency rules
        run: npm run deps:validate
      
      - name: Generate dependency report (on failure)
        if: failure()
        run: |
          npm run deps:report
          echo "::error::Dependency validation failed. Check docs/dependency-report.html for details."
```

---

### Setup 2: Custom DI Analyzer

#### Script: `scripts/analyze-di-dependencies.ts`

```typescript
import { Project, SyntaxKind, Node } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

interface ServiceInfo {
  name: string;
  file: string;
  token?: string;
  dependencies: string[];
  lifecycle?: 'SINGLETON' | 'TRANSIENT' | 'SCOPED';
  layer: 'CORE' | 'FOUNDRY' | 'APPLICATION' | 'INFRASTRUCTURE';
}

interface DependencyGraph {
  services: Map<string, ServiceInfo>;
  tokens: Map<string, string>; // tokenName -> serviceName
}

class DIAnalyzer {
  private project: Project;
  private graph: DependencyGraph;

  constructor() {
    this.project = new Project({ 
      tsConfigFilePath: 'tsconfig.json',
      skipAddingFilesFromTsConfig: false
    });
    this.graph = {
      services: new Map(),
      tokens: new Map()
    };
  }

  analyze(): DependencyGraph {
    console.log('🔍 Analyzing DI Container...\n');
    
    // 1. Find all services with static dependencies
    this.findServices();
    
    // 2. Find token registrations in dependencyconfig.ts
    this.findTokenRegistrations();
    
    // 3. Link tokens to services
    this.linkTokensToServices();
    
    return this.graph;
  }

  private findServices(): void {
    const serviceFiles = this.project.getSourceFiles([
      'src/services/**/*.ts',
      'src/foundry/services/**/*.ts',
      'src/observability/**/*.ts'
    ]);

    for (const file of serviceFiles) {
      const classes = file.getClasses();
      
      for (const cls of classes) {
        const depsProperty = cls.getStaticProperty('dependencies');
        
        if (depsProperty) {
          const serviceName = cls.getName();
          if (!serviceName) continue;

          const dependencies: string[] = [];
          const initializer = depsProperty.getInitializer();
          
          if (initializer && Node.isArrayLiteralExpression(initializer)) {
            for (const element of initializer.getElements()) {
              const tokenName = element.getText();
              dependencies.push(tokenName);
            }
          }

          const layer = this.determineLayer(file.getFilePath());

          this.graph.services.set(serviceName, {
            name: serviceName,
            file: file.getFilePath(),
            dependencies,
            layer,
          });
        }
      }
    }
    
    console.log(`✅ Found ${this.graph.services.size} services with dependencies`);
  }

  private findTokenRegistrations(): void {
    const configFile = this.project.getSourceFile('src/config/dependencyconfig.ts');
    if (!configFile) return;

    // Find all registerClass calls
    configFile.forEachDescendant(node => {
      if (Node.isCallExpression(node)) {
        const expr = node.getExpression();
        if (Node.isPropertyAccessExpression(expr) && 
            expr.getName() === 'registerClass') {
          
          const args = node.getArguments();
          if (args.length >= 3) {
            const tokenArg = args[0]?.getText();
            const classArg = args[1]?.getText();
            const lifecycleArg = args[2]?.getText();
            
            if (tokenArg && classArg) {
              // Extract lifecycle enum value
              const lifecycle = lifecycleArg?.split('.').pop() as ServiceInfo['lifecycle'];
              
              // Store token -> class mapping
              this.graph.tokens.set(tokenArg, classArg);
              
              // Update service info with lifecycle
              const service = this.graph.services.get(classArg);
              if (service) {
                service.lifecycle = lifecycle;
                service.token = tokenArg;
              }
            }
          }
        }
      }
    });
    
    console.log(`✅ Found ${this.graph.tokens.size} token registrations`);
  }

  private linkTokensToServices(): void {
    for (const [serviceName, info] of this.graph.services) {
      const resolvedDeps: string[] = [];
      
      for (const depToken of info.dependencies) {
        const targetService = this.graph.tokens.get(depToken);
        if (targetService) {
          resolvedDeps.push(targetService);
        } else {
          resolvedDeps.push(depToken); // Keep token name if not resolved
        }
      }
      
      info.dependencies = resolvedDeps;
    }
  }

  private determineLayer(filePath: string): ServiceInfo['layer'] {
    if (filePath.includes('/foundry/services/')) return 'FOUNDRY';
    if (filePath.includes('/services/')) return 'APPLICATION';
    if (filePath.includes('/di_infrastructure/')) return 'INFRASTRUCTURE';
    return 'CORE';
  }

  generateMermaidDiagram(): string {
    let mermaid = 'graph TB\n\n';
    
    // Group by layer
    const layers = {
      CORE: new Set<string>(),
      APPLICATION: new Set<string>(),
      FOUNDRY: new Set<string>(),
      INFRASTRUCTURE: new Set<string>()
    };
    
    for (const [name, info] of this.graph.services) {
      layers[info.layer].add(name);
    }
    
    // Generate subgraphs
    for (const [layer, services] of Object.entries(layers)) {
      if (services.size === 0) continue;
      
      mermaid += `  subgraph ${layer}["${layer} Layer"]\n`;
      for (const service of services) {
        const info = this.graph.services.get(service)!;
        const lifecycleIcon = info.lifecycle === 'SINGLETON' ? '⚡' : 
                            info.lifecycle === 'TRANSIENT' ? '🔄' : '📦';
        mermaid += `    ${service}["${lifecycleIcon} ${service}"]\n`;
      }
      mermaid += `  end\n\n`;
    }
    
    // Generate edges
    for (const [name, info] of this.graph.services) {
      for (const dep of info.dependencies) {
        mermaid += `  ${name} --> ${dep}\n`;
      }
    }
    
    // Styling
    mermaid += `\n  classDef core fill:#90EE90,stroke:#006400\n`;
    mermaid += `  classDef app fill:#DDA0DD,stroke:#8B008B\n`;
    mermaid += `  classDef foundry fill:#FFB6C1,stroke:#DC143C\n`;
    
    return mermaid;
  }

  generateStatistics(): string {
    let stats = '# DI Container Statistics\n\n';
    
    // Total services
    stats += `## Overview\n\n`;
    stats += `- **Total Services**: ${this.graph.services.size}\n`;
    stats += `- **Registered Tokens**: ${this.graph.tokens.size}\n\n`;
    
    // By lifecycle
    const lifecycles = new Map<string, number>();
    for (const info of this.graph.services.values()) {
      const lc = info.lifecycle || 'UNKNOWN';
      lifecycles.set(lc, (lifecycles.get(lc) || 0) + 1);
    }
    
    stats += `## By Lifecycle\n\n`;
    for (const [lifecycle, count] of lifecycles) {
      stats += `- **${lifecycle}**: ${count}\n`;
    }
    
    // By layer
    const layerCounts = new Map<string, number>();
    for (const info of this.graph.services.values()) {
      layerCounts.set(info.layer, (layerCounts.get(info.layer) || 0) + 1);
    }
    
    stats += `\n## By Layer\n\n`;
    for (const [layer, count] of layerCounts) {
      stats += `- **${layer}**: ${count}\n`;
    }
    
    // Dependency depth
    stats += `\n## Dependency Complexity\n\n`;
    let maxDepth = 0;
    let totalDeps = 0;
    
    for (const info of this.graph.services.values()) {
      totalDeps += info.dependencies.length;
      maxDepth = Math.max(maxDepth, info.dependencies.length);
    }
    
    const avgDeps = totalDeps / this.graph.services.size;
    stats += `- **Max Dependencies**: ${maxDepth}\n`;
    stats += `- **Average Dependencies**: ${avgDeps.toFixed(2)}\n`;
    
    // Services without dependencies
    const noDeps = Array.from(this.graph.services.values())
      .filter(s => s.dependencies.length === 0);
    stats += `- **Services without dependencies**: ${noDeps.length}\n`;
    
    if (noDeps.length > 0) {
      stats += `\n### Core Services (no dependencies):\n`;
      for (const service of noDeps) {
        stats += `- \`${service.name}\`\n`;
      }
    }
    
    return stats;
  }

  exportJSON(outputPath: string): void {
    const data = {
      services: Array.from(this.graph.services.entries()).map(([name, info]) => ({
        name,
        ...info,
        dependencies: info.dependencies
      })),
      tokens: Array.from(this.graph.tokens.entries()).map(([token, service]) => ({
        token,
        service
      }))
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`📄 JSON data exported to ${outputPath}`);
  }
}

// Main execution
function main() {
  console.log('═══════════════════════════════════════');
  console.log('  DI Container Dependency Analyzer');
  console.log('═══════════════════════════════════════\n');
  
  const analyzer = new DIAnalyzer();
  const graph = analyzer.analyze();
  
  console.log('\n📊 Generating reports...\n');
  
  // 1. Mermaid diagram
  const mermaid = analyzer.generateMermaidDiagram();
  const mermaidPath = 'docs/auto-generated-di-dependencies.md';
  fs.writeFileSync(mermaidPath, `# DI Container Dependencies\n\n\`\`\`mermaid\n${mermaid}\n\`\`\``);
  console.log(`✅ Mermaid diagram: ${mermaidPath}`);
  
  // 2. Statistics
  const stats = analyzer.generateStatistics();
  const statsPath = 'docs/di-statistics.md';
  fs.writeFileSync(statsPath, stats);
  console.log(`✅ Statistics: ${statsPath}`);
  
  // 3. JSON export
  const jsonPath = 'docs/di-dependency-data.json';
  analyzer.exportJSON(jsonPath);
  
  console.log('\n✨ Analysis complete!\n');
}

main();
```

#### NPM Scripts
```json
{
  "scripts": {
    "analyze:di": "tsx scripts/analyze-di-dependencies.ts",
    "analyze:all": "npm run deps:validate && npm run analyze:di",
    "analyze:watch": "nodemon --watch src --exec 'npm run analyze:di'"
  },
  "devDependencies": {
    "ts-morph": "^21.0.0",
    "tsx": "^4.7.0",
    "nodemon": "^3.0.0"
  }
}
```

---

## Budget & Timeline

### Option 1: Nur dependency-cruiser
- **Setup**: 2-3 Stunden
- **Kosten**: $0 (Open Source)
- **Maintenance**: ~1h/Monat

### Option 2: Nur Custom Script
- **Entwicklung**: 6-8 Stunden
- **Kosten**: $0
- **Maintenance**: ~2h/Monat

### Option 3: Hybrid (EMPFOHLEN)
- **Setup gesamt**: 8-12 Stunden
- **Kosten**: $0
- **Maintenance**: ~2h/Monat
- **ROI**: Sehr hoch - verhindert Architektur-Erosion

---

## Zusammenfassung

### Schnellentscheidung

**Wenn du...**
- ✅ **Nur Import-Dependencies prüfen willst** → `madge`
- ✅ **Architektur-Regeln enforcen willst** → `dependency-cruiser`
- ✅ **DI-Container verstehen willst** → `Custom Script`
- ✅ **Beides brauchst (empfohlen)** → `dependency-cruiser + Custom Script`

### Nächste Schritte

1. **Entscheidung treffen** basierend auf diesem Vergleich
2. **Phase 1 implementieren** (dependency-cruiser oder Custom Script zuerst)
3. **Testen** mit aktueller Codebase
4. **CI/CD integrieren** für automatische Validierung
5. **Dokumentation aktualisieren** mit generierten Graphen

---

**Fragen für deine Entscheidung:**
1. Wie wichtig ist DI-Container-Awareness? (1-10)
2. Wie viel Zeit kannst du in Setup investieren?
3. Soll das Tool in CI/CD laufen?
4. Brauchst du automatische Dokumentations-Updates?

