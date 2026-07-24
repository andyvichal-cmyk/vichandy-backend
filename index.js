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

// Fonction pour attendre avant une nouvelle tentative
function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

// Fonction de génération avec plusieurs tentatives automatiques
async function generateWithRetry(prompt, model, maxAttempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt
      });

      return response;

    } catch (error) {
      lastError = error;

      console.error(
        `Tentative ${attempt}/${maxAttempts} échouée :`,
        error.message
      );

      const errorMessage = error.message || "";

      const temporaryError =
        errorMessage.includes("503") ||
        errorMessage.includes("UNAVAILABLE") ||
        errorMessage.includes("high demand") ||
        errorMessage.includes("429") ||
        errorMessage.includes("RESOURCE_EXHAUSTED");

      if (!temporaryError || attempt === maxAttempts) {
        throw error;
      }

      await wait(attempt * 5000);
    }
  }

  throw lastError;
}

// Interface web VichAndy Studio IA
app.get("/test", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>VichAndy Studio IA</title>

      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f4f6f8;
          margin: 0;
          padding: 20px;
        }

        .container {
          max-width: 700px;
          margin: auto;
          background: white;
          padding: 25px;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        h1 {
          text-align: center;
          color: #222;
        }

        p {
          text-align: center;
          color: #666;
        }

        textarea {
          width: 100%;
          height: 150px;
          padding: 15px;
          font-size: 16px;
          border: 1px solid #ccc;
          border-radius: 10px;
          resize: vertical;
          box-sizing: border-box;
        }

        button {
          width: 100%;
          margin-top: 15px;
          padding: 15px;
          font-size: 17px;
          border: none;
          border-radius: 10px;
          background: #222;
          color: white;
          cursor: pointer;
        }

        button:hover {
          opacity: 0.85;
        }

        button:disabled {
          background: #999;
          cursor: not-allowed;
        }

        #result {
          margin-top: 25px;
          padding: 20px;
          background: #f1f1f1;
          border-radius: 10px;
          white-space: pre-wrap;
          line-height: 1.6;
        }

        .loading {
          color: #666;
          font-style: italic;
        }
      </style>
    </head>

    <body>
      <div class="container">
        <h1>🎵 VichAndy Studio IA</h1>

        <p>
          Génère les paroles d'une chanson à partir d'une idée.
        </p>

        <textarea
          id="prompt"
          placeholder="Exemple : Crée une chanson gospel moderne sur le thème de l'espoir et de la victoire..."
        ></textarea>

        <button id="generateButton" onclick="generateSong()">
          🎶 Générer ma chanson
        </button>

        <div id="result">
          Le résultat apparaîtra ici...
        </div>
      </div>

      <script>
        async function generateSong() {
          const prompt = document.getElementById("prompt").value;
          const button = document.getElementById("generateButton");
          const result = document.getElementById("result");

          if (!prompt.trim()) {
            result.innerText = "Veuillez entrer une idée de chanson.";
            return;
          }

          button.disabled = true;
          button.innerText = "⏳ Génération en cours...";
          result.innerHTML = '<div class="loading">Gemini est en train de créer votre chanson...</div>';

          try {
            const response = await fetch("/generate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                prompt: prompt
              })
            });

            const data = await response.json();

            if (data.success) {
              result.innerText = data.result;
            } else {
              result.innerText = "Erreur : " + data.error;
            }

          } catch (error) {
            result.innerText =
              "Erreur de connexion au serveur : " + error.message;
          }

          button.disabled = false;
          button.innerText = "🎶 Générer ma chanson";
        }
      </script>
    </body>
    </html>
  `);
});

// Endpoint pour générer du contenu avec Gemini
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

    const response = await generateWithRetry(prompt, model);

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
    const response = await generateWithRetry(
      "Réponds uniquement par : Connexion Gemini réussie",
      DEFAULT_MODEL
    );

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

// Endpoint racine
app.get("/", (req, res) => {
  res.send("API Gemini opérationnelle 🚀");
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Backend Vichandy en ligne sur le port ${PORT}`);
});
