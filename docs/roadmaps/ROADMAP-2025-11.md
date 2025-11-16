# Roadmap – November 2025

**Aktualisiert:** 2025-11-15  
**Scope:** Pre-Release v0.24.x (Foundry v13 only)

> Hinweis: Die frühere `ROADMAP.md` wurde abgeschlossen und ins Archiv verschoben. Diese Datei bildet den neuen Planungszyklus ab.

---

## Fokus-Themen

1. **UI-Styles & Netzwerk-Visualisierung** – Reaktivierung der Svelte-/XYFlow-Assets, sobald Feature-Flag stabil ist.
2. **RuntimeConfig DX** – Weitere Observability rund um Sampling/Cache-Live-Updates (Monitoring + Docs).

---

## 1. UI-Styles Reaktivierung

| Phase | Beschreibung | Owner | Blocker |
|-------|--------------|-------|---------|
| Analyse | Prüfen, welche Styles/Assets nach dem v0.21-Refactor fehlen (`@xyflow/svelte`, Tailwind Overrides). | UI Guild | Keine |
| Feature Flag | Neues Foundry-Setting `uiStylesEnabled` oder ENV-Flag, damit Early-Adopter testen können. | App Core | Abhängig von Settings-Backlog |
| Bundle Update | Re-Enable Import in `src/index.ts`, CSS in `styles/`. Sicherstellen, dass Baum-Shaking + Size Checks bestehen. | Build Guild | Performance-Check |
| QA & Docs | Screenshots/Docs aktualisieren, Beta-Rollout mit GM-Feedback. | QA | UI-Review |

**Definition of Done**
- Styles können per Setting aktiviert werden.
- Dokumentation & CHANGELOG verweisen auf das Flag.
- Kein Einfluss auf Bootstrapping, wenn Flag deaktiviert ist.

---

## 2. RuntimeConfig DX

- **Sampling-Grafana-Exports:** Weitere Beispiele bereitstellen, wie Samplingraten überwacht werden können.
- **Cache Telemetrie:** Zusätzliche Metrics (z. B. Größe/evictions) im API-Snapshot ausgeben.
- **Docs:** Schritt-für-Schritt-Guide für Admins, wie sie Live-Overrides überprüfen.

---

## Offene Fragen

- Benötigen wir zusätzlich zu Foundry-Settings eine CLI/ENV-Pipeline für UI-Experimente?
- Wann soll das UI-Feature standardmäßig aktiviert werden (v0.25 oder später)?

---

## Archiv-Notiz

Die alte `docs/roadmaps/ROADMAP.md` (v0.20-Fokus) ist vollständig umgesetzt und kann bei Bedarf im `docs/archive/`-Verzeichnis nachgelesen werden.

