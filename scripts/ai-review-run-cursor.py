#!/usr/bin/env python3
"""
Run Cursor AI analysis with large prompt support.
Avoids "Argument list too long" errors by using Python subprocess instead of shell timeout.
"""

import subprocess
import sys
import os
import argparse

def main():
    parser = argparse.ArgumentParser(description='Run Cursor AI analysis')
    parser.add_argument('--prompt-file', required=True, help='Path to prompt file')
    parser.add_argument('--output-file', required=True, help='Path to output file')
    parser.add_argument('--model', default=None, help='AI model to use (default: from CURSOR_AI_MODEL env or sonnet-4.5)')
    parser.add_argument('--timeout', type=int, default=1800, help='Timeout in seconds (default: 1800 = 30 minutes)')

    args = parser.parse_args()

    # Get model from argument, environment variable, or default
    model = args.model or os.environ.get('CURSOR_AI_MODEL', 'sonnet-4.5')

    print(f"Using model: {model}")

    # Check if prompt file exists
    if not os.path.exists(args.prompt_file):
        print(f"❌ Error: Prompt file not found: {args.prompt_file}", file=sys.stderr)
        sys.exit(1)

    # Read prompt from file
    try:
        with open(args.prompt_file, 'r', encoding='utf-8') as f:
            prompt = f.read()

        prompt_size = len(prompt)
        print(f"Prompt size: {prompt_size} bytes")
    except Exception as e:
        print(f"❌ Error reading prompt file: {e}", file=sys.stderr)
        sys.exit(1)

    # Check API key
    if not os.environ.get('CURSOR_API_KEY'):
        print("❌ Error: CURSOR_API_KEY environment variable not set", file=sys.stderr)
        sys.exit(1)

    # Start cursor-agent with prompt as argument
    # Python can handle long arguments directly without shell limits
    print("Starting Cursor AI analysis...")

    # Find cursor-agent in common installation paths
    cursor_agent_path = None
    possible_paths = [
        'cursor-agent',  # In PATH
        os.path.join(os.environ.get('HOME', ''), '.cursor/bin/cursor-agent'),
        os.path.join(os.environ.get('HOME', ''), '.local/bin/cursor-agent'),
        '/usr/local/bin/cursor-agent',
    ]

    for path in possible_paths:
        if path == 'cursor-agent':
            # Try which/find command
            try:
                result = subprocess.run(['which', 'cursor-agent'],
                                      capture_output=True, text=True, timeout=2)
                if result.returncode == 0 and result.stdout.strip():
                    cursor_agent_path = result.stdout.strip()
                    break
            except:
                pass
        else:
            if os.path.exists(path) and os.access(path, os.X_OK):
                cursor_agent_path = path
                break

    if not cursor_agent_path:
        print("❌ Error: cursor-agent not found. Make sure Cursor CLI is installed.", file=sys.stderr)
        print("Searched paths:", file=sys.stderr)
        for path in possible_paths:
            print(f"  - {path}", file=sys.stderr)
        sys.exit(1)

    print(f"Found cursor-agent at: {cursor_agent_path}")

    # Python subprocess can pass large arguments directly without shell limits
    # The OS limit (ARG_MAX) applies to shell commands, but Python subprocess.Popen
    # passes arguments directly to execve(), bypassing shell limitations
    # However, there's still a system limit (typically 2MB on Linux), so we check
    prompt_bytes = len(prompt.encode('utf-8'))
    MAX_ARG_BYTES = 2 * 1024 * 1024  # 2MB - typical Linux ARG_MAX

    print(f"📤 Prompt size: {prompt_bytes:,} bytes ({prompt_bytes / 1024 / 1024:.2f} MB)")

    if prompt_bytes > MAX_ARG_BYTES:
        print(f"❌ Error: Prompt too large ({prompt_bytes:,} bytes) exceeds system limit ({MAX_ARG_BYTES:,} bytes)", file=sys.stderr)
        print("   Solution: Reduce number of files or lines per file", file=sys.stderr)
        sys.exit(1)

    # Use Python subprocess directly - this bypasses shell argument limits
    # Python's subprocess.Popen passes arguments directly to the system call
    # without going through shell parsing, so we can use larger prompts
    print("🚀 Using direct subprocess call (bypasses shell limits)...")

    try:
        # Direct subprocess call - Python handles large arguments better than shell
        proc = subprocess.Popen(
            [cursor_agent_path, '--model', model, '-p', prompt],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )

        try:
            # Wait for completion with timeout
            stdout, stderr = proc.communicate(timeout=args.timeout)
            exit_code = proc.returncode

            # Print stderr if there were errors
            if stderr and (exit_code != 0 or 'error' in stderr.lower()):
                print(f"⚠️ Stderr output: {stderr[:500]}", file=sys.stderr)
            # Normal method: prompt as argument
            proc = subprocess.Popen(
                [cursor_agent_path, '--model', model, '-p', prompt],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            try:
                # Wait for completion with timeout
                stdout, _ = proc.communicate(timeout=args.timeout)
                exit_code = proc.returncode
        except subprocess.TimeoutExpired:
            proc.kill()
            stdout, stderr = proc.communicate()
            print(f"⏱️ Analysis timed out after {args.timeout} seconds", file=sys.stderr)
            exit_code = 124
        except OSError as e:
            proc.kill()
            if e.errno == 7:  # Argument list too long
                print(f"❌ Error: Prompt too large for system ({prompt_bytes:,} bytes)", file=sys.stderr)
                print("   System limit reached despite Python subprocess. Consider reducing prompt size.", file=sys.stderr)
            else:
                print(f"❌ OS Error during analysis: {e}", file=sys.stderr)
            exit_code = 1
        except Exception as e:
            proc.kill()
            print(f"❌ Error during analysis: {e}", file=sys.stderr)
            exit_code = 1

        # Write output to file (only if we got output)
        if 'stdout' in locals():
            try:
                with open(args.output_file, 'w', encoding='utf-8') as f:
                    f.write(stdout)
                print(f"✅ Output written to: {args.output_file}")
            except Exception as e:
                print(f"❌ Error writing output file: {e}", file=sys.stderr)
                # Still exit with analysis exit code even if write fails

        sys.exit(exit_code)
    except Exception as e:
        print(f"❌ Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()

