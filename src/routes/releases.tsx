import { createFileRoute } from '@tanstack/react-router'
import { getReleases } from '../data/releases'
import { getRepositories } from '../data/repositories'
import { Calendar, AlertCircle } from 'lucide-react'
import type { GitHubRelease } from '../types/github'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export const Route = createFileRoute('/releases')({
  component: Releases,
  loader: async () => {
    const [releases, repositories] = await Promise.all([
      getReleases(),
      getRepositories(),
    ])
    return { releases, repositories }
  },
})

interface MonthlyStats {
  month: string
  year: number
  stable: number
  beta: number
  total: number
}

function Releases() {
  const { releases, repositories } = Route.useLoaderData()

  // Group releases by repository
  const releasesByRepo = repositories.reduce(
    (acc, repo) => {
      acc[repo.full_name] = releases
        .filter((r) => r.repo_full_name === repo.full_name && !r.draft)
        .sort(
          (a, b) =>
            new Date(b.published_at || b.created_at).getTime() -
            new Date(a.published_at || a.created_at).getTime()
        )
      return acc
    },
    {} as Record<string, GitHubRelease[]>
  )

  // Get the last stable release for a repository
  const getLastStableRelease = (repoReleases: GitHubRelease[]) => {
    return repoReleases.find((r) => !r.prerelease)
  }

  // Get the latest stable version
  const getLatestStableVersion = (repoReleases: GitHubRelease[]): string | null => {
    const stableRelease = repoReleases.find((r) => !r.prerelease)
    return stableRelease?.tag_name || null
  }

  // Get the latest beta version (only if not superseded by stable)
  const getLatestBetaVersion = (repoReleases: GitHubRelease[]): string | null => {
    const latestBeta = repoReleases.find((r) => r.prerelease)
    if (!latestBeta) return null

    // Parse version numbers to check if beta is superseded
    const betaVersion = latestBeta.tag_name
    const stableVersion = getLatestStableVersion(repoReleases)

    if (!stableVersion) return betaVersion

    // Extract base version from beta (e.g., "1.49.0-beta.1" -> "1.49.0")
    const betaMatch = betaVersion.match(/^(\d+\.\d+\.\d+)/)
    const stableMatch = stableVersion.match(/^(\d+\.\d+\.\d+)/)

    if (!betaMatch || !stableMatch) return betaVersion

    const betaBase = betaMatch[1]
    const stableBase = stableMatch[1]

    // Compare version strings: if beta base <= stable base, beta is superseded
    const betaParts = betaBase.split('.').map(Number)
    const stableParts = stableBase.split('.').map(Number)

    for (let i = 0; i < 3; i++) {
      if (betaParts[i] > stableParts[i]) {
        return betaVersion // Beta is newer
      }
      if (betaParts[i] < stableParts[i]) {
        return null // Beta is superseded
      }
    }

    // Same base version means beta is superseded by stable
    return null
  }

  // Check if a date is more than 1 month old
  const isMoreThanOneMonthOld = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    return date < oneMonthAgo
  }

  // Calculate monthly statistics for each repo
  const getMonthlyStats = (repoReleases: GitHubRelease[]): MonthlyStats[] => {
    const monthlyMap = new Map<string, MonthlyStats>()

    repoReleases.forEach((release) => {
      const date = new Date(release.published_at || release.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          month: monthName,
          year: date.getFullYear(),
          stable: 0,
          beta: 0,
          total: 0,
        })
      }

      const stats = monthlyMap.get(key)!
      stats.total++
      if (release.prerelease) {
        stats.beta++
      } else {
        stats.stable++
      }
    })

    // Fill in missing months with zero releases
    const now = new Date()
    const last12Months: MonthlyStats[] = []

    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`
      const monthName = targetDate.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })

      // Find existing data for this month using the key
      const existingData = monthlyMap.get(key)

      last12Months.push(
        existingData || {
          month: monthName,
          year: targetDate.getFullYear(),
          stable: 0,
          beta: 0,
          total: 0,
        }
      )
    }

    return last12Months
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 ml-64">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Releases
          </h1>
          <p className="text-gray-400 text-lg">
            Track releases across all monitored repositories
          </p>
        </div>

        {repositories.map((repo) => {
          const repoReleases = releasesByRepo[repo.full_name] || []
          const monthlyStats = getMonthlyStats(repoReleases)
          const lastStableRelease = getLastStableRelease(repoReleases)
          const latestStableVersion = getLatestStableVersion(repoReleases)
          const latestBetaVersion = getLatestBetaVersion(repoReleases)

          if (repoReleases.length === 0) return null

          return (
            <div
              key={repo.id}
              className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
            >
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={repo.owner.avatar_url}
                    alt={repo.owner.login}
                    className="w-10 h-10 rounded-full"
                  />
                  <h2 className="text-3xl font-bold text-white">
                    {repo.full_name}
                  </h2>
                </div>

                {/* Version Display */}
                <div className="flex items-center gap-4 mb-3">
                  {latestStableVersion && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-400">Latest Stable:</span>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                        {latestStableVersion}
                      </span>
                    </div>
                  )}
                  {latestBetaVersion && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-400">Latest Beta:</span>
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-semibold">
                        {latestBetaVersion}
                      </span>
                    </div>
                  )}
                </div>

                {lastStableRelease && (
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-400 text-gray-600">
                    {isMoreThanOneMonthOld(
                      lastStableRelease.published_at || lastStableRelease.created_at
                    ) ? (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <Calendar className="w-5 h-5" />
                    )}
                    <span
                      className={
                        isMoreThanOneMonthOld(
                          lastStableRelease.published_at || lastStableRelease.created_at
                        )
                          ? 'text-red-400'
                          : ''
                      }
                    >
                      Last stable release:{' '}
                      {new Date(
                        lastStableRelease.published_at || lastStableRelease.created_at
                      ).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Monthly Bar Chart */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  Monthly Release Activity
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={monthlyStats}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="month"
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F3F4F6',
                      }}
                    />
                    <Legend
                      wrapperStyle={{ color: '#9CA3AF' }}
                      iconType="circle"
                    />
                    <Bar dataKey="stable" fill="#22C55E" name="Stable" />
                    <Bar dataKey="beta" fill="#EAB308" name="Beta" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
