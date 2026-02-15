import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Route test
app.get("/", (req, res) => {
  res.send("Backend Vichandy en ligne ✅");
});

// 🔎 Route pour voir les modèles disponibles
app.get("/list-models", async (req, res) => {
  try {
    const models = await genAI.listModels();
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend Vichandy en ligne sur le port ${PORT}`);
});
