# Simple Backend with Gemini AI + SerpAPI

A minimal Express server with Gemini AI and SerpAPI search integration.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file with your API keys:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   SERPAPI_KEY=your_serpapi_key_here
   PORT=3000
   ```

3. Get your API keys:

   - **Gemini API**: [Google AI Studio](https://makersuite.google.com/app/apikey)
   - **SerpAPI**: [SerpAPI Dashboard](https://serpapi.com/dashboard)

4. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Test Server

```bash
curl http://localhost:3000/
```

### Test Gemini AI

```bash
curl -X POST http://localhost:3000/test-gemini \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, how are you?"}'
```

### Test SerpAPI Search

```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "latest AI news"}'
```

## Project Structure

```
backend/
├── server.js          (72 lines - everything you need!)
├── package.json       (dependencies)
├── .env              (your API keys)
└── README.md         (this file)
```

That's it! Simple and clean. 🎉
