import { createFileRoute } from '@tanstack/react-router'
import { getRepositories } from '../data/repositories'
import { getMetadata } from '../data/metadata'
import { AlertCircle, Clock } from 'lucide-react'
import { PageLayout } from '../components/layout/PageLayout'
import { RepositoryListItem } from '../components/cards/RepositoryListItem'

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
		<PageLayout>
			<div className="mb-12">
				<h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
					Repository Dashboard
				</h1>
				<p className="text-gray-400 text-lg mb-2">
					Monitoring {repositories.length} public repositories
				</p>
				{metadata.lastUpdated && (
					<div className="flex items-center gap-2 text-gray-500 text-sm">
						<Clock className="w-4 h-4" aria-hidden="true" />
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
						Run{' '}
						<code className="px-2 py-1 bg-slate-700 rounded text-cyan-400">
							npm run fetch-repos
						</code>{' '}
						to fetch repository data
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-6" role="list" aria-label="Repository list">
					{repositories.map((repo) => (
						<RepositoryListItem key={repo.id} repository={repo} />
					))}
				</div>
			)}
		</PageLayout>
	)
}
