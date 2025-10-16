import { createFileRoute } from '@tanstack/react-router'
import { getPackages } from '../data/packages'
import { Package } from 'lucide-react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'

export const Route = createFileRoute('/packages')({
  component: PackagesPage,
  loader: async () => {
    const packages = await getPackages()
    return { packages }
  },
})

interface PackageRow {
  packageName: string
  [repoName: string]: string
}

interface TrackedPackage {
  name: string
  targetVersion?: string
}

const TRACKED_PACKAGES: TrackedPackage[] = [
  { name: 'node', targetVersion: '20.0.0' },
  { name: 'yarn', targetVersion: '1.22.0' },
  { name: '@rsbuild/core', targetVersion: '1.5.0' },
  { name: 'jest', targetVersion: '29.7.0' },
  { name: 'prettier' },
  { name: 'typescript' },
  { name: 'react' },
  { name: 'cozy-client' },
  { name: 'cozy-ui' },
]

function PackagesPage() {
  const { packages } = Route.useLoaderData()

  // Helper function to compare versions
  const isVersionGreaterOrEqual = (version: string, target: string): boolean => {
    // Remove common version prefixes and operators (^, ~, >=, >, =, v)
    const cleanVersion = version.replace(/^[\^~>=v]+/, '').trim()
    const cleanTarget = target.replace(/^[\^~>=v]+/, '').trim()

    const versionParts = cleanVersion.split('.').map(Number)
    const targetParts = cleanTarget.split('.').map(Number)

    for (let i = 0; i < Math.max(versionParts.length, targetParts.length); i++) {
      const v = versionParts[i] || 0
      const t = targetParts[i] || 0

      if (v > t) return true
      if (v < t) return false
    }

    return true // Equal
  }

  // Transform data for the table
  const tableData: PackageRow[] = TRACKED_PACKAGES.map((pkg) => {
    const row: PackageRow = { packageName: pkg.name }

    packages.forEach((repoData) => {
      let version: string | null = null

      // Handle special cases for node and yarn
      if (pkg.name === 'node') {
        version = repoData.nodeVersion
      } else if (pkg.name === 'yarn') {
        version = repoData.yarnVersion
      } else {
        // Check both dependencies and devDependencies for regular packages
        version = repoData.dependencies[pkg.name] || repoData.devDependencies[pkg.name]
      }

      row[repoData.repo_name] = version || '-'
    })

    return row
  })

  // Create columns dynamically based on repositories
  const columnHelper = createColumnHelper<PackageRow>()

  const columns = [
    columnHelper.accessor('packageName', {
      header: 'Package',
      cell: (info) => (
        <div className="font-semibold text-white">{info.getValue()}</div>
      ),
    }),
    columnHelper.display({
      id: 'target',
      header: 'Target',
      cell: (info) => {
        const packageName = info.row.original.packageName
        const trackedPackage = TRACKED_PACKAGES.find((p) => p.name === packageName)
        return (
          <div className="font-mono text-sm text-gray-400">
            {trackedPackage?.targetVersion || '-'}
          </div>
        )
      },
    }),
    ...packages.map((repo) =>
      columnHelper.accessor(repo.repo_name, {
        header: repo.repo_name,
        cell: (info) => {
          const value = info.getValue()
          const isInstalled = value !== '-'
          const packageName = info.row.original.packageName
          const trackedPackage = TRACKED_PACKAGES.find((p) => p.name === packageName)

          // Determine color based on target version
          let textColor = isInstalled ? 'text-cyan-400' : 'text-gray-500'

          if (isInstalled && trackedPackage?.targetVersion) {
            const meetsTarget = isVersionGreaterOrEqual(value, trackedPackage.targetVersion)
            textColor = meetsTarget ? 'text-green-400' : 'text-red-400'
          }

          return (
            <div className={`${textColor} font-mono text-sm`}>
              {value}
            </div>
          )
        },
      })
    ),
  ]

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 ml-64">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Packages
          </h1>
          <p className="text-gray-400 text-lg">
            Compare package versions across {packages.length} repositories
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-4 text-left text-sm font-semibold text-gray-300 border-b border-slate-600"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`${
                      idx % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/50'
                    } hover:bg-slate-700/50 transition-colors`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 border-b border-slate-700/50"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
          <Package className="w-4 h-4" />
          <span>
            Tracking {TRACKED_PACKAGES.length} key packages across all
            repositories
          </span>
        </div>
      </div>
    </div>
  )
}
