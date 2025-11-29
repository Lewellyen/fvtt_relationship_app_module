#!/usr/bin/env python3
"""
Extract JSON from Cursor AI output (may be embedded in Markdown).
"""
import re
import json
import sys

with open('/tmp/analysis-output.json', 'r', encoding='utf-8') as f:
    content = f.read()

# Suche nach JSON-Block in Markdown Code-Blöcken
json_match = re.search(r'```json\s*\n(.*?)\n```', content, re.DOTALL)
if not json_match:
    # Versuche direkten JSON-Block
    json_match = re.search(r'\{.*\}', content, re.DOTALL)

if json_match:
    json_str = json_match.group(1) if json_match.lastindex == 1 else json_match.group(0)
    try:
        json_obj = json.loads(json_str)
        with open('/tmp/analysis-output.json', 'w', encoding='utf-8') as f:
            json.dump(json_obj, f, indent=2, ensure_ascii=False)
        print("JSON extracted successfully")
        sys.exit(0)
    except json.JSONDecodeError as e:
        print(f"Failed to parse extracted JSON: {e}")
        sys.exit(1)
else:
    print("No JSON found in output")
    sys.exit(1)

