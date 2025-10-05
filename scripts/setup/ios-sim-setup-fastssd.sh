#!/usr/bin/env bash
set -euo pipefail

log() { printf "[sim-fastssd] %s\n" "$*"; }
err() { printf "[sim-fastssd][error] %s\n" "$*" 1>&2; }
warn() { printf "[sim-fastssd][warn] %s\n" "$*" 1>&2; }

FASTSSD_VOL="/Volumes/FastSSD"
TARGET_SET="$FASTSSD_VOL/Developer/_cache/CoreSimulator"
HOME_SIM="$HOME/Library/Developer/CoreSimulator"

# 0) Preflight: volume must exist
if [ ! -d "$FASTSSD_VOL" ]; then
  err "FastSSD volume not mounted at $FASTSSD_VOL"
  exit 1
fi

# 1) Verify ownership is enabled
OWNERS=$(diskutil info "$FASTSSD_VOL" 2>/dev/null | awk -F: '/Owners:/ {gsub(/^[ \t]+/,"",$2); print $2; exit}' || true)
if [ "${OWNERS:-Disabled}" = "Disabled" ]; then
  err "Ownership is Disabled on $FASTSSD_VOL. CoreSimulator cannot create devices on this volume."
  err "Enable it and re-run this script: sudo diskutil enableOwnership $FASTSSD_VOL"
  exit 2
fi

# 2) Stop Simulator app
osascript -e 'tell application "Simulator" to quit' >/dev/null 2>&1 || true
killall Simulator >/dev/null 2>&1 || true

# 3) Ensure device set root exists on FastSSD
mkdir -p "$TARGET_SET"
chmod -R u+rwX,go-rwx "$TARGET_SET" || true

# 4) Point home CoreSimulator path to FastSSD via symlink
if [ -e "$HOME_SIM" ] && [ ! -L "$HOME_SIM" ]; then
  BK="$HOME/Library/Developer/CoreSimulator.local-$(date +%Y%m%d-%H%M%S)"
  warn "Backing up existing local CoreSimulator dir to $BK"
  mv "$HOME_SIM" "$BK"
fi
if [ -L "$HOME_SIM" ]; then
  CUR=$(readlink "$HOME_SIM" || true)
  if [ "$CUR" != "$TARGET_SET" ]; then
    warn "Repointing CoreSimulator symlink -> $TARGET_SET"
    rm -f "$HOME_SIM"
    ln -s "$TARGET_SET" "$HOME_SIM"
  fi
else
  ln -sfn "$TARGET_SET" "$HOME_SIM"
fi

# 5) Restart CoreSimulator service
launchctl kickstart -k gui/$(id -u)/com.apple.CoreSimulator.CoreSimulatorService || true
sleep 1

# 6) Create a fresh device in this set
RUNTIME=$(xcrun simctl list runtimes | awk '/iOS [0-9]/ {print $NF}' | head -n1)
if [ -z "$RUNTIME" ]; then
  err "No iOS runtimes found. Install an iOS Simulator runtime in Xcode."; exit 3
fi

TYPES=(
  com.apple.CoreSimulator.SimDeviceType.iPhone-16
  com.apple.CoreSimulator.SimDeviceType.iPhone-16-Plus
  com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro
  com.apple.CoreSimulator.SimDeviceType.iPhone-15
  com.apple.CoreSimulator.SimDeviceType.iPhone-SE-3rd-generation
)

UDID=""
for T in "${TYPES[@]}"; do
  OUT=$(xcrun simctl --set "$TARGET_SET" create "CyntientOps iPhone" "$T" "$RUNTIME" 2>&1 || true)
  if [[ "$OUT" =~ ^[0-9A-F-]+$ ]]; then
    UDID="$OUT"; log "Created $UDID ($T on $RUNTIME)"; break
  else
    warn "Create failed for $T: $OUT"
  fi
done

if [ -z "$UDID" ]; then
  err "Failed to create device in $TARGET_SET. Ensure ownership is enabled and try again."
  exit 4
fi

# 7) Boot device and open Simulator
xcrun simctl --set "$TARGET_SET" boot "$UDID" >/dev/null 2>&1 || true
open -ga Simulator || true

# Wait for boot
for i in $(seq 1 30); do
  STATE=$(xcrun simctl --set "$TARGET_SET" list devices | awk -v U="$UDID" '$0 ~ U {print $0}' | sed -n 's/.*(\(Booted\|Shutdown\)).*/\1/p')
  [ "$STATE" = "Booted" ] && break
  sleep 1
done

xcrun simctl --set "$TARGET_SET" list -j devices | jq '.devices' | sed -n '1,80p' || true
log "Simulator is configured on FastSSD at: $TARGET_SET"
log "If no device appears Booted above, open Simulator and choose the 'CyntientOps iPhone' device."

