#!/usr/bin/env bash
set -euo pipefail

echo "=== Metro/Expo Performance Snapshot ==="
date
echo

echo "Node version:"; node -v
echo

echo "Processes (expo|metro|node related):"
ps aux | egrep -i "expo|metro|node .*start" | egrep -v egrep || true
echo

echo "Open files by node (approximate):"
pn=$(pgrep -f "node.*(expo|metro)" || true)
if [ -n "${pn:-}" ]; then
  for p in $pn; do
    echo "PID $p: $(/usr/sbin/lsof -p $p | wc -l) files open"
  done
fi
echo

echo "Workspace file counts (ts/tsx/js/json):"
find packages apps -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" \) | wc -l
echo

echo "node_modules sizes (top 10):"
du -sh apps/mobile-rn/node_modules/* 2>/dev/null | sort -h | tail -n 10
echo

echo "Metro cache dir: ${METRO_CACHE_ROOT:-<default>}"
[ -n "${METRO_CACHE_ROOT:-}" ] && du -sh "$METRO_CACHE_ROOT" 2>/dev/null || true
echo "======================================="

