import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  RefreshCcw,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useCurrencyStore } from '@/store/currency'
import { CclBadge } from '@/modules/dashboard/components/CclBadge'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/trading', label: 'Trading', icon: TrendingUp },
  { to: '/dca', label: 'DCA', icon: BarChart3 },
  { to: '/config', label: 'Config', icon: Settings },
  { to: '/ccl', label: 'CCL', icon: RefreshCcw },
]

function NavItem({
  item,
  collapsed,
}: {
  item: (typeof NAV_ITEMS)[0]
  collapsed: boolean
}) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.exact}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150',
          'hover:bg-accent hover:text-accent-foreground',
          isActive
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'text-muted-foreground',
          collapsed && 'justify-center px-2',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="font-body">{item.label}</span>}
    </NavLink>
  )
}

function CurrencyToggle() {
  const { currency, toggle } = useCurrencyStore()
  return (
    <button
      onClick={toggle}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-mono font-medium border transition-all',
        'border-warn/30 bg-warn/10 text-warn hover:bg-warn/20',
      )}
    >
      <span>{currency}</span>
    </button>
  )
}


export function RootLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const currentPage = NAV_ITEMS.find((item) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to),
  )

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background bg-grid">
      {/* ── Desktop Sidebar ── */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-200',
          collapsed ? 'w-14' : 'w-52',
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex items-center h-14 border-b border-border px-3 shrink-0',
            collapsed ? 'justify-center' : 'gap-2.5',
          )}
        >
          <div className="h-7 w-7 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-sm tracking-tight text-foreground truncate">
              PORTAFOLIO
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto scrollbar-thin">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} item={item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-border">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center justify-center p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-card/30 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2 md:hidden">
            <div className="h-6 w-6 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="font-display font-bold text-sm tracking-tight">PORTAFOLIO</span>
          </div>
          <div className="hidden md:block">
            <h1 className="text-sm font-semibold font-display text-foreground">
              {currentPage?.label ?? 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block"><CclBadge /></div>
            <CurrencyToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden h-16 border-t border-border bg-card/95 backdrop-blur-sm">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      'p-1.5 rounded-md transition-colors',
                      isActive && 'bg-primary/15',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-body text-[10px]">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
