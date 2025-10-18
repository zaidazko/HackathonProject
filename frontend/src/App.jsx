import React, { useState } from 'react'
import Home from '../src/pages/Home.jsx'
import FurnitureDemo from '../src/pages/FurnitureDemo.jsx'

const App = () => {
  const [currentPage, setCurrentPage] = useState('home')

  const renderPage = () => {
    switch (currentPage) {
      case 'furniture-demo':
        return <FurnitureDemo />
      default:
        return <Home />
    }
  }

  return (
    <div>
      {/* Simple Navigation */}
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Hackathon Project</h1>
          <div className="space-x-4">
            <button 
              onClick={() => setCurrentPage('home')}
              className={`px-4 py-2 rounded ${currentPage === 'home' ? 'bg-blue-800' : 'bg-blue-500 hover:bg-blue-700'}`}
            >
              Home
            </button>
            <button 
              onClick={() => setCurrentPage('furniture-demo')}
              className={`px-4 py-2 rounded ${currentPage === 'furniture-demo' ? 'bg-blue-800' : 'bg-blue-500 hover:bg-blue-700'}`}
            >
              Furniture Demo
            </button>
          </div>
        </div>
      </nav>
      
      {/* Page Content */}
      {renderPage()}
    </div>
  )
}

export default App
