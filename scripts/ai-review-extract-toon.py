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
    TEMP_DIR = os.environ.get("TEMP", "C:\\temp")
    OUTPUT_FILE = os.path.join(TEMP_DIR, "analysis-output.json")
    TOON_FILE = os.path.join(TEMP_DIR, "analysis-output.toon")
    RAW_FILE = os.path.join(TEMP_DIR, "analysis-output-raw.txt")
else:
    OUTPUT_FILE = "/tmp/analysis-output.json"
    TOON_FILE = "/tmp/analysis-output.toon"
    RAW_FILE = "/tmp/analysis-output-raw.txt"

def parse_toon_manually(toon_str):
    """
    Manueller TOON-Parser für AI-generiertes Format.
    Konvertiert TOON-Format zu JSON-Dict.
    """
    result = {}
    lines = [l.rstrip() for l in toon_str.split('\n')]
    i = 0

    def parse_value(value_str):
        """Parse einen Wert (String, Number, Boolean, Array, Object)"""
        value_str = value_str.strip()
        if not value_str:
            return None

        # Boolean
        if value_str.lower() == 'true':
            return True
        if value_str.lower() == 'false':
            return False

        # Number
        try:
            if '.' in value_str:
                return float(value_str)
            else:
                return int(value_str)
        except ValueError:
            pass

        # String (entferne Anführungszeichen)
        if value_str.startswith('"') and value_str.endswith('"'):
            return value_str[1:-1]
        if value_str.startswith("'") and value_str.endswith("'"):
            return value_str[1:-1]

        return value_str

    def parse_object(lines, start_idx, indent_level=0):
        """Parse ein TOON-Objekt"""
        obj = {}
        i = start_idx

        while i < len(lines):
            line = lines[i]
            stripped = line.strip()

            if not stripped or stripped.startswith('#'):
                i += 1
                continue

            # Prüfe Einrückung
            current_indent = len(line) - len(line.lstrip())
            # Breche ab, wenn Einrückung kleiner als erwartet (nächster Abschnitt)
            if current_indent < indent_level:
                break

            # Objekt-Struktur: key{fields}: oder key[count]{fields}:
            # WICHTIG: Nur matchen wenn {fields}: vorhanden ist (verschachteltes Objekt) oder [count] vorhanden ist (Array)
            # Einfache Key-Value-Paare wie "key: value" sollen NICHT hier gematcht werden
            # Die Zeile muss mit ":" enden UND entweder [count] oder {fields} enthalten
            key_match = re.match(r'^([a-zA-Z_][a-zA-Z0-9_]*)(\[(\d+)\])?(\{([^}]*)\})?:$', stripped)
            if key_match:
                key = key_match.group(1)
                count = key_match.group(3)
                fields = key_match.group(5)

                # Nur verarbeiten wenn es wirklich ein verschachteltes Objekt oder Array ist
                # (nicht ein einfaches Key-Value-Paar wie "key: value")
                if count or fields:
                    i += 1

                    if count:  # Array
                        array = []
                        expected_count = int(count)

                        # Suche nach Array-Elementen mit Pattern: key[0]{...}:, key[1]{...}:, etc.
                        # Gehe durch alle Zeilen und finde Array-Element-Header
                        j = i
                        while j < len(lines) and len(array) < expected_count:
                            line = lines[j]
                            line_stripped = line.strip()

                            # Prüfe ob es ein Array-Element-Header ist (issues[0]{...}:, issues[1]{...}:, etc.)
                            item_header_match = re.match(r'^' + re.escape(key) + r'\[(\d+)\].*?:', line_stripped)
                            if item_header_match:
                                item_index = int(item_header_match.group(1))
                                if item_index == len(array):  # Erwartetes nächstes Element
                                    # Parse das Objekt nach dem Header
                                    j += 1  # Überspringe Header-Zeile
                                    item = {}
                                    item_indent = indent_level + 2  # Array-Elemente sind eingerückt

                                    # Lese Felder des Objekts
                                    while j < len(lines):
                                        item_line = lines[j]
                                        item_line_stripped = item_line.strip()
                                        if not item_line_stripped:
                                            j += 1
                                            continue

                                        item_line_indent = len(item_line) - len(item_line.lstrip())

                                        # Prüfe ob neues Array-Element beginnt (issues[1], issues[2], etc.)
                                        if re.match(r'^' + re.escape(key) + r'\[', item_line_stripped):
                                            break

                                        # Prüfe ob Einrückung zu gering (nächstes Top-Level-Objekt)
                                        if item_line_indent <= indent_level and item_line_stripped:
                                            break

                                        # Key-Value-Paar
                                        if ':' in item_line_stripped and not item_line_stripped.endswith(':'):
                                            parts = item_line_stripped.split(':', 1)
                                            if len(parts) == 2:
                                                field_key = parts[0].strip()
                                                field_value = parts[1].strip()
                                                item[field_key] = parse_value(field_value)

                                        j += 1

                                    if item:
                                        array.append(item)
                                    i = j  # Setze Position für nächste Iteration
                                    continue

                            j += 1

                        # Falls keine Header gefunden, versuche altes Format (mit Einrückung ohne Header)
                        if len(array) == 0:
                            i += 1
                            while i < len(lines) and len(array) < expected_count:
                                line = lines[i]
                                line_stripped = line.strip()
                                if not line_stripped:
                                    i += 1
                                    continue

                                current_indent = len(line) - len(line.lstrip())
                                if current_indent <= indent_level:
                                    break

                                # Objekt in Array (mit Einrückung)
                                if current_indent > indent_level:
                                    item = {}
                                    item_indent = current_indent

                                    # Lese Felder des Items
                                    while i < len(lines):
                                        line = lines[i]
                                        line_stripped = line.strip()
                                        if not line_stripped:
                                            i += 1
                                            continue

                                        line_indent = len(line) - len(line.lstrip())
                                        if line_indent <= item_indent:
                                            break

                                        if ':' in line_stripped and not line_stripped.endswith(':'):
                                            parts = line_stripped.split(':', 1)
                                            if len(parts) == 2:
                                                field_key = parts[0].strip()
                                                field_value = parts[1].strip()
                                                item[field_key] = parse_value(field_value)
                                        i += 1

                                    if item:
                                        array.append(item)
                                else:
                                    i += 1

                        obj[key] = array
                    else:  # Objekt (verschachtelt)
                        # Rekursiv Objekt parsen
                        nested_obj, new_i = parse_object(lines, i, indent_level + 2)
                        if nested_obj:
                            obj[key] = nested_obj
                        i = new_i
                        continue

            # Key-Value-Paar: key: value (einfache Werte)
            elif ':' in stripped and not stripped.endswith(':'):
                parts = stripped.split(':', 1)
                if len(parts) == 2:
                    key = parts[0].strip()
                    value = parts[1].strip()
                    obj[key] = parse_value(value)
                    i += 1
                    continue

            i += 1

        return obj, i

    # Starte Parsing (Top-Level) - sammle alle Top-Level-Elemente
    result = {}
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if not stripped or stripped.startswith('#'):
            i += 1
            continue

        # Prüfe ob es ein Top-Level-Element ist (keine Einrückung)
        current_indent = len(line) - len(line.lstrip())
        if current_indent == 0:
            # Versuche Top-Level-Element zu parsen
            key_match = re.match(r'^([a-zA-Z_][a-zA-Z0-9_]*)(\[(\d+)\])?(\{([^}]*)\})?:', stripped)
            if key_match:
                key = key_match.group(1)
                count = key_match.group(3)

                i += 1

                if count:  # Array-Element-Header (z.B. issues[0], issues[1])
                    # Prüfe ob bereits ein Array für diesen Key existiert
                    if key not in result:
                        result[key] = []

                    # Parse das aktuelle Array-Element
                    item_index = int(count)
                    item = {}
                    item_indent = 2  # Array-Elemente sind eingerückt

                    # Lese Felder des Objekts
                    j = i
                    while j < len(lines):
                        item_line = lines[j]
                        item_line_stripped = item_line.strip()
                        if not item_line_stripped:
                            j += 1
                            continue

                        item_line_indent = len(item_line) - len(item_line.lstrip())

                        # Prüfe ob neues Array-Element beginnt (issues[1], issues[2], etc.)
                        next_item_match = re.match(r'^' + re.escape(key) + r'\[(\d+)\].*?:', item_line_stripped)
                        if next_item_match:
                            break

                        # Prüfe ob Einrückung zu gering (nächstes Top-Level-Element)
                        if item_line_indent == 0 and item_line_stripped:
                            # Neues Top-Level-Element (nicht issues)
                            break

                        # Key-Value-Paar
                        if ':' in item_line_stripped and not item_line_stripped.endswith(':'):
                            parts = item_line_stripped.split(':', 1)
                            if len(parts) == 2:
                                field_key = parts[0].strip()
                                field_value = parts[1].strip()
                                item[field_key] = parse_value(field_value)

                        j += 1

                    if item:
                        # Stelle sicher, dass das Array groß genug ist
                        while len(result[key]) <= item_index:
                            result[key].append({})
                        result[key][item_index] = item

                    i = j
                    continue
                else:  # Objekt (z.B. summary)
                    nested_obj, new_i = parse_object(lines, i, 2)  # Top-Level-Objekte haben Einrückung 2
                    # Immer zuweisen, auch wenn leer (damit summary nicht fehlt)
                    if nested_obj is not None:
                        result[key] = nested_obj
                    else:
                        # Debug: Wenn None zurückgegeben wird, erstelle leeres Objekt
                        result[key] = {}
                    i = new_i
                    continue

        i += 1

    return result if result else None

if not TOON_AVAILABLE:
    print("⚠️ TOON-Bibliothek nicht verfügbar, versuche JSON-Extraktion...", file=sys.stderr)
    # Fallback zu JSON-Extraktion
    import subprocess
    result = subprocess.run([sys.executable, "scripts/ai-review-extract-json.py"],
                          capture_output=True, text=True)
    sys.exit(result.returncode)

# Versuche verschiedene Input-Dateien (in dieser Reihenfolge)
input_files = [
    RAW_FILE,  # Primär: Raw-Output vom cursor-agent
    TOON_FILE,  # Sekundär: Bereits gespeicherte TOON-Datei
    OUTPUT_FILE,  # Tertiär: JSON-Datei (falls bereits konvertiert)
]

content = None
source_file = None
for input_file in input_files:
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
            source_file = input_file
            print(f"✅ Input-Datei gefunden: {input_file}", file=sys.stderr)

            # Prüfe ob es bereits gültiges JSON ist
            try:
                json.loads(content)
                print("✅ Datei ist bereits gültiges JSON - kopiere direkt", file=sys.stderr)
                with open(OUTPUT_FILE, 'w', encoding='utf-8') as out:
                    out.write(content)
                sys.exit(0)
            except json.JSONDecodeError:
                pass
            break
    except FileNotFoundError:
        continue

if content is None:
    print(f"❌ Keine Input-Datei gefunden. Gesucht in: {', '.join(input_files)}", file=sys.stderr)
    sys.exit(1)

if not content or not content.strip():
    print("Error: Empty output file", file=sys.stderr)
    sys.exit(1)

# Entferne führenden Text vor TOON
# Suche nach erstem TOON-Key (beginnt mit Buchstabe, gefolgt von { oder :)
toon_pattern = r'([a-zA-Z_][a-zA-Z0-9_]*(\[.*?\])?\{.*?\}:)'
toon_match = re.search(toon_pattern, content)
if toon_match:
    toon_str = content[toon_match.start():]
else:
    # Versuche gesamten Content als TOON
    toon_str = content.strip()

# Entferne Markdown-Formatierung falls vorhanden
toon_str = re.sub(r'^```toon\s*', '', toon_str, flags=re.MULTILINE)
toon_str = re.sub(r'^```\s*', '', toon_str, flags=re.MULTILINE)
toon_str = re.sub(r'```\s*$', '', toon_str, flags=re.MULTILINE)
toon_str = toon_str.strip()

# Entferne führenden Text (z.B. "Zusammenfassung der Analyse im TOON-Format:")
lines = toon_str.split('\n')
start_idx = 0
for i, line in enumerate(lines):
    if re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*(\[.*?\])?\{.*?\}:', line.strip()):
        start_idx = i
        break
toon_str = '\n'.join(lines[start_idx:])

# Speichere TOON-Version (vor Parsing)
with open(TOON_FILE, 'w', encoding='utf-8') as f:
    f.write(toon_str)

# Versuche TOON zu parsen
json_obj = None
parse_error = None

try:
    if hasattr(toon, 'decode'):
        json_obj = toon.decode(toon_str)
    elif hasattr(toon, 'loads'):
        json_obj = toon.loads(toon_str)
    else:
        raise AttributeError("Keine decode/loads Funktion gefunden")
except Exception as e:
    parse_error = e
    print(f"⚠️ TOON-Bibliothek-Parsing fehlgeschlagen: {e}", file=sys.stderr)
    print(f"Versuche manuelle TOON→JSON Konvertierung...", file=sys.stderr)

    # Versuche manuelle Konvertierung
    try:
        json_obj = parse_toon_manually(toon_str)
        if json_obj:
            print("✅ Manuelle TOON-Konvertierung erfolgreich", file=sys.stderr)
    except Exception as e2:
        print(f"⚠️ Auch manuelle Konvertierung fehlgeschlagen: {e2}", file=sys.stderr)
        parse_error = e2

if json_obj:
    # Speichere als JSON (für Kompatibilität mit bestehenden Skripten)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(json_obj, f, indent=2, ensure_ascii=False)

    print(f"✅ TOON extracted and converted to JSON (TOON length: {len(toon_str)} chars)", file=sys.stderr)
    sys.exit(0)
else:
    print(f"❌ Failed to parse TOON: {parse_error}", file=sys.stderr)
    print(f"Attempted to parse: {toon_str[:500]}...", file=sys.stderr)
    # Fallback zu JSON-Extraktion
    print("⚠️ Falling back to JSON extraction...", file=sys.stderr)
    import subprocess
    result = subprocess.run([sys.executable, "scripts/ai-review-extract-json.py"],
                          capture_output=True, text=True)
    sys.exit(result.returncode)
