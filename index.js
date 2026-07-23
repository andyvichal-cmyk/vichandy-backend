// index.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Vérification de la présence de la clé API
if (!process.env.GEMINI_API_KEY) {
  console.error("ERREUR : GEMINI_API_KEY est introuvable.");
}

// Initialisation du client Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Modèle Gemini utilisé par défaut
const DEFAULT_MODEL = "gemini-3.5-flash";

// Endpoint pour générer du contenu
app.post("/generate", async (req, res) => {
  try {
    const { prompt, modelName } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt manquant"
      });
    }

    const model = modelName || DEFAULT_MODEL;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt
    });

    res.json({
      success: true,
      model: model,
      result: response.text
    });

  } catch (error) {
    console.error("ERREUR GEMINI :", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint de test de connexion à Gemini
app.get("/list-models", async (req, res) => {
  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: "Réponds uniquement par : Connexion Gemini réussie"
    });

    res.json({
      success: true,
      model: DEFAULT_MODEL,
      message: response.text
    });

  } catch (error) {
    console.error("ERREUR DE CONNEXION GEMINI :", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint racine pour vérifier que le serveur fonctionne
app.get("/", (req, res) => {
  res.send("API Gemini opérationnelle 🚀");
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Backend Vichandy en ligne sur le port ${PORT}`);
});
