#!/bin/bash
# PreToolUse(Bash): блокирует git push в main/master, rm -rf /, DROP TABLE.
CMD=$(jq -r '.tool_input.command // empty')
if printf '%s' "$CMD" | grep -qiE '(git[[:space:]]+push[^;&|]*[[:space:]:](main|master)([[:space:]]|$)|rm[[:space:]]+-[a-zA-Z]*r[a-zA-Z]*[[:space:]]+/([[:space:]]|$)|DROP[[:space:]]+TABLE)'; then
  echo "BLOCKED: push в main/master, rm -rf / и DROP TABLE запрещены. Используй feature-ветку / безопасную альтернативу." >&2
  exit 2
fi
exit 0
