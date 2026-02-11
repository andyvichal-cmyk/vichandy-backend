import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { TextGenerationClient, TextPrompt } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Créer le client Gemini
const client = new TextGenerationClient({
  apiKey: process.env.GEMINI_API_KEY
});

// Endpoint pour générer une chanson à partir du texte
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Le champ prompt est requis" });
    }

    const response = await client.generateText({
      model: "text-bison-001",
      prompt: new TextPrompt({ text: prompt }),
      maxOutputTokens: 500
    });

    const output = response?.candidates?.[0]?.output || "";
    res.json({ result: output });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la génération" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend Vichandy en ligne sur le port ${PORT}`);
});
