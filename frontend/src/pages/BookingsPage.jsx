import { useState, useEffect } from 'react'
import { Calendar, Clock, Trash2 } from 'lucide-react'
import { format, isAfter, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { useAuth } from '../contexts/AuthContext'
import { getPrenotazioniByUser, getCorsi, deletePrenotazione } from '../lib/firestore'
import { isBookable } from '../lib/calendar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { cn } from '../lib/utils'

export default function BookingsPage() {
  const { currentUser } = useAuth()
  const [bookings, setBookings] = useState([])
  const [corsi, setCorsi] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [bookingsData, corsiData] = await Promise.all([
        getPrenotazioniByUser(currentUser.uid),
        getCorsi(),
      ])
      setCorsi(corsiData)
      setBookings(bookingsData)
    } catch (err) {
      console.error('Error loading bookings:', err)
    } finally {
      setLoading(false)
    }
  }

  function getCorso(corsoId) {
    return corsi.find((c) => c.id === corsoId)
  }

  const futureBookings = bookings
    .filter((b) => isAfter(parseISO(b.date), new Date()) || b.date === format(new Date(), 'yyyy-MM-dd'))
    .sort((a, b) => a.date.localeCompare(b.date))

  const pastBookings = bookings
    .filter((b) => !isAfter(parseISO(b.date), new Date()) && b.date !== format(new Date(), 'yyyy-MM-dd'))
    .sort((a, b) => b.date.localeCompare(a.date))

  async function handleCancel(bookingId) {
    try {
      await deletePrenotazione(bookingId)
      setBookings((prev) => prev.filter((b) => b.id !== bookingId))
    } catch (err) {
      console.error('Cancel error:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-2 border-brand-300 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Le mie prenotazioni</h2>
        <p className="text-sm text-gray-500 mt-0.5">Le tue lezioni prenotate</p>
      </div>

      {/* Future bookings */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2">
          <Calendar size={14} />
          Prossime lezioni ({futureBookings.length})
        </h3>

        {futureBookings.length === 0 ? (
          <Card className="text-center py-8">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center">
              <Calendar size={20} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-500">Nessuna lezione prenotata</p>
            <p className="text-xs text-gray-400 mt-1">Vai al calendario per prenotare</p>
          </Card>
        ) : (
          futureBookings.map((booking) => {
            const corso = getCorso(booking.corsoId)
            return (
              <Card key={booking.id} className="flex items-center gap-3 p-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${corso?.color || '#c4b5fd'}25` }}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: corso?.color || '#c4b5fd' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {corso?.name || 'Corso'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(parseISO(booking.date), 'EEEE d MMMM', { locale: it })}
                  </p>
                </div>
                {isBookable(booking.date) && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Past bookings */}
      {pastBookings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
            <Clock size={14} />
            Passate ({pastBookings.length})
          </h3>
          {pastBookings.slice(0, 10).map((booking) => {
            const corso = getCorso(booking.corsoId)
            return (
              <Card key={booking.id} className="flex items-center gap-3 p-4 opacity-60">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${corso?.color || '#c4b5fd'}15` }}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: corso?.color || '#c4b5fd' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 truncate">
                    {corso?.name || 'Corso'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(parseISO(booking.date), 'EEEE d MMMM', { locale: it })}
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
