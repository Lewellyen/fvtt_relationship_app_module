#!/usr/bin/env python3
import re
import subprocess
from pathlib import Path
import json
import os

# Projekt-Root bestimmen
PROJECT_ROOT = Path(__file__).parent.parent

def update_version_in_file(file_path, new_version):
    """Aktualisiert die Version in einer Datei.
    
    Args:
        file_path (str): Pfad zur Datei
        new_version (str): Die neue Versionsnummer
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Ersetze die Version in der MODULE_VERSION Konstante
    content = re.sub(
        r'MODULE_VERSION:\s*[\'"]([^\'"]+)[\'"]',
        f'MODULE_VERSION: "{new_version}"',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

def run_command(command, cwd=None):
    """Führt einen Shell-Befehl aus und gibt True zurück, wenn erfolgreich.
    
    Args:
        command (str): Der auszuführende Befehl
        cwd (str, optional): Das Arbeitsverzeichnis für den Befehl
    
    Returns:
        bool: True wenn erfolgreich, False wenn fehlgeschlagen
    """
    try:
        subprocess.run(command, shell=True, check=True, cwd=cwd)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Fehler beim Ausführen des Befehls '{command}': {e}")
        return False

def update_documentation(new_version, date):
    """Aktualisiert die Dokumentation für einen neuen Release.
    
    Args:
        new_version (str): Die neue Versionsnummer
        date (str): Das Release-Datum im Format YYYY-MM-DD
    """
    # CHANGELOG.md aktualisieren
    changelog_path = "CHANGELOG.md"
    with open(changelog_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Finde die [Unreleased] Sektion
    unreleased_content = ""
    if "## [Unreleased]" in content:
        # Extrahiere den Inhalt der Unreleased-Sektion
        start = content.index("## [Unreleased]")
        try:
            end = content.index("## [", start + len("## [Unreleased]"))  # Suche nach dem nächsten ##
        except ValueError:
            end = len(content)
        unreleased_content = content[start:end].strip()
        
        # Entferne leere Sektionen
        sections = ["### Hinzugefügt", "### Geändert", "### Fehlerbehebungen"]
        for section in sections:
            if section in unreleased_content:
                section_start = unreleased_content.index(section)
                next_section = float('inf')
                for s in sections:
                    if s in unreleased_content[section_start + len(section):]:
                        pos = unreleased_content.index(s, section_start + len(section))
                        next_section = min(next_section, pos)
                if next_section == float('inf'):
                    next_section = len(unreleased_content)
                
                section_content = unreleased_content[section_start + len(section):next_section].strip()
                if not section_content:
                    unreleased_content = unreleased_content.replace(f"{section}\n\n", "")
    
    # Erstelle neue Version-Sektion
    if unreleased_content and unreleased_content != "## [Unreleased]":
        new_version_content = unreleased_content.replace("[Unreleased]", f"[{new_version}] - {date}")
    else:
        # Erzeuge neuen Versionseintrag mit allen 5 Abschnitten
        new_version_content = (
            f"## [{new_version}] - {date}\n\n"
            "### Hinzugefügt\n\n"
            "### Geändert\n\n"
            "### Fehlerbehebungen\n\n"
            "### Bekannte Probleme\n\n"
            "### Upgrade-Hinweise"
        )
    
    # Erstelle neue [Unreleased] Sektion mit allen 5 Abschnitten
    new_unreleased = """## [Unreleased]

### Hinzugefügt

### Geändert

### Fehlerbehebungen

### Bekannte Probleme

### Upgrade-Hinweise

"""
    
    # Aktualisiere die Datei
    new_content = content.replace(unreleased_content, f"{new_unreleased}{new_version_content}")
    with open(changelog_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    # Extrahiere relevante Sektionen aus dem Changelog
    sections = {}
    for section in ["Hinzugefügt", "Geändert", "Fehlerbehebungen"]:
        if f"### {section}" in new_version_content:
            start = new_version_content.index(f"### {section}") + len(f"### {section}")
            end = new_version_content.find("###", start)
            if end == -1:
                end = len(new_version_content)
            section_content = new_version_content[start:end].strip()
            if section_content:
                sections[section] = section_content
    
    # Erstelle Release Notes für diese Version
    release_notes_dir = Path("docs/releases")
    release_notes_dir.mkdir(exist_ok=True, parents=True)
    release_notes_path = release_notes_dir / f"v{new_version}.md"
    
    release_notes_content = f"""# Release Notes - Version {new_version}

**Veröffentlichungsdatum:** {date}

## Hinzugefügt
{sections.get('Hinzugefügt', '- Keine Einträge')}

## Geändert
{sections.get('Geändert', '- Keine Einträge')}

## Fehlerbehebungen
{sections.get('Fehlerbehebungen', '- Keine Einträge')}

## Bekannte Probleme
- Keine bekannten Probleme

## Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich
"""
    
    with open(release_notes_path, 'w', encoding='utf-8') as f:
        f.write(release_notes_content)

def update_json_version(file_path, new_version):
    """Aktualisiert die Version in einer JSON-Datei unter dem Schlüssel 'version'."""
    path = Path(file_path)
    data = json.loads(path.read_text(encoding='utf-8'))
    data['version'] = new_version
    path.write_text(json.dumps(data, indent=2), encoding='utf-8')

def verify_json_version(file_path, new_version):
    """Verifiziert, dass die Version in JSON-Datei unter 'version' new_version steht."""
    path = Path(file_path)
    data = json.loads(path.read_text(encoding='utf-8'))
    return data.get('version') == new_version

def verify_metadata_update(new_version):
    """Verifiziert, dass alle Metadaten-Dateien korrekt aktualisiert wurden."""
    files_to_check = ["module.json", "package.json", "package-lock.json"]
    all_verified = True
    
    for file_path in files_to_check:
        if not verify_json_version(file_path, new_version):
            print(f"    X Fehler: {file_path} wurde nicht korrekt aktualisiert")
            all_verified = False
        else:
            print(f"    OK {file_path} erfolgreich verifiziert")
    
    return all_verified

def update_metadata(new_version):
    """Aktualisiert Version in module.json, package.json und package-lock.json auf new_version."""
    print("    Aktualisiere module.json...")
    update_json_version("module.json", new_version)
    print("    Aktualisiere package.json...")
    update_json_version("package.json", new_version)
    print("    Aktualisiere package-lock.json...")
    update_json_version("package-lock.json", new_version)
    # Optional: weitere Dateien aktualisieren (z.B. README.md)
    # print("    Aktualisiere README.md...")
    # update_readme(new_version)

def _remove_bom_from_file(path):
    """Entfernt BOM aus einer einzelnen Datei, falls vorhanden."""
    content = Path(path).read_text(encoding='utf-8')
    if content.startswith('\ufeff'):
        Path(path).write_text(content.lstrip('\ufeff'), encoding='utf-8')
        print(f"      BOM entfernt: {path}")

def remove_bom_in_paths(paths, extensions=None):
    """Scannt die angegebenen Pfade und entfernt BOM aus Dateien mit bestimmten Erweiterungen."""
    if extensions is None:
        extensions = ['.js', '.cjs', '.mjs', '.json']
    for p in paths:
        pth = Path(p)
        if pth.is_file():
            if pth.suffix in extensions:
                _remove_bom_from_file(pth)
        elif pth.is_dir():
            for f in pth.rglob('*'):
                if f.suffix in extensions:
                    _remove_bom_from_file(f)

def write_unreleased_changes(changelog_path, added, changed, fixes, known, upgrade):
    """Schreibt die Unreleased-Sektion in CHANGELOG.md mit den angegebenen Änderungen."""
    path = Path(changelog_path)
    content = path.read_text(encoding='utf-8')
    
    # Baue neuen Unreleased-Abschnitt auf
    section = "## [Unreleased]\n\n"
    section += "### Hinzugefügt\n"
    for line in added.splitlines():
        if line.strip():
            clean = line.strip().lstrip('- ').strip()
            section += f"- {clean}\n"
    section += "\n### Geändert\n"
    for line in changed.splitlines():
        if line.strip():
            clean = line.strip().lstrip('- ').strip()
            section += f"- {clean}\n"
    section += "\n### Fehlerbehebungen\n"
    for line in fixes.splitlines():
        if line.strip():
            clean = line.strip().lstrip('- ').strip()
            section += f"- {clean}\n"
    section += "\n### Bekannte Probleme\n"
    for line in known.splitlines():
        if line.strip():
            clean = line.strip().lstrip('- ').strip()
            section += f"- {clean}\n"
    section += "\n### Upgrade-Hinweise\n"
    for line in upgrade.splitlines():
        if line.strip():
            clean = line.strip().lstrip('- ').strip()
            section += f"- {clean}\n"
    section += "\n"
    
    # Prüfe, ob [Unreleased] bereits existiert
    if "## [Unreleased]" in content:
        # Finde den Unreleased-Block
        start = content.index("## [Unreleased]")
        try:
            end = content.index("## [", start + len("## [Unreleased]"))
        except ValueError:
            end = len(content)
        prefix = content[:start]
        suffix = content[end:]
        new_content = prefix + section + suffix
    else:
        # Wenn kein [Unreleased] existiert, füge es am Ende hinzu
        new_content = content.rstrip() + "\n\n" + section
    
    # Schreibe Datei
    path.write_text(new_content, encoding='utf-8')

def read_unreleased_changes(changelog_path):
    """Liest die Unreleased-Sektion aus CHANGELOG.md und gibt Dict mit added, changed, fixed, known, upgrade."""
    path = Path(changelog_path)
    content = path.read_text(encoding='utf-8')
    if "## [Unreleased]" not in content:
        return {"added":"", "changed":"", "fixed":"", "known":"", "upgrade":""}
    start = content.index("## [Unreleased]")
    try:
        end = content.index("## [", start + len("## [Unreleased]"))
    except ValueError:
        end = len(content)
    block = content[start:end]
    def extract(header):
        if header in block:
            idx = block.index(header) + len(header)
            rest = block[idx:]
            m = re.search(r"### \w", rest)
            if m:
                return rest[:m.start()].strip()
            return rest.strip()
        return ""
    return {
        "added": extract("### Hinzugefügt"),
        "changed": extract("### Geändert"),
        "fixed": extract("### Fehlerbehebungen"),
        "known": extract("### Bekannte Probleme"),
        "upgrade": extract("### Upgrade-Hinweise")
    }

def get_changed_files():
    """
    Gibt eine Liste aller geänderten Dateien zurück (git status).
    
    Returns:
        list: Liste der geänderten Dateipfade
    """
    try:
        result = subprocess.run(
            ['git', 'status', '--porcelain'],
            capture_output=True,
            text=True,
            cwd=PROJECT_ROOT,
            check=False
        )
        
        if result.returncode != 0:
            return []
        
        changed_files = []
        for line in result.stdout.strip().split('\n'):
            if line:
                # Format: " M file.txt" oder "?? file.txt" oder "A  file.txt"
                filepath = line[3:].strip()
                if filepath:
                    changed_files.append(filepath)
        
        return changed_files
    except Exception as e:
        print(f"Fehler beim Ermitteln geänderter Dateien: {e}")
        return []

def is_code_file(filepath):
    """
    Prüft ob eine Datei zum funktionalen Code des Moduls gehört.
    
    Args:
        filepath (str): Pfad zur Datei
        
    Returns:
        bool: True wenn Code, False wenn Dokumentation/Tooling
    """
    # Definiere was als "funktionaler Code" gilt (Whitelist-Ansatz)
    code_patterns = [
        'src/',           # Source Code
        'templates/',     # Handlebars Templates
        'styles/',        # CSS/SCSS
        'lang/',          # Übersetzungsdateien
        'dist/',          # Build-Output (falls committed)
    ]
    
    # Wichtige Root-Dateien die zum funktionalen Code gehören
    code_root_files = [
        'module.json',
        'package.json',
        'package-lock.json',
        'vite.config.ts',
        'vite.config.js',
        'tsconfig.json',
        'eslint.config.mjs',
        'eslint.config.js',
        '.eslintrc',
        'prettier.config.js',
        '.prettierrc',
        'vitest.config.ts',
        'vitest.config.js',
        'svelte.config.js',
        'tailwind.config.js',
        'postcss.config.js',
    ]
    
    # Prüfe ob Datei in einem Code-Verzeichnis liegt
    for pattern in code_patterns:
        if filepath.startswith(pattern) or pattern in filepath:
            return True
    
    # Prüfe ob es eine wichtige Root-Datei ist
    for root_file in code_root_files:
        if filepath == root_file or filepath.endswith(root_file):
            return True
    
    return False

def is_documentation_file(filepath):
    """
    Prüft ob eine Datei eine Dokumentations-Datei ist.
    
    Args:
        filepath (str): Pfad zur Datei
        
    Returns:
        bool: True wenn Dokumentation, False wenn Code
    """
    # Umgekehrte Logik: Alles was nicht Code ist, ist Doku/Tooling
    return not is_code_file(filepath)

def detect_change_type():
    """
    Erkennt automatisch ob es Code- oder nur Doku-Änderungen gibt.
    
    Returns:
        str: 'code' für Code-Änderungen, 'docs' für nur Dokumentation
    """
    changed_files = get_changed_files()
    
    if not changed_files:
        return 'code'  # Keine Änderungen → Default Code-Modus
    
    # Prüfe jede Datei
    has_code_changes = False
    
    for filepath in changed_files:
        if not is_documentation_file(filepath):
            has_code_changes = True
            break
    
    return 'code' if has_code_changes else 'docs'

def get_changed_files_info():
    """
    Gibt detaillierte Informationen über geänderte Dateien.
    
    Returns:
        dict: {
            'code': [liste von code-dateien],
            'docs': [liste von doku-dateien],
            'type': 'code' oder 'docs'
        }
    """
    changed_files = get_changed_files()
    
    code_files = []
    docs_files = []
    
    for filepath in changed_files:
        if is_documentation_file(filepath):
            docs_files.append(filepath)
        else:
            code_files.append(filepath)
    
    return {
        'code': code_files,
        'docs': docs_files,
        'type': 'code' if code_files else 'docs'
    } 