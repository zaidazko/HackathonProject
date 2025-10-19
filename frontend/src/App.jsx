import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import FurnitureDemo from './pages/FurnitureDemo.jsx';

const App = () => {
  return (
    <Router>
      <nav className="bg-indigo-600 shadow-md px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Room Modeler</h1>
        <div className="space-x-6">
          <Link
            to="/"
            className="text-white hover:text-[#79EBFC] transition-colors duration-200"
          >
            Home
          </Link>
          <Link
            to="/gallery"
            className="text-white hover:text-[#79EBFC] transition-colors duration-200"
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