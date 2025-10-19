import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import FurnitureDemo from './pages/FurnitureDemo.jsx';
import logo from '../images/Logo.png'; // ✅ correct path

const App = () => {
  return (
    <Router>
      <nav className="bg-indigo-600 shadow-md px-8 py-4 flex justify-between items-center">
        {/* Logo Section */}
        <Link to="/" className="flex items-center space-x-2">
          <img
            src={logo}
            alt="Room Modeler Logo"
            className="h-12 w-auto scale-90 transform origin-left object-contain"
          />
        </Link>

        {/* Navigation Links */}
        <div className="space-x-8">
          <Link
            to="/"
            className="text-white text-xl font-semibold hover:text-[#79EBFC] transition-colors duration-200"
          >
            Home
          </Link>
          <Link
            to="/gallery"
            className="text-white text-xl font-semibold hover:text-[#79EBFC] transition-colors duration-200"
          >
            Gallery
          </Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gallery" element={<FurnitureDemo />} />
      </Routes>
    </Router>
  );
};

export default App;
