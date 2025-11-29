#!/usr/bin/env python3
"""
Create GitHub label for full project review if it doesn't exist.
"""
import subprocess
import sys

try:
    result = subprocess.run(
        ['gh', 'label', 'create', 'ai-review-full', 
         '--description', 'Created by full project AI review', 
         '--color', '0E8A16'],
        capture_output=True,
        text=True,
        check=False  # Ignore if label already exists
    )
    if result.returncode == 0:
        print("Label 'ai-review-full' created successfully")
    elif "already exists" in result.stderr.lower():
        print("Label 'ai-review-full' already exists")
    else:
        print(f"Note: Could not create label (may already exist): {result.stderr}")
except Exception as e:
    print(f"Warning: Failed to create label: {e}")
    sys.exit(0)  # Non-critical, continue workflow

