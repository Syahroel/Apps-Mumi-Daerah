# Aplikasi Manajemen Muda-Mudi Web

Aplikasi web modern untuk manajemen data muda-mudi Cengkareng Jakarta Barat dengan fitur absensi QR Code, dikonversi dari aplikasi desktop Python ke Next.js.

## 🚀 Fitur Utama

### ✅ Fitur yang Sudah Dikonversi
- **Manajemen Peserta** - Input, edit, hapus data muda-mudi (USMAN/GENERUS)
- **Manajemen Kegiatan** - Buat dan kelola sesi/kegiatan
- **Sistem Absensi** - QR Code scanning dan input manual
- **Pencarian Data** - Filter berdasarkan nama, desa, kelompok, jenis kelamin, usia
- **Laporan** - Generate laporan PDF per kegiatan, per peserta, dan statistik
- **QR Code Generation** - Generate QR code untuk setiap peserta
- **Responsive Design** - Optimized untuk desktop dan mobile

### 🔄 Adaptasi dari Python ke Web
- **Database**: SQLite → Supabase (PostgreSQL)
- **UI Framework**: Tkinter → Next.js + Tailwind CSS
- **QR Generation**: Python qrcode → JavaScript qrcode
- **QR Scanning**: OpenCV → html5-qrcode
- **PDF Generation**: ReportLab → jsPDF
- **File Storage**: Local files → Supabase Storage (untuk foto)

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **QR Code**: qrcode + html5-qrcode
- **PDF**: jsPDF + jspdf-autotable
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ 
- npm atau yarn
- Akun Supabase

## 🚀 Setup & Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd app-manajemen-mumi
```

### 2. Install Dependencies
```bash
npm install
# atau
yarn install
```

### 3. Setup Supabase

#### A. Buat Project Supabase
1. Buka [supabase.com](https://supabase.com)
2. Buat project baru
3. Catat URL dan Anon Key

#### B. Buat Database Tables
Jalankan SQL berikut di Supabase SQL Editor:

```sql
-- Tabel Peserta
CREATE TABLE peserta (
  id SERIAL PRIMARY KEY,
  jenis_muda_i VARCHAR(10) CHECK (jenis_muda_i IN ('USMAN', 'GENERUS')),
  nama_lengkap VARCHAR(255) NOT NULL,
  jenis_kelamin VARCHAR(10) CHECK (jenis_kelamin IN ('PRIA', 'WANITA')),
  tempat_lahir VARCHAR(255),
  tanggal_lahir DATE,
  usia INTEGER,
  nama_orang_tua VARCHAR(255),
  kelompok VARCHAR(255) NOT NULL,
  desa VARCHAR(255) NOT NULL,
  pendidikan VARCHAR(255),
  pekerjaan VARCHAR(255),
  nama_sekolah VARCHAR(255),
  foto TEXT,
  hobby VARCHAR(255),
  qr_code_path TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Sesi/Kegiatan
CREATE TABLE sesi (
  id SERIAL PRIMARY KEY,
  nama_sesi VARCHAR(255) NOT NULL,
  tanggal DATE NOT NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  pemateri VARCHAR(255),
  materi TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Absensi
CREATE TABLE absensi (
  id SERIAL PRIMARY KEY,
  peserta_id INTEGER REFERENCES peserta(id) ON DELETE CASCADE,
  sesi_id INTEGER REFERENCES sesi(id) ON DELETE CASCADE,
  waktu_absen TIMESTAMP DEFAULT NOW(),
  UNIQUE(peserta_id, sesi_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE peserta ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesi ENABLE ROW LEVEL SECURITY;
ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now, customize as needed)
CREATE POLICY "Allow all operations on peserta" ON peserta FOR ALL USING (true);
CREATE POLICY "Allow all operations on sesi" ON sesi FOR ALL USING (true);
CREATE POLICY "Allow all operations on absensi" ON absensi FOR ALL USING (true);
```

### 4. Environment Variables
```bash
# Copy example file
cp .env.local.example .env.local

# Edit .env.local dengan credentials Supabase Anda
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 5. Run Development Server
```bash
npm run dev
# atau
yarn dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 🚀 Deployment ke Vercel

### 1. Push ke GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy ke Vercel
1. Buka [vercel.com](https://vercel.com)
2. Import repository dari GitHub
3. Tambahkan environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### 3. Custom Domain (Opsional)
- Tambahkan custom domain di Vercel dashboard
- Update DNS records sesuai instruksi Vercel

## 📊 Perbandingan Fitur: Python vs Next.js

| Fitur | Python Desktop | Next.js Web | Status |
|-------|----------------|-------------|---------|
| Input Data Peserta | ✅ Tkinter Form | ✅ React Form | ✅ Converted |
| Auto-fill Desa dari Kelompok | ✅ | ✅ | ✅ Converted |
| Generate QR Code | ✅ qrcode + PIL | ✅ qrcode.js | ✅ Converted |
| QR Code dengan Nama Bold | ✅ PIL ImageDraw | ⚠️ Canvas API | 🔄 Simplified |
| Scan QR Code | ✅ OpenCV | ✅ html5-qrcode | ✅ Converted |
| Scanner PANDA Support | ✅ Keyboard Input | ✅ Input Field | ✅ Converted |
| Database SQLite | ✅ | ✅ Supabase | ✅ Upgraded |
| Pencarian & Filter | ✅ | ✅ | ✅ Converted |
| Laporan PDF | ✅ ReportLab | ✅ jsPDF | ✅ Converted |
| Export QR Codes | ✅ File System | ⚠️ Download Links | 🔄 Web-adapted |
| Foto Upload | ✅ Local Files | 🔄 Supabase Storage | 🚧 Planned |
| Merge Database | ✅ | 🚧 | 🚧 Planned |

**Legend:**
- ✅ Fully Implemented
- ⚠️ Partially Implemented  
- 🔄 Modified for Web
- 🚧 Planned/In Progress

## 🔧 Konfigurasi Tambahan

### Supabase Storage (untuk Foto)
```sql
-- Buat bucket untuk foto
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- Policy untuk upload foto
CREATE POLICY "Allow photo uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos');
CREATE POLICY "Allow photo access" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
```

### Custom Domain & SSL
- Vercel otomatis menyediakan SSL certificate
- Untuk custom domain, ikuti panduan Vercel

## 📱 Mobile Responsiveness

Aplikasi sudah dioptimasi untuk:
- **Desktop**: Full layout dengan sidebar
- **Tablet**: Responsive grid layout  
- **Mobile**: Stack layout dengan touch-friendly buttons

## 🔒 Security Features

- **Row Level Security (RLS)** di Supabase
- **Environment Variables** untuk credentials
- **Input Validation** dengan React Hook Form
- **XSS Protection** dengan proper sanitization

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   ```
   Error: Invalid API key
   ```
   **Solution**: Periksa environment variables di `.env.local`

2. **QR Scanner Not Working**
   ```
   Error: Camera access denied
   ```
   **Solution**: Pastikan browser memiliki akses kamera dan menggunakan HTTPS

3. **PDF Generation Error**
   ```
   Error: jsPDF is not defined
   ```
   **Solution**: Restart development server setelah install dependencies

### Performance Tips

- Gunakan **React.memo** untuk komponen yang sering re-render
- Implementasi **pagination** untuk data besar
- Gunakan **Supabase realtime** untuk update otomatis

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Support

Untuk pertanyaan atau bantuan:
- Buat issue di GitHub repository
- Email: [your-email@domain.com]

## 🎯 Roadmap

### Phase 1 (Current) ✅
- [x] Basic CRUD operations
- [x] QR Code generation & scanning
- [x] PDF reports
- [x] Responsive design

### Phase 2 🚧
- [ ] Photo upload to Supabase Storage
- [ ] Advanced analytics dashboard
- [ ] Real-time notifications
- [ ] Bulk import/export

### Phase 3 🔮
- [ ] Mobile app (React Native)
- [ ] Offline support (PWA)
- [ ] Advanced reporting with charts
- [ ] Multi-tenant support

---

**Dibuat dengan ❤️ untuk Muda-Mudi Cengkareng Jakarta Barat**