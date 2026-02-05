import React from 'react'
import Header from '../components/Header'
import { Link } from 'react-router-dom'

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-md text-center p-6">
          <h2 className="text-xl font-semibold mb-3">Unauthorized</h2>
          <p className="text-gray-600 mb-4">You do not have permission to view this page.</p>
          <Link to="/" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded">Go home</Link>
        </div>
      </main>
    </div>
  )
}

export default Unauthorized