// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Initialisation du client Gemini avec ta clé API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Endpoint pour générer du texte/chanson
app.post("/generate", async (req, res) => {
  try {
    const { prompt, modelName } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt manquant" });
    }

    if (!modelName) {
      return res.status(400).json({ error: "Nom du modèle manquant. Utilisez /list-models pour voir les modèles disponibles." });
    }

    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ result: text });
  } catch (error) {
    console.error("ERREUR GEMINI :", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Endpoint pour lister les modèles disponibles
app.get("/list-models", async (req, res) => {
  try {
    const models = await genAI.listModels();
    res.json({ models });
  } catch (error) {
    console.error("Erreur listModels :", error);
    res.status(500).json({ error: error.message });
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
