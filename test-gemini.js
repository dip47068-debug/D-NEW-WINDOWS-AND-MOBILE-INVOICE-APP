require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  try {
    const history = [
      { role: 'model', parts: [{ text: 'Hello!' }] },
      { role: 'user', parts: [{ text: 'Hi!' }] }
    ];
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: history,
    });
    console.log(response.text);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
run();
