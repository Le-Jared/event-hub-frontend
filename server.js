import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function generateAIContent(prompt) {
  try {
    const contextPrompt = `As a helpful AI assistant, please respond to: ${prompt}
    Keep the response concise and natural, as it will be converted to speech.`;
    
    const result = await model.generateContent(contextPrompt);
    const response = result.response.text();

    return response
      .replace(/\*\*/g, '') 
      .replace(/\n\n/g, ' ') 
      .replace(/\n/g, ' ') 
      .trim();
  } catch (error) {
    console.error("Error generating AI content:", error);
    return "I apologize, but I encountered an error while processing your request. Could you please try again?";
  }
}

app.post('/generate-ai', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }
  
  try {
    const aiResponse = await generateAIContent(prompt);
    res.json({ response: aiResponse });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate AI content" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

