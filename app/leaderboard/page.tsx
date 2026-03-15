'use client'

import { useState } from 'react'
import Navbar from '@/components/ui/Navbar'

type LeaderboardTab = 'survival' | 'classic'

// Mock data for now - will connect to Supabase later
const mockSurvivalLeaderboard = [
  { rank: 1, username: 'PathMaster', score: 15850, level: 12 },
  { rank: 2, username: 'GridWizard', score: 14200, level: 11 },
  { rank: 3, username: 'SpeedRunner', score: 13800, level: 10 },
  { rank: 4, username: 'LogicKing', score: 12500, level: 10 },
  { rank: 5, username: 'PuzzlePro', score: 11200, level: 9 },
  { rank: 6, username: 'PathFinder99', score: 10800, level: 9 },
  { rank: 7, username: 'GridMaster', score: 9500, level: 8 },
  { rank: 8, username: 'SpeedyGonzales', score: 8900, level: 8 },
  { rank: 9, username: 'BrainTeaser', score: 8200, level: 7 },
  { rank: 10, username: 'LogicNinja', score: 7800, level: 7 },
]

const mockClassicLeaderboard = [
  { rank: 1, username: 'PerfectScore', stars: 24, levels: 8 },
  { rank: 2, username: 'StarCollector', stars: 23, levels: 8 },
  { rank: 3, username: 'GridAce', stars: 22, levels: 8 },
  { rank: 4, username: 'PathExpert', stars: 21, levels: 8 },
  { rank: 5, username: 'SpeedDemon', stars: 20, levels: 8 },
  { rank: 6, username: 'LogicMaster', stars: 19, levels: 7 },
  { rank: 7, username: 'PuzzleKing', stars: 18, levels: 7 },
  { rank: 8, username: 'GridNinja', stars: 17, levels: 7 },
  { rank: 9, username: 'PathHunter', stars: 16, levels: 6 },
  { rank: 10, username: 'SpeedRunner', stars: 15, levels: 6 },
]

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('survival')

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-4 text-gradient">Leaderboard</h1>
        <p className="text-gray-400 text-center mb-12">See how you rank against other players</p>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-full bg-[#12121a] p-1 border border-white/10">
            <button
              onClick={() => setActiveTab('survival')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                activeTab === 'survival'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Survival Mode
            </button>
            <button
              onClick={() => setActiveTab('classic')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                activeTab === 'classic'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Classic Mode
            </button>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="game-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Rank</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Player</th>
                  <th className="text-right py-4 px-6 text-gray-400 font-medium">
                    {activeTab === 'survival' ? 'Score' : 'Stars'}
                  </th>
                  <th className="text-right py-4 px-6 text-gray-400 font-medium">
                    {activeTab === 'survival' ? 'Level' : 'Levels'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'survival' ? mockSurvivalLeaderboard : mockClassicLeaderboard).map((entry, index) => (
                  <tr
                    key={entry.rank}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                      index < 3 ? 'bg-white/5' : ''
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        {entry.rank === 1 && <span className="text-2xl mr-2">🥇</span>}
                        {entry.rank === 2 && <span className="text-2xl mr-2">🥈</span>}
                        {entry.rank === 3 && <span className="text-2xl mr-2">🥉</span>}
                        {entry.rank > 3 && (
                          <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-gray-400">
                            {entry.rank}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white mr-3">
                          {entry.username[0]}
                        </div>
                        <span className="font-medium text-white">{entry.username}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`font-bold ${
                        activeTab === 'survival' ? 'text-amber-400' : 'text-amber-400'
                      }`}>
                        {activeTab === 'survival' 
                          ? (entry as typeof mockSurvivalLeaderboard[0]).score.toLocaleString()
                          : '⭐'.repeat((entry as typeof mockClassicLeaderboard[0]).stars)
                        }
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-gray-400">
                      {activeTab === 'survival' 
                        ? `${(entry as typeof mockSurvivalLeaderboard[0]).level}×${(entry as typeof mockSurvivalLeaderboard[0]).level}` 
                        : `${(entry as typeof mockClassicLeaderboard[0]).levels}/8`
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Your Rank Placeholder */}
        <div className="mt-8 game-card border border-cyan-500/30 bg-cyan-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold mr-4">
                ?
              </div>
              <div>
                <p className="text-white font-medium">Sign in to see your rank</p>
                <p className="text-gray-400 text-sm">Track your progress and compete with friends</p>
              </div>
            </div>
            <button className="btn-primary text-sm">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
