#!/bin/bash
# Installiere alle benötigten Tools für AI Review Skripte in WSL

set -e

echo "🔧 Installiere benötigte Tools für WSL..."
echo ""

# Aktualisiere Package-Liste
echo "📦 Aktualisiere Package-Liste..."
apt-get update -qq

# Installiere essentielle Tools
echo "📦 Installiere essentielle Tools..."
apt-get install -y \
    grep \
    sed \
    gawk \
    findutils \
    coreutils \
    git \
    python3 \
    python3-pip \
    curl \
    wget \
    bash \
    procps \
    util-linux \
    build-essential

echo ""
echo "✅ Basis-Tools installiert"
echo ""

# Installiere Python-Abhängigkeiten
echo "📦 Installiere Python-Abhängigkeiten..."
python3 -m pip install --user python-dotenv 2>&1 | grep -v "WARNING:" || true

echo ""
echo "✅ Python-Abhängigkeiten installiert"
echo ""

# Prüfe Installationen
echo "🔍 Prüfe Installationen..."
echo ""

TOOLS=("grep" "sed" "awk" "find" "git" "python3" "curl" "bash")
ALL_OK=true

for tool in "${TOOLS[@]}"; do
    if command -v "$tool" &> /dev/null; then
        echo "✅ $tool: $(which $tool)"
    else
        echo "❌ $tool: Nicht gefunden"
        ALL_OK=false
    fi
done

echo ""
if [ "$ALL_OK" = true ]; then
    echo "✅ Alle Tools erfolgreich installiert!"
    exit 0
else
    echo "⚠️ Einige Tools konnten nicht installiert werden"
    exit 1
fi

