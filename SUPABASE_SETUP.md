# 🗄️ Panduan Setup Supabase untuk Aplikasi Manajemen Muda-Mudi

Panduan lengkap untuk menghubungkan aplikasi Next.js dengan Supabase sebagai pengganti SQLite dari aplikasi Python.

## 📋 Langkah-langkah Setup

### 1. Buat Akun dan Project Supabase

1. **Daftar di Supabase**
   - Kunjungi [supabase.com](https://supabase.com)
   - Klik "Start your project" 
   - Daftar dengan GitHub/Google atau email

2. **Buat Project Baru**
   - Klik "New Project"
   - Pilih organization (atau buat baru)
   - Isi detail project:
     - **Name**: `manajemen-muda-mudi`
     - **Database Password**: Buat password yang kuat
     - **Region**: Southeast Asia (Singapore) - terdekat dengan Indonesia
   - Klik "Create new project"
   - Tunggu ~2 menit hingga project siap

### 2. Dapatkan Credentials

1. **Project URL dan API Keys**
   - Buka project dashboard
   - Klik "Settings" → "API"
   - Catat:
     - **Project URL**: `https://your-project-id.supabase.co`
     - **Anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Setup Database Schema

1. **Buka SQL Editor**
   - Di dashboard Supabase, klik "SQL Editor"
   - Klik "New query"

2. **Jalankan Script Database**
   Copy dan paste script berikut, lalu klik "Run":

```sql
-- =====================================================
-- SCHEMA DATABASE MANAJEMEN MUDA-MUDI
-- Konversi dari SQLite Python ke PostgreSQL Supabase
-- =====================================================

-- 1. TABEL PESERTA (Konversi dari tabel 'peserta' Python)
CREATE TABLE peserta (
  id SERIAL PRIMARY KEY,
  jenis_muda_i VARCHAR(10) CHECK (jenis_muda_i IN ('USMAN', 'GENERUS')),
  nama_lengkap VARCHAR(255) NOT NULL,
  jenis_kelamin VARCHAR(10) CHECK (jenis_kelamin IN ('PRIA', 'WANITA')),
  tempat_lahir VARCHAR(255),
  tanggal_lahir DATE,
  usia INTEGER CHECK (usia >= 0 AND usia <= 100),
  nama_orang_tua VARCHAR(255),
  kelompok VARCHAR(255) NOT NULL,
  desa VARCHAR(255) NOT NULL,
  pendidikan VARCHAR(255),
  pekerjaan VARCHAR(255),
  nama_sekolah VARCHAR(255),
  foto TEXT, -- URL ke Supabase Storage
  hobby VARCHAR(255),
  qr_code_path TEXT, -- URL ke QR code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABEL SESI/KEGIATAN (Konversi dari tabel 'sesi' Python)
CREATE TABLE sesi (
  id SERIAL PRIMARY KEY,
  nama_sesi VARCHAR(255) NOT NULL,
  tanggal DATE NOT NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  pemateri VARCHAR(255),
  materi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABEL ABSENSI (Konversi dari tabel 'absensi' Python)
CREATE TABLE absensi (
  id SERIAL PRIMARY KEY,
  peserta_id INTEGER NOT NULL REFERENCES peserta(id) ON DELETE CASCADE,
  sesi_id INTEGER NOT NULL REFERENCES sesi(id) ON DELETE CASCADE,
  waktu_absen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Constraint: satu peserta hanya bisa absen sekali per sesi
  UNIQUE(peserta_id, sesi_id)
);

-- =====================================================
-- INDEXES UNTUK PERFORMANCE
-- =====================================================

-- Index untuk pencarian peserta
CREATE INDEX idx_peserta_nama ON peserta USING gin(to_tsvector('indonesian', nama_lengkap));
CREATE INDEX idx_peserta_desa ON peserta(desa);
CREATE INDEX idx_peserta_kelompok ON peserta(kelompok);
CREATE INDEX idx_peserta_jenis_muda_i ON peserta(jenis_muda_i);
CREATE INDEX idx_peserta_jenis_kelamin ON peserta(jenis_kelamin);

-- Index untuk sesi
CREATE INDEX idx_sesi_tanggal ON sesi(tanggal DESC);
CREATE INDEX idx_sesi_nama ON sesi USING gin(to_tsvector('indonesian', nama_sesi));

-- Index untuk absensi
CREATE INDEX idx_absensi_peserta_id ON absensi(peserta_id);
CREATE INDEX idx_absensi_sesi_id ON absensi(sesi_id);
CREATE INDEX idx_absensi_waktu ON absensi(waktu_absen DESC);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger untuk auto-update timestamp
CREATE TRIGGER update_peserta_updated_at BEFORE UPDATE ON peserta
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sesi_updated_at BEFORE UPDATE ON sesi
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE peserta ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesi ENABLE ROW LEVEL SECURITY;
ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;

-- Policies (untuk development - allow all)
-- CATATAN: Untuk production, sesuaikan dengan kebutuhan security
CREATE POLICY "Allow all operations on peserta" ON peserta FOR ALL USING (true);
CREATE POLICY "Allow all operations on sesi" ON sesi FOR ALL USING (true);
CREATE POLICY "Allow all operations on absensi" ON absensi FOR ALL USING (true);

-- =====================================================
-- SAMPLE DATA (OPSIONAL)
-- =====================================================

-- Insert sample kelompok dan desa
INSERT INTO peserta (jenis_muda_i, nama_lengkap, jenis_kelamin, kelompok, desa, usia) VALUES
('USMAN', 'Ahmad Fauzi', 'PRIA', 'TEGAL ALUR A', 'KALIDERES', 25),
('GENERUS', 'Siti Nurhaliza', 'WANITA', 'FAJAR A', 'CENGKARENG', 17),
('USMAN', 'Budi Santoso', 'PRIA', 'PRIMA', 'BANDARA', 23);

-- Insert sample sesi
INSERT INTO sesi (nama_sesi, tanggal, jam_mulai, jam_selesai, pemateri, materi) VALUES
('Kajian Rutin Minggu Pagi', '2024-01-07', '08:00', '10:00', 'Ustadz Abdullah', 'Akhlak dalam Islam'),
('Pelatihan Kepemimpinan', '2024-01-14', '13:00', '16:00', 'Kak Ridwan', 'Leadership Skills');

-- =====================================================
-- VIEWS UNTUK REPORTING
-- =====================================================

-- View untuk statistik peserta per desa
CREATE VIEW v_statistik_desa AS
SELECT 
    desa,
    COUNT(*) as total_peserta,
    COUNT(CASE WHEN jenis_kelamin = 'PRIA' THEN 1 END) as total_pria,
    COUNT(CASE WHEN jenis_kelamin = 'WANITA' THEN 1 END) as total_wanita,
    COUNT(CASE WHEN jenis_muda_i = 'USMAN' THEN 1 END) as total_usman,
    COUNT(CASE WHEN jenis_muda_i = 'GENERUS' THEN 1 END) as total_generus
FROM peserta 
GROUP BY desa
ORDER BY total_peserta DESC;

-- View untuk statistik kehadiran
CREATE VIEW v_statistik_kehadiran AS
SELECT 
    s.nama_sesi,
    s.tanggal,
    COUNT(a.id) as total_hadir,
    (SELECT COUNT(*) FROM peserta) as total_peserta,
    ROUND(COUNT(a.id) * 100.0 / (SELECT COUNT(*) FROM peserta), 2) as persentase_kehadiran
FROM sesi s
LEFT JOIN absensi a ON s.id = a.sesi_id
GROUP BY s.id, s.nama_sesi, s.tanggal
ORDER BY s.tanggal DESC;

-- =====================================================
-- STORAGE BUCKET UNTUK FOTO
-- =====================================================

-- Buat bucket untuk foto peserta
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true);

-- Policy untuk storage
CREATE POLICY "Allow photo uploads" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Allow photo access" ON storage.objects 
FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Allow photo updates" ON storage.objects 
FOR UPDATE USING (bucket_id = 'photos');

CREATE POLICY "Allow photo deletes" ON storage.objects 
FOR DELETE USING (bucket_id = 'photos');
```

### 4. Verifikasi Setup

1. **Cek Tabel**
   - Klik "Table Editor" di sidebar
   - Pastikan tabel `peserta`, `sesi`, dan `absensi` sudah ada
   - Cek sample data sudah masuk

2. **Test Connection**
   - Buka "API Docs" 
   - Test endpoint dengan curl atau Postman

### 5. Setup Environment Variables

1. **Buat file `.env.local`** di root project Next.js:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Ganti dengan credentials Anda yang sebenarnya
```

2. **Restart Development Server**
```bash
npm run dev
```

## 🔧 Konfigurasi Lanjutan

### Authentication (Opsional)

Jika ingin menambahkan login:

```sql
-- Enable authentication
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- RLS untuk user profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
```

### Real-time Subscriptions

Untuk update real-time:

```javascript
// Di komponen React
useEffect(() => {
  const subscription = supabase
    .channel('absensi-changes')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'absensi' },
      (payload) => {
        console.log('New attendance:', payload)
        // Update UI
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}, [])
```

### Backup & Recovery

1. **Automatic Backups**
   - Supabase otomatis backup daily untuk plan berbayar
   - Free tier: backup manual via dashboard

2. **Manual Backup**
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Backup
supabase db dump --db-url "postgresql://..." > backup.sql
```

## 🚨 Security Best Practices

### 1. Row Level Security (RLS)

Untuk production, ganti policy dengan yang lebih ketat:

```sql
-- Hapus policy development
DROP POLICY "Allow all operations on peserta" ON peserta;

-- Buat policy production (contoh)
CREATE POLICY "Allow read peserta" ON peserta FOR SELECT USING (true);
CREATE POLICY "Allow insert peserta" ON peserta FOR INSERT WITH CHECK (true);
-- Tambahkan kondisi sesuai kebutuhan
```

### 2. API Rate Limiting

```javascript
// Di Next.js API routes
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
```

### 3. Input Validation

```javascript
// Gunakan Zod untuk validation
import { z } from 'zod'

const participantSchema = z.object({
  nama_lengkap: z.string().min(1).max(255),
  jenis_muda_i: z.enum(['USMAN', 'GENERUS']),
  // ... field lainnya
})
```

## 📊 Monitoring & Analytics

### 1. Supabase Dashboard
- Monitor query performance
- Check storage usage
- View real-time connections

### 2. Custom Analytics
```sql
-- Query untuk monitoring
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables;
```

## 🔄 Migration dari SQLite

Jika Anda memiliki data existing dari aplikasi Python:

### 1. Export dari SQLite
```python
import sqlite3
import json

conn = sqlite3.connect('database_mumi.db')
cursor = conn.cursor()

# Export peserta
cursor.execute("SELECT * FROM peserta")
peserta_data = cursor.fetchall()

with open('peserta_export.json', 'w') as f:
    json.dump(peserta_data, f)
```

### 2. Import ke Supabase
```javascript
// Script Node.js untuk import
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(url, key)

async function importData() {
  const data = JSON.parse(fs.readFileSync('peserta_export.json'))
  
  for (const row of data) {
    await supabase.from('peserta').insert({
      // mapping fields
    })
  }
}
```

## 🆘 Troubleshooting

### Common Issues

1. **Connection Error**
```
Error: Invalid API key
```
**Solution**: Periksa environment variables

2. **RLS Policy Error**
```
Error: new row violates row-level security policy
```
**Solution**: Update RLS policies

3. **Storage Upload Error**
```
Error: Bucket not found
```
**Solution**: Buat bucket di Storage dashboard

### Performance Tips

1. **Use Indexes**
   - Buat index untuk kolom yang sering di-query
   - Monitor slow queries di dashboard

2. **Optimize Queries**
   - Gunakan `select()` dengan field spesifik
   - Implementasi pagination untuk data besar

3. **Connection Pooling**
   - Supabase otomatis handle connection pooling
   - Untuk high traffic, pertimbangkan connection pooler

## 📞 Support

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Community**: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
- **Discord**: [discord.supabase.com](https://discord.supabase.com)

---

**Setup berhasil? Lanjut ke development! 🚀**