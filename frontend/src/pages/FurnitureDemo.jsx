import React from "react";
import FurnitureGenerator from "../components/FurnitureGenerator.jsx";

const FurnitureDemo = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Furniture Generator Demo
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This is a separate component that demonstrates how to connect to the
            backend furniture generation API without modifying the existing
            Home.jsx file.
          </p>
        </div>

        <FurnitureGenerator />

        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            How to Use This:
          </h3>
          <ol className="text-blue-700 space-y-1">
            <li>1. Make sure your backend server is running on port 3000</li>
            <li>2. Click "Test Backend Connection" to verify the connection</li>
            <li>3. Fill in the form with your room preferences</li>
            <li>4. Click "Generate Furniture Recommendations"</li>
            <li>5. View the AI-generated furniture list and search queries</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default FurnitureDemo;
