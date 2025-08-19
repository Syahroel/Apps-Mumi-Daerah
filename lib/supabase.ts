import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Participant {
  id: number
  jenis_muda_i: 'USMAN' | 'GENERUS'
  nama_lengkap: string
  jenis_kelamin: 'PRIA' | 'WANITA'
  tempat_lahir?: string
  tanggal_lahir?: string
  usia?: number
  nama_orang_tua?: string
  kelompok: string
  desa: string
  pendidikan?: string
  pekerjaan?: string
  nama_sekolah?: string
  foto?: string
  hobby?: string
  qr_code_path?: string
  created_at?: string
}

export interface Session {
  id: number
  nama_sesi: string
  tanggal: string
  jam_mulai: string
  jam_selesai: string
  pemateri?: string
  materi?: string
  created_at?: string
}

export interface Attendance {
  id: number
  peserta_id: number
  sesi_id: number
  waktu_absen: string
  participant?: Participant
  session?: Session
}