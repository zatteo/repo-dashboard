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
  date: string
  duration: number
  runNumber: number
  conclusion: string
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

  // Prepare line chart data
  const getChartData = (runs: GitHubWorkflowRun[]): RunDataPoint[] => {
    return runs.slice(-50).map((run) => ({
      date: new Date(run.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      duration: Math.round(run.duration_seconds / 60), // Convert to minutes
      runNumber: run.run_number,
      conclusion: run.conclusion || 'unknown',
    }))
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
            CI/CD Pipeline Analytics
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
                <h3 className="text-xl font-semibold text-white mb-4">
                  Workflow Run Duration (Last 50 Runs)
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
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
                        value: 'Duration (minutes)',
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#9CA3AF',
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F3F4F6',
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'duration') {
                          return [`${value} min`, 'Duration']
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
                      dataKey="duration"
                      stroke="#06B6D4"
                      strokeWidth={2}
                      dot={{ fill: '#06B6D4', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Duration (min)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Recent Runs */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Recent Workflow Runs
                </h3>
                <div className="space-y-2">
                  {repoRuns.slice(-10).reverse().map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {run.conclusion === 'success' ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : run.conclusion === 'failure' ? (
                          <XCircle className="w-5 h-5 text-red-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-400" />
                        )}
                        <div>
                          <p className="text-white font-medium">{run.name}</p>
                          <p className="text-sm text-gray-400">
                            #{run.run_number} • {run.head_branch}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">
                          {formatDuration(run.duration_seconds)}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(run.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
