import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LogOut, Mail, User } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function ProfilePage() {
  const { currentUser, userProfile, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Profilo</h2>
        <p className="text-sm text-gray-500 mt-0.5">Il tuo account</p>
      </div>

      <Card className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-200 to-lavender-200 flex items-center justify-center flex-shrink-0">
          <User size={24} className="text-brand-600" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 truncate">
            {currentUser?.displayName || 'Utente'}
          </p>
          <p className="text-sm text-gray-500 truncate flex items-center gap-1">
            <Mail size={12} />
            {currentUser?.email}
          </p>
        </div>
      </Card>

      <Button variant="secondary" className="w-full" onClick={handleLogout}>
        <LogOut size={16} />
        Esci
      </Button>
    </div>
  )
}
