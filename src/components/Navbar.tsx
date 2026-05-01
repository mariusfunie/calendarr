'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Tv2, Film, LayoutDashboard, Settings2, CalendarDays } from 'lucide-react'
import clsx from 'clsx'

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/series', label: 'Series', icon: Tv2 },
  { href: '/movies', label: 'Movies', icon: Film },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/settings', label: 'Settings', icon: Settings2 },
]

export default function Navbar() {
  const pathname = usePathname()
  return (
    <header className="fixed top-0 inset-x-0 z-50 h-16 border-b border-[#1e1e32] bg-[#09090f]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 select-none">
          <span className="text-2xl">📅</span>
          <span className="font-bold text-lg tracking-tight text-[#e8e8f4]">Calendarr</span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-[#4f46e5]/15 text-[#818cf8]'
                    : 'text-[#6b6b8a] hover:text-[#e8e8f4] hover:bg-[#17172a]'
                )}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
