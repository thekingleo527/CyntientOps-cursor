#!/usr/bin/env bash
# Append FastSSD dev environment to ~/.zshrc (idempotent)

BLOCK_START="# >>> FASTSSD DEV ENV >>>"
BLOCK_END="# <<< FASTSSD DEV ENV <<<"
TARGET="$HOME/.zshrc"

PAYLOAD=$(cat <<'EOF'
# >>> FASTSSD DEV ENV >>>
export YARN_CACHE_FOLDER="/Volumes/FastSSD/Developer/_devdata/yarn"
export npm_config_cache="/Volumes/FastSSD/Developer/_devdata/npm"
export GRADLE_USER_HOME="/Volumes/FastSSD/Developer/_devdata/gradle"
export ANDROID_SDK_ROOT="/Volumes/FastSSD/Developer/_devdata/android/sdk"
export ANDROID_HOME="$ANDROID_SDK_ROOT"
export ANDROID_AVD_HOME="/Volumes/FastSSD/Developer/_devdata/android/avd"
# Optional: keep Metro & temp files on FastSSD
export TMPDIR="/Volumes/FastSSD/Developer/_devdata/tmp"
# Persist tool caches
alias fastssd-tool-configs='yarn config set cache-folder "/Volumes/FastSSD/Developer/_devdata/yarn" && npm config set cache "/Volumes/FastSSD/Developer/_devdata/npm" --global'
# <<< FASTSSD DEV ENV <<<
EOF
)

mkdir -p "$(dirname "$TARGET")"

if grep -q "$BLOCK_START" "$TARGET" 2>/dev/null; then
  # Replace existing block
  awk -v start="$BLOCK_START" -v end="$BLOCK_END" -v payload="$PAYLOAD" '
    BEGIN{printFlag=1}
    $0==start{print payload; skip=1}
    $0==end{skip=0; next}
    skip!=1{print}
  ' "$TARGET" >"$TARGET.tmp" && mv "$TARGET.tmp" "$TARGET"
else
  echo "" >> "$TARGET"
  echo "$PAYLOAD" >> "$TARGET"
fi

echo "Appended FastSSD env to $TARGET. Open a new terminal or run: source $TARGET"

