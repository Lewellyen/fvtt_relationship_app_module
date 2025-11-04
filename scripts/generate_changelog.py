#!/usr/bin/env python3
"""
Generiert CHANGELOG.md aus den Release Notes in docs/development/foundry/releases.
"""

import re
from pathlib import Path

def main():
    root = Path(__file__).parent.parent
    changelog_path = root / "CHANGELOG.md"
    release_dir = root / "docs/development/foundry/releases"

    # Lese Header bis Unreleased
    text = changelog_path.read_text(encoding='utf-8')
    if "## [Unreleased]" in text:
        header, _ = text.split("## [Unreleased]", 1)
    else:
        header = text
    header = header.rstrip() + "\n\n"

    # Neuer Unreleased-Block
    unreleased_block = "## [Unreleased]\n\n### Hinzugefügt\n\n### Geändert\n\n### Fehlerbehebungen\n\n"

    # Sammle Releases (absteigend nach Version)
    sections = []
    for file in sorted(release_dir.glob('v*.md'), reverse=True):
        content = file.read_text(encoding='utf-8').splitlines()
        # Version aus Dateiname
        version = file.stem.lstrip('v')
        # Datum aus Zeile mit Veröffentlichung
        date_line = next((l for l in content if l.startswith('**Veröffentlichungsdatum:**')), None)
        date = date_line.replace('**Veröffentlichungsdatum:**', '').strip() if date_line else ''
        # Restliche Zeilen nach Datum + leerer Zeile
        idx = content.index(date_line) + 2 if date_line in content else 3
        body_lines = content[idx:]
        # Überschriften anpassen (## -> ###)
        body = []
        for line in body_lines:
            if line.startswith('## '):
                body.append('### ' + line[3:])
            else:
                body.append(line)
        section = f"## [{version}] - {date}\n" + "\n".join(body).rstrip() + "\n\n"
        sections.append(section)

    # Schreibe neues CHANGELOG.md
    new_text = header + unreleased_block + ''.join(sections)
    changelog_path.write_text(new_text, encoding='utf-8')

if __name__ == '__main__':
    main() 