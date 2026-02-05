# Vibe Castle Ladder - Bouldering Tracker

A single-page web app to track your bouldering problem progress.

## 🌐 Live Demo

Once deployed, access at: `https://[your-username].github.io/vibe-castle_ladder/`

## Features

- 📊 Track 21 bouldering problems (Ladder 1-20 + Bonus)
- 🎨 Visual progress grid with silver/gold completion boxes
- 💾 Persistent storage using localStorage (no backend needed)
- 🎯 Clean, responsive design
- 🔍 Filter by area and completion status
- 📱 Mobile-friendly interface

## Quick Deploy to GitHub Pages

### Automated Deployment (Recommended)

```bash
cd /Users/tnarik/Desktop/vibe-castle_ladder
./deploy.sh
```

The script will:
1. Initialize git (if needed)
2. Commit your files
3. Push to GitHub
4. Provide setup instructions

### Manual Deployment

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to repository **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - Site will auto-deploy on every push to main

3. **Access your site:**
   - URL: `https://[username].github.io/vibe-castle_ladder/`
   - First deployment takes 1-2 minutes

See [GITHUB_PAGES_SETUP.md](GITHUB_PAGES_SETUP.md) for detailed instructions.

## Structure

```
vibe-castle_ladder/
├── index.html          # Main HTML structure
├── styles.css          # Styling and layout
├── app.js              # Application logic and data
└── README.md           # This file
```

## Usage

Simply open `index.html` in your web browser. Your progress will be saved automatically to localStorage.

## Problem Configuration

Currently, problems are defined in the `PROBLEMS_DATA` array in `app.js`:

```javascript
const PROBLEMS_DATA = [
    { id: 1, name: "Crimpy Delight", color: "#FF6B6B", area: "Main Wall" },
    // ... more problems
];
```

### Problem Properties:
- `id`: Unique identifier (number)
- `name`: Problem name (string)
- `color`: Hex color code for the problem hold color (string)
- `area`: Location/section where the problem is found (string)

## Status Types

Each problem can have one of three statuses:
- **Not Started**: Haven't attempted yet
- **In Progress**: Currently working on it
- **Completed**: Successfully sent!

## Future Enhancements

- [ ] Move problem data to a separate `problems.json` file
- [ ] Add notes/comments for each problem
- [ ] Track attempt history and dates
- [ ] Export/import functionality
- [ ] PWA support for offline use
- [ ] Add problem difficulty/grade tracking

## Technical Notes

- **localStorage key**: `bouldering-progress`
- **Storage format**: JSON object mapping problem IDs to status
- **Browser compatibility**: Works on all modern browsers
- **Mobile-friendly**: Responsive design works on phones and tablets

## License

Free to use and modify as needed.
