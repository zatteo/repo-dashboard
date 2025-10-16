import { createFileRoute } from '@tanstack/react-router'
import { getRepositories } from '../data/repositories'
import { getMetadata } from '../data/metadata'
import { Star, GitFork, AlertCircle, Calendar, ExternalLink, Clock } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: Dashboard,
  loader: async () => {
    const [repositories, metadata] = await Promise.all([
      getRepositories(),
      getMetadata(),
    ])
    return { repositories, metadata }
  },
})

function Dashboard() {
  const { repositories, metadata } = Route.useLoaderData()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  const formatLastUpdated = (dateString: string | null) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Repository Dashboard
          </h1>
          <p className="text-gray-400 text-lg mb-2">
            Monitoring {repositories.length} public repositories
          </p>
          {metadata.lastUpdated && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Clock className="w-4 h-4" />
              <span>Last updated: {formatLastUpdated(metadata.lastUpdated)}</span>
            </div>
          )}
        </div>

        {repositories.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">
              No repositories found
            </h2>
            <p className="text-gray-400 mb-6">
              Run <code className="px-2 py-1 bg-slate-700 rounded text-cyan-400">npm run fetch-repos</code> to fetch repository data
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <img
                      src={repo.owner.avatar_url}
                      alt={repo.owner.login}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-2xl font-semibold text-white hover:text-cyan-400 transition-colors flex items-center gap-2"
                        >
                          {repo.full_name}
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      </div>
                      {repo.description && (
                        <p className="text-gray-400 mb-3">{repo.description}</p>
                      )}
                      {repo.topics.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {repo.topics.map((topic) => (
                            <span
                              key={topic}
                              className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-sm rounded-full border border-cyan-500/20"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span className="font-semibold">{formatNumber(repo.stargazers_count)}</span>
                    <span className="text-gray-500">stars</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <GitFork className="w-5 h-5 text-blue-400" />
                    <span className="font-semibold">{formatNumber(repo.forks_count)}</span>
                    <span className="text-gray-500">forks</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="font-semibold">{formatNumber(repo.open_issues_count)}</span>
                    <span className="text-gray-500">issues</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-5 h-5 text-green-400" />
                    <span className="text-gray-500">Updated {formatDate(repo.updated_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-400 pt-4 border-t border-slate-700">
                  {repo.language && (
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-cyan-500 rounded-full"></span>
                      <span>{repo.language}</span>
                    </div>
                  )}
                  {repo.license && (
                    <div className="flex items-center gap-2">
                      <span>{repo.license.name}</span>
                    </div>
                  )}
                  {repo.homepage && (
                    <a
                      href={repo.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-cyan-400 transition-colors flex items-center gap-1"
                    >
                      Website <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
