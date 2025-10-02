#!/usr/bin/env bash
set -euo pipefail

# Clean common React Native / Expo / build caches to reclaim disk space.

confirm(){ read -r -p "$1 [y/N]: " ans; [[ "$ans" == "y" || "$ans" == "Y" ]]; }

paths=(
  "$TMPDIR/metro-cache"
  "$TMPDIR/react-*"
  "$HOME/Library/Developer/Xcode/DerivedData"
  "$HOME/Library/Developer/Xcode/Archives"
  "$HOME/Library/Caches/Yarn"
  "$HOME/.npm/_cacache"
  "$HOME/.gradle/caches"
  "$HOME/Library/Caches/CocoaPods"
  "$HOME/.expo"
)

echo "Will clean these (if they exist):"
for p in "${paths[@]}"; do [ -e "$p" ] && du -sh "$p" 2>/dev/null || true; done

if confirm "Proceed to delete cache directories above?"; then
  for p in "${paths[@]}"; do
    if [ -e "$p" ]; then
      echo "Deleting $p"
      rm -rf "$p"
    fi
  done
  echo "Done."
else
  echo "Aborted."
fi

