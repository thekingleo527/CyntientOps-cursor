#!/bin/bash

# 🔐 Security File Protection Script
# Purpose: Ensure SECURE_USER_CREDENTIALS.md is never committed to git

echo "🔐 Checking for security files..."

# Check if SECURE_USER_CREDENTIALS.md exists
if [ -f "docs/SECURE_USER_CREDENTIALS.md" ]; then
    echo "⚠️  SECURE_USER_CREDENTIALS.md found in docs folder"
    
    # Check if file is tracked by git
    if git ls-files --error-unmatch "docs/SECURE_USER_CREDENTIALS.md" >/dev/null 2>&1; then
        echo "🚨 CRITICAL: SECURE_USER_CREDENTIALS.md is tracked by git!"
        echo "🔧 Removing from git tracking..."
        git rm --cached "docs/SECURE_USER_CREDENTIALS.md"
        echo "✅ File removed from git tracking"
    else
        echo "✅ File is not tracked by git (good)"
    fi
    
    # Check if file is in staging area
    if git diff --cached --name-only | grep -q "SECURE_USER_CREDENTIALS.md"; then
        echo "🚨 CRITICAL: SECURE_USER_CREDENTIALS.md is in staging area!"
        echo "🔧 Removing from staging area..."
        git reset HEAD "docs/SECURE_USER_CREDENTIALS.md"
        echo "✅ File removed from staging area"
    else
        echo "✅ File is not in staging area (good)"
    fi
    
    # Set file permissions to be more restrictive
    chmod 600 "docs/SECURE_USER_CREDENTIALS.md"
    echo "✅ File permissions set to 600 (owner read/write only)"
    
else
    echo "ℹ️  SECURE_USER_CREDENTIALS.md not found in docs folder"
fi

# Check for any other security files
echo "🔍 Scanning for other security files..."
find . -name "*SECURE*" -o -name "*PASSWORD*" -o -name "*SECRET*" -o -name "*CREDENTIAL*" | grep -v node_modules | grep -v .git | while read file; do
    if [ -f "$file" ]; then
        echo "⚠️  Found potential security file: $file"
        # Check if it's tracked by git
        if git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
            echo "🚨 WARNING: $file is tracked by git!"
        else
            echo "✅ $file is not tracked by git"
        fi
    fi
done

echo "🔐 Security file protection check complete"
