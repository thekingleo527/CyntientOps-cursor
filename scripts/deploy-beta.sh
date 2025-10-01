#!/bin/bash
# 🚀 Deploy to Beta (TestFlight + Play Store Internal)

set -e  # Exit on error

echo "🚀 CyntientOps Beta Deployment Script"
echo "======================================"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Navigate to mobile-rn directory
cd "$(dirname "$0")/../apps/mobile-rn" || exit 1

echo "📋 Pre-flight checks..."
echo ""

# Check for .env file
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please create .env from .env.example with your credentials"
    exit 1
fi

# Check for required environment variables
if ! grep -q "SUPABASE_URL" .env; then
    echo "⚠️  Warning: SUPABASE_URL not found in .env"
fi

if ! grep -q "SUPABASE_ANON_KEY" .env; then
    echo "⚠️  Warning: SUPABASE_ANON_KEY not found in .env"
fi

echo "✅ Environment file found"
echo ""

# Prompt for build type
echo "Select build target:"
echo "1) iOS (TestFlight)"
echo "2) Android (Play Store Internal)"
echo "3) Both platforms"
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo "📱 Building for iOS..."
        eas build --profile preview --platform ios --non-interactive
        echo "✅ iOS build complete!"
        echo "To submit to TestFlight: eas submit --platform ios"
        ;;
    2)
        echo "🤖 Building for Android..."
        eas build --profile preview --platform android --non-interactive
        echo "✅ Android build complete!"
        echo "To submit to Play Store: eas submit --platform android"
        ;;
    3)
        echo "📱🤖 Building for both platforms..."
        eas build --profile preview --platform all --non-interactive
        echo "✅ Builds complete!"
        echo "To submit:"
        echo "  iOS:     eas submit --platform ios"
        echo "  Android: eas submit --platform android"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment process complete!"
echo ""
echo "Next steps:"
echo "1. Test the build on a real device"
echo "2. Gather feedback from beta testers"
echo "3. Fix any issues found"
echo "4. Submit to stores when ready"
