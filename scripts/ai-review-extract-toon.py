#!/usr/bin/env python3
"""
Extract TOON from Cursor AI output and convert to JSON for compatibility.
"""
import re
import json
import sys
import os

# Versuche TOON-Bibliothek zu importieren
try:
    import toon
    TOON_AVAILABLE = True
except ImportError:
    try:
        from toon_formatter import dumps, loads
        class ToonWrapper:
            @staticmethod
            def encode(obj):
                return dumps(obj)
            @staticmethod
            def decode(s):
                return loads(s)
        toon = ToonWrapper()
        TOON_AVAILABLE = True
    except ImportError:
        TOON_AVAILABLE = False

# Windows-kompatible Pfad-Erkennung
if sys.platform == "win32":
    OUTPUT_FILE = os.path.join(os.environ.get("TEMP", "C:\\temp"), "analysis-output.json")
    TOON_FILE = os.path.join(os.environ.get("TEMP", "C:\\temp"), "analysis-output.toon")
else:
    OUTPUT_FILE = "/tmp/analysis-output.json"
    TOON_FILE = "/tmp/analysis-output.toon"

if not TOON_AVAILABLE:
    print("⚠️ TOON-Bibliothek nicht verfügbar, versuche JSON-Extraktion...", file=sys.stderr)
    # Fallback zu JSON-Extraktion
    import subprocess
    result = subprocess.run([sys.executable, "scripts/ai-review-extract-json.py"],
                          capture_output=True, text=True)
    sys.exit(result.returncode)

try:
    with open(TOON_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
except FileNotFoundError:
    # Versuche auch JSON-Datei (Rückwärtskompatibilität)
    try:
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
            # Prüfe ob es JSON ist
            try:
                json.loads(content)
                print("✅ JSON-Datei gefunden, bereits im richtigen Format", file=sys.stderr)
                sys.exit(0)
            except json.JSONDecodeError:
                pass
    except FileNotFoundError:
        print(f"Error: {TOON_FILE} oder {OUTPUT_FILE} nicht gefunden", file=sys.stderr)
        sys.exit(1)

if not content or not content.strip():
    print("Error: Empty output file", file=sys.stderr)
    sys.exit(1)

# Versuche TOON zu extrahieren
# TOON hat typischerweise keine geschweiften Klammern, sondern Einrückungen

# Strategie 1: Suche nach TOON-Block in Markdown
toon_match = re.search(r'```toon\s*\n(.*?)\n```', content, re.DOTALL)
if toon_match:
    toon_str = toon_match.group(1)
elif re.search(r'```\s*\n([a-zA-Z_][a-zA-Z0-9_]*\[.*?\]:.*?)\n```', content, re.DOTALL):
    # Strategie 2: Code-Block mit TOON-ähnlichem Inhalt
    toon_match = re.search(r'```\s*\n([a-zA-Z_][a-zA-Z0-9_]*\[.*?\]:.*?)\n```', content, re.DOTALL)
    if toon_match:
        toon_str = toon_match.group(1)
    else:
        toon_match = None
else:
    toon_match = None

if not toon_match:
    # Strategie 3: Suche nach TOON-Format direkt (beginnt mit key: oder key[)
    # TOON beginnt typischerweise mit einem Key gefolgt von : oder [
    toon_pattern = r'^[a-zA-Z_][a-zA-Z0-9_]*(\[.*?\])?\{.*?\}:'
    if re.search(toon_pattern, content, re.MULTILINE):
        # Extrahiere alles ab dem ersten TOON-Key bis zum Ende
        lines = content.split('\n')
        toon_lines = []
        in_toon = False
        for line in lines:
            if re.match(toon_pattern, line.strip()):
                in_toon = True
            if in_toon:
                toon_lines.append(line)
        if toon_lines:
            toon_str = '\n'.join(toon_lines)
            toon_match = True
        else:
            toon_str = None
            toon_match = None
    else:
        # Strategie 4: Versuche gesamten Content als TOON zu parsen
        toon_str = content.strip()
        toon_match = True

if toon_str:
    try:
        # Entferne Markdown-Formatierung
        toon_str = re.sub(r'^```toon\s*', '', toon_str, flags=re.MULTILINE)
        toon_str = re.sub(r'^```\s*', '', toon_str, flags=re.MULTILINE)
        toon_str = re.sub(r'```\s*$', '', toon_str, flags=re.MULTILINE)
        toon_str = toon_str.strip()

        # Konvertiere TOON zu JSON
        if hasattr(toon, 'decode'):
            json_obj = toon.decode(toon_str)
        elif hasattr(toon, 'loads'):
            json_obj = toon.loads(toon_str)
        else:
            raise AttributeError("Keine decode/loads Funktion gefunden")

        # Speichere als JSON (für Kompatibilität mit bestehenden Skripten)
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(json_obj, f, indent=2, ensure_ascii=False)

        # Speichere auch TOON-Version
        with open(TOON_FILE, 'w', encoding='utf-8') as f:
            f.write(toon_str)

        print(f"✅ TOON extracted and converted to JSON (TOON length: {len(toon_str)} chars)", file=sys.stderr)
        sys.exit(0)
    except Exception as e:
        print(f"❌ Failed to parse TOON: {e}", file=sys.stderr)
        print(f"Attempted to parse: {toon_str[:200]}...", file=sys.stderr)
        # Fallback zu JSON-Extraktion
        print("⚠️ Falling back to JSON extraction...", file=sys.stderr)
        import subprocess
        result = subprocess.run([sys.executable, "scripts/ai-review-extract-json.py"],
                              capture_output=True, text=True)
        sys.exit(result.returncode)
else:
    print("⚠️ No TOON found in output, trying JSON extraction...", file=sys.stderr)
    # Fallback zu JSON-Extraktion
    import subprocess
    result = subprocess.run([sys.executable, "scripts/ai-review-extract-json.py"],
                          capture_output=True, text=True)
    sys.exit(result.returncode)

