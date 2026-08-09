import { GoogleGenAI } from "@google/genai";
async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    console.log(`Testing gemini-3.6-flash...`);
    await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: "Hello",
    });
    console.log(`✅ gemini-3.6-flash works!`);
  } catch (e: any) {
    console.error(`❌ gemini-3.6-flash failed: ${e.message}`);
  }
}
run();
