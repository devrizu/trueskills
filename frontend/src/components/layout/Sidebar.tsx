import { useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  User,
  Trophy,
  Briefcase,
  LogOut,
  Sparkles,
  Menu,
  X,
  MessageSquare,
  Settings,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Avatar } from '../ui/Avatar'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface NavItem {
  path: string
  label: string
  icon: React.ElementType
  coming?: boolean
}

const studentNav: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/competitions', label: 'Competitions', icon: Trophy },
  { path: '/jobs', label: 'Jobs', icon: Briefcase },
  { path: '/messages', label: 'Messages', icon: MessageSquare },
]

const recruiterNav: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/search', label: 'AI Candidate Search', icon: Sparkles },
  { path: '/competitions', label: 'Competitions', icon: Trophy },
  { path: '/jobs', label: 'Job Postings', icon: Briefcase },
  { path: '/messages', label: 'Messages', icon: MessageSquare },
]

interface SidebarProps {
  isPinned: boolean
  onTogglePin: () => void
}

export function Sidebar({ isPinned, onTogglePin }: SidebarProps) {
  const location = useLocation()
  const { appUser, profile, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = (appUser?.role === 'recruiter' || appUser?.role === 'admin') ? recruiterNav : studentNav
  const displayName =
    profile && 'full_name' in profile ? (profile.full_name as string) : ''

  const [isHovered, setIsHovered] = useState(false)
  const isExpanded = isPinned || isHovered || mobileOpen

  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!appUser) return
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', appUser.id)
        .is('read_at', null)
      
      setUnreadCount(count || 0)
    }
    fetchUnread()
    
      const channel = supabase.channel('messages_changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${appUser.id}` }, _payload => {
           setUnreadCount(prev => prev + 1)
        })
      .subscribe()

    window.addEventListener('messages_read', fetchUnread)
      
    return () => { 
      supabase.removeChannel(channel)
      window.removeEventListener('messages_read', fetchUnread)
    }
  }, [appUser])

  return (
    <>
      {/* Mobile hamburger to cross animation */}
      <AnimatePresence mode="wait">
        {!mobileOpen && (
          <motion.button
            key="menu"
            initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            type="button"
            className="fixed top-4 left-4 z-50 lg:hidden bg-graphite-950 text-white p-2 rounded-button cursor-pointer border-none shadow-md"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        layout
        onMouseEnter={() => !isPinned && setIsHovered(true)}
        onMouseLeave={() => !isPinned && setIsHovered(false)}
        className={`h-screen bg-graphite-950 flex flex-col fixed left-0 top-0 z-40 ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isExpanded ? 'w-64' : 'w-20'}`}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-graphite-800 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 no-underline overflow-hidden"
            onClick={() => setMobileOpen(false)}
          >
            <img src="/logo.png" alt="TrueSkills Logo" className="h-8 shrink-0" />
            <span className={`text-lg font-logo font-bold text-white transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>TrueSkills</span>
          </Link>
          {isExpanded && (
            <>
              {/* Desktop Pin Button */}
              <button 
                onClick={onTogglePin}
                className="hidden lg:flex items-center justify-center relative w-6 h-6 text-graphite-400 hover:text-white bg-transparent border-none cursor-pointer"
              >
                <div className={`absolute transition-all duration-300 ${isPinned ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}>
                  <Menu size={20} />
                </div>
                <div className={`absolute transition-all duration-300 ${isPinned ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}>
                  <X size={20} />
                </div>
              </button>

              {/* Mobile Close Button */}
              <button 
                onClick={() => setMobileOpen(false)}
                className="lg:hidden text-graphite-400 hover:text-white bg-transparent border-none cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="flex flex-col gap-1 list-none p-0 m-0">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'))
              const Icon = item.icon
              return (
                <li key={item.path}>
                  {item.coming ? (
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-button text-graphite-400 cursor-not-allowed ${isExpanded ? '' : 'justify-center'}`}>
                      <Icon size={18} className="shrink-0" />
                      {isExpanded && (
                        <>
                          <span className="text-sm font-body truncate">{item.label}</span>
                          <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider text-graphite-400 bg-graphite-800 px-1.5 py-0.5 rounded-pill">
                            Soon
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-button transition-colors duration-150 no-underline relative ${
                        isActive
                          ? 'bg-graphite-800 text-signal-400'
                          : 'text-graphite-400 hover:text-white hover:bg-graphite-800/50'
                      } ${isExpanded ? '' : 'justify-center'}`}
                      title={!isExpanded ? item.label : undefined}
                    >
                      <div className="relative shrink-0">
                        <Icon size={18} />
                        {!isExpanded && item.label === 'Messages' && unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-signal-600 rounded-full" />
                        )}
                      </div>
                      {isExpanded && <span className="text-sm font-body truncate">{item.label}</span>}
                      {isExpanded && item.label === 'Messages' && unreadCount > 0 && (
                        <div className="ml-auto bg-signal-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {unreadCount}
                        </div>
                      )}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-graphite-800">
          <div className={`flex items-center gap-3 ${isExpanded ? 'px-3' : 'justify-center'} py-2`}>
            <Avatar
              name={displayName}
              src={profile && 'avatar_url' in profile ? (profile.avatar_url as string) : undefined}
              size="sm"
            />
            {isExpanded && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-body truncate m-0">
                    {displayName || 'User'}
                  </p>
                  <p className="text-[11px] text-graphite-400 font-body capitalize m-0">
                    {appUser?.role || 'student'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    to="/profile/edit"
                    onClick={() => setMobileOpen(false)}
                    className="text-graphite-400 hover:text-white transition-colors p-1 cursor-pointer bg-transparent border-none"
                    title="Edit Profile"
                  >
                    <Settings size={16} />
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="text-graphite-400 hover:text-white transition-colors p-1 cursor-pointer bg-transparent border-none"
                    title="Sign out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  )
}
