#!/usr/bin/env python3
"""
Erstellt einen Issue-Kommentar für den Fall, dass keine Code-Änderungen erforderlich sind.
Behandelt sicher alle Sonderzeichen.
"""
import os
import sys

def create_issue_comment():
    """Erstellt den Issue-Kommentar aus Environment-Variablen und Agent-Ausgabe."""
    issue_num = os.environ.get('ISSUE_NUM', '')
    issue_title = os.environ.get('ISSUE_TITLE', '')
    agent_summary_file = os.environ.get('AGENT_SUMMARY_FILE', '/tmp/agent-summary.md')
    agent_output_file = os.environ.get('AGENT_OUTPUT_FILE', '/tmp/fix-output.txt')
    output_file = os.environ.get('OUTPUT_FILE', '/tmp/issue-comment.txt')

    if not issue_num:
        print("❌ Error: ISSUE_NUM environment variable not set", file=sys.stderr)
        sys.exit(1)

    # Baue Kommentar-Text zusammen
    comment_body = f"""## 🤖 AI-Analyse: Keine Code-Änderungen erforderlich

Der AI-Agent hat das Issue analysiert und festgestellt, dass keine Code-Änderungen erforderlich sind.

**Issue:** #{issue_num} - {issue_title}

---

"""

    # Versuche Agent-Zusammenfassung zu laden
    agent_summary = None
    if os.path.exists(agent_summary_file):
        try:
            with open(agent_summary_file, 'r', encoding='utf-8') as f:
                agent_summary = f.read().strip()
            print(f"✅ Loaded agent summary from {agent_summary_file}", file=sys.stderr)
        except Exception as e:
            print(f"⚠️ Could not read agent summary: {e}", file=sys.stderr)

    # Falls keine Zusammenfassung, versuche Agent-Output
    if not agent_summary and os.path.exists(agent_output_file):
        try:
            with open(agent_output_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                # Verwende die letzten 200 Zeilen
                agent_output = ''.join(lines[-200:]).strip()
                if agent_output:
                    agent_summary = f"```\n{agent_output}\n```"
                    print(f"✅ Using agent output from {agent_output_file}", file=sys.stderr)
        except Exception as e:
            print(f"⚠️ Could not read agent output: {e}", file=sys.stderr)

    # Füge Zusammenfassung hinzu
    if agent_summary:
        comment_body += agent_summary
    else:
        comment_body += "Der AI-Agent hat das Issue analysiert, aber keine detaillierte Zusammenfassung erstellt."

    comment_body += """

---

*Dieses Issue wird automatisch geschlossen, da keine Code-Änderungen erforderlich sind.*"""

    # Schreibe Kommentar in Datei
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(comment_body)
        print(f"✅ Issue comment created for issue #{issue_num} -> {output_file}", file=sys.stderr)
        # Nur auf stdout ausgeben wenn OUTPUT_FILE nicht gesetzt ist (für Rückwärtskompatibilität)
        if 'OUTPUT_FILE' not in os.environ:
            print(comment_body)
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error writing issue comment file: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    create_issue_comment()

