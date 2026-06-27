const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeMessage(message) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash"
        });

        const prompt = `
You are an AI meme recommendation assistant.

Analyze the following user message.

Return ONLY valid JSON.

Example:

{
  "emotion":"happy",
  "keywords":["pizza","food","hungry"]
}

User Message:
"${message}"
`;

        const result = await model.generateContent(prompt);

        let text = result.response.text();

        text = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        return JSON.parse(text);

    } catch (err) {
        console.error("Gemini Error:", err);
        throw err;
    }
}

module.exports = {
    analyzeMessage
};