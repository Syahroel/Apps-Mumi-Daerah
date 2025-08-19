'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import toast from 'react-hot-toast'
import { QrCode, Camera, CameraOff, Users, Clock, CheckCircle } from 'lucide-react'
import { AppsMumiService } from '@/lib/appsmumi'
import { Session, Attendance } from '@/lib/supabase'

export default function ScanTab() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [manualId, setManualId] = useState('')
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  const loadSessions = async () => {
    try {
      const data = await AppsMumiService.getSessions()
      setSessions(data)
      if (data.length > 0 && !selectedSessionId) {
        setSelectedSessionId(data[0].id)
      }
    } catch (error) {
      toast.error('Gagal memuat data kegiatan')
    }
  }

  const loadTodayAttendance = async () => {
    try {
      const data = await AppsMumiService.getTodayAttendance()
      setTodayAttendance(data)
    } catch (error) {
      console.error('Error loading today attendance:', error)
    }
  }

  useEffect(() => {
    loadSessions()
    loadTodayAttendance()
  }, [])

  const startScanning = () => {
    if (!selectedSessionId) {
      toast.error('Pilih kegiatan terlebih dahulu!')
      return
    }

    setIsScanning(true)
    
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    )

    scanner.render(
      (decodedText) => {
        processQRCode(decodedText)
        scanner.clear()
        setIsScanning(false)
      },
      (error) => {
        // Ignore scanning errors (they're frequent)
      }
    )

    scannerRef.current = scanner
  }

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear()
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  const processQRCode = async (qrData: string) => {
    try {
      if (!selectedSessionId) {
        toast.error('Pilih kegiatan terlebih dahulu!')
        return
      }

      // Parse QR data
      let participantId: number
      try {
        const data = JSON.parse(qrData)
        participantId = data.id
      } catch {
        // Try to extract ID from plain text
        const match = qrData.match(/\d+/)
        if (match) {
          participantId = parseInt(match[0])
        } else {
          toast.error('Format QR Code tidak valid!')
          return
        }
      }

      await recordAttendance(participantId)
    } catch (error: any) {
      toast.error(error.message || 'Gagal memproses QR Code')
    }
  }

  const recordAttendance = async (participantId: number) => {
    try {
      if (!selectedSessionId) {
        toast.error('Pilih kegiatan terlebih dahulu!')
        return
      }

      const attendance = await AppsMumiService.recordAttendance(participantId, selectedSessionId)
      
      if (attendance.participant) {
        toast.success(`✓ Absensi tercatat: ${attendance.participant.nama_lengkap}`)
        loadTodayAttendance()
      }
    } catch (error: any) {
      if (error.message.includes('sudah tercatat')) {
        toast.error(error.message)
      } else {
        toast.error('Gagal mencatat absensi')
      }
    }
  }

  const handleManualAttendance = async () => {
    if (!manualId.trim()) {
      toast.error('Masukkan ID peserta!')
      return
    }

    try {
      const participantId = parseInt(manualId)
      await recordAttendance(participantId)
      setManualId('')
    } catch (error) {
      toast.error('ID peserta tidak valid!')
    }
  }

  const selectedSession = sessions.find(s => s.id === selectedSessionId)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Scanner Section */}
      <div className="space-y-6">
        {/* Session Selection */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Pilih Kegiatan</h2>
          <select
            value={selectedSessionId || ''}
            onChange={(e) => setSelectedSessionId(Number(e.target.value))}
            className="input-field"
          >
            <option value="">Pilih Kegiatan</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.nama_sesi} - {session.tanggal} {session.jam_mulai}
              </option>
            ))}
          </select>
          
          {selectedSession && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900">{selectedSession.nama_sesi}</h3>
              <p className="text-sm text-blue-700">
                {selectedSession.tanggal} • {selectedSession.jam_mulai} - {selectedSession.jam_selesai}
              </p>
              {selectedSession.pemateri && (
                <p className="text-sm text-blue-700">Pemateri: {selectedSession.pemateri}</p>
              )}
            </div>
          )}
        </div>

        {/* QR Scanner */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Scanner QR Code</h2>
          
          {!isScanning ? (
            <div className="text-center">
              <div className="mb-4">
                <QrCode className="h-16 w-16 mx-auto text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4">
                Klik tombol di bawah untuk mulai scan QR Code
              </p>
              <button
                onClick={startScanning}
                disabled={!selectedSessionId}
                className="btn-primary"
              >
                <Camera className="h-4 w-4 mr-2" />
                Mulai Scan QR
              </button>
            </div>
          ) : (
            <div>
              <div id="qr-reader" className="mb-4"></div>
              <div className="text-center">
                <button onClick={stopScanning} className="btn-danger">
                  <CameraOff className="h-4 w-4 mr-2" />
                  Berhenti Scan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Manual Input */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Input Manual</h2>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="ID Peserta"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              className="input-field flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleManualAttendance()}
            />
            <button
              onClick={handleManualAttendance}
              disabled={!selectedSessionId}
              className="btn-success"
            >
              Catat Absensi
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Log */}
      <div>
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Log Absensi Hari Ini</h2>
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-1" />
              {todayAttendance.length} hadir
            </div>
          </div>

          {todayAttendance.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Belum ada absensi hari ini</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {todayAttendance.map((attendance) => (
                <div key={attendance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {attendance.participant?.nama_lengkap}
                    </div>
                    <div className="text-sm text-gray-600">
                      {attendance.participant?.kelompok} • {attendance.participant?.desa}
                    </div>
                    <div className="text-sm text-gray-500">
                      {attendance.session?.nama_sesi}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(attendance.waktu_absen).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      ✓ Hadir
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