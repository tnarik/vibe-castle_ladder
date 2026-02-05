# GitHub Pages Setup Instructions

This repository is configured to automatically deploy to GitHub Pages.

## Automatic Setup (Recommended)

1. **Push your code to GitHub:**
   ```bash
   cd /Users/tnarik/Desktop/vibe-castle_ladder
   git add .
   git commit -m "Initial commit with GitHub Pages setup"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click on **Settings** tab
   - Click on **Pages** in the left sidebar
   - Under **Source**, select **GitHub Actions**
   - The site will automatically deploy when you push to main

3. **Access your site:**
   - Your site will be available at: `https://[your-username].github.io/vibe-castle_ladder/`
   - It may take 1-2 minutes for the first deployment

## What Happens Automatically

- Every time you push to the `main` branch, GitHub Actions will:
  1. Build your site
  2. Deploy it to GitHub Pages
  3. Make it available at your GitHub Pages URL

## Manual Setup (Alternative)

If you prefer not to use GitHub Actions:

1. Go to **Settings** → **Pages**
2. Under **Source**, select **Deploy from a branch**
3. Select **main** branch and **/ (root)** folder
4. Click **Save**

## Troubleshooting

- If the site doesn't work, check the **Actions** tab for deployment status
- Make sure GitHub Pages is enabled in your repository settings
- Ensure your repository is public (or you have GitHub Pro for private repos)

## Local Testing

Before pushing, test locally by opening `index.html` in your browser.
