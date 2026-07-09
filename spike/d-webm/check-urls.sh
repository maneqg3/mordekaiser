#!/usr/bin/env bash
set -uo pipefail

BASE="https://d28xe8vt774jo5.cloudfront.net/champion-abilities/0082"

for ability in P1 Q1 W1 E1 R1; do
  url="${BASE}/ability_0082_${ability}.webm"
  code=$(curl -s -o /dev/null -w '%{http_code}' -I "$url")
  printf '%-4s HTTP %s  %s\n' "$ability" "$code" "$url"
done
