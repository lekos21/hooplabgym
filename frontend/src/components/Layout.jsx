import { NavLink, useNavigate } from 'react-router-dom'
import { Calendar, User, LogOut, Shield, BookOpen } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { BackgroundHoops } from './HoopDecorations'

export default function Layout({ children }) {
  const { currentUser, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
      isActive
        ? 'text-brand-500 bg-brand-50'
        : 'text-gray-400 hover:text-gray-600'
    }`

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-lavender-50 to-white relative">
      <BackgroundHoops />

      <div className="relative z-10 pb-20">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-md border-b border-white/60">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-brand-300 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full border-[1.5px] border-lavender-400" />
              </div>
              <span className="font-semibold text-gray-800 text-lg">Hoop Lab</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-lg mx-auto px-4 py-4">
          {children}
        </main>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/80 backdrop-blur-md border-t border-gray-100">
        <div className="max-w-lg mx-auto flex justify-around py-1.5 px-2">
          <NavLink to="/" className={linkClass}>
            <Calendar size={20} />
            <span>Calendario</span>
          </NavLink>
          <NavLink to="/bookings" className={linkClass}>
            <BookOpen size={20} />
            <span>Prenotazioni</span>
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              <Shield size={20} />
              <span>Admin</span>
            </NavLink>
          )}
          <NavLink to="/profile" className={linkClass}>
            <User size={20} />
            <span>Profilo</span>
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
