"use client";

import { useState } from "react";

interface ClassificationResult {
  category: string;
  initial_justification: string;
  refined_justification: string;
}

export default function HomePage() {
  const [textToClassify, setTextToClassify] = useState("My internet has been down for three days and your support line just keeps hanging up on me. I want to cancel my service and get a full refund for this month.");
  const [categories, setCategories] = useState("Billing Issue, Technical Problem, Sales Inquiry, Positive Feedback");
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClassify = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textToClassify, categories }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "An unknown error occurred.");
      }
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-gray-100">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-center">Self-Refining Zero-Shot Classifier</h1>
        <p className="mt-2 text-center text-gray-600">An AI that Classifies, Justifies, and Improves its Own Reasoning.</p>

        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
          <div>
            <label htmlFor="text-input" className="block text-lg font-medium text-gray-700">Text to Classify:</label>
            <textarea
              id="text-input"
              value={textToClassify}
              onChange={(e) => setTextToClassify(e.target.value)}
              className="w-full h-32 mt-2 p-3 font-mono text-sm border rounded-md"
            />
          </div>
          <div className="mt-4">
            <label htmlFor="categories-input" className="block text-lg font-medium text-gray-700">Categories (comma-separated):</label>
            <input
              id="categories-input"
              type="text"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              className="w-full mt-2 p-3 font-mono text-sm border rounded-md"
            />
          </div>
          <button onClick={handleClassify} disabled={isLoading} className="w-full mt-4 px-4 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400">
            {isLoading ? "Classifying..." : "Classify and Refine"}
          </button>
        </div>

        {error && <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">{error}</div>}

        {result && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-center mb-4">Classification Result</h2>
            <div className="p-6 bg-white rounded-lg shadow-md border">
              <p className="text-lg"><strong>Final Category:</strong> <span className="font-semibold text-blue-700">{result.category}</span></p>
              
              <div className="grid md:grid-cols-2 gap-6 mt-4 pt-4 border-t">
                <div>
                  <h3 className="font-semibold text-gray-800">Initial Justification:</h3>
                  <p className="mt-2 p-3 bg-gray-50 rounded-md italic text-gray-700">{result.initial_justification}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Refined Justification:</h3>
                  <p className="mt-2 p-3 bg-green-50 rounded-md font-medium text-gray-900">{result.refined_justification}</p>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </main>
  );
}
