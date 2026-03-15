import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2 animate-pulse" />
            <span className="text-sm text-gray-300">Free to Play • No Download Required</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            <span className="block text-white">Find the</span>
            <span className="block text-gradient">Optimal Path</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Challenge your mind with strategic pathfinding puzzles. Navigate through grids, 
            minimize your score, and compete for the top spot on the leaderboard.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/game">
              <button className="btn-primary text-lg px-8 py-4">
                Start Playing
              </button>
            </Link>
            <Link href="#how-to-play">
              <button className="btn-secondary text-lg px-8 py-4">
                How to Play
              </button>
            </Link>
          </div>

          {/* Stats Preview */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div className="stat-card">
              <div className="stat-value">∞</div>
              <div className="stat-label">Puzzles</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">3-10</div>
              <div className="stat-label">Grid Sizes</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">2</div>
              <div className="stat-label">Game Modes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Game Modes Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#12121a]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Choose Your Challenge</h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-16">
            Two exciting game modes to test your strategic thinking
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Classic Mode Card */}
            <div className="game-card group hover:border-cyan-500/30 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">Classic Mode</h3>
              </div>
              <p className="text-gray-400 mb-6">
                Progress through grid sizes from 3×3 to 10×10. Find the optimal path with the lowest sum. 
                Earn stars based on your efficiency.
              </p>
              <ul className="space-y-3 mb-8 text-gray-300">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-cyan-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  8 grid sizes to master
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-cyan-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Star rating system
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-cyan-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Track your best times
                </li>
              </ul>
              <Link href="/game?mode=classic">
                <button className="btn-primary w-full">Play Classic</button>
              </Link>
            </div>

            {/* Survival Mode Card */}
            <div className="game-card group hover:border-purple-500/30 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">Survival Mode</h3>
              </div>
              <p className="text-gray-400 mb-6">
                Start at 3×3 and advance to larger grids. You have 3 lives and limited time. 
                How far can you go before running out?
              </p>
              <ul className="space-y-3 mb-8 text-gray-300">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-purple-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Infinite progression
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-purple-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  3 lives system
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-purple-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Global leaderboard
                </li>
              </ul>
              <Link href="/game?mode=survival">
                <button className="btn-secondary w-full border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white">
                  Play Survival
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How to Play Section */}
      <section id="how-to-play" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">How to Play</h2>
          <p className="text-gray-400 text-center mb-16">Master the art of pathfinding in 3 simple steps</p>

          <div className="space-y-12">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Start at the Green Cell</h3>
                <p className="text-gray-400">
                  Your journey begins at the green &quot;START&quot; cell. Your goal is to reach the red &quot;END&quot; cell 
                  by moving through adjacent cells (up, down, left, right only - no diagonals).
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Minimize Your Score</h3>
                <p className="text-gray-400">
                  Each cell has a number (1-9). Your path sum is the total of all cells you pass through. 
                  The challenge: find the path with the LOWEST total sum. Think strategically!
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Compete & Improve</h3>
                <p className="text-gray-400">
                  Submit your scores to the global leaderboard. Challenge friends, track your progress, 
                  and see how you rank against players worldwide. Can you reach the top?
                </p>
              </div>
            </div>
          </div>

          {/* Tip Box */}
          <div className="mt-16 p-6 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-white/10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Pro Tip</h4>
                <p className="text-gray-400">
                  Don&apos;t just follow low numbers blindly! Sometimes a higher number early on opens up 
                  a path with much lower numbers overall. Think ahead like in chess.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">PF</span>
            </div>
            <span className="text-lg font-bold text-white">PathFinder</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 PathFinder. Free to play, forever.
          </p>
          <div className="flex items-center space-x-6">
            <Link href="/leaderboard" className="text-gray-400 hover:text-white text-sm transition-colors">
              Leaderboard
            </Link>
            <Link href="/game" className="text-gray-400 hover:text-white text-sm transition-colors">
              Play Now
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
