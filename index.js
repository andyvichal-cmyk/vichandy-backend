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

// Initialisation Gemini avec clé API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Endpoint pour lister tous les modèles disponibles
app.get("/list-models", async (req, res) => {
  try {
    const models = await genAI.listModels();
    res.json(models);
  } catch (error) {
    console.error("ERREUR LIST-MODELS :", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint pour générer du texte
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt manquant" });
    }

    // Remplace "text-bison-001" par le modèle que tu auras récupéré via /list-models
    const model = genAI.getGenerativeModel({
      model: "text-bison-001"
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ result: text });

  } catch (error) {
    console.error("ERREUR GEMINI :", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint racine pour vérifier que le backend est en ligne
app.get("/", (req, res) => {
  res.send("Backend Vichandy en ligne ✅");
});

app.listen(PORT, () => {
  console.log(`Backend Vichandy en ligne sur le port ${PORT}`);
});
