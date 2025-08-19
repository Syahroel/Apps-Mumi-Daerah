'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, RefreshCw, Calendar, Clock } from 'lucide-react'
import { AppsMumiService } from '@/lib/appsmumi'
import { Session } from '@/lib/supabase'

interface SessionForm {
  nama_sesi: string
  tanggal: string
  jam_mulai: string
  jam_selesai: string
  pemateri: string
  materi: string
}

export default function SessionTab() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SessionForm>()

  const loadSessions = async () => {
    try {
      setLoading(true)
      const data = await AppsMumiService.getSessions()
      setSessions(data)
    } catch (error) {
      toast.error('Gagal memuat data kegiatan')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const onSubmit = async (data: SessionForm) => {
    try {
      if (editingId) {
        await AppsMumiService.updateSession(editingId, data)
        toast.success('Data kegiatan berhasil diperbarui!')
      } else {
        await AppsMumiService.createSession(data)
        toast.success('Kegiatan berhasil ditambahkan!')
      }

      reset()
      setEditingId(null)
      loadSessions()
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data kegiatan')
    }
  }

  const handleEdit = (session: Session) => {
    setEditingId(session.id)
    reset({
      nama_sesi: session.nama_sesi,
      tanggal: session.tanggal,
      jam_mulai: session.jam_mulai,
      jam_selesai: session.jam_selesai,
      pemateri: session.pemateri || '',
      materi: session.materi || '',
    })
  }

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kegiatan "${nama}"?\n\nSemua data absensi untuk kegiatan ini juga akan dihapus!`)) return

    try {
      await AppsMumiService.deleteSession(id)
      toast.success('Kegiatan berhasil dihapus!')
      loadSessions()
    } catch (error) {
      toast.error('Gagal menghapus kegiatan')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Section */}
      <div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Kegiatan' : 'Kegiatan Baru'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Kegiatan *</label>
              <input
                {...register('nama_sesi', { required: 'Nama kegiatan harus diisi' })}
                className="input-field"
                placeholder="Masukkan nama kegiatan"
              />
              {errors.nama_sesi && <p className="text-red-500 text-sm mt-1">{errors.nama_sesi.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tanggal *</label>
              <input
                {...register('tanggal', { required: 'Tanggal harus diisi' })}
                type="date"
                className="input-field"
              />
              {errors.tanggal && <p className="text-red-500 text-sm mt-1">{errors.tanggal.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Jam Mulai *</label>
                <input
                  {...register('jam_mulai', { required: 'Jam mulai harus diisi' })}
                  type="time"
                  className="input-field"
                />
                {errors.jam_mulai && <p className="text-red-500 text-sm mt-1">{errors.jam_mulai.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Jam Selesai *</label>
                <input
                  {...register('jam_selesai', { required: 'Jam selesai harus diisi' })}
                  type="time"
                  className="input-field"
                />
                {errors.jam_selesai && <p className="text-red-500 text-sm mt-1">{errors.jam_selesai.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Pemateri</label>
              <input
                {...register('pemateri')}
                className="input-field"
                placeholder="Nama pemateri"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Materi</label>
              <textarea
                {...register('materi')}
                className="input-field"
                rows={3}
                placeholder="Deskripsi materi"
              />
            </div>

            <div className="flex space-x-2">
              <button type="submit" className="btn-success flex-1">
                <Plus className="h-4 w-4 mr-2" />
                {editingId ? 'Perbarui Kegiatan' : 'Tambah Kegiatan'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null)
                    reset()
                  }}
                  className="btn-secondary"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* List Section */}
      <div>
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Daftar Kegiatan ({sessions.length})</h2>
            <button onClick={loadSessions} className="btn-secondary">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="loading-spinner"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Belum ada kegiatan yang dibuat</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{session.nama_sesi}</h3>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{formatDate(session.tanggal)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{session.jam_mulai} - {session.jam_selesai}</span>
                        </div>
                        {session.pemateri && (
                          <div className="flex items-center">
                            <span className="font-medium mr-2">Pemateri:</span>
                            <span>{session.pemateri}</span>
                          </div>
                        )}
                        {session.materi && (
                          <div className="mt-2">
                            <span className="font-medium">Materi:</span>
                            <p className="text-gray-700 mt-1">{session.materi}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(session)}
                        className="text-warning hover:text-yellow-600 p-1"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(session.id, session.nama_sesi)}
                        className="text-danger hover:text-red-700 p-1"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}