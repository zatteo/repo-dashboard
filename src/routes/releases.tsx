import { createFileRoute } from '@tanstack/react-router'
import { getReleases } from '../data/releases'
import { getRepositories } from '../data/repositories'
import { GitBranch, Tag, Calendar, AlertCircle } from 'lucide-react'
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
                <div className="flex items-center gap-6 text-gray-400 flex-wrap">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-5 h-5" />
                    <span>
                      {repoReleases.filter((r) => !r.prerelease).length} stable
                      releases
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    <span>
                      {repoReleases.filter((r) => r.prerelease).length} beta
                      releases
                    </span>
                  </div>
                  {lastStableRelease && (
                    <div className="flex items-center gap-2">
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
                        Last stable:{' '}
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
