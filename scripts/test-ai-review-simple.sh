#!/bin/bash
# Vereinfachtes Test-Skript - funktioniert auch mit minimalen Tools

# Sauberer PATH (nur Linux, keine Windows-Pfade)
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$HOME/.local/bin"

MODE="${1:-incremental}"

echo "🚀 AI Code Review Test (Simplified)"
echo "===================================="
echo ""

# Lade .env mit Python
if [ -f .env ] && command -v python3 > /dev/null 2>&1; then
    echo "📄 Lade .env..."
    eval "$(python3 -c "
import os
try:
    from dotenv import load_dotenv
    load_dotenv()
    # Lade API Key und Model
    api_key = os.getenv('CURSOR_API_KEY', '')
    model = os.getenv('CURSOR_AI_MODEL', '')
    if api_key:
        api_key = api_key.replace('\"', '\\\"').replace('\$', '\\\$')
        print(f'export CURSOR_API_KEY=\"{api_key}\"')
    if model:
        model = model.replace('\"', '\\\"').replace('\$', '\\\$')
        print(f'export CURSOR_AI_MODEL=\"{model}\"')
except:
    pass
" 2>/dev/null)"

    if [ -n "$CURSOR_API_KEY" ]; then
        echo "✅ API Key geladen (Länge: ${#CURSOR_API_KEY})"
    else
        echo "❌ API Key nicht gefunden in .env"
        exit 1
    fi
else
    echo "❌ .env Datei oder python3 nicht gefunden"
    exit 1
fi

# Prüfe Cursor CLI
if ! command -v cursor-agent > /dev/null 2>&1; then
    echo "❌ cursor-agent nicht gefunden"
    echo "   Installiere mit: curl https://cursor.com/install.sh | bash"
    exit 1
fi

echo "✅ Cursor CLI: $(which cursor-agent)"
echo ""

# Finde Dateien
if [ "$MODE" = "incremental" ]; then
    echo "🔍 Suche geänderte Dateien..."
    FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only HEAD HEAD~1 2>/dev/null || echo "")
    FILES=$(echo "$FILES" | python3 -c "
import sys
files = [f.strip() for f in sys.stdin if f.strip() and (f.endswith('.ts\\n') or f.endswith('.js\\n') or f.endswith('.svelte\\n')) and 'test' not in f and 'spec' not in f]
for f in files:
    print(f)
" 2>/dev/null || echo "")

    if [ -z "$FILES" ]; then
        echo "⚠️ Keine geänderten Dateien gefunden"
        exit 0
    fi

    COUNT=$(echo "$FILES" | python3 -c "import sys; print(len([l for l in sys.stdin if l.strip()]))" 2>/dev/null || echo "0")
    echo "📄 $COUNT Dateien gefunden"
else
    echo "🔍 Suche alle Dateien in src/..."
    FILES=$(python3 -c "
import os
files = []
for root, dirs, filenames in os.walk('src'):
    if 'node_modules' in root:
        continue
    for f in filenames:
        if f.endswith(('.ts', '.js', '.svelte')) and 'test' not in f and 'spec' not in f:
            files.append(os.path.join(root, f))
for f in files[:10]:  # Erste 10 für Test
    print(f)
" 2>/dev/null || echo "")

    if [ -z "$FILES" ]; then
        echo "⚠️ Keine Dateien gefunden"
        exit 0
    fi
    COUNT=$(echo "$FILES" | python3 -c "import sys; print(len([l for l in sys.stdin if l.strip()]))" 2>/dev/null || echo "0")
    echo "📄 $COUNT Dateien (erste 10 für Test)"
fi

echo ""

# Erstelle einfachen Prompt
PROMPT=$(python3 << 'PYEOF'
prompt = """Analysiere diesen TypeScript-Code auf SOLID-Prinzipien, Result-Pattern, Clean Architecture.

Gib NUR JSON zurück (kein Markdown):

{
  "summary": {"total_issues": 0, "by_type": {}, "by_severity": {}},
  "issues": []
}

Code:"""
print(prompt)
PYEOF
)

# Füge erste Datei hinzu
FIRST_FILE=$(echo "$FILES" | python3 -c "import sys; print(sys.stdin.readline().strip())" 2>/dev/null || echo "")
if [ -n "$FIRST_FILE" ] && [ -f "$FIRST_FILE" ]; then
    CONTENT=$(python3 -c "
with open('$FIRST_FILE', 'r') as f:
    lines = f.readlines()[:30]
    print(''.join(lines))
" 2>/dev/null || echo "")
    PROMPT="$PROMPT

\`\`\`typescript
$CONTENT
\`\`\`"
fi

# Setze Standard-Modell falls nicht in .env definiert oder leer
# ${VAR:-default} überschreibt nur wenn VAR nicht gesetzt ist, nicht wenn leer
# Daher prüfen wir explizit auf Leer-Sein
if [ -z "$CURSOR_AI_MODEL" ]; then
    CURSOR_AI_MODEL="sonnet-4.5"
fi

echo "🤖 Starte Analyse..."
echo "   Modell: $CURSOR_AI_MODEL"
echo ""

# Führe Analyse aus
OUTPUT_FILE="/tmp/analysis-output.json"
cursor-agent -p "$PROMPT" --model "$CURSOR_AI_MODEL" > "$OUTPUT_FILE" 2>&1

if [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
    echo "✅ Analyse abgeschlossen!"
    echo ""

    # Zeige Output
    python3 scripts/ai-review-extract-json.py 2>&1 || true
    python3 scripts/ai-review-summary.py 2>&1 || true
else
    echo "⚠️ Keine Ausgabe erhalten"
    if [ -f "$OUTPUT_FILE" ]; then
        echo "Datei-Inhalt:"
        python3 -c "with open('$OUTPUT_FILE', 'r') as f: print(f.read()[:500])" 2>/dev/null || true
    fi
fi

