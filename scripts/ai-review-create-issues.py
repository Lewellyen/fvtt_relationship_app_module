#!/usr/bin/env python3
"""
Parse AI analysis results and create GitHub issues.
"""
import json
import subprocess
import os
import re
from datetime import datetime

# Lade .env Datei falls vorhanden
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # python-dotenv nicht installiert - Umgebungsvariable muss manuell gesetzt sein
    pass

# Lade Analyse-Ergebnisse
try:
    with open('/tmp/analysis-output.json', 'r', encoding='utf-8') as f:
        analysis_data = json.load(f)
except (json.JSONDecodeError, FileNotFoundError) as e:
    print(f"Failed to load analysis data: {e}")
    exit(0)  # Nicht kritisch, Workflow darf weiterlaufen

# Hole bestehende Issues
try:
    existing_issues_result = subprocess.run(
        ['gh', 'issue', 'list', '--label', 'ai-review', '--state', 'all', '--json', 'title,number'],
        capture_output=True,
        text=True,
        check=True
    )
    existing_issues = json.loads(existing_issues_result.stdout)
    existing_titles = {issue['title'].lower(): issue['number'] for issue in existing_issues}
except subprocess.CalledProcessError as e:
    print(f"Warning: Failed to fetch existing issues: {e}")
    existing_titles = {}

# Erstelle Issues
issues_created = 0
issues_skipped = 0

for issue in analysis_data.get('issues', []):
    # Erstelle eindeutigen Titel
    file_short = issue['file'].replace('src/', '').replace('/', '-')
    title = f"[{issue['type'].upper()}] {file_short}:{issue['line']} - {issue['title']}"

    # Prüfe auf Duplikate (basierend auf ähnlichem Titel)
    title_lower = title.lower()
    is_duplicate = any(
        title_lower.startswith(existing.lower()[:50]) or
        existing.lower().startswith(title_lower[:50])
        for existing in existing_titles.keys()
    )

    if is_duplicate:
        print(f"Skipping duplicate issue: {title}")
        issues_skipped += 1
        continue

    # Erstelle Issue-Body
    # Unterstütze sowohl 'principle' als auch 'solid_principle' (für Rückwärtskompatibilität)
    principle = issue.get('solid_principle') or issue.get('principle')
    principle_tag = f"**Prinzip:** {principle}\n\n" if principle else ""

    commit_sha = os.environ.get('GITHUB_SHA', 'unknown')

    body = f"""## {issue['type'].replace('_', ' ').title()}

{principle_tag}**Severity:** {issue['severity'].upper()}
**File:** `{issue['file']}`
**Location:** Line {issue['line']}, Column {issue['column']}

### Problem

{issue['description']}

### Aktueller Code

```typescript
{issue.get('current_code', 'N/A')}
```

### Empfehlung

{issue['recommendation']}

### Referenzen

{chr(10).join(f'- {ref}' for ref in issue.get('references', []))}

---
*Automatisch erstellt durch AI Code Review am {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
*Commit: `{commit_sha}`*
"""

    # Labels - prüfe ob Full Review oder Incremental
    labels = ['ai-review', issue['type'], f"severity-{issue['severity']}"]

    # Prüfe ob Full Review Label existiert (wird im Full Review Workflow erstellt)
    try:
        subprocess.run(['gh', 'label', 'list', '--json', 'name'], capture_output=True, check=False)
        # Wenn ai-review-full existiert, nutze es (wird automatisch gesetzt)
        if os.environ.get('GITHUB_WORKFLOW', '').endswith('full'):
            labels.append('ai-review-full')
    except:
        pass

    # Unterstütze sowohl 'principle' als auch 'solid_principle' (für Rückwärtskompatibilität)
    principle = issue.get('solid_principle') or issue.get('principle')
    if principle:
        labels.append(f"solid-{principle.lower()}")

    # Erstelle Issue
    try:
        result = subprocess.run(
            ['gh', 'issue', 'create',
             '--title', title,
             '--body', body,
             '--label', ','.join(labels)],
            capture_output=True,
            text=True,
            check=True
        )
        print(f"Created issue: {title}")
        issues_created += 1
    except subprocess.CalledProcessError as e:
        print(f"Failed to create issue '{title}': {e.stderr}")
        continue

print(f"\nSummary: {issues_created} issues created, {issues_skipped} skipped")

