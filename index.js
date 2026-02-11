import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "@google/generative-ai";

const { TextGenerationClient, TextPrompt } = pkg;

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new TextGenerationClient({
  apiKey: process.env.GEMINI_API_KEY
});

app.get("/", (req, res) => {
  res.send("Backend Vichandy en ligne ✅");
});

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await client.generateText({
      model: "text-bison-001",
      prompt: prompt,
      temperature: 0.7,
      maxOutputTokens: 256
    });

    res.json({ result: response.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la génération de texte" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Backend Vichandy en ligne sur le port ${PORT}`);
});
