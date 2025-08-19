'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, QrCode, Search, RefreshCw } from 'lucide-react'
import { AppsMumiService, KELOMPOK_OPTIONS, KELOMPOK_DESA_MAP, calculateAge, generateQRCode } from '@/lib/appsmumi'
import { Participant } from '@/lib/supabase'

interface ParticipantForm {
  jenis_muda_i: 'USMAN' | 'GENERUS'
  nama_lengkap: string
  jenis_kelamin: 'PRIA' | 'WANITA'
  tempat_lahir: string
  tanggal_lahir: string
  nama_orang_tua: string
  kelompok: string
  pendidikan: string
  pekerjaan: string
  nama_sekolah: string
  hobby: string
}

export default function ParticipantTab() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [showQrModal, setShowQrModal] = useState(false)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ParticipantForm>()

  const watchedKelompok = watch('kelompok')
  const watchedJenisMudaI = watch('jenis_muda_i')
  const watchedTanggalLahir = watch('tanggal_lahir')

  // Auto-fill desa when kelompok changes
  useEffect(() => {
    if (watchedKelompok && KELOMPOK_DESA_MAP[watchedKelompok]) {
      // Desa is auto-filled, no need to set in form as it's calculated
    }
  }, [watchedKelompok])

  // Auto-calculate age when birth date changes
  useEffect(() => {
    if (watchedTanggalLahir) {
      const age = calculateAge(watchedTanggalLahir)
      // Age is calculated, no need to set in form as it's calculated
    }
  }, [watchedTanggalLahir])

  const loadParticipants = async () => {
    try {
      setLoading(true)
      const data = await AppsMumiService.getParticipants()
      setParticipants(data)
    } catch (error) {
      toast.error('Gagal memuat data peserta')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadParticipants()
  }, [])

  const onSubmit = async (data: ParticipantForm) => {
    try {
      const participantData: Omit<Participant, 'id' | 'created_at'> = {
        ...data,
        desa: KELOMPOK_DESA_MAP[data.kelompok] || '',
        usia: data.tanggal_lahir ? calculateAge(data.tanggal_lahir) : undefined,
        // Handle conditional fields based on jenis_muda_i
        pekerjaan: data.jenis_muda_i === 'USMAN' ? data.pekerjaan : undefined,
        nama_sekolah: data.jenis_muda_i === 'GENERUS' ? data.nama_sekolah : undefined,
      }

      let result: Participant
      if (editingId) {
        result = await AppsMumiService.updateParticipant(editingId, participantData)
        toast.success('Data peserta berhasil diperbarui!')
      } else {
        result = await AppsMumiService.createParticipant(participantData)
        toast.success('Peserta berhasil didaftarkan!')
      }

      // Generate QR Code
      try {
        const qrUrl = await generateQRCode(result)
        setQrCodeUrl(qrUrl)
        setShowQrModal(true)
      } catch (error) {
        console.error('Error generating QR code:', error)
      }

      reset()
      setEditingId(null)
      loadParticipants()
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data peserta')
    }
  }

  const handleEdit = (participant: Participant) => {
    setEditingId(participant.id)
    reset({
      jenis_muda_i: participant.jenis_muda_i,
      nama_lengkap: participant.nama_lengkap,
      jenis_kelamin: participant.jenis_kelamin,
      tempat_lahir: participant.tempat_lahir || '',
      tanggal_lahir: participant.tanggal_lahir || '',
      nama_orang_tua: participant.nama_orang_tua || '',
      kelompok: participant.kelompok,
      pendidikan: participant.pendidikan || '',
      pekerjaan: participant.pekerjaan || '',
      nama_sekolah: participant.nama_sekolah || '',
      hobby: participant.hobby || '',
    })
  }

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus peserta ${nama}?`)) return

    try {
      await AppsMumiService.deleteParticipant(id)
      toast.success('Peserta berhasil dihapus!')
      loadParticipants()
    } catch (error) {
      toast.error('Gagal menghapus peserta')
    }
  }

  const handleGenerateQR = async (participant: Participant) => {
    try {
      const qrUrl = await generateQRCode(participant)
      setQrCodeUrl(qrUrl)
      setShowQrModal(true)
    } catch (error) {
      toast.error('Gagal generate QR Code')
    }
  }

  const filteredParticipants = participants.filter(p =>
    p.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.kelompok.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.desa.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Section */}
      <div className="lg:col-span-1">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Data Muda-Mudi' : 'Data Muda-Mudi Baru'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Jenis Muda/i *</label>
              <select {...register('jenis_muda_i', { required: 'Jenis Muda/i harus dipilih' })} className="input-field">
                <option value="">Pilih Jenis</option>
                <option value="USMAN">USMAN</option>
                <option value="GENERUS">GENERUS</option>
              </select>
              {errors.jenis_muda_i && <p className="text-red-500 text-sm mt-1">{errors.jenis_muda_i.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nama Lengkap *</label>
              <input
                {...register('nama_lengkap', { required: 'Nama lengkap harus diisi' })}
                className="input-field"
                placeholder="Masukkan nama lengkap"
              />
              {errors.nama_lengkap && <p className="text-red-500 text-sm mt-1">{errors.nama_lengkap.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Jenis Kelamin</label>
              <select {...register('jenis_kelamin')} className="input-field">
                <option value="">Pilih Jenis Kelamin</option>
                <option value="PRIA">PRIA</option>
                <option value="WANITA">WANITA</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Tempat Lahir</label>
                <input {...register('tempat_lahir')} className="input-field" placeholder="Tempat lahir" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tanggal Lahir</label>
                <input {...register('tanggal_lahir')} type="date" className="input-field" />
              </div>
            </div>

            {watchedTanggalLahir && (
              <div>
                <label className="block text-sm font-medium mb-1">Usia</label>
                <input
                  value={calculateAge(watchedTanggalLahir)}
                  readOnly
                  className="input-field bg-gray-100"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Nama Orang Tua</label>
              <input {...register('nama_orang_tua')} className="input-field" placeholder="Nama orang tua" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Kelompok *</label>
              <select {...register('kelompok', { required: 'Kelompok harus dipilih' })} className="input-field">
                <option value="">Pilih Kelompok</option>
                {KELOMPOK_OPTIONS.map(kelompok => (
                  <option key={kelompok} value={kelompok}>{kelompok}</option>
                ))}
              </select>
              {errors.kelompok && <p className="text-red-500 text-sm mt-1">{errors.kelompok.message}</p>}
            </div>

            {watchedKelompok && (
              <div>
                <label className="block text-sm font-medium mb-1">Desa</label>
                <input
                  value={KELOMPOK_DESA_MAP[watchedKelompok] || ''}
                  readOnly
                  className="input-field bg-gray-100"
                />
              </div>
            )}

            {watchedJenisMudaI === 'USMAN' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Pendidikan Terakhir</label>
                  <input {...register('pendidikan')} className="input-field" placeholder="Pendidikan terakhir" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pekerjaan</label>
                  <input {...register('pekerjaan')} className="input-field" placeholder="Pekerjaan" />
                </div>
              </>
            )}

            {watchedJenisMudaI === 'GENERUS' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Pendidikan Terakhir</label>
                  <select {...register('pendidikan')} className="input-field">
                    <option value="">Pilih Kelas</option>
                    <option value="KELAS VII">KELAS VII</option>
                    <option value="KELAS VIII">KELAS VIII</option>
                    <option value="KELAS IX">KELAS IX</option>
                    <option value="KELAS X">KELAS X</option>
                    <option value="KELAS XI">KELAS XI</option>
                    <option value="KELAS XII">KELAS XII</option>
                    <option value="KELAS XIII">KELAS XIII</option>
                    <option value="KULIAH">KULIAH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Sekolah/Univ</label>
                  <input {...register('nama_sekolah')} className="input-field" placeholder="Nama sekolah/universitas" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Hobby</label>
              <input {...register('hobby')} className="input-field" placeholder="Hobby" />
            </div>

            <div className="flex space-x-2">
              <button type="submit" className="btn-primary flex-1">
                <Plus className="h-4 w-4 mr-2" />
                {editingId ? 'Perbarui Data' : 'Daftar & Generate QR'}
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
      <div className="lg:col-span-2">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Daftar Peserta ({filteredParticipants.length})</h2>
            <button onClick={loadParticipants} className="btn-secondary">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Cari nama, kelompok, atau desa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelompok</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      <div className="loading-spinner mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Tidak ada data peserta
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((participant) => (
                    <tr key={participant.id} className="table-row">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{participant.nama_lengkap}</div>
                          <div className="text-sm text-gray-500">{participant.jenis_kelamin} • {participant.usia} tahun</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          participant.jenis_muda_i === 'USMAN' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {participant.jenis_muda_i}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{participant.kelompok}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{participant.desa}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleGenerateQR(participant)}
                          className="text-primary hover:text-blue-700"
                          title="Generate QR Code"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(participant)}
                          className="text-warning hover:text-yellow-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(participant.id, participant.nama_lengkap)}
                          className="text-danger hover:text-red-700"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && qrCodeUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-center">QR Code Generated</h3>
            <div className="flex justify-center mb-4">
              <img src={qrCodeUrl} alt="QR Code" className="max-w-full h-auto" />
            </div>
            <div className="flex justify-center space-x-2">
              <a
                href={qrCodeUrl}
                download="qr-code.png"
                className="btn-primary"
              >
                Download
              </a>
              <button
                onClick={() => setShowQrModal(false)}
                className="btn-secondary"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}