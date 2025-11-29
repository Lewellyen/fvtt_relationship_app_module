#!/usr/bin/env python3
"""
TOON (Token-Oriented Object Notation) Converter für AI-Workflows.

Konvertiert zwischen JSON und TOON-Format für Token-Optimierung in LLM-Prompts.
"""
import json
import sys
import os

# Versuche verschiedene TOON-Bibliotheken zu importieren
toon = None
import subprocess

# Liste der möglichen Pakete und ihre Import-Namen
packages_to_try = [
    ("toon-formatter", ["toon_formatter", "toonformatter"]),
    ("python-toon", ["toon", "python_toon"]),
    ("toons", ["toons"]),
]

# Versuche zuerst, ob bereits etwas installiert ist
for package_name, import_names in packages_to_try:
    for import_name in import_names:
        try:
            toon = __import__(import_name)
            print(f"✅ Erfolgreich importiert: {import_name} (aus {package_name})", file=sys.stderr)
            break
        except ImportError:
            continue
    if toon is not None:
        break

# Falls nichts gefunden wurde, versuche Installation
if toon is None:
    print("⚠️ Keine TOON-Bibliothek gefunden. Versuche Installation...", file=sys.stderr)
    for package_name, import_names in packages_to_try:
        print(f"📦 Installiere {package_name}...", file=sys.stderr)
        result = subprocess.run([sys.executable, "-m", "pip", "install", package_name],
                              capture_output=True, text=True)
        if result.returncode == 0:
            # Versuche nach Installation zu importieren
            for import_name in import_names:
                try:
                    toon = __import__(import_name)
                    print(f"✅ Nach Installation erfolgreich importiert: {import_name}", file=sys.stderr)
                    break
                except ImportError:
                    continue
            if toon is not None:
                break
        else:
            print(f"⚠️ Installation von {package_name} fehlgeschlagen", file=sys.stderr)

# Falls immer noch nichts gefunden, prüfe ob es Funktionen direkt gibt
if toon is None:
    try:
        from toon_formatter import dumps, loads
        # Erstelle Wrapper-Objekt
        class ToonWrapper:
            @staticmethod
            def dumps(obj):
                return dumps(obj)
            @staticmethod
            def loads(s):
                return loads(s)
        toon = ToonWrapper()
        print("✅ Wrapper für toon_formatter Funktionen erstellt", file=sys.stderr)
    except ImportError:
        try:
            from toon import dumps, loads
            class ToonWrapper:
                @staticmethod
                def dumps(obj):
                    return dumps(obj)
                @staticmethod
                def loads(s):
                    return loads(s)
            toon = ToonWrapper()
            print("✅ Wrapper für toon Funktionen erstellt", file=sys.stderr)
        except ImportError:
            print("❌ Keine TOON-Bibliothek konnte importiert werden", file=sys.stderr)
            print("Verfügbare Pakete:", file=sys.stderr)
            result = subprocess.run([sys.executable, "-m", "pip", "list"], capture_output=True, text=True)
            print(result.stdout, file=sys.stderr)
            sys.exit(1)


def json_to_toon(json_data):
    """Konvertiert JSON-Daten zu TOON-Format."""
    try:
        if isinstance(json_data, str):
            json_obj = json.loads(json_data)
        else:
            json_obj = json_data

        # Versuche verschiedene API-Varianten
        if hasattr(toon, 'dumps'):
            toon_str = toon.dumps(json_obj)
        elif hasattr(toon, 'encode'):
            toon_str = toon.encode(json_obj)
        else:
            # Versuche direkten Funktionszugriff
            if hasattr(toon, 'encoder'):
                toon_str = toon.encoder.encode(json_obj)
            else:
                raise AttributeError("Keine encode/dumps Funktion gefunden")

        return toon_str
    except Exception as e:
        print(f"❌ Fehler bei JSON→TOON Konvertierung: {e}", file=sys.stderr)
        return None


def toon_to_json(toon_str):
    """Konvertiert TOON-Format zu JSON."""
    try:
        # Versuche verschiedene API-Varianten
        if hasattr(toon, 'loads'):
            json_obj = toon.loads(toon_str)
        elif hasattr(toon, 'decode'):
            json_obj = toon.decode(toon_str)
        else:
            # Versuche direkten Funktionszugriff
            if hasattr(toon, 'decoder'):
                json_obj = toon.decoder.decode(toon_str)
            else:
                raise AttributeError("Keine decode/loads Funktion gefunden")

        return json.dumps(json_obj, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"❌ Fehler bei TOON→JSON Konvertierung: {e}", file=sys.stderr)
        return None


def estimate_tokens(text):
    """
    Schätzt Token-Anzahl basierend auf Text-Länge.
    Grobe Schätzung: ~4 Zeichen pro Token (konservativ).
    """
    # Entferne Whitespace für genauere Schätzung
    cleaned = ' '.join(text.split())
    char_count = len(cleaned)
    # ~4 Zeichen pro Token ist eine konservative Schätzung
    # (tatsächlich variiert es je nach Tokenizer, aber für Vergleich reicht das)
    return int(char_count / 4)


def compare_formats(json_data, toon_data):
    """Vergleicht JSON und TOON und gibt Statistiken aus."""
    json_str = json.dumps(json_data, ensure_ascii=False) if isinstance(json_data, dict) else json_data
    json_tokens = estimate_tokens(json_str)
    toon_tokens = estimate_tokens(toon_data)

    reduction = ((json_tokens - toon_tokens) / json_tokens * 100) if json_tokens > 0 else 0

    return {
        "json_size": len(json_str),
        "toon_size": len(toon_data),
        "json_tokens_est": json_tokens,
        "toon_tokens_est": toon_tokens,
        "reduction_percent": round(reduction, 2),
        "tokens_saved": json_tokens - toon_tokens
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Verwendung:")
        print("  python3 scripts/toon-converter.py json-to-toon <input.json> [output.toon]")
        print("  python3 scripts/toon-converter.py toon-to-json <input.toon> [output.json]")
        print("  python3 scripts/toon-converter.py compare <input.json>")
        sys.exit(1)

    command = sys.argv[1]

    if command == "json-to-toon":
        if len(sys.argv) < 3:
            print("❌ Fehler: Eingabedatei fehlt")
            sys.exit(1)

        input_file = sys.argv[2]
        output_file = sys.argv[3] if len(sys.argv) > 3 else None

        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                json_data = json.load(f)

            toon_str = json_to_toon(json_data)
            if toon_str is None:
                sys.exit(1)

            if output_file:
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(toon_str)
                print(f"✅ TOON-Datei erstellt: {output_file}")
            else:
                print(toon_str)

        except FileNotFoundError:
            print(f"❌ Datei nicht gefunden: {input_file}", file=sys.stderr)
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"❌ Ungültiges JSON: {e}", file=sys.stderr)
            sys.exit(1)

    elif command == "toon-to-json":
        if len(sys.argv) < 3:
            print("❌ Fehler: Eingabedatei fehlt")
            sys.exit(1)

        input_file = sys.argv[2]
        output_file = sys.argv[3] if len(sys.argv) > 3 else None

        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                toon_str = f.read()

            json_str = toon_to_json(toon_str)
            if json_str is None:
                sys.exit(1)

            if output_file:
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(json_str)
                print(f"✅ JSON-Datei erstellt: {output_file}")
            else:
                print(json_str)

        except FileNotFoundError:
            print(f"❌ Datei nicht gefunden: {input_file}", file=sys.stderr)
            sys.exit(1)

    elif command == "compare":
        if len(sys.argv) < 3:
            print("❌ Fehler: Eingabedatei fehlt")
            sys.exit(1)

        input_file = sys.argv[2]

        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                json_data = json.load(f)

            toon_str = json_to_toon(json_data)
            if toon_str is None:
                sys.exit(1)

            stats = compare_formats(json_data, toon_str)

            print("📊 Format-Vergleich:")
            print(f"  JSON Größe: {stats['json_size']} Bytes")
            print(f"  TOON Größe: {stats['toon_size']} Bytes")
            print(f"  JSON Tokens (geschätzt): {stats['json_tokens_est']}")
            print(f"  TOON Tokens (geschätzt): {stats['toon_tokens_est']}")
            print(f"  Token-Einsparung: {stats['tokens_saved']} ({stats['reduction_percent']}%)")

        except FileNotFoundError:
            print(f"❌ Datei nicht gefunden: {input_file}", file=sys.stderr)
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"❌ Ungültiges JSON: {e}", file=sys.stderr)
            sys.exit(1)

    else:
        print(f"❌ Unbekannter Befehl: {command}", file=sys.stderr)
        sys.exit(1)

