#!/bin/bash
cd "$(dirname "$0")/apps/mobile-rn"
export METRO_CACHE_ROOT="/Volumes/FastSSD/Developer/_devdata/metro-cache"
npx expo start -c --dev-client
