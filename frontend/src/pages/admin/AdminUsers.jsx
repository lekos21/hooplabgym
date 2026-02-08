import { useState, useEffect } from 'react'
import { Search, ChevronRight, StickyNote, Check, X, Minus, Plus } from 'lucide-react'
import { format, subMonths } from 'date-fns'
import { it } from 'date-fns/locale'
import {
  getAllUsers,
  updateUserProfile,
  setMonthlyPaymentStatus,
  getMonthlyPayments,
  updatePerLessonCounts,
} from '../../lib/firestore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { cn } from '../../lib/utils'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [monthlyPayments, setMonthlyPaymentsState] = useState([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  async function openUserDetail(user) {
    setSelectedUser(user)
    setNotes(user.notes || '')
    if (user.paymentType === 'mensile') {
      try {
        const payments = await getMonthlyPayments(user.id)
        setMonthlyPaymentsState(payments)
      } catch {
        setMonthlyPaymentsState([])
      }
    }
  }

  async function handlePaymentTypeChange(userId, type) {
    setSaving(true)
    try {
      await updateUserProfile(userId, { paymentType: type })
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, paymentType: type } : u))
      )
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => ({ ...prev, paymentType: type }))
      }
    } catch (err) {
      console.error('Error updating payment type:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleMonthPaid(userId, yearMonth, currentPaid) {
    try {
      await setMonthlyPaymentStatus(userId, yearMonth, !currentPaid)
      setMonthlyPaymentsState((prev) => {
        const existing = prev.find((p) => p.id === yearMonth)
        if (existing) {
          return prev.map((p) => (p.id === yearMonth ? { ...p, paid: !currentPaid } : p))
        }
        return [...prev, { id: yearMonth, paid: !currentPaid }]
      })
    } catch (err) {
      console.error('Error toggling payment:', err)
    }
  }

  async function handlePerLessonUpdate(userId, field, delta) {
    const user = users.find((u) => u.id === userId)
    const current = user?.[field] || 0
    const newVal = Math.max(0, current + delta)
    try {
      await updatePerLessonCounts(
        userId,
        field === 'lessonsAttended' ? newVal : user?.lessonsAttended || 0,
        field === 'lessonsPaid' ? newVal : user?.lessonsPaid || 0
      )
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, [field]: newVal } : u))
      )
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => ({ ...prev, [field]: newVal }))
      }
    } catch (err) {
      console.error('Error updating per-lesson counts:', err)
    }
  }

  async function handleSaveNotes() {
    if (!selectedUser) return
    setSaving(true)
    try {
      await updateUserProfile(selectedUser.id, { notes })
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, notes } : u))
      )
    } catch (err) {
      console.error('Error saving notes:', err)
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      (u.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase())
  )

  // Generate last 6 months for monthly payment view
  const recentMonths = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), i)
    return format(d, 'yyyy-MM')
  })

  function isMonthPaid(yearMonth) {
    return monthlyPayments.find((p) => p.id === yearMonth)?.paid || false
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-brand-300 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cerca utente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/70 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent"
        />
      </div>

      {/* Users list */}
      {filteredUsers.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-sm text-gray-500">Nessun utente trovato</p>
        </Card>
      ) : (
        filteredUsers.map((user) => {
          const delta =
            user.paymentType === 'per-lesson'
              ? (user.lessonsAttended || 0) - (user.lessonsPaid || 0)
              : 0

          return (
            <Card
              key={user.id}
              className="flex items-center gap-3 p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
              onClick={() => openUserDetail(user)}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-lavender-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-brand-600">
                  {(user.displayName || user.email || '?')[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user.displayName || 'Senza nome'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={user.paymentType === 'mensile' ? 'brand' : 'default'}>
                  {user.paymentType === 'mensile' ? 'Mensile' : 'Per lezione'}
                </Badge>
                {user.paymentType === 'per-lesson' && delta > 0 && (
                  <Badge variant="warning">-{delta}</Badge>
                )}
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </Card>
          )
        })
      )}

      {/* User detail modal */}
      <Modal
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.displayName || selectedUser?.email || 'Utente'}
      >
        {selectedUser && (
          <div className="space-y-5">
            {/* Payment type selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Tipo pagamento
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePaymentTypeChange(selectedUser.id, 'mensile')}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-sm font-medium transition-all border',
                    selectedUser.paymentType === 'mensile'
                      ? 'bg-brand-50 border-brand-200 text-brand-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  )}
                >
                  Mensile
                </button>
                <button
                  onClick={() => handlePaymentTypeChange(selectedUser.id, 'per-lesson')}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-sm font-medium transition-all border',
                    selectedUser.paymentType === 'per-lesson'
                      ? 'bg-brand-50 border-brand-200 text-brand-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  )}
                >
                  Per lezione
                </button>
              </div>
            </div>

            {/* Monthly payment view */}
            {selectedUser.paymentType === 'mensile' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Pagamenti mensili
                </label>
                {recentMonths.map((ym) => {
                  const paid = isMonthPaid(ym)
                  const [year, month] = ym.split('-')
                  const monthName = format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy', { locale: it })
                  return (
                    <div
                      key={ym}
                      className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5"
                    >
                      <span className="text-sm text-gray-700 capitalize">{monthName}</span>
                      <button
                        onClick={() => handleToggleMonthPaid(selectedUser.id, ym, paid)}
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                          paid
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-red-50 text-red-400 hover:bg-red-100'
                        )}
                      >
                        {paid ? <Check size={16} /> : <X size={16} />}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Per-lesson payment view */}
            {selectedUser.paymentType === 'per-lesson' && (
              <div className="space-y-3">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Conteggio lezioni
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Frequentate</p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handlePerLessonUpdate(selectedUser.id, 'lessonsAttended', -1)}
                        className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xl font-bold text-gray-800 w-8 text-center">
                        {selectedUser.lessonsAttended || 0}
                      </span>
                      <button
                        onClick={() => handlePerLessonUpdate(selectedUser.id, 'lessonsAttended', 1)}
                        className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Pagate</p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handlePerLessonUpdate(selectedUser.id, 'lessonsPaid', -1)}
                        className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xl font-bold text-gray-800 w-8 text-center">
                        {selectedUser.lessonsPaid || 0}
                      </span>
                      <button
                        onClick={() => handlePerLessonUpdate(selectedUser.id, 'lessonsPaid', 1)}
                        className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {(() => {
                  const delta = (selectedUser.lessonsAttended || 0) - (selectedUser.lessonsPaid || 0)
                  if (delta === 0) return (
                    <div className="text-center py-2">
                      <Badge variant="success">In pari</Badge>
                    </div>
                  )
                  if (delta > 0) return (
                    <div className="text-center py-2">
                      <Badge variant="warning">Da pagare: {delta} lezioni</Badge>
                    </div>
                  )
                  return (
                    <div className="text-center py-2">
                      <Badge variant="brand">Credito: {Math.abs(delta)} lezioni</Badge>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <StickyNote size={12} />
                Note
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Note sull'utente..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white/70 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent resize-none"
              />
              <Button size="sm" variant="secondary" onClick={handleSaveNotes} disabled={saving}>
                {saving ? '...' : 'Salva note'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
