# Frontend-Backend Integration

## Files Created

### 1. `furnitureService.js`
Service file that handles all backend communication:
- `generateFurniture(formData)` - Sends form data to backend for furniture generation
- `searchFurniture(query)` - Searches for furniture using SerpAPI
- `testConnection()` - Tests backend connectivity

### 2. `FurnitureGenerator.jsx`
Standalone component that demonstrates the integration:
- Form for room preferences (room type, style, budget)
- Button to test backend connection
- Button to generate furniture recommendations
- Display of results (image description, furniture list, search queries)

### 3. `FurnitureDemo.jsx`
Demo page that showcases the FurnitureGenerator component

## How to Use

1. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Navigate to Furniture Demo**:
   - Click "Furniture Demo" in the navigation
   - Test the backend connection
   - Fill in the form and generate furniture recommendations

## Integration with Existing Code

- **No changes made to `Home.jsx`** - Your teammate's work is untouched
- **Separate service layer** - All backend communication is isolated
- **Reusable components** - Can be imported into any existing component

## Example Usage in Other Components

```jsx
import { generateFurniture } from '../services/furnitureService.js';

const MyComponent = () => {
  const handleSubmit = async (formData) => {
    try {
      const results = await generateFurniture(formData);
      console.log(results.furnitureList);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  // ... rest of component
};
```

## API Endpoints Used

- `POST /generate-furniture` - Generate furniture recommendations
- `POST /search` - Search for furniture items
- `GET /` - Test server connection
