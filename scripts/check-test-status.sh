#!/bin/bash
# Prüfe Status des AI Review Tests

echo "🔍 Status-Check AI Review Test"
echo ""

if [ -f /tmp/analysis-output.json ]; then
    echo "✅ Output-Datei vorhanden"
    SIZE=$(python3 -c "import os; print(os.path.getsize('/tmp/analysis-output.json'))")
    echo "   Größe: $SIZE Bytes"
    echo ""
    
    # Prüfe ob gültiges JSON
    if python3 -m json.tool /tmp/analysis-output.json > /dev/null 2>&1; then
        echo "✅ Gültiges JSON gefunden"
        echo ""
        python3 scripts/ai-review-summary.py 2>&1 || true
    else
        echo "⚠️ Datei ist kein gültiges JSON"
        echo ""
        echo "Erste 200 Zeichen:"
        python3 -c "with open('/tmp/analysis-output.json', 'r') as f: print(f.read()[:200])"
    fi
else
    echo "⏳ Output-Datei noch nicht vorhanden"
    echo "   Der Test läuft möglicherweise noch..."
fi

echo ""
echo "💡 Um den Test zu starten:"
echo "   ./scripts/test-ai-review-local.sh incremental"

