// index.js - Backend simple pour Vichandy Studio IA
// Reçoit un texte, appelle Gemini API et renvoie la chanson générée

const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch"); // pour appeler l'API Gemini
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(bodyParser.json());
app.use(cors());

// Route test simple
app.get("/", (req, res) => {
  res.send("Vichandy Backend en ligne ✅");
});

// Route pour générer la chanson
app.post("/generate-song", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Texte requis" });
  }

  try {
    const response = await fetch("https://api.generativeai.google/v1beta2/models/gemini-3-pro:generateText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        prompt: `Génère une chanson complète avec paroles, voix IA et instrumental à partir de ce texte : ${text}`,
        max_output_tokens: 1000
      })
    });

    const data = await response.json();

    // Renvoie la réponse brute pour l'instant
    res.json({ song: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.listen(port, () => {
  console.log(`Backend Vichandy en ligne sur le port ${port}`);
});
