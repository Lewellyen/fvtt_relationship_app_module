#!/usr/bin/env python3
"""
Extract JSON from Cursor AI output (may be embedded in Markdown or text).
"""
import re
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

# Windows-kompatible Pfad-Erkennung
if sys.platform == "win32":
    OUTPUT_FILE = os.path.join(os.environ.get("TEMP", "C:\\temp"), "analysis-output.json")
else:
    OUTPUT_FILE = "/tmp/analysis-output.json"

try:
    with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
except FileNotFoundError:
    print(f"Error: {OUTPUT_FILE} not found")
    sys.exit(1)

if not content or not content.strip():
    print("Error: Empty output file")
    sys.exit(1)

# Versuche verschiedene JSON-Extraktions-Strategien

# Strategie 1: Suche nach JSON-Block in Markdown Code-Blöcken
json_match = re.search(r'```json\s*\n(.*?)\n```', content, re.DOTALL)
if json_match:
    json_str = json_match.group(1)
elif re.search(r'```\s*\n(\{.*?\})\s*\n```', content, re.DOTALL):
    # Strategie 2: Code-Block ohne json-Label aber mit JSON-Inhalt
    json_match = re.search(r'```\s*\n(\{.*?\})\s*\n```', content, re.DOTALL)
    if json_match:
        json_str = json_match.group(1)
    else:
        json_match = None
else:
    json_match = None

if not json_match:
    # Strategie 3: Suche nach erstem JSON-Objekt im Text (von { bis zugehörigem })
    # Versuche verschachtelte JSON-Objekte korrekt zu matchen
    brace_count = 0
    start_idx = content.find('{')
    if start_idx != -1:
        json_str = ''
        for i in range(start_idx, len(content)):
            char = content[i]
            json_str += char
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    # Geschlossenes JSON-Objekt gefunden
                    break
        if brace_count == 0:
            json_match = True
        else:
            json_match = None
            json_str = None
    else:
        json_str = None

if json_str:
    try:
        # Entferne führende/abschließende Whitespace
        json_str = json_str.strip()
        # Entferne mögliche Markdown-Formatierung
        json_str = re.sub(r'^```json\s*', '', json_str, flags=re.MULTILINE)
        json_str = re.sub(r'^```\s*', '', json_str, flags=re.MULTILINE)
        json_str = re.sub(r'```\s*$', '', json_str, flags=re.MULTILINE)
        
        json_obj = json.loads(json_str)
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(json_obj, f, indent=2, ensure_ascii=False)
        print(f"JSON extracted successfully (length: {len(json_str)} chars)")
        sys.exit(0)
    except json.JSONDecodeError as e:
        print(f"Failed to parse extracted JSON: {e}")
        print(f"Attempted to parse: {json_str[:200]}...")
        sys.exit(1)
else:
    print("No JSON found in output")
    print(f"Output preview (first 500 chars):\n{content[:500]}")
    sys.exit(1)

