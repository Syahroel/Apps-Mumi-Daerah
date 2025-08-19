'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Search, RefreshCw, Filter, X } from 'lucide-react'
import { AppsMumiService, DESA_OPTIONS, KELOMPOK_OPTIONS } from '@/lib/appsmumi'
import { Participant } from '@/lib/supabase'

interface SearchForm {
  nama: string
  desa: string
  kelompok: string
  jenis_kelamin: string
  usia_min: string
  usia_max: string
}

export default function SearchTab() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const { register, handleSubmit, reset, watch } = useForm<SearchForm>({
    defaultValues: {
      nama: '',
      desa: '',
      kelompok: '',
      jenis_kelamin: '',
      usia_min: '',
      usia_max: '',
    }
  })

  const watchedValues = watch()

  const onSubmit = async (data: SearchForm) => {
    try {
      setLoading(true)
      setHasSearched(true)
      
      const filters = {
        nama: data.nama || undefined,
        desa: data.desa || undefined,
        kelompok: data.kelompok || undefined,
        jenis_kelamin: data.jenis_kelamin || undefined,
        usia_min: data.usia_min ? parseInt(data.usia_min) : undefined,
        usia_max: data.usia_max ? parseInt(data.usia_max) : undefined,
      }

      const results = await AppsMumiService.searchParticipants(filters)
      setParticipants(results)
    } catch (error) {
      console.error('Search error:', error)
      setParticipants([])
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    reset()
    setParticipants([])
    setHasSearched(false)
  }

  const hasActiveFilters = Object.values(watchedValues).some(value => value !== '')

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Filter Pencarian</h2>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
            >
              <X className="h-4 w-4 mr-1" />
              Reset Filter
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
              <input
                {...register('nama')}
                className="input-field"
                placeholder="Cari nama..."
              />
            </div>

            {/* Desa */}
            <div>
              <label className="block text-sm font-medium mb-1">Desa</label>
              <select {...register('desa')} className="input-field">
                <option value="">Semua Desa</option>
                {DESA_OPTIONS.map(desa => (
                  <option key={desa} value={desa}>{desa}</option>
                ))}
              </select>
            </div>

            {/* Kelompok */}
            <div>
              <label className="block text-sm font-medium mb-1">Kelompok</label>
              <select {...register('kelompok')} className="input-field">
                <option value="">Semua Kelompok</option>
                {KELOMPOK_OPTIONS.map(kelompok => (
                  <option key={kelompok} value={kelompok}>{kelompok}</option>
                ))}
              </select>
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label className="block text-sm font-medium mb-1">Jenis Kelamin</label>
              <select {...register('jenis_kelamin')} className="input-field">
                <option value="">Semua</option>
                <option value="PRIA">PRIA</option>
                <option value="WANITA">WANITA</option>
              </select>
            </div>

            {/* Rentang Usia */}
            <div>
              <label className="block text-sm font-medium mb-1">Usia Minimum</label>
              <input
                {...register('usia_min')}
                type="number"
                min="0"
                max="100"
                className="input-field"
                placeholder="Min"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Usia Maksimum</label>
              <input
                {...register('usia_max')}
                type="number"
                min="0"
                max="100"
                className="input-field"
                placeholder="Max"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Mencari...' : 'Cari'}
            </button>
            <button type="button" onClick={handleReset} className="btn-secondary">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Search Results */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Hasil Pencarian
            {hasSearched && (
              <span className="ml-2 text-sm font-normal text-gray-600">
                ({participants.length} peserta ditemukan)
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="loading-spinner"></div>
          </div>
        ) : !hasSearched ? (
          <div className="text-center py-8 text-gray-500">
            <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Masukkan kriteria pencarian dan klik "Cari"</p>
          </div>
        ) : participants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Tidak ada peserta yang sesuai dengan kriteria pencarian</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jenis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jenis Kelamin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kelompok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Desa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pendidikan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pekerjaan/Sekolah
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants.map((participant) => (
                  <tr key={participant.id} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {participant.id}
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{participant.nama_lengkap}</div>
                      {participant.tempat_lahir && participant.tanggal_lahir && (
                        <div className="text-sm text-gray-500">
                          {participant.tempat_lahir}, {new Date(participant.tanggal_lahir).toLocaleDateString('id-ID')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.jenis_kelamin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.usia} tahun
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.kelompok}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.desa}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.pendidikan || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.jenis_muda_i === 'USMAN' 
                        ? (participant.pekerjaan || '-')
                        : (participant.nama_sekolah || '-')
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}