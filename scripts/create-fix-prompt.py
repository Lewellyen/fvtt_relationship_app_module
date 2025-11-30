#!/usr/bin/env python3
"""
Erstellt einen Fix-Prompt für den AI Issue Fix Workflow.
Behandelt sicher alle Sonderzeichen in Issue-Beschreibungen.
"""
import os
import sys

def create_fix_prompt():
    """Erstellt den Fix-Prompt aus Environment-Variablen."""
    issue_num = os.environ.get('ISSUE_NUM', '')
    issue_title = os.environ.get('ISSUE_TITLE', '')
    issue_url = os.environ.get('ISSUE_URL', '')
    issue_body = os.environ.get('ISSUE_BODY', '')
    branch_name = os.environ.get('BRANCH_NAME', '')

    if not issue_num:
        print("❌ Error: ISSUE_NUM environment variable not set", file=sys.stderr)
        sys.exit(1)

    prompt = f"""Du arbeitest in einem GitHub Actions Runner mit vollständigem Zugriff auf Git und GitHub CLI.

# Aufgabe: Issue #{issue_num} beheben

**Issue-Titel:** {issue_title}
**Issue-URL:** {issue_url}

**Issue-Beschreibung:**
{issue_body}

## Deine Aufgabe:

1. **Analysiere das Problem** im Issue
2. **Finde die betroffenen Dateien** (nutze `git`, `gh`, oder lese Dateien direkt)
3. **Implementiere die Lösung** direkt im Code
4. **Erstelle Commits** mit `git add` und `git commit`
5. **Teste deine Lösung** (falls Tests vorhanden sind)

## WICHTIG - Du MUSST folgendes tun:

- **Nutze Git-Befehle direkt:** `git add`, `git commit`, `git push`
- **Erstelle sinnvolle Commits:** Jeder Commit sollte eine logische Änderungseinheit sein
- **Commit-Messages:** Verwende klare, beschreibende Messages (z.B. "fix: resolve issue #{issue_num}")
- **Keine leeren Commits:** Nur committen wenn tatsächlich Änderungen gemacht wurden
- **Keine Force-Push:** Nutze normale `git push`

## Git-Konfiguration:

Git ist bereits konfiguriert:
- User: github-actions[bot]
- Email: github-actions[bot]@users.noreply.github.com
- Branch: {branch_name}
- Remote: origin (bereits konfiguriert)

## Projektkontext:

Das Projekt verwendet:
- **Clean Architecture** mit 4 Schichten: Domain → Application → Infrastructure → Framework
- **Result-Pattern** statt Exceptions (siehe ADR-0001)
- **SOLID-Prinzipien** durchgängig
- **Port-Adapter-Pattern** für Foundry VTT Version-Kompatibilität
- **Dependency Inversion Principle (DIP)**: Abhängigkeiten nur zu Interfaces

## Code-Qualität:

- Halte dich an die bestehenden Architektur-Patterns
- Verwende das Result-Pattern für Fehlerbehandlung
- Respektiere die Schichttrennung (Clean Architecture)
- Füge Tests hinzu, wenn möglich

## Output:

Nachdem du die Änderungen gemacht und committed hast, gib eine kurze Zusammenfassung aus:
- Welche Dateien wurden geändert?
- Was wurde behoben?
- Gibt es besondere Überlegungen für den Reviewer?

**Beginne jetzt mit der Analyse und Implementierung!**
"""

    output_file = os.environ.get('OUTPUT_FILE', '/tmp/fix-prompt.md')

    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(prompt)
        print(f"✅ Prompt created for issue #{issue_num} -> {output_file}", file=sys.stderr)
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error writing prompt file: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    create_fix_prompt()

