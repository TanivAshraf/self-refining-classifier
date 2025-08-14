import { kv } from '@vercel/kv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createHash } from 'crypto';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

function robustJSONParse(rawText) {
  const startIndex = rawText.indexOf('{');
  const endIndex = rawText.lastIndexOf('}');
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error("Could not find a valid JSON object in the AI's response.");
  }
  const jsonString = rawText.substring(startIndex, endIndex + 1);
  return JSON.parse(jsonString);
}

export async function POST(request) {
  try {
    const { textToClassify, categories } = await request.json();
    if (!textToClassify || !categories) {
      return new Response(JSON.stringify({ error: "Text and categories are required." }), { status: 400 });
    }

    // --- Step A: Initial Classification & Justification ---
    console.log("Step A: Performing initial classification...");
    const classifierPrompt = `You are a text classification AI. Read the following text and categorize it into ONE of the provided categories. Then, provide a brief, simple justification for your choice.
    
    Text: "${textToClassify}"
    Categories: "${categories}"
    
    Respond ONLY with a JSON object with the keys "category" and "initial_justification".`;
    
    const initialResult = await model.generateContent(classifierPrompt);
    const initialAnalysis = robustJSONParse(initialResult.response.text());
    const { category, initial_justification } = initialAnalysis;

    // --- Step B: Self-Refinement ---
    console.log("Step B: Performing self-refinement...");
    const criticPrompt = `You are a senior analyst responsible for quality control. An AI assistant just made the following classification and provided a justification. Your task is to critique and improve the justification. Make it more concise, professional, and directly tied to specific phrases in the source text.
    
    Original Text: "${textToClassify}"
    Initial Classification: "${category}"
    Initial Justification: "${initial_justification}"
    
    Respond ONLY with a JSON object with one key, "refined_justification".`;

    const criticResult = await model.generateContent(criticPrompt);
    const criticAnalysis = robustJSONParse(criticResult.response.text());
    const { refined_justification } = criticAnalysis;

    // --- Combine and Log Results ---
    const finalResult = {
      category,
      initial_justification,
      refined_justification
    };

    const logKey = `classification:${createHash('sha256').update(textToClassify + categories).digest('hex')}`;
    await kv.set(logKey, finalResult); // Use set instead of lpush for simple key-value logging
    console.log("Logged classification result.");

    return new Response(JSON.stringify(finalResult), { status: 200 });

  } catch (error) {
    console.error("An error occurred during classification:", error);
    return new Response(JSON.stringify({ error: error.message || "An internal server error occurred." }), { status: 500 });
  }
}
