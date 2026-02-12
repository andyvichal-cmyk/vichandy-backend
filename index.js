// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "@google/generative-ai";

const { TextGenerationClient, TextPrompt } = pkg;

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Crée le client Gemini avec ta clé API depuis Render Environment Variables
const client = new TextGenerationClient({
  apiKey: process.env.GEMINI_API_KEY
});

const PORT = process.env.PORT || 10000;

// Endpoint pour générer des chansons
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt manquant" });
    }

    const response = await client.generateText({
      model: "text-bison-001",
      prompt: new TextPrompt({ text: prompt }),
      temperature: 0.7,
      maxOutputTokens: 500
    });

    res.json({ result: response.candidates[0].content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la génération du texte" });
  }
});

app.get("/", (req, res) => {
  res.send("Backend Vichandy en ligne ✅");
});

app.listen(PORT, () => {
  console.log(`Backend Vichandy en ligne sur le port ${PORT}`);
});
