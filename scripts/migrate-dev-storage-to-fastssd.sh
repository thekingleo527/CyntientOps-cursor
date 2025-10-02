#!/usr/bin/env bash
set -euo pipefail

# Migrate heavy developer data to the FastSSD volume and symlink back.
# Safe to re-run; backs up originals before moving.

FASTSSD_ROOT="/Volumes/FastSSD/Developer"
TARGET_ROOT="$FASTSSD_ROOT/_devdata"

bold(){ printf "\033[1m%s\033[0m\n" "$*"; }
info(){ printf "[INFO] %s\n" "$*"; }
warn(){ printf "[WARN] %s\n" "$*"; }
err(){ printf "[ERROR] %s\n" "$*"; }

ensure_dir(){
  mkdir -p "$1"
}

move_and_link(){
  local src="$1" dest="$2"
  if [ -L "$src" ]; then
    info "Skipping (already symlink): $src -> $(readlink "$src")"
    return 0
  fi
  if [ -d "$src" ]; then
    local parent
    parent="$(dirname "$dest")"
    ensure_dir "$parent"
    info "Moving $src -> $dest"
    mv "$src" "$dest"
  else
    info "Source missing (creating empty): $src"
    ensure_dir "$dest"
  fi
  info "Linking $src -> $dest"
  ensure_dir "$(dirname "$src")"
  ln -sfn "$dest" "$src"
}

du_h(){ [ -e "$1" ] && du -sh "$1" 2>/dev/null || true; }

bold "⏩ Migrating developer data to $TARGET_ROOT"
ensure_dir "$TARGET_ROOT"

# Summary of paths to migrate
declare -A PATHS

# Yarn cache (macOS default)
PATHS["$HOME/Library/Caches/Yarn"]="$TARGET_ROOT/yarn"
# npm cache
PATHS["$HOME/.npm"]="$TARGET_ROOT/npm"
# Expo cache/config
PATHS["$HOME/.expo"]="$TARGET_ROOT/expo"
# Gradle caches
PATHS["$HOME/.gradle"]="$TARGET_ROOT/gradle"
# Xcode DerivedData & Archives
PATHS["$HOME/Library/Developer/Xcode/DerivedData"]="$TARGET_ROOT/xcode/DerivedData"
PATHS["$HOME/Library/Developer/Xcode/Archives"]="$TARGET_ROOT/xcode/Archives"
# iOS CoreSimulator (can be large)
PATHS["$HOME/Library/Developer/CoreSimulator"]="$TARGET_ROOT/ios/CoreSimulator"
# CocoaPods caches
PATHS["$HOME/Library/Caches/CocoaPods"]="$TARGET_ROOT/cocoapods/Caches"
# Android SDK and AVDs
PATHS["$HOME/Library/Android/sdk"]="$TARGET_ROOT/android/sdk"
PATHS["$HOME/.android/avd"]="$TARGET_ROOT/android/avd"

bold "📦 Current sizes (before):"
for src in "${!PATHS[@]}"; do du_h "$src"; done

bold "🔧 Moving and linking..."
for src in "${!PATHS[@]}"; do
  move_and_link "$src" "${PATHS[$src]}"
done

bold "📦 Sizes on FastSSD (after):"
for src in "${!PATHS[@]}"; do du_h "${PATHS[$src]}"; done

bold "✅ Done. Next: add these to your shell profile (~/.zshrc):"
cat <<'ENV'
# FastSSD developer caches
export YARN_CACHE_FOLDER="/Volumes/FastSSD/Developer/_devdata/yarn"
export npm_config_cache="/Volumes/FastSSD/Developer/_devdata/npm"
export GRADLE_USER_HOME="/Volumes/FastSSD/Developer/_devdata/gradle"
export ANDROID_SDK_ROOT="/Volumes/FastSSD/Developer/_devdata/android/sdk"
export ANDROID_HOME="$ANDROID_SDK_ROOT"
export ANDROID_AVD_HOME="/Volumes/FastSSD/Developer/_devdata/android/avd"
# Optional: place temporary files and Metro cache on FastSSD
export TMPDIR="/Volumes/FastSSD/Developer/_devdata/tmp"
ENV

bold "👉 Also run once to persist tool configs:"
echo "  yarn config set cache-folder \"/Volumes/FastSSD/Developer/_devdata/yarn\""
echo "  npm config set cache \"/Volumes/FastSSD/Developer/_devdata/npm\" --global"

bold "ℹ️ Close Xcode/Android Studio/Simulators before running this script."

