#!/bin/bash
set -e

# Stelle sicher dass Standard-PATH gesetzt ist
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$HOME/.local/bin:$PATH"

MODE="${1:-incremental}"

# Prüfe Cursor API Key (lade .env falls vorhanden mit Python)
if [ -f .env ] && command -v python3 &> /dev/null; then
    echo "📄 Lade .env Datei..."
    # Lade .env mit Python-dotenv (am zuverlässigsten)
    eval "$(python3 << 'PYTHON_EOF'
import os
try:
    from dotenv import load_dotenv
    load_dotenv()
    # Exportiere alle wichtigen Variablen
    for key in ['CURSOR_API_KEY', 'CURSOR_AI_MODEL']:
        value = os.getenv(key)
        if value:
            # Escape quotes für bash
            value = value.replace('"', '\\"').replace('$', '\\$')
            print(f'export {key}="{value}"')
except Exception as e:
    pass
PYTHON_EOF
)"
fi

# Prüfe ob API Key gesetzt ist (auch nach .env Laden)
if [ -z "$CURSOR_API_KEY" ]; then
    # Versuche mit Python zu laden (falls verfügbar)
    if command -v python3 &> /dev/null; then
        CURSOR_API_KEY=$(python3 -c "
import os
try:
    from dotenv import load_dotenv
    load_dotenv()
    print(os.getenv('CURSOR_API_KEY', ''))
except:
    pass
" 2>/dev/null)
        if [ -n "$CURSOR_API_KEY" ]; then
            export CURSOR_API_KEY
        fi
    fi

    if [ -z "$CURSOR_API_KEY" ]; then
        echo "❌ CURSOR_API_KEY nicht gefunden!"
        echo ""
        echo "Lösungsmöglichkeiten:"
        echo "1. Erstelle eine .env Datei im Projekt-Root:"
        echo "   CURSOR_API_KEY=dein-api-key-hier"
        echo ""
        echo "2. Oder setze Umgebungsvariable:"
        echo "   export CURSOR_API_KEY='dein-key'"
        echo ""
        echo "3. Kopiere .env.example zu .env als Vorlage"
        exit 1
    fi
fi

# Prüfe und setze PATH für Cursor CLI (WSL Standard-Installation)
# Bereinige PATH von Windows-Pfaden und setze sauberen Linux-PATH
CLEAN_PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$HOME/.local/bin"
# Entferne Windows-Pfade aus PATH
CLEAN_PATH=$(echo "$PATH" | tr ':' '\n' | grep -v '^[A-Z]:' | grep -v '\\\\' | tr '\n' ':' | sed 's/:$//')
export PATH="$CLEAN_PATH:$HOME/.local/bin"

# Prüfe Cursor CLI
if ! command -v cursor-agent &> /dev/null; then
    # Versuche direkten Pfad
    if [ -f "$HOME/.local/bin/cursor-agent" ]; then
        export PATH="$HOME/.local/bin:$PATH"
    else
        echo "❌ Cursor CLI nicht gefunden!"
        echo ""
        echo "Installiere Cursor CLI:"
        echo "  curl https://cursor.com/install -fsS | bash"
        echo ""
        echo "Oder siehe: docs/AI_CODE_REVIEW_LOCAL_TESTING.md"
        exit 1
    fi
fi

echo "✅ Cursor CLI gefunden: $(which cursor-agent || echo '$HOME/.local/bin/cursor-agent')"
echo "✅ API Key gesetzt (Länge: ${#CURSOR_API_KEY} Zeichen)"

# Erstelle temporäres Verzeichnis
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

ANALYSIS_PROMPT="$TEMP_DIR/analysis-prompt.md"
ANALYSIS_OUTPUT="/tmp/analysis-output.json"

# Bestimme zu analysierende Dateien
case "$MODE" in
    incremental)
        echo ""
        echo "🔍 Modus: Incremental (geänderte Dateien)"
        FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null | grep -E '\.(ts|js|svelte)$' | grep -v '\.test\.' | grep -v '\.spec\.' || true)
        if [ -z "$FILES" ]; then
            echo "⚠️ Keine geänderten Dateien gefunden (versuche mit HEAD)"
            FILES=$(git diff --name-only HEAD HEAD~1 2>/dev/null | grep -E '\.(ts|js|svelte)$' | grep -v '\.test\.' | grep -v '\.spec\.' || true)
        fi
        ;;
    full)
        echo ""
        echo "🔍 Modus: Full Project (all)"
        find src templates styles -type f \( -name "*.ts" -o -name "*.js" -o -name "*.svelte" -o -name "*.css" -o -name "*.hbs" -o -name "*.html" \) ! -path "*/node_modules/*" ! -name "*.test.*" ! -name "*.spec.*" 2>/dev/null > "$TEMP_DIR/files.txt"
        FILES=$(cat "$TEMP_DIR/files.txt" 2>/dev/null || echo "")
        ;;
    full-src)
        echo ""
        echo "🔍 Modus: Full Project (src)"
        find src -type f \( -name "*.ts" -o -name "*.js" -o -name "*.svelte" \) ! -path "*/node_modules/*" ! -name "*.test.*" ! -name "*.spec.*" 2>/dev/null > "$TEMP_DIR/files.txt"
        FILES=$(cat "$TEMP_DIR/files.txt" 2>/dev/null || echo "")
        ;;
    *)
        echo "❌ Unbekannter Modus: $MODE"
        echo "Verfügbare Modi: incremental, full, full-src"
        exit 1
        ;;
esac

if [ -z "$FILES" ]; then
    echo "⚠️ Keine Dateien zum Analysieren gefunden"
    exit 0
fi

FILE_COUNT=$(echo "$FILES" | grep -v '^$' | wc -l | tr -d ' ')
echo "📄 Gefundene Dateien: $FILE_COUNT"

if [ "$FILE_COUNT" -le 10 ]; then
    echo "$FILES" | while IFS= read -r file; do
        [ -n "$file" ] && echo "  - $file"
    done
else
    echo "$FILES" | head -5 | while IFS= read -r file; do
        [ -n "$file" ] && echo "  - $file"
    done
    echo "  ... und $((FILE_COUNT - 5)) weitere"
fi

# Erstelle vereinfachten Prompt (für lokales Testen)
echo ""
echo "📝 Erstelle Analyse-Prompt..."

cat > "$ANALYSIS_PROMPT" << 'EOF'
Du bist ein Code-Reviewer für ein TypeScript-Projekt mit Clean Architecture.

Analysiere die folgenden Dateien auf:
- SOLID-Prinzipien
- Result-Pattern Konformität
- Clean Architecture Schichttrennung
- Code Smells & Anti-Patterns
- Bugs

Gib das Ergebnis als JSON aus (KEIN Markdown, NUR JSON):

{
  "summary": {
    "total_issues": 0,
    "by_type": {},
    "by_severity": {}
  },
  "issues": []
}

Dateien zum Analysieren:
EOF

# Füge erste 3 Dateien als Beispiel hinzu
echo "$FILES" | head -3 | while IFS= read -r file; do
    if [ -n "$file" ] && [ -f "$file" ]; then
        echo "" >> "$ANALYSIS_PROMPT"
        echo "## $file" >> "$ANALYSIS_PROMPT"
        echo "\`\`\`typescript" >> "$ANALYSIS_PROMPT"
        head -50 "$file" >> "$ANALYSIS_PROMPT" 2>/dev/null || true
        echo "\`\`\`" >> "$ANALYSIS_PROMPT"
    fi
done

echo "✅ Prompt erstellt: $ANALYSIS_PROMPT"

# Führe Cursor AI Analyse aus
# Setze Standard-Modell falls nicht in .env definiert oder leer
# ${VAR:-default} überschreibt nur wenn VAR nicht gesetzt ist, nicht wenn leer
# Daher prüfen wir explizit auf Leer-Sein
if [ -z "$CURSOR_AI_MODEL" ]; then
    CURSOR_AI_MODEL="sonnet-4.5"
fi

echo ""
echo "🤖 Starte Cursor AI Analyse..."
echo "   (Dies kann einige Minuten dauern...)"
echo "   Modell: $CURSOR_AI_MODEL"

cursor-agent -p "$(cat "$ANALYSIS_PROMPT")" --model "$CURSOR_AI_MODEL" > "$ANALYSIS_OUTPUT" 2>&1 || {
    EXIT_CODE=$?
    echo "⚠️ Cursor AI Analyse beendet mit Exit Code: $EXIT_CODE"
}

# Prüfe Output
if [ -f "$ANALYSIS_OUTPUT" ] && [ -s "$ANALYSIS_OUTPUT" ]; then
    echo ""
    echo "✅ Analyse abgeschlossen!"
    echo "📊 Output gespeichert: $ANALYSIS_OUTPUT"

    # Versuche JSON zu extrahieren
    echo ""
    echo "🔍 Parse JSON-Ergebnisse..."
    python3 scripts/ai-review-extract-json.py 2>&1 || true

    if [ -f "$ANALYSIS_OUTPUT" ]; then
        # Zeige Zusammenfassung
        echo ""
        echo "📋 Zusammenfassung:"
        python3 scripts/ai-review-summary.py 2>&1 || true
    fi

    # Zeige ersten Teil des Outputs
    echo ""
    echo "📄 Output Preview (erste 500 Zeichen):"
    head -c 500 "$ANALYSIS_OUTPUT"
    echo ""
else
    echo "⚠️ Output-Datei ist leer oder wurde nicht erstellt"
    if [ -f "$ANALYSIS_OUTPUT" ]; then
        echo "Datei existiert, aber ist leer"
    fi
fi

echo ""
echo "💡 Tipp: Output-Datei: $ANALYSIS_OUTPUT"
echo "   Du kannst sie manuell öffnen und prüfen."

