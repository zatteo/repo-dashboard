import { createFileRoute } from '@tanstack/react-router'
import { getWorkflowRuns } from '../data/workflow-runs'
import { getRepositories } from '../data/repositories'
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { GitHubWorkflowRun } from '../types/github'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export const Route = createFileRoute('/cicd')({
  component: CICDDashboard,
  loader: async () => {
    const [workflowRuns, repositories] = await Promise.all([
      getWorkflowRuns(),
      getRepositories(),
    ])
    return { workflowRuns, repositories }
  },
})

interface RunDataPoint {
  month: string
  avgDuration: number
  runCount: number
}

function CICDDashboard() {
  const { workflowRuns, repositories } = Route.useLoaderData()

  // Group workflow runs by repository
  const runsByRepo = repositories.reduce(
    (acc, repo) => {
      acc[repo.full_name] = workflowRuns
        .filter((r) => r.repo_full_name === repo.full_name)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      return acc
    },
    {} as Record<string, GitHubWorkflowRun[]>
  )

  // Prepare monthly average chart data
  const getChartData = (runs: GitHubWorkflowRun[]): RunDataPoint[] => {
    // Group runs by month
    const monthlyData = new Map<string, { total: number; count: number }>()

    runs.forEach((run) => {
      const date = new Date(run.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { total: 0, count: 0 })
      }

      const monthData = monthlyData.get(monthKey)!
      monthData.total += run.duration_seconds
      monthData.count += 1
    })

    // Generate all months from September 2024 to current month
    const startDate = new Date(2024, 8, 1) // September 2024
    const currentDate = new Date()
    const chartData: RunDataPoint[] = []

    let currentMonth = new Date(startDate)
    while (currentMonth <= currentDate) {
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = currentMonth.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })

      const data = monthlyData.get(monthKey)

      if (data && data.count > 0) {
        // Month has data
        chartData.push({
          month: monthLabel,
          avgDuration: Math.round((data.total / data.count / 60) * 100) / 100, // Average in minutes
          runCount: data.count,
        })
      } else {
        // Month has no data - add null values so line skips this month
        chartData.push({
          month: monthLabel,
          avgDuration: null as any,
          runCount: 0,
        })
      }

      // Move to next month
      currentMonth.setMonth(currentMonth.getMonth() + 1)
    }

    return chartData
  }

  // Calculate statistics
  const getStats = (runs: GitHubWorkflowRun[]) => {
    const successful = runs.filter((r) => r.conclusion === 'success').length
    const failed = runs.filter((r) => r.conclusion === 'failure').length
    const avgDuration =
      runs.reduce((sum, r) => sum + r.duration_seconds, 0) / runs.length / 60

    return {
      total: runs.length,
      successful,
      failed,
      avgDuration: Math.round(avgDuration * 10) / 10,
      successRate: Math.round((successful / runs.length) * 100),
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${minutes}m ${secs}s`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 ml-64">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            CI/CD
          </h1>
          <p className="text-gray-400 text-lg">
            GitHub Actions workflow run times and performance metrics
          </p>
        </div>

        {repositories.map((repo) => {
          const repoRuns = runsByRepo[repo.full_name] || []
          const chartData = getChartData(repoRuns)
          const stats = getStats(repoRuns)

          if (repoRuns.length === 0) return null

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

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Avg Duration</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {stats.avgDuration}m
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Success Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">
                      {stats.successRate}%
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm">Successful</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {stats.successful}
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-sm">Failed</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {stats.failed}
                    </p>
                  </div>
                </div>
              </div>

              {/* Line Chart */}
              <div>
                <h3 className="text-xl font-semibold text-white dark:text-white text-gray-900 mb-4">
                  Average Workflow Duration by Month
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="month"
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                      label={{
                        value: 'Average Duration (minutes)',
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#9CA3AF',
                      }}
                      domain={[0, 10]}
                      allowDecimals={true}
                      tickFormatter={(value) => value.toFixed(1)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F3F4F6',
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'avgDuration') {
                          return [`${value.toFixed(2)} min`, 'Avg Duration']
                        }
                        if (name === 'runCount') {
                          return [value, 'Run Count']
                        }
                        return [value, name]
                      }}
                    />
                    <Legend
                      wrapperStyle={{ color: '#9CA3AF' }}
                      iconType="line"
                    />
                    <Line
                      type="monotone"
                      dataKey="avgDuration"
                      stroke="#06B6D4"
                      strokeWidth={2}
                      dot={{ fill: '#06B6D4', r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls={true}
                      name="Avg Duration (min)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
