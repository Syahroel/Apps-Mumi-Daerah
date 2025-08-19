import { supabase, Participant, Session, Attendance } from './supabase'
import QRCode from 'qrcode'

// Kelompok to Desa mapping (from Python app)
export const KELOMPOK_DESA_MAP: Record<string, string> = {
  'TEGAL ALUR A': 'KALIDERES',
  'TEGAL ALUR B': 'KALIDERES',
  'PREPEDAN A': 'KALIDERES',
  'PREPEDAN B': 'KALIDERES',
  'KEBON KELAPA': 'KALIDERES',
  'FAJAR A': 'CENGKARENG',
  'FAJAR B': 'CENGKARENG',
  'FAJAR C': 'CENGKARENG',
  'PRIMA': 'BANDARA',
  'RAWA LELE': 'BANDARA',
  'KAMPUNG DURI': 'BANDARA',
  'DAMAI': 'JELAMBAR',
  'JAYA': 'JELAMBAR',
  'INDAH': 'JELAMBAR',
  'PEJAGALAN': 'JELAMBAR',
  'BGN': 'KAPUK MELATI',
  'MELATI A': 'KAPUK MELATI',
  'MELATI B': 'KAPUK MELATI',
  'GRIYA PERMATA': 'CIPONDOH',
  'SEMANAN A': 'CIPONDOH',
  'SEMANAN B': 'CIPONDOH',
  'PONDOK BAHAR': 'CIPONDOH',
  'KEBON JAHE A': 'KEBON JAHE',
  'KEBON JAHE B': 'KEBON JAHE',
  'GARIKAS': 'KEBON JAHE',
  'TANIWAN': 'KEBON JAHE',
  'TAMAN KOTA A': 'TAMAN KOTA',
  'TAMAN KOTA B': 'TAMAN KOTA',
  'RAWA BUAYA A': 'TAMAN KOTA',
  'RAWA BUAYA B': 'TAMAN KOTA'
}

export const KELOMPOK_OPTIONS = Object.keys(KELOMPOK_DESA_MAP)
export const DESA_OPTIONS = [...new Set(Object.values(KELOMPOK_DESA_MAP))]

// Utility functions
export const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

export const formatTime = (date: Date): string => {
  return date.toTimeString().split(' ')[0].slice(0, 5)
}

// QR Code generation
export const generateQRCode = async (participant: Participant): Promise<string> => {
  const qrData = {
    id: participant.id,
    nama: participant.nama_lengkap,
    jenis_kelamin: participant.jenis_kelamin,
    usia: participant.usia,
    kelompok: participant.kelompok,
    desa: participant.desa
  }
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw error
  }
}

// Database operations
export class AppsMumiService {
  // Participants
  static async getParticipants(): Promise<Participant[]> {
    const { data, error } = await supabase
      .from('peserta')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async createParticipant(participant: Omit<Participant, 'id' | 'created_at'>): Promise<Participant> {
    const { data, error } = await supabase
      .from('peserta')
      .insert([participant])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateParticipant(id: number, updates: Partial<Participant>): Promise<Participant> {
    const { data, error } = await supabase
      .from('peserta')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteParticipant(id: number): Promise<void> {
    // Delete attendance records first
    await supabase.from('absensi').delete().eq('peserta_id', id)
    
    // Delete participant
    const { error } = await supabase
      .from('peserta')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async searchParticipants(filters: {
    nama?: string
    desa?: string
    kelompok?: string
    jenis_kelamin?: string
    usia_min?: number
    usia_max?: number
  }): Promise<Participant[]> {
    let query = supabase.from('peserta').select('*')
    
    if (filters.nama) {
      query = query.ilike('nama_lengkap', `%${filters.nama}%`)
    }
    if (filters.desa) {
      query = query.eq('desa', filters.desa)
    }
    if (filters.kelompok) {
      query = query.eq('kelompok', filters.kelompok)
    }
    if (filters.jenis_kelamin) {
      query = query.eq('jenis_kelamin', filters.jenis_kelamin)
    }
    if (filters.usia_min) {
      query = query.gte('usia', filters.usia_min)
    }
    if (filters.usia_max) {
      query = query.lte('usia', filters.usia_max)
    }
    
    const { data, error } = await query.order('nama_lengkap')
    
    if (error) throw error
    return data || []
  }

  // Sessions
  static async getSessions(): Promise<Session[]> {
    const { data, error } = await supabase
      .from('sesi')
      .select('*')
      .order('tanggal', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async createSession(session: Omit<Session, 'id' | 'created_at'>): Promise<Session> {
    const { data, error } = await supabase
      .from('sesi')
      .insert([session])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateSession(id: number, updates: Partial<Session>): Promise<Session> {
    const { data, error } = await supabase
      .from('sesi')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteSession(id: number): Promise<void> {
    // Delete attendance records first
    await supabase.from('absensi').delete().eq('sesi_id', id)
    
    // Delete session
    const { error } = await supabase
      .from('sesi')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Attendance
  static async getAttendance(): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('absensi')
      .select(`
        *,
        participant:peserta(*),
        session:sesi(*)
      `)
      .order('waktu_absen', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async recordAttendance(peserta_id: number, sesi_id: number): Promise<Attendance> {
    // Check if already recorded
    const { data: existing } = await supabase
      .from('absensi')
      .select('id')
      .eq('peserta_id', peserta_id)
      .eq('sesi_id', sesi_id)
      .single()
    
    if (existing) {
      throw new Error('Peserta sudah tercatat hadir di sesi ini')
    }
    
    const { data, error } = await supabase
      .from('absensi')
      .insert([{
        peserta_id,
        sesi_id,
        waktu_absen: new Date().toISOString()
      }])
      .select(`
        *,
        participant:peserta(*),
        session:sesi(*)
      `)
      .single()
    
    if (error) throw error
    return data
  }

  static async getTodayAttendance(): Promise<Attendance[]> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('absensi')
      .select(`
        *,
        participant:peserta(*),
        session:sesi(*)
      `)
      .gte('waktu_absen', `${today}T00:00:00`)
      .lt('waktu_absen', `${today}T23:59:59`)
      .order('waktu_absen', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // Reports
  static async getAttendanceBySession(sessionId: number): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('absensi')
      .select(`
        *,
        participant:peserta(*),
        session:sesi(*)
      `)
      .eq('sesi_id', sessionId)
      .order('waktu_absen')
    
    if (error) throw error
    return data || []
  }

  static async getAttendanceByDesa(desa: string, sessionId?: number): Promise<Attendance[]> {
    let query = supabase
      .from('absensi')
      .select(`
        *,
        participant:peserta!inner(*),
        session:sesi(*)
      `)
      .eq('participant.desa', desa)
    
    if (sessionId) {
      query = query.eq('sesi_id', sessionId)
    }
    
    const { data, error } = await query.order('waktu_absen')
    
    if (error) throw error
    return data || []
  }
}