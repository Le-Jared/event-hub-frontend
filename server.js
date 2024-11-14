import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Configure multer for handling file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); 

// Helper function to convert file to GenerativePart
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

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
    throw error;
  }
}

async function generateImageBasedContent(imagePath, prompt, mimeType) {
  try {
    const imagePart = fileToGenerativePart(imagePath, mimeType);
    const result = await model.generateContent([prompt, imagePart]);
    return result.response.text();
  } catch (error) {
    console.error("Error generating image-based content:", error);
    throw error;
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
    console.error("Error in /generate-ai:", error);
    res.status(500).json({ error: "Failed to generate AI content" });
  }
});

app.post('/generate-with-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const imagePath = req.file.path;
    const mimeType = req.file.mimetype;

    const aiResponse = await generateImageBasedContent(imagePath, prompt, mimeType);

    fs.unlinkSync(imagePath);

    res.json({ response: aiResponse });
  } catch (error) {
    console.error("Error in /generate-with-image:", error);
    res.status(500).json({ error: "Failed to generate content from image" });
  }
});

// Optional: Endpoint to handle multiple images
app.post('/generate-with-multiple-images', upload.array('images', 3), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const imageParts = req.files.map(file => 
      fileToGenerativePart(file.path, file.mimetype)
    );

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = result.response.text();

    req.files.forEach(file => fs.unlinkSync(file.path));

    res.json({ response });
  } catch (error) {
    console.error("Error in /generate-with-multiple-images:", error);
    res.status(500).json({ error: "Failed to generate content from images" });
  }
});

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
