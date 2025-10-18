import React, { useState } from 'react';
import { generateFurniture, searchFurniture, testConnection } from '../services/furnitureService.js';

const FurnitureGenerator = () => {
  const [formData, setFormData] = useState({
    room: 'living room',
    style: 'modern',
    budget: '5000'
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateFurniture = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await generateFurniture(formData);
      setResults(response);
      console.log('Furniture generation response:', response);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      const response = await testConnection();
      alert(`Connection successful: ${response.message}`);
    } catch (err) {
      alert(`Connection failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Furniture Generator</h2>
      
      {/* Test Connection Button */}
      <div className="mb-4">
        <button
          onClick={handleTestConnection}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Backend Connection
        </button>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Room Type
          </label>
          <select
            name="room"
            value={formData.room}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="living room">Living Room</option>
            <option value="bedroom">Bedroom</option>
            <option value="kitchen">Kitchen</option>
            <option value="dining room">Dining Room</option>
            <option value="office">Office</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Style
          </label>
          <select
            name="style"
            value={formData.style}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="modern">Modern</option>
            <option value="traditional">Traditional</option>
            <option value="minimalist">Minimalist</option>
            <option value="industrial">Industrial</option>
            <option value="scandinavian">Scandinavian</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget
          </label>
          <input
            type="number"
            name="budget"
            value={formData.budget}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter budget"
          />
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateFurniture}
        disabled={loading}
        className="w-full bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Generating Furniture...' : 'Generate Furniture Recommendations'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Results</h3>
          
          {/* Image Description */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Room Description:</h4>
            <p className="text-gray-700">{results.imageDescription}</p>
          </div>

          {/* Furniture List */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Furniture Recommendations ({results.furnitureList.length} items):</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.furnitureList.map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <h5 className="font-medium text-gray-800">{item.name}</h5>
                  <p className="text-sm text-gray-600">{item.type} • {item.color}</p>
                  <p className="text-sm text-gray-500">{item.dimensions}</p>
                  <p className="text-xs text-gray-400 mt-2">{item.material}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Search Queries */}
          <div>
            <h4 className="font-semibold mb-3">Search Queries Generated:</h4>
            <div className="space-y-2">
              {results.searchQueries.map((query, index) => (
                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm font-medium text-blue-800">{query.furniture.name}:</p>
                  <p className="text-xs text-blue-600 mt-1">{query.searchQuery}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FurnitureGenerator;
