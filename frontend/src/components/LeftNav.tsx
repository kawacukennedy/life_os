import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/app/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/app/health', label: 'Health', icon: '💚' },
  { href: '/app/finance', label: 'Finance', icon: '💰' },
  { href: '/app/learn', label: 'Learn', icon: '📚' },
  { href: '/app/routines', label: 'Routines', icon: '🤖' },
  { href: '/app/analytics', label: 'Analytics', icon: '📊' },
  { href: '/app/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/app/settings', label: 'Settings', icon: '⚙️' },
]

export default function LeftNav() {
  const pathname = usePathname()

  return (
    <nav
      className="bg-white shadow-lg w-64 min-h-screen"
      aria-label="Main navigation"
      role="navigation"
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary-start">LifeOS</h1>
      </div>
      <div className="px-4">
        <ul className="space-y-2" role="list">
          {navItems.map((item) => (
            <li key={item.href} role="listitem">
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-primary-start text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-current={pathname === item.href ? 'page' : undefined}
                aria-label={`Navigate to ${item.label}`}
              >
                <span className="mr-3" aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}