'use client'

import { useState } from 'react'
import { Users, Calendar, QrCode, Search, FileText, Database } from 'lucide-react'
import ParticipantTab from './components/ParticipantTab'
import SessionTab from './components/SessionTab'
import ScanTab from './components/ScanTab'
import SearchTab from './components/SearchTab'
import ReportTab from './components/ReportTab'

const tabs = [
  { id: 'participants', name: 'Input Data Muda-Mudi', icon: Users },
  { id: 'sessions', name: 'Manajemen Kegiatan', icon: Calendar },
  { id: 'scan', name: 'Scan QR Absensi', icon: QrCode },
  { id: 'search', name: 'Pencarian Data', icon: Search },
  { id: 'reports', name: 'Laporan', icon: FileText },
]

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('participants')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'participants':
        return <ParticipantTab />
      case 'sessions':
        return <SessionTab />
      case 'scan':
        return <ScanTab />
      case 'search':
        return <SearchTab />
      case 'reports':
        return <ReportTab />
      default:
        return <ParticipantTab />
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  )
}