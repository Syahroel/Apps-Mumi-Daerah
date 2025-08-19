'use client'

import { useState, useEffect } from 'react'
import { FileText, Download, Users, Calendar, BarChart3, PieChart } from 'lucide-react'
import { AppsMumiService } from '@/lib/appsmumi'
import { Session, Attendance, Participant } from '@/lib/supabase'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export default function ReportTab() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loadSessions = async () => {
    try {
      const data = await AppsMumiService.getSessions()
      setSessions(data)
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const generateSessionReport = async () => {
    if (!selectedSessionId) return

    try {
      setLoading(true)
      const attendance = await AppsMumiService.getAttendanceBySession(selectedSessionId)
      const session = sessions.find(s => s.id === selectedSessionId)
      
      setReportData({
        type: 'session',
        session,
        attendance,
        totalAttendees: attendance.length
      })
    } catch (error) {
      console.error('Error generating session report:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateParticipantReport = async () => {
    try {
      setLoading(true)
      const participants = await AppsMumiService.getParticipants()
      const attendance = await AppsMumiService.getAttendance()
      
      // Calculate attendance stats per participant
      const participantStats = participants.map(participant => {
        const attendanceCount = attendance.filter(a => a.peserta_id === participant.id).length
        return {
          ...participant,
          attendanceCount
        }
      })

      setReportData({
        type: 'participant',
        participants: participantStats,
        totalParticipants: participants.length
      })
    } catch (error) {
      console.error('Error generating participant report:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateStatisticsReport = async () => {
    try {
      setLoading(true)
      const participants = await AppsMumiService.getParticipants()
      const sessions = await AppsMumiService.getSessions()
      const attendance = await AppsMumiService.getAttendance()

      // Statistics by desa
      const desaStats = participants.reduce((acc, p) => {
        acc[p.desa] = (acc[p.desa] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Statistics by kelompok
      const kelompokStats = participants.reduce((acc, p) => {
        acc[p.kelompok] = (acc[p.kelompok] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Statistics by jenis_muda_i
      const jenisStats = participants.reduce((acc, p) => {
        acc[p.jenis_muda_i] = (acc[p.jenis_muda_i] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Statistics by gender
      const genderStats = participants.reduce((acc, p) => {
        acc[p.jenis_kelamin] = (acc[p.jenis_kelamin] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      setReportData({
        type: 'statistics',
        totalParticipants: participants.length,
        totalSessions: sessions.length,
        totalAttendance: attendance.length,
        desaStats,
        kelompokStats,
        jenisStats,
        genderStats
      })
    } catch (error) {
      console.error('Error generating statistics report:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = () => {
    if (!reportData) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    
    // Title
    doc.setFontSize(16)
    doc.text('LAPORAN SISTEM MANAJEMEN MUDA-MUDI', pageWidth / 2, 20, { align: 'center' })
    doc.setFontSize(12)
    doc.text('Cengkareng Jakarta Barat', pageWidth / 2, 30, { align: 'center' })
    
    let yPosition = 50

    if (reportData.type === 'session') {
      // Session Report
      doc.setFontSize(14)
      doc.text('LAPORAN KEHADIRAN PER KEGIATAN', 20, yPosition)
      yPosition += 20

      doc.setFontSize(10)
      doc.text(`Kegiatan: ${reportData.session.nama_sesi}`, 20, yPosition)
      yPosition += 10
      doc.text(`Tanggal: ${reportData.session.tanggal}`, 20, yPosition)
      yPosition += 10
      doc.text(`Waktu: ${reportData.session.jam_mulai} - ${reportData.session.jam_selesai}`, 20, yPosition)
      yPosition += 10
      doc.text(`Jumlah Hadir: ${reportData.totalAttendees} peserta`, 20, yPosition)
      yPosition += 20

      if (reportData.attendance.length > 0) {
        const tableData = reportData.attendance.map((att: Attendance, index: number) => [
          index + 1,
          att.participant?.nama_lengkap || '',
          att.participant?.kelompok || '',
          att.participant?.desa || '',
          new Date(att.waktu_absen).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        ])

        doc.autoTable({
          head: [['No', 'Nama', 'Kelompok', 'Desa', 'Waktu Absen']],
          body: tableData,
          startY: yPosition,
          styles: { fontSize: 8 }
        })
      }
    } else if (reportData.type === 'participant') {
      // Participant Report
      doc.setFontSize(14)
      doc.text('LAPORAN KEHADIRAN PER PESERTA', 20, yPosition)
      yPosition += 20

      doc.setFontSize(10)
      doc.text(`Total Peserta: ${reportData.totalParticipants}`, 20, yPosition)
      yPosition += 20

      const tableData = reportData.participants.map((p: any, index: number) => [
        index + 1,
        p.nama_lengkap,
        p.jenis_muda_i,
        p.kelompok,
        p.desa,
        p.attendanceCount
      ])

      doc.autoTable({
        head: [['No', 'Nama', 'Jenis', 'Kelompok', 'Desa', 'Jumlah Hadir']],
        body: tableData,
        startY: yPosition,
        styles: { fontSize: 8 }
      })
    } else if (reportData.type === 'statistics') {
      // Statistics Report
      doc.setFontSize(14)
      doc.text('LAPORAN STATISTIK', 20, yPosition)
      yPosition += 20

      doc.setFontSize(10)
      doc.text(`Total Peserta: ${reportData.totalParticipants}`, 20, yPosition)
      yPosition += 10
      doc.text(`Total Kegiatan: ${reportData.totalSessions}`, 20, yPosition)
      yPosition += 10
      doc.text(`Total Kehadiran: ${reportData.totalAttendance}`, 20, yPosition)
      yPosition += 20

      // Statistics by Desa
      doc.text('Statistik per Desa:', 20, yPosition)
      yPosition += 10
      Object.entries(reportData.desaStats).forEach(([desa, count]) => {
        doc.text(`- ${desa}: ${count} peserta`, 25, yPosition)
        yPosition += 8
      })
      yPosition += 10

      // Statistics by Jenis
      doc.text('Statistik per Jenis:', 20, yPosition)
      yPosition += 10
      Object.entries(reportData.jenisStats).forEach(([jenis, count]) => {
        doc.text(`- ${jenis}: ${count} peserta`, 25, yPosition)
        yPosition += 8
      })
    }

    // Footer
    const now = new Date()
    doc.setFontSize(8)
    doc.text(`Laporan dicetak pada: ${now.toLocaleString('id-ID')}`, 20, doc.internal.pageSize.height - 20)

    // Save PDF
    const filename = `Laporan_${reportData.type}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
  }

  return (
    <div className="space-y-6">
      {/* Report Generation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Session Report */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Calendar className="h-6 w-6 text-primary mr-2" />
            <h3 className="text-lg font-semibold">Laporan per Kegiatan</h3>
          </div>
          
          <div className="space-y-4">
            <select
              value={selectedSessionId || ''}
              onChange={(e) => setSelectedSessionId(Number(e.target.value))}
              className="input-field"
            >
              <option value="">Pilih Kegiatan</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.nama_sesi} - {session.tanggal}
                </option>
              ))}
            </select>
            
            <button
              onClick={generateSessionReport}
              disabled={!selectedSessionId || loading}
              className="btn-primary w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Laporan
            </button>
          </div>
        </div>

        {/* Participant Report */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Users className="h-6 w-6 text-success mr-2" />
            <h3 className="text-lg font-semibold">Laporan per Peserta</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Laporan kehadiran semua peserta di seluruh kegiatan
            </p>
            
            <button
              onClick={generateParticipantReport}
              disabled={loading}
              className="btn-success w-full"
            >
              <Users className="h-4 w-4 mr-2" />
              Generate Laporan
            </button>
          </div>
        </div>

        {/* Statistics Report */}
        <div className="card">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-6 w-6 text-warning mr-2" />
            <h3 className="text-lg font-semibold">Laporan Statistik</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Statistik peserta berdasarkan desa, kelompok, dan jenis
            </p>
            
            <button
              onClick={generateStatisticsReport}
              disabled={loading}
              className="btn-warning w-full"
            >
              <PieChart className="h-4 w-4 mr-2" />
              Generate Laporan
            </button>
          </div>
        </div>
      </div>

      {/* Report Display */}
      {reportData && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {reportData.type === 'session' && 'Laporan Kehadiran per Kegiatan'}
              {reportData.type === 'participant' && 'Laporan Kehadiran per Peserta'}
              {reportData.type === 'statistics' && 'Laporan Statistik'}
            </h2>
            <button onClick={downloadPDF} className="btn-primary">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </button>
          </div>

          {reportData.type === 'session' && (
            <div>
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-900">{reportData.session.nama_sesi}</h3>
                <p className="text-blue-700">
                  {reportData.session.tanggal} • {reportData.session.jam_mulai} - {reportData.session.jam_selesai}
                </p>
                <p className="text-blue-700">Jumlah Hadir: {reportData.totalAttendees} peserta</p>
              </div>

              {reportData.attendance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelompok</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desa</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu Absen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.attendance.map((att: Attendance, index: number) => (
                        <tr key={att.id}>
                          <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {att.participant?.nama_lengkap}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{att.participant?.kelompok}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{att.participant?.desa}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(att.waktu_absen).toLocaleTimeString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Tidak ada peserta yang hadir</p>
              )}
            </div>
          )}

          {reportData.type === 'participant' && (
            <div>
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <p className="text-green-700">Total Peserta: {reportData.totalParticipants}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelompok</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Hadir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.participants.map((participant: any, index: number) => (
                      <tr key={participant.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {participant.nama_lengkap}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            participant.jenis_muda_i === 'USMAN' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {participant.jenis_muda_i}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{participant.kelompok}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{participant.desa}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{participant.attendanceCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportData.type === 'statistics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-4">Ringkasan</h4>
                <div className="space-y-2">
                  <p>Total Peserta: {reportData.totalParticipants}</p>
                  <p>Total Kegiatan: {reportData.totalSessions}</p>
                  <p>Total Kehadiran: {reportData.totalAttendance}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-4">Statistik per Desa</h4>
                <div className="space-y-2">
                  {Object.entries(reportData.desaStats).map(([desa, count]) => (
                    <div key={desa} className="flex justify-between">
                      <span>{desa}</span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-4">Statistik per Jenis</h4>
                <div className="space-y-2">
                  {Object.entries(reportData.jenisStats).map(([jenis, count]) => (
                    <div key={jenis} className="flex justify-between">
                      <span>{jenis}</span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-4">Statistik per Jenis Kelamin</h4>
                <div className="space-y-2">
                  {Object.entries(reportData.genderStats).map(([gender, count]) => (
                    <div key={gender} className="flex justify-between">
                      <span>{gender}</span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  )
}