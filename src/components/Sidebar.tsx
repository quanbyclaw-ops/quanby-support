'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserRole } from '@prisma/client'
import { cn } from '@/lib/utils'

type Props = {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    organizationName?: string | null
  }
}

const navItems = (role: UserRole) => {
  const base = [
    { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { href: '/tickets', label: 'Tickets', icon: '🎫' },
    { href: '/knowledge', label: 'Knowledge Base', icon: '📚' },
  ]
  if (role === 'CLIENT') return [...base, { href: '/settings', label: 'Settings', icon: '⚙' }]
  
  const staff = [
    ...base,
    { href: '/tickets/new', label: 'New Ticket', icon: '+' },
  ]
  
  if (role === 'ADMIN' || role === 'MANAGER') {
    staff.push(
      { href: '/admin/reports', label: 'Reports', icon: '📊' },
      { href: '/admin/users', label: 'Users', icon: '👥' },
    )
  }
  if (role === 'ADMIN') {
    staff.push(
      { href: '/admin/organizations', label: 'Organizations', icon: '🏢' },
      { href: '/admin/sla', label: 'SLA Config', icon: '⏱' },
    )
  }
  staff.push({ href: '/settings', label: 'Settings', icon: '⚙' })
  return staff
}

export default function Sidebar({ user }: Props) {
  const pathname = usePathname()
  const items = navItems(user.role)

  return (
    <aside className="w-64 min-h-screen bg-[#1a3a5c] text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#1a3a5c] font-bold text-sm">Q</div>
          <div>
            <div className="font-bold text-sm leading-tight">Quanby Support</div>
            <div className="text-xs text-white/60 leading-tight">IT Solutions</div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-xs text-white/60 truncate">{user.role}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <span className="w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <form action="/api/auth/logout" method="POST">
          <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors w-full">
            <span className="w-5 text-center">→</span>
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  )
}
