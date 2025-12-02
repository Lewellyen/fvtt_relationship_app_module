#!/bin/bash
set -e

cd /home/runner/work/fvtt_relationship_app_module/fvtt_relationship_app_module

# Git-Operationen
git add src/infrastructure/adapters/foundry/settings-adapters/foundry-settings-adapter.ts

git commit -m "fix: Resolve issue #63 - mapSettingType returns Result instead of throwing exception

- Convert mapSettingType() to return Result<typeof String | typeof Number | typeof Boolean, SettingsError>
- Update register() to handle mapSettingType() Result
- Improve error message with details about unsupported type
- Fixes Result-Pattern violation where exceptions were thrown instead of returning Result"

git push origin fix/issue-63--result-pattern-violation-infrastructure-adapters-

# PR erstellen
PR_BODY_FILE="/home/runner/work/fvtt_relationship_app_module/fvtt_relationship_app_module/tmp/agent-summary.md"
if [ -f "$PR_BODY_FILE" ]; then
  gh pr create \
    --title "fix: Resolve issue #63 - [RESULT_PATTERN_VIOLATION] infrastructure-adapters-foundry-settings-adapters-foundry-settings-adapter.ts:123 - mapSettingType wirft Exception statt Result zurückzugeben" \
    --body-file "$PR_BODY_FILE" \
    --base main \
    --head fix/issue-63--result-pattern-violation-infrastructure-adapters- \
    --label "ai-generated" \
    --label "automated"
else
  echo "Warning: PR body file not found at $PR_BODY_FILE"
  gh pr create \
    --title "fix: Resolve issue #63 - [RESULT_PATTERN_VIOLATION] infrastructure-adapters-foundry-settings-adapters-foundry-settings-adapter.ts:123 - mapSettingType wirft Exception statt Result zurückzugeben" \
    --body "🤖 AI has created a fix for issue #63. Please review the changes." \
    --base main \
    --head fix/issue-63--result-pattern-violation-infrastructure-adapters- \
    --label "ai-generated" \
    --label "automated"
fi

# Issue kommentieren (PR-Nummer wird aus gh pr create Output extrahiert)
PR_NUMBER=$(gh pr list --head fix/issue-63--result-pattern-violation-infrastructure-adapters- --json number --jq '.[0].number')
if [ -n "$PR_NUMBER" ]; then
  gh issue comment 63 --body "🤖 AI has created a fix for this issue: PR #$PR_NUMBER"
fi
