#!/bin/bash

# Vibe Castle Ladder - GitHub Pages Deployment Script
# This script automates the setup and deployment to GitHub Pages

set -e  # Exit on any error

echo "🧗 Vibe Castle Ladder - GitHub Pages Deployment"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Please run this script from the repository root."
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git repository already initialized"
fi

# Check if GitHub Actions workflow exists
if [ ! -f ".github/workflows/deploy.yml" ]; then
    echo "❌ Error: GitHub Actions workflow not found."
    echo "Please make sure .github/workflows/deploy.yml exists."
    exit 1
fi

# Add all files
echo ""
echo "📝 Staging files for commit..."
git add .

# Commit
echo "💾 Committing changes..."
git commit -m "Setup: Configure GitHub Pages deployment" || echo "No changes to commit"

# Check if remote exists
if git remote | grep -q "origin"; then
    echo "✅ Remote 'origin' already configured"
else
    echo ""
    echo "🔗 No remote repository configured."
    echo "Please enter your GitHub repository URL (e.g., https://github.com/username/vibe-castle_ladder.git):"
    read REPO_URL
    git remote add origin "$REPO_URL"
    echo "✅ Remote added: $REPO_URL"
fi

# Get the remote URL
REMOTE_URL=$(git remote get-url origin)
echo "📡 Remote URL: $REMOTE_URL"

# Extract username and repo name from URL
if [[ $REMOTE_URL =~ github.com[:/]([^/]+)/([^/.]+) ]]; then
    USERNAME="${BASH_REMATCH[1]}"
    REPONAME="${BASH_REMATCH[2]}"
    PAGES_URL="https://${USERNAME}.github.io/${REPONAME}/"
else
    echo "⚠️  Could not parse GitHub URL"
    PAGES_URL="(check GitHub Pages settings)"
fi

# Push to GitHub
echo ""
echo "🚀 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "=============================================="
echo "✅ Deployment Complete!"
echo "=============================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Go to your repository on GitHub:"
echo "   ${REMOTE_URL%.git}"
echo ""
echo "2. Click on 'Settings' → 'Pages'"
echo ""
echo "3. Under 'Source', select 'GitHub Actions'"
echo ""
echo "4. Wait 1-2 minutes for deployment"
echo ""
echo "5. Your site will be live at:"
echo "   $PAGES_URL"
echo ""
echo "=============================================="
echo ""
echo "💡 Tips:"
echo "   - Any future push to 'main' will auto-deploy"
echo "   - Check 'Actions' tab to monitor deployments"
echo "   - LocalStorage data is per-device/browser"
echo ""
echo "Happy climbing! 🧗"
