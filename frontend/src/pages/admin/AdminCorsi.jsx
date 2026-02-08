import { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, Clock } from 'lucide-react'
import { getCorsi, createCorso, updateCorso, deleteCorso } from '../../lib/firestore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { DAYS_IT } from '../../lib/calendar'

const COURSE_COLORS = [
  '#c4b5fd', '#f9a8d4', '#86efac', '#7dd3fc', '#fdba74',
  '#fca5a5', '#a5b4fc', '#67e8f9', '#fcd34d', '#d8b4fe',
]

const EMPTY_FORM = {
  name: '',
  description: '',
  color: '#c4b5fd',
  capacity: 10,
  schedule: [],
}

export default function AdminCorsi() {
  const [corsi, setCorsi] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCorsi()
  }, [])

  async function loadCorsi() {
    setLoading(true)
    try {
      const data = await getCorsi()
      setCorsi(data)
    } catch (err) {
      console.error('Error loading corsi:', err)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(corso) {
    setForm({
      name: corso.name,
      description: corso.description || '',
      color: corso.color || '#c4b5fd',
      capacity: corso.capacity || 10,
      schedule: corso.schedule || [],
    })
    setEditingId(corso.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        await updateCorso(editingId, form)
      } else {
        await createCorso(form)
      }
      await loadCorsi()
      setShowForm(false)
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(corsoId) {
    if (!confirm('Eliminare questo corso?')) return
    try {
      await deleteCorso(corsoId)
      await loadCorsi()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  function addScheduleSlot() {
    setForm((f) => ({
      ...f,
      schedule: [...f.schedule, { dayOfWeek: 1, startTime: '16:00', endTime: '17:00' }],
    }))
  }

  function updateScheduleSlot(index, field, value) {
    setForm((f) => ({
      ...f,
      schedule: f.schedule.map((s, i) =>
        i === index ? { ...s, [field]: field === 'dayOfWeek' ? parseInt(value) : value } : s
      ),
    }))
  }

  function removeScheduleSlot(index) {
    setForm((f) => ({
      ...f,
      schedule: f.schedule.filter((_, i) => i !== index),
    }))
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
      <Button onClick={openCreate} size="sm">
        <Plus size={16} />
        Nuovo corso
      </Button>

      {corsi.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-sm text-gray-500">Nessun corso creato</p>
        </Card>
      ) : (
        corsi.map((corso) => (
          <Card key={corso.id} className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: corso.color || '#c4b5fd' }}
                />
                <div>
                  <p className="font-semibold text-gray-800">{corso.name}</p>
                  {corso.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{corso.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(corso)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(corso.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Badge>Max {corso.capacity || 10}</Badge>
              {(corso.schedule || []).map((slot, i) => (
                <Badge key={i} variant="brand">
                  <Clock size={10} className="mr-1" />
                  {DAYS_IT[slot.dayOfWeek]?.slice(0, 3)} {slot.startTime}–{slot.endTime}
                </Badge>
              ))}
            </div>
          </Card>
        ))
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? 'Modifica corso' : 'Nuovo corso'}
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="es. Hoop Base"
          />
          <Input
            label="Descrizione"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Descrizione opzionale"
          />
          <Input
            label="Capacità massima"
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value) || 10 }))}
          />

          {/* Color picker */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-600">Colore</label>
            <div className="flex gap-2 flex-wrap">
              {COURSE_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  className={`w-8 h-8 rounded-full transition-all ${
                    form.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-600">Orari ricorrenti</label>
              <button
                onClick={addScheduleSlot}
                className="text-xs text-brand-500 font-medium hover:underline"
              >
                + Aggiungi
              </button>
            </div>
            {form.schedule.map((slot, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
                <select
                  value={slot.dayOfWeek}
                  onChange={(e) => updateScheduleSlot(i, 'dayOfWeek', e.target.value)}
                  className="text-sm bg-white rounded-lg border border-gray-200 px-2 py-1.5 flex-1"
                >
                  {DAYS_IT.map((day, idx) => (
                    <option key={idx} value={idx}>{day}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateScheduleSlot(i, 'startTime', e.target.value)}
                  className="text-sm bg-white rounded-lg border border-gray-200 px-2 py-1.5 w-24"
                />
                <span className="text-gray-400 text-xs">–</span>
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateScheduleSlot(i, 'endTime', e.target.value)}
                  className="text-sm bg-white rounded-lg border border-gray-200 px-2 py-1.5 w-24"
                />
                <button
                  onClick={() => removeScheduleSlot(i)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <Button className="w-full" onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? '...' : editingId ? 'Salva modifiche' : 'Crea corso'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
