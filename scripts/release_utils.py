#!/usr/bin/env python3
import re
import subprocess
from pathlib import Path
import json
import os
import shutil
from datetime import datetime

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

def check_and_handle_git_lock():
    """Prüft auf Git-Lock-Dateien und behandelt sie.
    
    Returns:
        bool: True wenn keine Lock-Datei existiert oder erfolgreich entfernt wurde, False bei Fehler
    """
    import time
    
    lock_file = PROJECT_ROOT / ".git" / "index.lock"
    
    # Prüfe mehrmals mit kurzen Pausen (Race Condition vermeiden)
    max_retries = 3
    for attempt in range(max_retries):
        if not lock_file.exists():
            return True
        
        # Prüfe, ob ein Git-Prozess läuft
        try:
            # Versuche Git-Status abzurufen - wenn ein Prozess läuft, wird dies fehlschlagen
            result = subprocess.run(
                ['git', 'status', '--porcelain'],
                capture_output=True,
                text=True,
                cwd=PROJECT_ROOT,
                timeout=2,
                check=False
            )
            
            # Wenn Git-Status erfolgreich ist, ist wahrscheinlich kein Prozess aktiv
            if result.returncode == 0:
                if attempt == 0:
                    print(f"  Warnung: Lock-Datei gefunden, aber kein aktiver Git-Prozess erkannt.")
                    print(f"  Entferne Lock-Datei...")
                
                try:
                    lock_file.unlink()
                    print(f"  OK Lock-Datei erfolgreich entfernt")
                    return True
                except FileNotFoundError:
                    # Datei wurde zwischen Prüfung und Entfernung gelöscht - das ist OK
                    print(f"  OK Lock-Datei wurde bereits entfernt")
                    return True
                except PermissionError as e:
                    if attempt < max_retries - 1:
                        time.sleep(0.5)  # Kurze Pause vor Retry
                        continue
                    print(f"  Fehler: Keine Berechtigung zum Entfernen der Lock-Datei: {e}")
                    print(f"  Bitte entfernen Sie die Datei manuell: {lock_file}")
                    return False
                except Exception as e:
                    if attempt < max_retries - 1:
                        time.sleep(0.5)  # Kurze Pause vor Retry
                        continue
                    print(f"  Fehler beim Entfernen der Lock-Datei: {e}")
                    return False
            else:
                # Git-Status fehlgeschlagen - möglicherweise läuft ein Prozess
                if attempt == 0:
                    print(f"  Warnung: Lock-Datei gefunden und Git-Status fehlgeschlagen.")
                    print(f"  Möglicherweise läuft ein anderer Git-Prozess.")
                
                if attempt < max_retries - 1:
                    time.sleep(1)  # Längere Pause, da möglicherweise ein Prozess läuft
                    continue
                
                print(f"  Bitte warten Sie, bis alle Git-Prozesse beendet sind, oder entfernen Sie die Datei manuell:")
                print(f"  {lock_file}")
                return False
        except subprocess.TimeoutExpired:
            if attempt == 0:
                print(f"  Warnung: Git-Status hat zu lange gedauert - möglicherweise läuft ein Git-Prozess.")
            
            if attempt < max_retries - 1:
                time.sleep(1)  # Längere Pause bei Timeout
                continue
            
            return False
        except Exception as e:
            if attempt == 0:
                print(f"  Fehler beim Prüfen der Lock-Datei: {e}")
            
            if attempt < max_retries - 1:
                time.sleep(0.5)
                continue
            
            return False
    
    # Falls wir hier ankommen, haben alle Versuche fehlgeschlagen
    return False

def run_command(command, cwd=None):
    """Führt einen Shell-Befehl aus und gibt True zurück, wenn erfolgreich.
    
    Args:
        command (str): Der auszuführende Befehl
        cwd (str, optional): Das Arbeitsverzeichnis für den Befehl
    
    Returns:
        bool: True wenn erfolgreich, False wenn fehlgeschlagen
    """
    # Prüfe auf Git-Lock-Dateien vor Git-Operationen
    if command.strip().startswith('git '):
        if not check_and_handle_git_lock():
            print(f"  Fehler: Git-Lock-Datei blockiert die Operation. Bitte beheben Sie das Problem manuell.")
            return False
    
    try:
        subprocess.run(command, shell=True, check=True, cwd=cwd)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Fehler beim Ausführen des Befehls '{command}': {e}")
        # Bei Git-Operationen zusätzliche Hilfe anbieten
        if command.strip().startswith('git '):
            lock_file = PROJECT_ROOT / ".git" / "index.lock"
            if lock_file.exists():
                print(f"  Hinweis: Eine Git-Lock-Datei existiert noch: {lock_file}")
                print(f"  Falls kein Git-Prozess läuft, können Sie die Datei manuell entfernen.")
        return False

# ============================================================================
# Git-Prüfungen und robustes Tag-Handling
# ============================================================================

def check_git_repository_status():
    """
    Prüft den Git-Repository-Status auf potenzielle Probleme.
    
    Returns:
        dict: {
            'is_clean': bool,
            'has_uncommitted': bool,
            'is_behind': bool,
            'is_ahead': bool,
            'is_diverged': bool,
            'current_branch': str,
            'remote_branch': str,
            'issues': list,  # Liste von Problem-Beschreibungen
            'warnings': list  # Liste von Warnungen
        }
    """
    result = {
        'is_clean': True,
        'has_uncommitted': False,
        'is_behind': False,
        'is_ahead': False,
        'is_diverged': False,
        'current_branch': None,
        'remote_branch': None,
        'issues': [],
        'warnings': []
    }
    
    try:
        # Prüfe auf uncommitted changes
        status_result = subprocess.run(
            ['git', 'status', '--porcelain'],
            capture_output=True,
            text=True,
            cwd=PROJECT_ROOT,
            check=True
        )
        
        if status_result.stdout.strip():
            result['has_uncommitted'] = True
            result['is_clean'] = False
            result['warnings'].append("Es gibt uncommitted Änderungen im Working Directory")
        
        # Hole aktuellen Branch
        branch_result = subprocess.run(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
            capture_output=True,
            text=True,
            cwd=PROJECT_ROOT,
            check=True
        )
        result['current_branch'] = branch_result.stdout.strip()
        
        # Prüfe ob Remote-Branch existiert
        remote_branch = f"origin/{result['current_branch']}"
        remote_check = subprocess.run(
            ['git', 'ls-remote', '--heads', 'origin', result['current_branch']],
            capture_output=True,
            text=True,
            cwd=PROJECT_ROOT,
            check=False
        )
        
        if remote_check.returncode == 0 and remote_check.stdout.strip():
            result['remote_branch'] = remote_branch
            
            # Prüfe auf ausstehende Pulls (lokal hinter Remote)
            fetch_result = subprocess.run(
                ['git', 'fetch', 'origin', result['current_branch']],
                capture_output=True,
                text=True,
                cwd=PROJECT_ROOT,
                check=False
            )
            
            # Vergleiche lokalen und Remote-Branch
            local_hash = subprocess.run(
                ['git', 'rev-parse', result['current_branch']],
                capture_output=True,
                text=True,
                cwd=PROJECT_ROOT,
                check=True
            ).stdout.strip()
            
            remote_hash = subprocess.run(
                ['git', 'rev-parse', remote_branch],
                capture_output=True,
                text=True,
                cwd=PROJECT_ROOT,
                check=False
            )
            
            if remote_hash.returncode == 0:
                remote_hash = remote_hash.stdout.strip()
                
                # Prüfe ob lokal hinter Remote
                behind_check = subprocess.run(
                    ['git', 'rev-list', '--count', f'{local_hash}..{remote_hash}'],
                    capture_output=True,
                    text=True,
                    cwd=PROJECT_ROOT,
                    check=False
                )
                
                if behind_check.returncode == 0:
                    behind_count = int(behind_check.stdout.strip())
                    if behind_count > 0:
                        result['is_behind'] = True
                        result['is_clean'] = False
                        result['issues'].append(
                            f"Lokaler Branch ist {behind_count} Commit(s) hinter dem Remote-Branch. "
                            f"Bitte 'git pull' ausführen."
                        )
                
                # Prüfe ob lokal vor Remote
                ahead_check = subprocess.run(
                    ['git', 'rev-list', '--count', f'{remote_hash}..{local_hash}'],
                    capture_output=True,
                    text=True,
                    cwd=PROJECT_ROOT,
                    check=False
                )
                
                if ahead_check.returncode == 0:
                    ahead_count = int(ahead_check.stdout.strip())
                    if ahead_count > 0:
                        result['is_ahead'] = True
                
                # Prüfe auf Divergenz
                if result['is_behind'] and result['is_ahead']:
                    result['is_diverged'] = True
                    result['issues'].append(
                        "Lokaler und Remote-Branch sind divergiert. "
                        "Bitte 'git pull --rebase' oder 'git pull' ausführen."
                    )
        else:
            result['warnings'].append(f"Remote-Branch '{remote_branch}' existiert nicht")
    
    except subprocess.CalledProcessError as e:
        result['issues'].append(f"Fehler beim Prüfen des Git-Status: {e}")
        result['is_clean'] = False
    except Exception as e:
        result['issues'].append(f"Unerwarteter Fehler: {e}")
        result['is_clean'] = False
    
    return result

def check_tag_exists(tag_name):
    """
    Prüft ob ein Tag lokal oder remote existiert.
    
    Args:
        tag_name (str): Name des Tags (z.B. 'v0.35.0')
    
    Returns:
        dict: {
            'exists_local': bool,
            'exists_remote': bool,
            'exists': bool,
            'local_hash': str or None,
            'remote_hash': str or None,
            'is_same': bool  # True wenn beide existieren und gleich sind
        }
    """
    result = {
        'exists_local': False,
        'exists_remote': False,
        'exists': False,
        'local_hash': None,
        'remote_hash': None,
        'is_same': False
    }
    
    try:
        # Prüfe lokalen Tag
        local_check = subprocess.run(
            ['git', 'rev-parse', tag_name],
            capture_output=True,
            text=True,
            cwd=PROJECT_ROOT,
            check=False
        )
        
        if local_check.returncode == 0:
            result['exists_local'] = True
            result['local_hash'] = local_check.stdout.strip()
        
        # Prüfe Remote-Tag
        remote_check = subprocess.run(
            ['git', 'ls-remote', '--tags', 'origin', tag_name],
            capture_output=True,
            text=True,
            cwd=PROJECT_ROOT,
            check=False
        )
        
        if remote_check.returncode == 0 and remote_check.stdout.strip():
            result['exists_remote'] = True
            # Extrahiere Hash aus Output (Format: "hash\trefs/tags/tag_name")
            lines = remote_check.stdout.strip().split('\n')
            for line in lines:
                if tag_name in line:
                    result['remote_hash'] = line.split()[0]
                    break
        
        result['exists'] = result['exists_local'] or result['exists_remote']
        
        # Prüfe ob beide existieren und gleich sind
        if result['exists_local'] and result['exists_remote']:
            result['is_same'] = (result['local_hash'] == result['remote_hash'])
    
    except Exception as e:
        print(f"  Warnung: Fehler beim Prüfen des Tags {tag_name}: {e}")
    
    return result

def push_tags_smartly(tag_name=None):
    """
    Pusht Tags intelligent: Nur neue Tags werden gepusht, existierende werden übersprungen.
    
    Args:
        tag_name (str, optional): Spezifischer Tag zum Pushen. Wenn None, werden alle Tags gepusht.
    
    Returns:
        dict: {
            'success': bool,
            'pushed': list,  # Liste gepushter Tags
            'skipped': list,  # Liste übersprungener Tags (bereits existierend)
            'failed': list,  # Liste fehlgeschlagener Tags
            'errors': list  # Liste von Fehlermeldungen
        }
    """
    result = {
        'success': True,
        'pushed': [],
        'skipped': [],
        'failed': [],
        'errors': []
    }
    
    try:
        # Hole alle lokalen Tags wenn kein spezifischer Tag angegeben
        if tag_name:
            tags_to_push = [tag_name]
        else:
            tags_result = subprocess.run(
                ['git', 'tag', '-l'],
                capture_output=True,
                text=True,
                cwd=PROJECT_ROOT,
                check=True
            )
            tags_to_push = [t.strip() for t in tags_result.stdout.strip().split('\n') if t.strip()]
        
        # Prüfe jeden Tag
        for tag in tags_to_push:
            tag_info = check_tag_exists(tag)
            
            if tag_info['exists_remote']:
                if tag_info['exists_local'] and tag_info['is_same']:
                    # Tag existiert bereits remote und ist identisch
                    result['skipped'].append(tag)
                    print(f"  ⏭️  Tag {tag} existiert bereits im Remote (übersprungen)")
                else:
                    # Tag existiert remote aber ist unterschiedlich - Warnung
                    result['skipped'].append(tag)
                    result['errors'].append(
                        f"Tag {tag} existiert bereits im Remote mit unterschiedlichem Hash. "
                        f"Bitte manuell prüfen oder mit --force pushen."
                    )
                    print(f"  ⚠️  Tag {tag} existiert bereits im Remote mit unterschiedlichem Hash (übersprungen)")
            else:
                # Tag existiert nicht remote - pushe ihn
                push_result = subprocess.run(
                    ['git', 'push', 'origin', tag],
                    capture_output=True,
                    text=True,
                    cwd=PROJECT_ROOT,
                    check=False
                )
                
                if push_result.returncode == 0:
                    result['pushed'].append(tag)
                    print(f"  ✅ Tag {tag} erfolgreich gepusht")
                else:
                    result['failed'].append(tag)
                    result['errors'].append(f"Fehler beim Pushen von {tag}: {push_result.stderr}")
                    result['success'] = False
                    print(f"  ❌ Fehler beim Pushen von Tag {tag}: {push_result.stderr}")
        
        # Pushe auch den Branch (nur wenn Tags gepusht wurden oder wenn explizit gewünscht)
        # Der Branch wird separat gepusht, daher ist diese Funktion nur für Tags zuständig
        # Der Branch-Push wird vom Release-Tool selbst gehandhabt
    
    except Exception as e:
        result['success'] = False
        result['errors'].append(f"Unerwarteter Fehler: {e}")
    
    return result

def validate_release_prerequisites(new_version):
    """
    Validiert alle Voraussetzungen für einen Release.
    
    Args:
        new_version (str): Die neue Versionsnummer
    
    Returns:
        dict: {
            'valid': bool,
            'issues': list,  # Kritische Probleme (müssen behoben werden)
            'warnings': list,  # Warnungen (können ignoriert werden)
            'tag_info': dict  # Informationen über den Tag
        }
    """
    result = {
        'valid': True,
        'issues': [],
        'warnings': [],
        'tag_info': None
    }
    
    # Prüfe Git-Status
    git_status = check_git_repository_status()
    
    # Kritische Probleme
    if git_status['is_behind'] or git_status['is_diverged']:
        result['valid'] = False
        result['issues'].extend(git_status['issues'])
    
    # Warnungen
    if git_status['has_uncommitted']:
        result['warnings'].extend(git_status['warnings'])
    
    result['warnings'].extend([w for w in git_status['warnings'] if w not in result['warnings']])
    
    # Prüfe Tag
    tag_name = f"v{new_version}"
    tag_info = check_tag_exists(tag_name)
    result['tag_info'] = tag_info
    
    if tag_info['exists_remote']:
        if not tag_info['exists_local'] or not tag_info['is_same']:
            result['warnings'].append(
                f"Tag {tag_name} existiert bereits im Remote. "
                f"Der Tag wird beim Push übersprungen."
            )
        else:
            result['warnings'].append(
                f"Tag {tag_name} existiert bereits lokal und remote. "
                f"Der Tag wird beim Push übersprungen."
            )
    
    return result

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

# ============================================================================
# Rollback-System für Release-Prozess
# ============================================================================

class ReleaseCheckpoint:
    """Verwaltet Checkpoints und Rollbacks für den Release-Prozess."""
    
    def __init__(self, version: str):
        self.version = version
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.backup_dir = PROJECT_ROOT / ".release_backup" / f"{version}_{self.timestamp}"
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        self.git_commit_hash = None
        self.completed_steps = []
        self.files_backed_up = []
        
    def create_git_checkpoint(self) -> bool:
        """Erstellt einen Git-Checkpoint (speichert aktuellen Commit-Hash)."""
        try:
            result = subprocess.run(
                ['git', 'rev-parse', 'HEAD'],
                capture_output=True,
                text=True,
                cwd=PROJECT_ROOT,
                check=True
            )
            self.git_commit_hash = result.stdout.strip()
            checkpoint_file = self.backup_dir / "git_checkpoint.txt"
            checkpoint_file.write_text(f"Commit: {self.git_commit_hash}\n", encoding='utf-8')
            print(f"  Git-Checkpoint erstellt: {self.git_commit_hash[:8]}")
            return True
        except Exception as e:
            print(f"  Warnung: Git-Checkpoint konnte nicht erstellt werden: {e}")
            return False
    
    def backup_file(self, file_path: str) -> bool:
        """Sichert eine Datei vor Änderungen."""
        source = PROJECT_ROOT / file_path
        if not source.exists():
            return False
        
        try:
            # Erstelle Verzeichnisstruktur im Backup
            relative_path = Path(file_path)
            backup_path = self.backup_dir / relative_path
            backup_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Kopiere Datei
            shutil.copy2(source, backup_path)
            self.files_backed_up.append(file_path)
            return True
        except Exception as e:
            print(f"  Warnung: Backup von {file_path} fehlgeschlagen: {e}")
            return False
    
    def backup_files(self, file_paths: list) -> int:
        """Sichert mehrere Dateien."""
        backed_up = 0
        for file_path in file_paths:
            if self.backup_file(file_path):
                backed_up += 1
        return backed_up
    
    def mark_step_completed(self, step_name: str):
        """Markiert einen Schritt als abgeschlossen."""
        self.completed_steps.append(step_name)
        status_file = self.backup_dir / "steps_completed.txt"
        status_file.write_text("\n".join(self.completed_steps) + "\n", encoding='utf-8')
    
    def rollback_file(self, file_path: str) -> bool:
        """Stellt eine Datei aus dem Backup wieder her."""
        relative_path = Path(file_path)
        backup_path = self.backup_dir / relative_path
        target = PROJECT_ROOT / file_path
        
        if not backup_path.exists():
            return False
        
        try:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(backup_path, target)
            return True
        except Exception as e:
            print(f"  Fehler beim Rollback von {file_path}: {e}")
            return False
    
    def rollback_git(self) -> bool:
        """Rollback zu Git-Checkpoint."""
        if not self.git_commit_hash:
            print("  Kein Git-Checkpoint vorhanden")
            return False
        
        try:
            # Prüfe ob wir uns noch im gleichen Repository befinden
            result = subprocess.run(
                ['git', 'rev-parse', 'HEAD'],
                capture_output=True,
                text=True,
                cwd=PROJECT_ROOT,
                check=True
            )
            current_hash = result.stdout.strip()
            
            if current_hash == self.git_commit_hash:
                print("  Bereits am Checkpoint - kein Rollback nötig")
                return True
            
            # Reset zu Checkpoint (nur Working Directory, nicht HEAD)
            print(f"  Rollback zu Git-Checkpoint: {self.git_commit_hash[:8]}")
            subprocess.run(
                ['git', 'reset', '--hard', self.git_commit_hash],
                cwd=PROJECT_ROOT,
                check=True
            )
            return True
        except Exception as e:
            print(f"  Fehler beim Git-Rollback: {e}")
            return False
    
    def rollback_files(self) -> int:
        """Stellt alle gesicherten Dateien wieder her."""
        restored = 0
        for file_path in self.files_backed_up:
            if self.rollback_file(file_path):
                restored += 1
        return restored
    
    def rollback_all(self) -> dict:
        """Führt vollständigen Rollback durch."""
        result = {
            'git': False,
            'files': 0,
            'success': False
        }
        
        print("\nStarte Rollback...")
        
        # Rollback Git
        result['git'] = self.rollback_git()
        
        # Rollback Dateien
        result['files'] = self.rollback_files()
        
        result['success'] = result['git'] or result['files'] > 0
        
        if result['success']:
            print(f"  Rollback abgeschlossen: {result['files']} Dateien wiederhergestellt")
        else:
            print("  Warnung: Rollback konnte nicht vollständig durchgeführt werden")
        
        return result
    
    def cleanup(self):
        """Entfernt Backup-Verzeichnis (optional, nach erfolgreichem Release)."""
        try:
            if self.backup_dir.exists():
                shutil.rmtree(self.backup_dir)
                print(f"  Backup-Verzeichnis entfernt: {self.backup_dir}")
        except Exception as e:
            print(f"  Warnung: Backup-Verzeichnis konnte nicht entfernt werden: {e}")
    
    def get_backup_info(self) -> str:
        """Gibt Informationen über das Backup zurück."""
        info = f"Backup für Version {self.version}\n"
        info += f"Zeitpunkt: {self.timestamp}\n"
        info += f"Verzeichnis: {self.backup_dir}\n"
        if self.git_commit_hash:
            info += f"Git-Checkpoint: {self.git_commit_hash[:8]}\n"
        info += f"Gesicherte Dateien: {len(self.files_backed_up)}\n"
        info += f"Abgeschlossene Schritte: {len(self.completed_steps)}\n"
        return info

def create_release_checkpoint(version: str) -> ReleaseCheckpoint:
    """Erstellt einen neuen Release-Checkpoint."""
    checkpoint = ReleaseCheckpoint(version)
    
    # Wichtige Dateien sichern
    important_files = [
        "scripts/constants.cjs",
        "module.json",
        "package.json",
        "package-lock.json",
        "CHANGELOG.md"
    ]
    
    print(f"\nErstelle Release-Checkpoint für Version {version}...")
    checkpoint.create_git_checkpoint()
    backed_up = checkpoint.backup_files(important_files)
    print(f"  {backed_up} Dateien gesichert")
    
    return checkpoint 