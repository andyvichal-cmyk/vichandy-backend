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

if (!process.env.GEMINI_API_KEY) {
  console.error("ERREUR : GEMINI_API_KEY est introuvable.");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const DEFAULT_MODEL = "gemini-3.5-flash-lite";

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

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

/* ============================================================
   INTERFACE VICHANDY STUDIO IA
============================================================ */

app.get("/test", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="fr">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>VichAndy Studio IA</title>

  <style>

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      background:
        radial-gradient(circle at top left, #302b63, transparent 35%),
        radial-gradient(circle at bottom right, #24243e, transparent 35%),
        #09090f;
      color: white;
      min-height: 100vh;
    }

    .app {
      max-width: 1100px;
      margin: auto;
      padding: 25px;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 20px 0 35px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .logo {
      width: 58px;
      height: 58px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      background: linear-gradient(135deg, #ff8a00, #e52e71);
      box-shadow: 0 10px 30px rgba(229, 46, 113, 0.35);
    }

    .brand h1 {
      margin: 0;
      font-size: 25px;
    }

    .brand p {
      margin: 4px 0 0;
      color: #aaa;
      font-size: 14px;
    }

    .badge {
      padding: 8px 14px;
      border-radius: 30px;
      background: rgba(255,255,255,0.08);
      color: #ccc;
      font-size: 13px;
    }

    .hero {
      text-align: center;
      padding: 35px 10px 40px;
    }

    .hero h2 {
      font-size: clamp(30px, 5vw, 58px);
      line-height: 1.1;
      margin: 0 auto 18px;
      max-width: 800px;
      background: linear-gradient(90deg, #ffffff, #ffb86c, #ff6b9d);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero p {
      color: #aaa;
      font-size: 17px;
      max-width: 650px;
      margin: auto;
      line-height: 1.6;
    }

    .creator {
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      backdrop-filter: blur(20px);
      border-radius: 25px;
      padding: 28px;
      box-shadow: 0 20px 70px rgba(0,0,0,0.3);
    }

    .section-title {
      font-size: 20px;
      margin-bottom: 18px;
    }

    textarea {
      width: 100%;
      min-height: 150px;
      resize: vertical;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 16px;
      padding: 18px;
      font-size: 16px;
      color: white;
      background: rgba(0,0,0,0.3);
      outline: none;
      line-height: 1.6;
    }

    textarea:focus {
      border-color: #ff7b8a;
    }

    .controls {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-top: 20px;
    }

    .control label {
      display: block;
      margin-bottom: 8px;
      color: #aaa;
      font-size: 13px;
    }

    select {
      width: 100%;
      padding: 14px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.15);
      background: #171722;
      color: white;
      font-size: 15px;
      outline: none;
    }

    .generate-button {
      width: 100%;
      margin-top: 25px;
      padding: 17px;
      border: none;
      border-radius: 14px;
      font-size: 17px;
      font-weight: bold;
      color: white;
      cursor: pointer;
      background: linear-gradient(90deg, #ff8a00, #e52e71);
      transition: transform 0.2s, opacity 0.2s;
    }

    .generate-button:hover {
      transform: translateY(-2px);
    }

    .generate-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .result-container {
      margin-top: 30px;
      display: none;
    }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      gap: 10px;
    }

    .result-header h3 {
      margin: 0;
    }

    .copy-button {
      padding: 9px 14px;
      border-radius: 9px;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.08);
      color: white;
      cursor: pointer;
    }

    .result {
      background: rgba(0,0,0,0.3);
      border-radius: 16px;
      padding: 22px;
      white-space: pre-wrap;
      line-height: 1.7;
      color: #eee;
      max-height: 700px;
      overflow-y: auto;
    }

    .loading {
      text-align: center;
      padding: 30px;
      color: #bbb;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-top: 25px;
    }

    .feature {
      padding: 20px;
      border-radius: 16px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
    }

    .feature strong {
      display: block;
      margin-bottom: 8px;
    }

    .feature span {
      color: #aaa;
      font-size: 14px;
      line-height: 1.5;
    }

    footer {
      text-align: center;
      padding: 35px 0 10px;
      color: #777;
      font-size: 13px;
    }

    @media (max-width: 750px) {

      .controls {
        grid-template-columns: 1fr;
      }

      .features {
        grid-template-columns: 1fr;
      }

      .header {
        align-items: flex-start;
      }

      .badge {
        display: none;
      }

      .creator {
        padding: 20px;
      }

    }

  </style>
</head>

<body>

  <div class="app">

    <header class="header">

      <div class="brand">

        <div class="logo">
          🎵
        </div>

        <div>
          <h1>VichAndy Studio</h1>
          <p>Imagine. Create. Inspire.</p>
        </div>

      </div>

      <div class="badge">
        ✨ Powered by AI
      </div>

    </header>

    <section class="hero">

      <h2>
        Transforme tes idées en musique.
      </h2>

      <p>
        Décris simplement la chanson que tu imagines.
        VichAndy Studio utilise l'intelligence artificielle
        pour donner vie à ta vision créative.
      </p>

    </section>

    <main class="creator">

      <div class="section-title">
        🎼 Décris la chanson que tu veux créer
      </div>

      <textarea
        id="idea"
        placeholder="Exemple : Je veux une chanson gospel sur la victoire après une période difficile. Je veux que la chanson soit puissante, émouvante et pleine d'espoir..."
      ></textarea>

      <div class="controls">

        <div class="control">

          <label for="style">
            🎶 Style musical
          </label>

          <select id="style">

            <option>Gospel</option>
            <option>Afrobeat</option>
            <option>Afropop</option>
            <option>R&B</option>
            <option>Rap</option>
            <option>Hip-Hop</option>
            <option>Pop</option>
            <option>Reggae</option>
            <option>Worship</option>
            <option>Jazz</option>

          </select>

        </div>

        <div class="control">

          <label for="language">
            🌍 Langue
          </label>

          <select id="language">

            <option>Français</option>
            <option>English</option>
            <option>Español</option>
            <option>Português</option>

          </select>

        </div>

        <div class="control">

          <label for="mood">
            🔥 Ambiance
          </label>

          <select id="mood">

            <option>Puissante</option>
            <option>Émotionnelle</option>
            <option>Joyeuse</option>
            <option>Inspirante</option>
            <option>Romantique</option>
            <option>Sombre</option>
            <option>Énergique</option>

          </select>

        </div>

      </div>

      <button
        class="generate-button"
        id="generateButton"
        onclick="generateSong()"
      >
        ✨ CRÉER MA CHANSON
      </button>

      <div
        class="result-container"
        id="resultContainer"
      >

        <div class="result-header">

          <h3>
            🎵 Ta création
          </h3>

          <button
            class="copy-button"
            onclick="copyResult()"
          >
            📋 Copier
          </button>

        </div>

        <div
          class="result"
          id="result"
        ></div>

      </div>

    </main>

    <section class="features">

      <div class="feature">

        <strong>
          💡 Ton idée
        </strong>

        <span>
          Commence avec une simple inspiration.
        </span>

      </div>

      <div class="feature">

        <strong>
          🤖 Intelligence artificielle
        </strong>

        <span>
          L'IA développe ta vision créative.
        </span>

      </div>

      <div class="feature">

        <strong>
          🎵 Ta création
        </strong>

        <span>
          Découvre une chanson créée à partir de ton idée.
        </span>

      </div>

    </section>

    <footer>
      © 2026 VichAndy Studio — Imagine. Create. Inspire.
    </footer>

  </div>

  <script>

    async function generateSong() {

      const idea =
        document.getElementById("idea").value.trim();

      const style =
        document.getElementById("style").value;

      const language =
        document.getElementById("language").value;

      const mood =
        document.getElementById("mood").value;

      const button =
        document.getElementById("generateButton");

      const resultContainer =
        document.getElementById("resultContainer");

      const result =
        document.getElementById("result");

      if (!idea) {

        alert(
          "Décris d'abord la chanson que tu veux créer."
        );

        return;

      }

      const prompt = `

Tu es un auteur-compositeur professionnel et un directeur artistique musical.

Crée une chanson originale complète à partir des informations suivantes :

IDÉE DE L'UTILISATEUR :
${idea}

STYLE MUSICAL :
${style}

LANGUE :
${language}

AMBIANCE :
${mood}

La chanson doit être originale, cohérente, émotionnelle et adaptée au style choisi.

Structure obligatoirement la chanson avec :

1. TITRE
2. STYLE MUSICAL
3. INTRODUCTION
4. COUPLET 1
5. PRÉ-REFRAIN si nécessaire
6. REFRAIN
7. COUPLET 2
8. PONT
9. REFRAIN FINAL
10. OUTRO

Ajoute également des indications entre parenthèses pour décrire l'énergie musicale, les instruments et l'évolution de la chanson.

Réponds uniquement avec la création musicale complète.
`;

      button.disabled = true;

      button.innerText =
        "⏳ CRÉATION EN COURS...";

      resultContainer.style.display =
        "block";

      result.innerHTML = `
        <div class="loading">
          🎼 VichAndy Studio imagine ta création...
          <br><br>
          ✨ Composition des paroles en cours...
        </div>
      `;

      try {

        const response =
          await fetch("/generate", {

            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({
              prompt: prompt
            })

          });

        const data =
          await response.json();

        if (data.success) {

          result.innerText =
            data.result;

        } else {

          result.innerText =
            "Erreur : " + data.error;

        }

      } catch (error) {

        result.innerText =
          "Erreur de connexion au serveur : "
          + error.message;

      }

      button.disabled = false;

      button.innerText =
        "✨ CRÉER MA CHANSON";

    }

    function copyResult() {

      const text =
        document.getElementById("result").innerText;

      navigator.clipboard.writeText(text);

      alert(
        "Création copiée avec succès !"
      );

    }

  </script>

</body>

</html>
  `);
});

/* ============================================================
   API DE GÉNÉRATION
============================================================ */

app.post("/generate", async (req, res) => {

  try {

    const {
      prompt,
      modelName
    } = req.body;

    if (!prompt) {

      return res.status(400).json({

        success: false,

        error: "Prompt manquant"

      });

    }

    const model =
      modelName || DEFAULT_MODEL;

    const response =
      await generateWithRetry(
        prompt,
        model
      );

    res.json({

      success: true,

      model: model,

      result: response.text

    });

  } catch (error) {

    console.error(
      "ERREUR GEMINI :",
      error
    );

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});

/* ============================================================
   TEST GEMINI
============================================================ */

app.get("/list-models", async (req, res) => {

  try {

    const response =
      await generateWithRetry(

        "Réponds uniquement par : Connexion Gemini réussie",

        DEFAULT_MODEL

      );

    res.json({

      success: true,

      model: DEFAULT_MODEL,

      message: response.text

    });

  } catch (error) {

    console.error(
      "ERREUR DE CONNEXION GEMINI :",
      error
    );

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});

/* ============================================================
   ROUTE PRINCIPALE
============================================================ */

app.get("/", (req, res) => {

  res.send(
    "API Gemini opérationnelle 🚀"
  );

});

/* ============================================================
   DÉMARRAGE DU SERVEUR
============================================================ */

app.listen(PORT, () => {

  console.log(
    `Backend Vichandy en ligne sur le port ${PORT}`
  );

});
