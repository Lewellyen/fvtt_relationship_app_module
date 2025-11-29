#!/bin/bash
# Installiere Python-Abhängigkeiten für AI Review Skripte

echo "Installing Python dependencies for AI Review scripts..."

# Prüfe ob Python verfügbar ist
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 nicht gefunden!"
    exit 1
fi

# Prüfe ob wir in einer virtuellen Umgebung sind
if [ -n "$VIRTUAL_ENV" ] || [ -n "$CONDA_DEFAULT_ENV" ]; then
    echo "Virtuelle Umgebung erkannt - installiere ohne --user"
    python3 -m pip install python-dotenv 2>&1 || {
        echo "⚠️ Fehler beim Installieren von python-dotenv"
        echo "Versuche mit pip statt python3 -m pip..."
        pip install python-dotenv || {
            echo "❌ Installation fehlgeschlagen"
            echo "Bitte manuell installieren: pip install python-dotenv"
            exit 1
        }
    }
else
    echo "System-Python erkannt - installiere mit --user"
    python3 -m pip install --user python-dotenv 2>&1 || {
        echo "⚠️ Fehler beim Installieren von python-dotenv"
        echo "Versuche mit pip statt python3 -m pip..."
        pip install --user python-dotenv || {
            echo "❌ Installation fehlgeschlagen"
            echo "Bitte manuell installieren: pip install --user python-dotenv"
            exit 1
        }
    }
fi

echo "✅ Python-Abhängigkeiten installiert"

