#!/usr/bin/env python3
"""
Create GitHub labels for AI code review if they don't exist.
"""
import subprocess
import sys

def create_label(name, description, color):
    """Create a label if it doesn't exist."""
    try:
        result = subprocess.run(
            ['gh', 'label', 'create', name,
             '--description', description,
             '--color', color],
            capture_output=True,
            text=True,
            check=False  # Ignore if label already exists
        )
        if result.returncode == 0:
            print(f"✅ Label '{name}' created successfully")
            return True
        elif "already exists" in result.stderr.lower():
            print(f"ℹ️  Label '{name}' already exists")
            return True
        else:
            print(f"⚠️  Note: Could not create label '{name}': {result.stderr.strip()}")
            return False
    except Exception as e:
        print(f"⚠️  Warning: Failed to create label '{name}': {e}")
        return False

# Liste aller benötigten Labels
labels = [
    # Haupt-Labels
    ('ai-review', 'Issue erstellt durch AI Code Review', '0E8A16'),
    ('ai-review-full', 'Issue erstellt durch Full Project AI Review', '1D76DB'),

    # Issue-Typen
    ('solid_violation', 'Verstoß gegen SOLID-Prinzipien', 'D93F0B'),
    ('result_pattern_violation', 'Verstoß gegen Result-Pattern', 'F9D71C'),
    ('architecture_violation', 'Architektur-Verstoß (Clean Architecture)', 'B60205'),
    ('code_smell', 'Code Smell', 'C5DEF5'),
    ('bug', 'Potentieller Bug', 'D73A4A'),

    # Severity-Labels
    ('severity-critical', 'Kritisches Problem', 'B60205'),
    ('severity-high', 'Hohe Priorität', 'D93F0B'),
    ('severity-medium', 'Mittlere Priorität', 'FBCA04'),
    ('severity-low', 'Niedrige Priorität', '0E8A16'),

    # SOLID-Principle Labels
    ('solid-srp', 'Single Responsibility Principle', '0052CC'),
    ('solid-ocp', 'Open/Closed Principle', '0052CC'),
    ('solid-lsp', 'Liskov Substitution Principle', '0052CC'),
    ('solid-isp', 'Interface Segregation Principle', '0052CC'),
    ('solid-dip', 'Dependency Inversion Principle', '0052CC'),
]

print("Creating GitHub labels for AI code review...")
print("")

created = 0
skipped = 0

for name, description, color in labels:
    if create_label(name, description, color):
        created += 1
    else:
        skipped += 1

print("")
print(f"Summary: {created} labels ready, {skipped} skipped/failed")

# Exit with error only if critical labels are missing
critical_labels = ['ai-review']
try:
    existing_labels_result = subprocess.run(
        ['gh', 'label', 'list', '--json', 'name'],
        capture_output=True,
        text=True,
        check=True
    )
    import json
    existing_labels = [label['name'] for label in json.loads(existing_labels_result.stdout)]
    missing_critical = [label for label in critical_labels if label not in existing_labels]
    if missing_critical:
        print(f"⚠️  Warning: Critical labels missing: {', '.join(missing_critical)}")
        print("   You may need to create them manually via GitHub UI or gh CLI")
except:
    print("⚠️  Warning: Could not verify critical labels")

sys.exit(0)  # Non-critical, continue workflow

