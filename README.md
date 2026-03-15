# 🎮 PathFinder

A strategic puzzle game where players find the minimum sum path through dynamic grids.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 + TypeScript
- **Styling**: Tailwind CSS
- **Hosting**: Cloudflare Pages (Free)
- **Database**: Supabase (Free tier)
- **Auth**: Supabase Auth

## 📁 Project Structure

```
/pathfinder-web
├── /app                  # Next.js app router pages
│   ├── /game            # Main game page
│   ├── /leaderboard     # Leaderboard page
│   ├── /profile         # User profile page
│   └── /api             # API routes
├── /components          # React components
│   ├── /game           # Game-specific components
│   └── /ui             # UI components
├── /lib                # Utilities
│   ├── game.ts         # Game logic
│   └── supabase.ts     # Database client
├── /supabase           # Database schema
└── /public             # Static assets
```

## 🎮 Game Modes

### Classic Mode
- Progress through grid sizes 3×3 to 10×10
- Find the optimal path with lowest sum
- Earn 1-3 stars based on attempts

### Survival Mode
- Start at 3×3, advance through infinite levels
- 3 lives, decreasing time limits
- Compete for high score on global leaderboard

## 📝 Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy to Cloudflare Pages
- Connect GitHub repo to Cloudflare Pages
- Build command: `npm run build`
- Output directory: `dist`

### 3. Set up Supabase
- Run schema.sql in Supabase SQL Editor
- Copy credentials to environment variables

## 📄 License

MIT License - Free to use and modify
