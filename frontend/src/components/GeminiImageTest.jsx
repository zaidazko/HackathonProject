import React, { useState } from "react";

const GeminiImageTest = () => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testImageGeneration = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log("Testing Gemini image generation with prompt:", prompt);

      const response = await fetch("http://localhost:3000/test-gemini-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      console.log("Test response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Test error:", errorData);

        if (response.status === 429) {
          const retryAfter = errorData.retryAfter || 60;
          throw new Error(
            `API quota exceeded. Please wait ${retryAfter} seconds before trying again. ${
              errorData.details || ""
            }`
          );
        }

        throw new Error(`Test failed: ${errorData.error || "Unknown error"}`);
      }

      const data = await response.json();
      console.log("Test result received:", data);

      if (data.success) {
        setResult(data);
      } else {
        throw new Error("Failed to generate test image");
      }
    } catch (err) {
      console.error("Test error:", err);
      setError(err.message || "Test failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-slate-200">
      <h3 className="text-lg font-semibold mb-4 text-slate-800">
        🧪 Test Imagen 3.0 AI Image Generation
      </h3>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="test-prompt"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Enter a prompt to generate an AI image:
          </label>
          <input
            id="test-prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A beautiful sunset over mountains, A cute cat wearing a hat, A modern living room"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          />
        </div>

        <button
          onClick={testImageGeneration}
          disabled={isLoading || !prompt.trim()}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Generating..." : "Generate Test Image"}
        </button>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
              <strong>Success!</strong> Image generated successfully.
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                Generated Image:
              </h4>
              <img
                src={result.imageUrl}
                alt={`Generated: ${result.prompt}`}
                className="w-full max-w-md mx-auto rounded-lg shadow-md"
              />
              <p className="text-xs text-slate-500 mt-2 text-center">
                Prompt: "{result.prompt}"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeminiImageTest;
