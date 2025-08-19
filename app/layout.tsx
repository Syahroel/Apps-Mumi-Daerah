import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Aplikasi Manajemen Muda-Mudi | Cengkareng Jakarta Barat',
  description: 'Sistem manajemen data muda-mudi dengan fitur absensi QR Code',
  keywords: 'muda-mudi, manajemen, absensi, QR code, Jakarta Barat, Cengkareng',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-light min-h-screen`}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-primary">
                    SISTEM MANAJEMEN MUDA-MUDI
                  </h1>
                </div>
                <div className="text-sm text-gray-600">
                  Cengkareng Jakarta Barat
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-1">
            {children}
          </main>
          
          <footer className="bg-white border-t border-gray-200 py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center text-sm text-gray-600">
                © 2024 Aplikasi Manajemen Muda-Mudi Cengkareng Jakarta Barat
              </div>
            </div>
          </footer>
        </div>
        
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#4CAF50',
              },
            },
            error: {
              style: {
                background: '#F44336',
              },
            },
          }}
        />
      </body>
    </html>
  )
}