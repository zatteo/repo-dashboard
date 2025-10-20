import { Home, Rocket, Activity, Package } from 'lucide-react'
import { NavLink } from './layout/NavLink'

export default function Header() {
	return (
		<aside className="fixed top-0 left-0 h-full w-64 bg-gray-900 text-white shadow-2xl z-50 flex flex-col">
			<nav className="flex-1 p-4 overflow-y-auto" aria-label="Main navigation">
				<NavLink
					to="/"
					icon={<Home size={20} />}
					label="Repository Dashboard"
				/>
				<NavLink to="/releases" icon={<Rocket size={20} />} label="Releases" />
				<NavLink to="/cicd" icon={<Activity size={20} />} label="CI/CD" />
				<NavLink to="/packages" icon={<Package size={20} />} label="Packages" />
			</nav>
		</aside>
	)
}
