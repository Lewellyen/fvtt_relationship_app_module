#!/usr/bin/env python3
"""
Extract summary from AI analysis results for GitHub Actions summary.
"""
import json
import sys

try:
    with open('/tmp/analysis-output.json', 'r') as f:
        data = json.load(f)
    summary = data.get('summary', {})
    print(f"**Gefundene Probleme:** {summary.get('total_issues', 0)}")
    print("")
    print("### Nach Typ")
    for issue_type, count in summary.get('by_type', {}).items():
        if count > 0:
            print(f"- {issue_type}: {count}")
    print("")
    print("### Nach Severity")
    for severity, count in summary.get('by_severity', {}).items():
        if count > 0:
            print(f"- {severity}: {count}")
except Exception as e:
    print(f"⚠️ Konnte Zusammenfassung nicht extrahieren: {e}")
    sys.exit(0)  # Nicht kritisch

