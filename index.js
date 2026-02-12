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

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt manquant" });
    }

    // Modèle compatible
    const model = genAI.getGenerativeModel({ model: "text-bison-001" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ result: text });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Erreur lors de la génération du texte" });
  }
});

app.get("/", (req, res) => {
  res.send("Backend Vichandy en ligne ✅");
});

app.listen(PORT, () => {
  console.log(`Backend Vichandy en ligne sur le port ${PORT}`);
});
