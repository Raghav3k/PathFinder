# PathFinder - AI Agent Handoff Document

> **READ THIS FIRST** before making any changes to the codebase.

---

## ⚠️ IMPORTANT: Context Limits & Note Taking

### The Problem
Kimi CLI has a context limit (~128k tokens). When conversations get long, older messages are **compacted into a summary**. This means:
- ❌ Specific error messages get lost
- ❌ Detailed reasoning for decisions disappears  
- ❌ Failed attempts and debugging steps are forgotten
- ✅ Only high-level summaries remain

### What You (Future Agent) Should Do

**1. READ FILES FIRST**
```
Don't rely on conversation history - it may be compacted.
ALWAYS read the actual source files to understand current state.
```

**2. UPDATE THIS DOCUMENT**
When you make significant changes, update AGENTS.md:
- Add to "What's Been Done" in Current Status
- Update "Critical Implementation Details" if behavior changes
- Add new "Common Pitfalls" if you discovered any

**3. RECORD IMPORTANT DECISIONS**
When something important happens, add it here:
```markdown
### Recent Decisions Log (Add new entries at top)
| Date | Decision | Why | Impact |
|------|----------|-----|--------|
| 2026-03-18 | Add difficulty modes | Maze complexity Easy→Expert | game.ts, ClassicMode |
| 2026-03-18 | Add 1 Minute mode | Flow state speed challenge | OneMinMode.tsx, game page |
| 2026-03-18 | Cross-device sync enabled | Users can switch devices mid-game | progress.ts, ClassicMode, SurvivalMode |
| 2026-03-18 | Warm Paper Theme redesign | Avoid "AI slop", editorial aesthetic | globals.css, all components |
| 2026-03-18 | Fraunces + DM Sans fonts | Display vs body separation | layout.tsx, tailwind.config.ts |
| 2026-03-18 | OKLCH color space | Better perceptual uniformity | All colors in globals.css |
| 2026-03-18 | Exponential easing | Bouncy, playful interactions | CSS transitions |
| 2026-03-17 | Timer pauses on not-optimal | User can think without pressure | ClassicMode.tsx |
| 2026-03-17 | Sum excludes START/END | Fair scoring (corners are fixed) | game.ts, ClassicMode.tsx |
| 2026-03-17 | gridKey state for re-mount | Fixes React freeze bug | GameGrid.tsx usage |
| 2026-03-17 | Survival countdown timer | Creates urgency vs Classic | SurvivalMode.tsx |
```

**4. DON'T OVERFLOW WITH DETAILS**
Only record:
- ✅ Design decisions and their rationale
- ✅ Bug fixes and root causes
- ✅ Breaking changes or gotchas
- ✅ Architecture patterns established

Don't record:
- ❌ Every little code change
- ❌ Typos or formatting fixes
- ❌ Experimental attempts that failed

### If Something Is Missing
If the user asks about something not in this file:
1. Check the source files (they're the truth)
2. Ask the user for clarification if needed
3. **Don't guess** - the compacted context may have lost details

---

## 📍 Current Status (Last Updated: 2026-03-18)

### What's Been Done
1. **Classic Mode Rebuilt** - Fixed grid freeze bug by isolating component, timer pauses on not-optimal, stops on optimal
2. **Continue Feature** - Auto-saves game state to localStorage, can resume same puzzle
3. **Survival Mode Update** - Same UI as Classic, countdown timer, lives system, score removed
4. **Sum Calculation Fix** - Excludes START/END cells from "Your" sum and optimal sum
5. **UI Redesign Complete** - Warm Paper Theme with Fraunces/DM Sans typography, OKLCH colors

### Live Deployment
- **URL:** https://pathfinder-dvg.pages.dev
- **Last Deployment:** March 18, 2026 (UI redesign)

### Git State
- **Latest Commit:** `6f5acf6` - SNAPSHOT: Before UI redesign
- **Tag:** `v1.0-working` - Working version before redesign
- **Uncommitted Changes:** UI redesign files (globals.css, layout.tsx, GameGrid, ClassicMode, SurvivalMode)

---

## 🔄 The Development Workflow

When making ANY changes to PathFinder, follow this exact process:

### 1. EXPLORE & UNDERSTAND
```
ALWAYS start by reading the relevant files:
- Check components/game/ for game components
- Check app/ for pages
- Check lib/ for utilities
- Read existing code before modifying
```

### 2. MAKE CHANGES
- Edit files using StrReplaceFile or WriteFile
- Follow existing code patterns
- Keep TypeScript types intact
- Preserve game logic (especially path validation, sum calculation)

### 3. BUILD LOCALLY
```bash
cd D:\dev\projects\PathFinder\pathfinder-web
npm run build
```
**Watch for:** TypeScript errors, ESLint warnings, build failures

### 4. TEST LOCALLY (Optional but recommended)
```bash
npm run dev
# Open http://localhost:3000
```

### 5. DEPLOY TO CLOUDFLARE
```bash
cd D:\dev\projects\PathFinder\pathfinder-web
npx wrangler pages deploy dist --project-name=pathfinder
```

**Project name is `pathfinder` NOT `pathfinder-dvg`**

### 6. VERIFY DEPLOYMENT
- Check the deployed URL
- Test the feature you changed
- Confirm no console errors

---

## 🎨 Design System (NEW - Post Redesign)

### Typography
- **Display/Numbers:** Fraunces (Google Font with SOFT, WONK axes)
- **Body/UI:** DM Sans (Google Font)
- **Usage:** `font-display` for headings/grid numbers, `font-body` for everything else

### Color System (OKLCH)
```css
--bg-primary: oklch(12% 0.02 60)      /* Deep warm dark */
--bg-paper: oklch(18% 0.03 70)        /* Card backgrounds */
--bg-elevated: oklch(25% 0.04 75)     /* Elevated cards */
--accent: oklch(70% 0.15 75)          /* Amber (not cyan/purple) */
--accent-light: oklch(85% 0.08 75)    /* Light amber */
--start: oklch(65% 0.12 145)          /* Green for START */
--end: oklch(60% 0.15 25)             /* Red for END */
```

### Design Principles
- **NO "AI slop":** No Inter font, no cyan/purple, no glassmorphism
- **Asymmetric layouts:** Editorial-style, staggered cards
- **Exponential easing:** `cubic-bezier(0.34, 1.56, 0.64, 1)` for bouncy interactions
- **Warm paper aesthetic:** Cream/amber tones on dark backgrounds

---

## 🏗️ Project Structure

```
pathfinder-web/
├── app/
│   ├── layout.tsx              # Root layout - fonts configured here
│   ├── globals.css             # Global styles - OKLCH color variables
│   ├── page.tsx                # Home page
│   ├── game/page.tsx           # Game page (Classic/Survival router)
│   ├── auth/signin/page.tsx    # Sign in
│   ├── auth/callback/route.ts  # OAuth callback
│   ├── profile/page.tsx        # User profile
│   └── leaderboard/page.tsx    # Leaderboard
├── components/
│   ├── game/
│   │   ├── GameGrid.tsx        # Grid component - paper texture styling
│   │   ├── ClassicMode.tsx     # Classic mode - asymmetric layout
│   │   └── SurvivalMode.tsx    # Survival mode - countdown timer UI
│   └── ui/
│       └── Navbar.tsx          # Navigation
├── lib/
│   ├── supabase.ts             # Supabase client & auth
│   ├── game.ts                 # Game logic (generateGrid, validateSolution, etc.)
│   ├── gameState.ts            # LocalStorage persistence
│   └── progress.ts             # Supabase database operations
├── dist/                       # Build output (DEPLOY THIS)
└── next.config.mjs             # Must have: output: 'export', distDir: 'dist'
```

---

## ⚠️ Critical Implementation Details

### Timer Behavior (IMPORTANT)
- **During Play:** Timer runs
- **Not Optimal Result:** Timer PAUSES (user clicks "Try Again" to resume)
- **Optimal Result:** Timer STOPS permanently

### Sum Calculation (IMPORTANT)
- **Your Sum:** Sum of SELECTED cells, excluding START and END
- **Best Sum:** Optimal path sum, excluding START and END
- **Implementation:** `path.slice(1, -1)` to exclude corners

### Grid Freeze Prevention
- **Problem:** React state conflicts when transitioning levels
- **Solution:** `gridKey` state forces GameGrid re-mount on level change
- **Pattern:** `<GameGrid key={gridKey} ... />` where `gridKey = level`

### Game State Persistence
- **Guests:** localStorage only (`gameState.ts`)
- **Signed-in:** Supabase `current_runs` table (if migration run)
- **Continue Feature:** Restores exact same puzzle (grid + path)

---

## 🛠️ Key Files to Know

### Game Logic: `lib/game.ts`
- `generateGrid(size, mode)` - Creates puzzle grid
- `validateSolution(grid, path)` - Checks if path is valid
- `findOptimalPath(grid)` - Dijkstra's algorithm for optimal path
- **DO NOT MODIFY** these core functions without understanding the game

### Game Grid: `components/game/GameGrid.tsx`
- Handles cell selection, path visualization
- Uses `gridKey` for re-mounting
- Styled with paper-texture aesthetic

### Classic Mode: `components/game/ClassicMode.tsx`
- Asymmetric layout (grid left, status right)
- Timer pause/resume logic
- Auto-save on every path change

### Survival Mode: `components/game/SurvivalMode.tsx`
- Same UI as Classic
- Countdown timer (not up)
- Lives system (❤️ display)

---

## 🧪 Testing Checklist (After Any Change)

### Classic Mode
- [ ] Start new game (3×3)
- [ ] Continue previous game
- [ ] Timer pauses on "not optimal"
- [ ] Timer stops on "optimal"
- [ ] Sum excludes START/END cells
- [ ] Progress saves after level complete

### Survival Mode
- [ ] Countdown timer works
- [ ] Lives display correctly
- [ ] Lose life on wrong path
- [ ] Game over at 0 lives

### Auth
- [ ] Sign in with Google works
- [ ] Sign out clears state

---

## 🚨 Common Pitfalls

1. **Don't break the timer logic** - The pause/resume is delicate
2. **Don't modify sum calculation** - START/END exclusion is intentional
3. **Don't remove gridKey** - It prevents the freeze bug
4. **Don't change OKLCH colors randomly** - The warm paper theme is intentional
5. **Don't forget to build** - Always build before deploying
6. **Use correct project name** - `pathfinder` not `pathfinder-dvg`

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `AGENTS.md` | This file - AI agent handoff |
| `KIMI_PROMPT.md` | Original project context |
| `KM_LORE.md` | Project lore/story |
| `STATUS.md` | Detailed status report |
| `ROADMAP.md` | Future plans |
| `SIMPLE_GUIDE.md` | Simple user guide |
| `SQL_MIGRATION_PENDING.md` | Pending SQL migrations |

---

## 💾 Backup & Recovery

### If Redesign Has Issues:
```bash
# Revert to working version
cd D:\dev\projects\PathFinder\pathfinder-web
git checkout v1.0-working
npm run build
npx wrangler pages deploy dist --project-name=pathfinder
```

### Or restore from backup:
```powershell
# Copy backup over current
copy .backups\pathfinder-web-pre-ui-redesign\* . -Recurse -Force
```

---

## 🔑 Environment Variables

Create `pathfinder-web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://kcbvupdqgbevatxctlbb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnZ1cGRxZ2JldmF0eGN0bGJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDM0MDUsImV4cCI6MjA4OTExOTQwNX0.gRFM_nFYe9URrzfJjUDGNDz0b8pybCePe6uLxcx9rFQ
```

**Already configured in Cloudflare Pages.**

---

## 📞 Resources

- **Supabase Dashboard:** https://supabase.com/dashboard/project/kcbvupdqgbevatxctlbb
- **Cloudflare Pages:** https://dash.cloudflare.com/ → Workers & Pages → pathfinder
- **Live Site:** https://pathfinder-dvg.pages.dev

---

**When in doubt:** Read the existing code first, follow the workflow, and test thoroughly.

*Document created: March 18, 2026*
