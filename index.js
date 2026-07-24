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
   INTERFACE VICHANDY STUDIO IA (V2 - STUDIO PRO)
============================================================ */

app.get("/test", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VichAndy Studio IA - Pro</title>
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
      padding: 20px 10px 30px;
    }

    .hero h2 {
      font-size: clamp(28px, 4.5vw, 52px);
      line-height: 1.1;
      margin: 0 auto 14px;
      max-width: 800px;
      background: linear-gradient(90deg, #ffffff, #ffb86c, #ff6b9d);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero p {
      color: #aaa;
      font-size: 16px;
      max-width: 650px;
      margin: auto;
      line-height: 1.5;
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
      font-size: 19px;
      margin-bottom: 16px;
      font-weight: bold;
    }

    textarea {
      width: 100%;
      min-height: 130px;
      resize: vertical;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 16px;
      padding: 16px;
      font-size: 15px;
      color: white;
      background: rgba(0,0,0,0.3);
      outline: none;
      line-height: 1.6;
    }

    textarea:focus {
      border-color: #ff7b8a;
    }

    .controls-grid {
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
      padding: 13px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.15);
      background: #171722;
      color: white;
      font-size: 14px;
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

    @media (max-width: 850px) {
      .controls-grid { grid-template-columns: 1fr; }
      .features { grid-template-columns: 1fr; }
      .header { align-items: flex-start; }
      .badge { display: none; }
      .creator { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="app">
    <header class="header">
      <div class="brand">
        <div class="logo">🎵</div>
        <div>
          <h1>VichAndy Studio</h1>
          <p>Imagine. Create. Inspire.</p>
        </div>
      </div>
      <div class="badge">🎹 Studio de Production IA Pro</div>
    </header>

    <section class="hero">
      <h2>Direction Artistique & Composition Pro</h2>
      <p>
        Configure ton morceau dans les moindres détails : style, tempo, instruments et type de voix.
      </p>
    </section>

    <main class="creator">
      <div class="section-title">💡 Thème ou histoire de la chanson</div>
      <textarea id="idea" placeholder="Exemple : Une chanson de victoire et d'espoir après avoir surmonté les difficultés de la vie..."></textarea>

      <div class="controls-grid">
        <div class="control">
          <label for="style">🎶 Style Musical</label>
          <select id="style">
            <option>Gospel Modern</option>
            <option>Afrobeat / Afropop</option>
            <option>Amapiano</option>
            <option>R&B Soul</option>
            <option>Rap / Trap</option>
            <option>Slam & Poésie</option>
            <option>Reggae / Dancehall</option>
            <option>Worship & Louange</option>
            <option>Pop / Variété</option>
            <option>Jazz / Blues</option>
          </select>
        </div>

        <div class="control">
          <label for="voice">🎤 Type de Voix & Chant</label>
          <select id="voice">
            <option>Voix Masculine Puissante</option>
            <option>Voix Féminine Douce & Émotionnelle</option>
            <option>Duo Masculin / Féminin</option>
            <option>Chorale Gospel & Lead Solo</option>
            <option>Voix Rap / Flow Rapide</option>
            <option>Voix Grave & Warm</option>
          </select>
        </div>

        <div class="control">
          <label for="tempo">⏱️ Tempo & Dynamique (BPM)</label>
          <select id="tempo">
            <option>Lent / Ballade Émotionnelle (60-80 BPM)</option>
            <option>Médium / Groove Posé (90-110 BPM)</option>
            <option>Rapide / Énergique (115-130 BPM)</option>
            <option>Très Rapide / Club & Afrobeat (135+ BPM)</option>
          </select>
        </div>

        <div class="control">
          <label for="instruments">🎸 Instrumentation Clé</label>
          <select id="instruments">
            <option>Piano Acoustique & Cordes Orchestrales</option>
            <option>Cuivres Afrobeat & Percursions Lourd</option>
            <option>Guitare Acoustique & Basse Round</option>
            <option>Synthétiseurs & Drums Trap 808</option>
            <option>Kora, Balafon & Percussions Traditionnelles</option>
            <option>Guitare Électrique Solo & Orgue</option>
          </select>
        </div>

        <div class="control">
          <label for="language">🌍 Langue</label>
          <select id="language">
            <option>Français</option>
            <option>Français + Lingala / Fang (Mix)</option>
            <option>English</option>
            <option>Español</option>
            <option>Português</option>
          </select>
        </div>

        <div class="control">
          <label for="mood">🔥 Ambiance & Émotion</label>
          <select id="mood">
            <option>Triomphante & Victorieuse</option>
            <option>Mélancolique & Profonde</option>
            <option>Festive & Dansante</option>
            <option>Inspirante & Motivante</option>
            <option>Romantique & Envoûtante</option>
          </select>
        </div>
      </div>

      <button class="generate-button" id="generateButton" onclick="generateSong()">
        ✨ PRODUIRE MA CHANSON & PROMPTS
      </button>

      <div class="result-container" id="resultContainer">
        <div class="result-header">
          <h3>🎵 Direction Artistique & Paroles</h3>
          <button class="copy-button" onclick="copyResult()">📋 Copier Tout</button>
        </div>
        <div class="result" id="result"></div>
      </div>
    </main>

    <section class="features">
      <div class="feature">
        <strong>🎼 Paroles Synchronisées</strong>
        <span>Structure professionnelle pré-balisée ([Intro], [Chorus], [Bridge]).</span>
      </div>
      <div class="feature">
        <strong>🎧 Direction d'Arrangement</strong>
        <span>Indications d'instruments, de tempo et d'évolutions de la voix.</span>
      </div>
      <div class="feature">
        <strong>🚀 Prompt Suno / Udio prêt</strong>
        <span>Balises techniques prêtes à être injectées pour générer la vraie musique.</span>
      </div>
    </section>

    <footer>
      © 2026 VichAndy Studio — Direction Artistique & Production IA
    </footer>
  </div>

  <script>
    async function generateSong() {
      const idea = document.getElementById("idea").value.trim();
      const style = document.getElementById("style").value;
      const voice = document.getElementById("voice").value;
      const tempo = document.getElementById("tempo").value;
      const instruments = document.getElementById("instruments").value;
      const language = document.getElementById("language").value;
      const mood = document.getElementById("mood").value;

      const button = document.getElementById("generateButton");
      const resultContainer = document.getElementById("resultContainer");
      const result = document.getElementById("result");

      if (!idea) {
        alert("Décris d'abord le thème ou l'histoire de la chanson.");
        return;
      }

      const prompt = \`
Tu es un directeur artistique musical de renom et un auteur-compositeur professionnel.

Crée un projet musical complet et professionnel basé sur ces caractéristiques :

THÈME / HISTOIRE : \${idea}
STYLE MUSICAL : \${style}
TYPE DE VOIX : \${voice}
TEMPO & DYNAMIQUE : \${tempo}
INSTRUMENTS CLÉS : \${instruments}
LANGUE : \${language}
AMBIANCE : \${mood}

GÉNÈRE UNE RÉPONSE DANS LA STRUCTURE SUIVANTE EXACTE :

---
1. 📌 FICHE TECHNIQUE DU MORCEAU
- Titre proposé :
- Style & Sub-genres :
- Tempo recommandé :
- Ambiance sonore :
- Configuration vocale :

2. 🚀 PROMPT OPTIMISÉ POUR IA MUSICALE (SUNO / UDIO)
(Donne une ligne de tags synthétiques en anglais prête à copier-coller dans Suno ou Udio, ex: [Gospel, Male vocal, Piano, Orchestral, 75 bpm, Emotional, Powerful])

3. 🎼 PAROLES COMPLÈTES ET ARRANGEMENTS
Rédige les paroles complètes du morceau avec des balises de structure claires entre crochets :
- [Intro] (avec annotations d'instruments entre parenthèses)
- [Couplet 1]
- [Pré-Refrain]
- [Refrain] (Le moment fort)
- [Couplet 2]
- [Pont / Bridge] (L'apogée émotionnelle)
- [Refrain Final]
- [Outro]
---
\`;

      button.disabled = true;
      button.innerText = "⏳ PRODUCTION EN COURS...";
      resultContainer.style.display = "block";
      result.innerHTML = \`
        <div class="loading">
          🎼 VichAndy Studio orchestre ta création...<br><br>
          ✨ Génération de la fiche technique, du prompt Suno/Udio et des paroles...
        </div>
      \`;

      try {
        const response = await fetch("/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ prompt: prompt })
        });

        const data = await response.json();

        if (data.success) {
          result.innerText = data.result;
        } else {
          result.innerText = "Erreur : " + data.error;
        }
      } catch (error) {
        result.innerText = "Erreur de connexion au serveur : " + error.message;
      }

      button.disabled = false;
      button.innerText = "✨ PRODUIRE MA CHANSON & PROMPTS";
    }

    function copyResult() {
      const text = document.getElementById("result").innerText;
      navigator.clipboard.writeText(text);
      alert("Création copiée avec succès !");
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

/* ============================================================
   TEST DE CONNEXION GEMINI
============================================================ */

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

/* ============================================================
   ROUTE PRINCIPALE
============================================================ */

app.get("/", (req, res) => {
  res.send("API Gemini opérationnelle 🚀");
});

/* ============================================================
   DÉMARRAGE DU SERVEUR
============================================================ */

app.listen(PORT, () => {
  console.log(`Backend Vichandy en ligne sur le port ${PORT}`);
});
