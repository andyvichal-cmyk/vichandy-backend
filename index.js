import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Initialisation Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Endpoint racine pour vérifier que le backend fonctionne
app.get("/", (req, res) => {
  res.send("Backend Vichandy en ligne ✅");
});

// Endpoint pour lister tous les modèles disponibles dans ton projet
app.get("/list-models", async (req, res) => {
  try {
    const models = await genAI.listModels();
    res.json(models);
  } catch (error) {
    console.error("ERREUR GEMINI :", error);
    res.status(500).json({ error: error.toString() });
  }
});

// Endpoint pour générer du texte/chansons à partir d'un prompt
// ⚠️ Remplace "NOM_DU_MODELE_VALIDE" par un modèle que tu trouves dans /list-models
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt manquant" });
    }

    const model = genAI.getGenerativeModel({
      model: "NOM_DU_MODELE_VALIDE" // <-- Remplacer par un modèle valide de la liste
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

app.listen(PORT, () => {
  console.log(`Backend Vichandy en ligne sur le port ${PORT}`);
});
