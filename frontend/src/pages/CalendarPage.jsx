import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Users, Check, Clock } from 'lucide-react'
import { addWeeks, startOfWeek, endOfWeek, format, isToday, isBefore } from 'date-fns'
import { it } from 'date-fns/locale'
import { useAuth } from '../contexts/AuthContext'
import {
  getCorsi,
  getPrenotazioniByDate,
  getPrenotazioniByUser,
  createPrenotazione,
  deletePrenotazione,
} from '../lib/firestore'
import { getLezioneOverrides } from '../lib/firestore'
import {
  generateLessons,
  formatDate,
  getWeekDays,
  timeToMinutes,
  getCalendarHours,
  isBookable,
} from '../lib/calendar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { cn } from '../lib/utils'

export default function CalendarPage() {
  const { currentUser } = useAuth()
  const [weekOffset, setWeekOffset] = useState(0)
  const [corsi, setCorsi] = useState([])
  const [overrides, setOverrides] = useState([])
  const [prenotazioni, setPrenotazioni] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [lessonBookings, setLessonBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const referenceDate = addWeeks(new Date(), weekOffset)
  const weekDays = getWeekDays(referenceDate)
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 })

  useEffect(() => {
    loadData()
  }, [weekOffset])

  async function loadData() {
    setLoading(true)
    try {
      const [corsiData, myBookingsData] = await Promise.all([
        getCorsi(),
        getPrenotazioniByUser(currentUser.uid),
      ])
      setCorsi(corsiData)
      setMyBookings(myBookingsData)

      const allOverrides = []
      for (const corso of corsiData) {
        const ov = await getLezioneOverrides(corso.id)
        allOverrides.push(...ov)
      }
      setOverrides(allOverrides)

      const allPrenotazioni = []
      for (const day of weekDays) {
        const dateStr = formatDate(day)
        const pren = await getPrenotazioniByDate(dateStr)
        allPrenotazioni.push(...pren)
      }
      setPrenotazioni(allPrenotazioni)
    } catch (err) {
      console.error('Error loading calendar data:', err)
    } finally {
      setLoading(false)
    }
  }

  const lessons = useMemo(
    () => generateLessons(corsi, overrides, weekStart, weekEnd),
    [corsi, overrides, weekStart, weekEnd]
  )

  const hours = useMemo(() => getCalendarHours(lessons), [lessons])

  function getLessonBookingCount(corsoId, date) {
    return prenotazioni.filter((p) => p.corsoId === corsoId && p.date === date).length
  }

  function isBooked(corsoId, date) {
    return myBookings.some((b) => b.corsoId === corsoId && b.date === date)
  }

  function getMyBookingId(corsoId, date) {
    return myBookings.find((b) => b.corsoId === corsoId && b.date === date)?.id
  }

  async function handleLessonClick(lesson) {
    setSelectedLesson(lesson)
    const bookings = prenotazioni.filter(
      (p) => p.corsoId === lesson.corsoId && p.date === lesson.date
    )
    setLessonBookings(bookings)
  }

  async function handleBook() {
    if (!selectedLesson) return
    setActionLoading(true)
    try {
      await createPrenotazione({
        corsoId: selectedLesson.corsoId,
        date: selectedLesson.date,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
      })
      await loadData()
      const updatedBookings = prenotazioni.filter(
        (p) => p.corsoId === selectedLesson.corsoId && p.date === selectedLesson.date
      )
      setLessonBookings(updatedBookings)
    } catch (err) {
      console.error('Booking error:', err)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancelBooking() {
    if (!selectedLesson) return
    const bookingId = getMyBookingId(selectedLesson.corsoId, selectedLesson.date)
    if (!bookingId) return
    setActionLoading(true)
    try {
      await deletePrenotazione(bookingId)
      await loadData()
      setLessonBookings((prev) => prev.filter((b) => b.id !== bookingId))
    } catch (err) {
      console.error('Cancel error:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const totalHourHeight = 64 // px per hour

  function lessonStyle(lesson) {
    const startMin = timeToMinutes(lesson.startTime)
    const endMin = timeToMinutes(lesson.endTime)
    const top = (startMin - hours.start * 60) * (totalHourHeight / 60)
    const height = (endMin - startMin) * (totalHourHeight / 60)
    return { top: `${top}px`, height: `${height}px` }
  }

  const now = new Date()
  const canGoBack = weekOffset > 0
  const canGoForward = weekOffset < 1

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-2 border-brand-300 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => canGoBack && setWeekOffset((w) => w - 1)}
          disabled={!canGoBack}
          className="p-2 rounded-xl hover:bg-white/60 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-800">
            {format(weekStart, 'd MMM', { locale: it })} – {format(weekEnd, 'd MMM yyyy', { locale: it })}
          </p>
          {weekOffset === 0 && (
            <p className="text-xs text-brand-500 font-medium">Questa settimana</p>
          )}
        </div>
        <button
          onClick={() => canGoForward && setWeekOffset((w) => w + 1)}
          disabled={!canGoForward}
          className="p-2 rounded-xl hover:bg-white/60 disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Calendar grid */}
      <Card className="p-0 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-[40px_repeat(7,1fr)] border-b border-gray-100">
          <div />
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                'text-center py-2.5 text-xs font-medium border-l border-gray-50',
                isToday(day) ? 'text-brand-500' : 'text-gray-500'
              )}
            >
              <div className="uppercase">{format(day, 'EEE', { locale: it })}</div>
              <div
                className={cn(
                  'w-7 h-7 mx-auto mt-0.5 rounded-full flex items-center justify-center text-sm font-semibold',
                  isToday(day) ? 'bg-brand-400 text-white' : 'text-gray-700'
                )}
              >
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="grid grid-cols-[40px_repeat(7,1fr)] relative">
          {/* Hour labels */}
          <div className="relative">
            {Array.from({ length: hours.end - hours.start }, (_, i) => (
              <div
                key={i}
                className="text-[10px] text-gray-400 text-right pr-1.5"
                style={{ height: `${totalHourHeight}px`, lineHeight: `${totalHourHeight}px` }}
              >
                {hours.start + i}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dateStr = formatDate(day)
            const dayLessons = lessons.filter((l) => l.date === dateStr)
            const isPast = isBefore(day, new Date()) && !isToday(day)

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'relative border-l border-gray-50',
                  isPast && 'opacity-40'
                )}
                style={{ height: `${(hours.end - hours.start) * totalHourHeight}px` }}
              >
                {/* Hour grid lines */}
                {Array.from({ length: hours.end - hours.start }, (_, i) => (
                  <div
                    key={i}
                    className="absolute w-full border-t border-gray-50"
                    style={{ top: `${i * totalHourHeight}px` }}
                  />
                ))}

                {/* Lesson blocks */}
                {dayLessons.map((lesson, idx) => {
                  const booked = isBooked(lesson.corsoId, lesson.date)
                  const count = getLessonBookingCount(lesson.corsoId, lesson.date)
                  const full = count >= lesson.capacity
                  const bookable = isBookable(lesson.date)

                  return (
                    <button
                      key={`${lesson.corsoId}-${idx}`}
                      onClick={() => handleLessonClick(lesson)}
                      className={cn(
                        'absolute inset-x-0.5 rounded-lg px-1 py-0.5 text-left transition-all overflow-hidden',
                        'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
                        booked && 'ring-2 ring-offset-1'
                      )}
                      style={{
                        ...lessonStyle(lesson),
                        backgroundColor: booked ? lesson.color : `${lesson.color}40`,
                        color: booked ? '#fff' : lesson.color,
                        borderLeft: `3px solid ${lesson.color}`,
                        ringColor: lesson.color,
                      }}
                    >
                      <div className="text-[10px] font-semibold leading-tight truncate">
                        {lesson.corsoName}
                      </div>
                      <div className="text-[9px] opacity-80 leading-tight">
                        {lesson.startTime}
                      </div>
                      {booked && (
                        <Check size={10} className="absolute top-0.5 right-0.5" />
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Lesson detail modal */}
      <Modal
        open={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        title={selectedLesson?.corsoName || ''}
      >
        {selectedLesson && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedLesson.color }}
              />
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {format(new Date(selectedLesson.date), 'EEEE d MMMM', { locale: it })}
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock size={14} />
                  {selectedLesson.startTime} – {selectedLesson.endTime}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">
                {getLessonBookingCount(selectedLesson.corsoId, selectedLesson.date)} / {selectedLesson.capacity} posti
              </span>
              {getLessonBookingCount(selectedLesson.corsoId, selectedLesson.date) >= selectedLesson.capacity && (
                <Badge variant="warning">Pieno</Badge>
              )}
            </div>

            {/* Booked people */}
            {lessonBookings.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prenotati</p>
                <div className="flex flex-wrap gap-1.5">
                  {lessonBookings.map((b) => (
                    <span
                      key={b.id}
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full',
                        b.userId === currentUser.uid
                          ? 'bg-brand-100 text-brand-700 font-medium'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {b.userName}
                      {b.userId === currentUser.uid && ' (tu)'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {isBookable(selectedLesson.date) && (
              <div className="pt-2">
                {isBooked(selectedLesson.corsoId, selectedLesson.date) ? (
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={handleCancelBooking}
                    disabled={actionLoading}
                  >
                    {actionLoading ? '...' : 'Cancella prenotazione'}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handleBook}
                    disabled={
                      actionLoading ||
                      getLessonBookingCount(selectedLesson.corsoId, selectedLesson.date) >= selectedLesson.capacity
                    }
                  >
                    {actionLoading ? '...' : 'Prenota'}
                  </Button>
                )}
              </div>
            )}

            {!isBookable(selectedLesson.date) && (
              <p className="text-xs text-gray-400 text-center">
                Le prenotazioni sono aperte solo per i prossimi 7 giorni
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
