import { Link } from '@tanstack/react-router'
import {
  Home,
  Rocket,
  Activity,
  Package,
} from 'lucide-react'

export default function Header() {
  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-gray-900 text-white shadow-2xl z-50 flex flex-col">
      <nav className="flex-1 p-4 overflow-y-auto">
        <Link
          to="/"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
          activeProps={{
            className:
              'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
          }}
        >
          <Home size={20} />
          <span className="font-medium">Repository Dashboard</span>
        </Link>

        <Link
          to="/releases"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
          activeProps={{
            className:
              'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
          }}
        >
          <Rocket size={20} />
          <span className="font-medium">Releases</span>
        </Link>

        <Link
          to="/cicd"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
          activeProps={{
            className:
              'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
          }}
        >
          <Activity size={20} />
          <span className="font-medium">CI/CD</span>
        </Link>

        <Link
          to="/packages"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
          activeProps={{
            className:
              'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
          }}
        >
          <Package size={20} />
          <span className="font-medium">Packages</span>
        </Link>
      </nav>
    </aside>
  )
}
