import React from 'react'
import Header from '../components/Header'
import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-md text-center p-8">
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
            <ShieldOff className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-3">Unauthorized</h2>
          <p className="text-neutral-500 mb-6">You do not have permission to view this page.</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors font-medium"
          >
            Go Home
          </Link>
        </div>
      </main>
    </div>
  )
}

export default Unauthorized