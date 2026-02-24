'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  BarChart3,
  FolderKanban,
  Mic,
  Network,
  Activity,
  Send,
  ChevronsLeft,
  ChevronsRight,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'wave-nav-collapsed'

interface NavLink {
  href: string
  label: string
  icon: React.ElementType
}

const links: NavLink[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/alignment', label: 'Alignment', icon: BarChart3 },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/voice-demo', label: 'Voice Demo', icon: Mic },
  { href: '/architecture', label: 'Architecture', icon: Network },
  { href: '/submissions', label: 'Submissions', icon: Send },
  { href: '/status', label: 'Status', icon: Activity },
]

function NavItem({
  link,
  active,
  collapsed,
}: {
  link: NavLink
  active: boolean
  collapsed: boolean
}) {
  const Icon = link.icon

  const content = (
    <Link
      href={link.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-blue-600/20 text-blue-400'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{link.label}</span>}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{link.label}</TooltipContent>
      </Tooltip>
    )
  }

  return content
}

function NavContent({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex items-center border-b border-border px-4 py-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        <div className="flex items-center gap-2">
          <Image
            src="/wave-logo.png"
            alt="Wave"
            width={28}
            height={28}
            className="h-7 w-7 rounded-md object-contain"
          />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-lg font-bold text-transparent">
                  Wave
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <TooltipProvider>
        <nav className="flex-1 space-y-1 p-2">
          {links.map((link) => (
            <NavItem
              key={link.href}
              link={link}
              active={pathname === link.href}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </TooltipProvider>
    </div>
  )
}

export default function CollapsibleNav() {
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) === 'true' : false
  )
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

  if (!mounted) return null

  return (
    <>
      {/* Mobile trigger */}
      <div className="fixed left-4 top-4 z-50 sm:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <NavContent collapsed={false} onToggle={() => {}} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="sticky top-0 hidden h-screen shrink-0 border-r border-border bg-background sm:block"
      >
        <NavContent collapsed={collapsed} onToggle={toggle} />
      </motion.aside>
    </>
  )
}
