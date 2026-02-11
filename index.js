// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {TextGenerationClient, TextPrompt} from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Définir le port
const PORT = process.env.PORT || 10000;

// Créer le client Gemini
const client = new TextGenerationClient({
  apiKey: process.env.GEMINI_API_KEY
});

// Endpoint de test pour générer de la musique / texte
app.post("/generate", async (req, res) => {
  try {
    const {prompt} = req.body;
    if (!prompt) return res.status(400).json({error: "prompt manquant"});

    const response = await client.generateText({
      model: "gemini-text-1",
      prompt: new TextPrompt({text: prompt}),
      temperature: 0.7,
    });

    res.json({result: response.candidates[0].output});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: "Erreur serveur"});
  }
});

// Message pour confirmer que le backend est en ligne
app.listen(PORT, () => {
  console.log(`Backend Vichandy en ligne sur le port ${PORT}`);
});
