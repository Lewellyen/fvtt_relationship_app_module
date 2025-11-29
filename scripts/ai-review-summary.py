#!/usr/bin/env python3
"""
Extract summary from AI analysis results for GitHub Actions summary.
"""
import json
import sys
import os

# Lade .env Datei falls vorhanden
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # python-dotenv nicht installiert - Umgebungsvariable muss manuell gesetzt sein
    pass

import os

# Windows-kompatible Pfad-Erkennung
if sys.platform == "win32":
    json_path = os.path.join(os.environ.get("TEMP", "C:\\temp"), "analysis-output.json")
else:
    json_path = "/tmp/analysis-output.json"

try:
    if not os.path.exists(json_path):
        print(f"⚠️ Datei nicht gefunden: {json_path}")
        sys.exit(0)
    
    if os.path.getsize(json_path) == 0:
        print("⚠️ JSON-Datei ist leer")
        sys.exit(0)
    
    with open(json_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if not content or not content.strip():
        print("⚠️ JSON-Datei enthält keine Daten")
        sys.exit(0)
    
    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        print(f"⚠️ JSON-Parsing-Fehler: {e}")
        print(f"Datei-Inhalt (erste 500 Zeichen):\n{content[:500]}")
        sys.exit(0)
    
    summary = data.get('summary', {})
    total_issues = summary.get('total_issues', 0)
    
    print(f"**Gefundene Probleme:** {total_issues}")
    print("")
    
    if total_issues == 0:
        print("✅ Keine Probleme gefunden - Code entspricht den Qualitätsstandards!")
        sys.exit(0)
    
    print("### Nach Typ")
    by_type = summary.get('by_type', {})
    if by_type:
        for issue_type, count in by_type.items():
            if count > 0:
                print(f"- {issue_type}: {count}")
    else:
        print("- Keine Typ-Aufschlüsselung verfügbar")
    
    print("")
    print("### Nach Severity")
    by_severity = summary.get('by_severity', {})
    if by_severity:
        for severity, count in by_severity.items():
            if count > 0:
                print(f"- {severity}: {count}")
    else:
        print("- Keine Severity-Aufschlüsselung verfügbar")
        
except Exception as e:
    print(f"⚠️ Fehler beim Extrahieren der Zusammenfassung: {e}")
    import traceback
    print(f"Traceback: {traceback.format_exc()}")
    sys.exit(0)  # Nicht kritisch - Workflow darf weiterlaufen

