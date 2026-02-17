import { createFileRoute } from '@tanstack/react-router';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Package } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { PageLayout } from '../components/layout/PageLayout';
import { getPackages } from '../data/packages';
import { getVersionColorClass } from '../utils/packageUtils';

export const Route = createFileRoute('/packages')({
  component: PackagesPage,
  loader: async () => {
    const packages = await getPackages();
    return { packages };
  },
});

interface PackageRow {
  packageName: string;
  [repoName: string]: string;
}

interface TrackedPackage {
  name: string;
  targetVersion?: string;
}

const TRACKED_PACKAGES: TrackedPackage[] = [
  { name: 'node', targetVersion: '20.0.0' },
  { name: 'yarn', targetVersion: '4.0.0' },
  { name: '@rsbuild/core', targetVersion: '1.5.0' },
  { name: 'jest', targetVersion: '29.7.0' },
  { name: 'prettier' },
  { name: 'typescript' },
  { name: 'react', targetVersion: '18.0.0' },
  { name: 'cozy-client' },
  { name: 'cozy-ui' },
];

function PackagesPage() {
  const { packages } = Route.useLoaderData();

  // Transform data for the table
  const tableData: PackageRow[] = TRACKED_PACKAGES.map((pkg) => {
    const row: PackageRow = { packageName: pkg.name };

    packages.forEach((repoData) => {
      let version: string | null = null;

      // Handle special cases for node and yarn
      if (pkg.name === 'node') {
        version = repoData.nodeVersion;
      } else if (pkg.name === 'yarn') {
        version = repoData.yarnVersion;
      } else {
        // Check both dependencies and devDependencies for regular packages
        version =
          repoData.dependencies[pkg.name] || repoData.devDependencies[pkg.name];
      }

      row[repoData.repo_name] = version || '-';
    });

    return row;
  });

  // Create columns dynamically based on repositories
  const columnHelper = createColumnHelper<PackageRow>();

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
        const packageName = info.row.original.packageName;
        const trackedPackage = TRACKED_PACKAGES.find(
          (p) => p.name === packageName,
        );
        return (
          <div className="font-mono text-sm text-gray-400">
            {trackedPackage?.targetVersion || '-'}
          </div>
        );
      },
    }),
    ...packages.map((repo) =>
      columnHelper.accessor(repo.repo_name, {
        header: repo.repo_name,
        cell: (info) => {
          const value = info.getValue();
          const packageName = info.row.original.packageName;
          const trackedPackage = TRACKED_PACKAGES.find(
            (p) => p.name === packageName,
          );

          const textColor = getVersionColorClass(
            value,
            trackedPackage?.targetVersion,
          );

          return (
            <div className={`${textColor} font-mono text-sm`}>{value}</div>
          );
        },
      }),
    ),
  ];

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <PageLayout>
      <PageHeader
        title="Packages"
        description={`Compare package versions across ${packages.length} repositories`}
      />

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-300 border-b border-slate-600"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
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
                        cell.getContext(),
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
        <Package className="w-4 h-4" aria-hidden="true" />
        <span>
          Tracking {TRACKED_PACKAGES.length} key packages across all
          repositories
        </span>
      </div>
    </PageLayout>
  );
}
