#!/usr/bin/env python3
"""Test parse_object für summary"""
import re
import sys
sys.path.insert(0, 'scripts')
from ai-review-extract-toon import parse_toon_manually

with open('test-toon-real-output.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Entferne führenden Text
lines = [l.rstrip() for l in content.split('\n')]
start_idx = 0
for i, line in enumerate(lines):
    if re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*(\[.*?\])?\{.*?\}:', line.strip()):
        start_idx = i
        break
lines = lines[start_idx:]

# Parse TOON
result = parse_toon_manually('\n'.join(lines))

import json
print("Ergebnis:")
print(json.dumps(result, indent=2, ensure_ascii=False))

if result:
    print(f"\nKeys im Ergebnis: {list(result.keys())}")
    if 'summary' in result:
        print(f"summary Keys: {list(result['summary'].keys()) if isinstance(result['summary'], dict) else 'Nicht ein Dict'}")
    if 'issues' in result:
        print(f"issues Count: {len(result['issues']) if isinstance(result['issues'], list) else 'Nicht eine Liste'}")

