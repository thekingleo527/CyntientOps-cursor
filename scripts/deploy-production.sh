#!/bin/bash
# 🎯 Deploy to Production (App Store + Play Store)

set -e  # Exit on error

echo "🎯 CyntientOps Production Deployment Script"
echo "==========================================="
echo ""
echo "⚠️  WARNING: This will create a PRODUCTION build"
echo "Make sure you have:"
echo "  ✅ Tested thoroughly in beta"
echo "  ✅ Gathered user feedback"
echo "  ✅ Fixed all critical bugs"
echo "  ✅ Updated version numbers"
echo ""

read -p "Continue with production deployment? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Navigate to mobile-rn directory
cd "$(dirname "$0")/../apps/mobile-rn" || exit 1

echo ""
echo "📋 Pre-flight checks..."
echo ""

# Check for .env file
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Check production environment variables
required_vars=("SUPABASE_URL" "SUPABASE_ANON_KEY" "HPD_API_KEY" "DOB_API_KEY")
for var in "${required_vars[@]}"; do
    if ! grep -q "$var" .env; then
        echo "❌ Missing required variable: $var"
        exit 1
    fi
done

echo "✅ All required environment variables found"
echo ""

# Verify version number
echo "Current version in app.json:"
grep -A 1 "\"version\":" app.json
echo ""
read -p "Is this version correct? (yes/no): " version_ok

if [ "$version_ok" != "yes" ]; then
    echo "Please update version in app.json before deploying"
    exit 1
fi

echo ""
echo "Select deployment target:"
echo "1) iOS (App Store)"
echo "2) Android (Play Store)"
echo "3) Both platforms"
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo "📱 Building for iOS production..."
        eas build --profile production-ios --platform ios --non-interactive
        echo ""
        echo "✅ iOS production build complete!"
        echo ""
        read -p "Submit to App Store now? (yes/no): " submit
        if [ "$submit" = "yes" ]; then
            eas submit --profile production --platform ios
        fi
        ;;
    2)
        echo "🤖 Building for Android production..."
        eas build --profile production-android --platform android --non-interactive
        echo ""
        echo "✅ Android production build complete!"
        echo ""
        read -p "Submit to Play Store now? (yes/no): " submit
        if [ "$submit" = "yes" ]; then
            eas submit --profile production --platform android
        fi
        ;;
    3)
        echo "📱🤖 Building for both platforms..."
        eas build --profile production --platform all --non-interactive
        echo ""
        echo "✅ Production builds complete!"
        echo ""
        read -p "Submit to both stores now? (yes/no): " submit
        if [ "$submit" = "yes" ]; then
            echo "Submitting to App Store..."
            eas submit --profile production --platform ios
            echo "Submitting to Play Store..."
            eas submit --profile production --platform android
        fi
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Production deployment complete!"
echo ""
echo "Monitor your releases at:"
echo "  iOS: https://appstoreconnect.apple.com"
echo "  Android: https://play.google.com/console"
