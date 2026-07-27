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
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
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
      console.error(`Tentative ${attempt}/${maxAttempts} échouée :`, error.message);

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
   INTERFACE VICHANDY STUDIO IA (V4 - MULTI-BOUTONS PRO)
============================================================ */

app.get("/test", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VichAndy Studio IA - Studio Créatif</title>
  <style>
    * { box-sizing: border-box; }

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

    .app { max-width: 1100px; margin: auto; padding: 25px; }

    .header {
      display: flex; align-items: center; justify-content: space-between;
      gap: 20px; padding: 20px 0 35px;
    }

    .brand { display: flex; align-items: center; gap: 14px; }

    .logo {
      width: 58px; height: 58px; border-radius: 18px;
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; background: linear-gradient(135deg, #ff8a00, #e52e71);
      box-shadow: 0 10px 30px rgba(229, 46, 113, 0.35);
    }

    .brand h1 { margin: 0; font-size: 25px; }
    .brand p { margin: 4px 0 0; color: #aaa; font-size: 14px; }

    .badge {
      padding: 8px 14px; border-radius: 30px;
      background: rgba(255,255,255,0.08); color: #ccc; font-size: 13px;
    }

    .hero { text-align: center; padding: 20px 10px 30px; }

    .hero h2 {
      font-size: clamp(28px, 4.5vw, 52px); line-height: 1.1; margin: 0 auto 14px;
      max-width: 800px; background: linear-gradient(90deg, #ffffff, #ffb86c, #ff6b9d);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }

    .hero p { color: #aaa; font-size: 16px; max-width: 650px; margin: auto; line-height: 1.5; }

    .creator {
      background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
      backdrop-filter: blur(20px); border-radius: 25px; padding: 28px;
      box-shadow: 0 20px 70px rgba(0,0,0,0.3);
    }

    .section-title { font-size: 19px; margin-bottom: 16px; font-weight: bold; }

    textarea {
      width: 100%; min-height: 120px; resize: vertical;
      border: 1px solid rgba(255,255,255,0.15); border-radius: 16px;
      padding: 16px; font-size: 15px; color: white; background: rgba(0,0,0,0.3);
      outline: none; line-height: 1.6;
    }

    textarea:focus { border-color: #ff7b8a; }

    .controls-grid {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 15px; margin-top: 20px;
    }

    .control label { display: block; margin-bottom: 8px; color: #aaa; font-size: 13px; }

    select {
      width: 100%; padding: 13px; border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.15); background: #171722;
      color: white; font-size: 14px; outline: none;
    }

    .btn-primary {
      width: 100%; margin-top: 25px; padding: 17px; border: none;
      border-radius: 14px; font-size: 17px; font-weight: bold; color: white;
      cursor: pointer; background: linear-gradient(90deg, #ff8a00, #e52e71);
      transition: transform 0.2s, opacity 0.2s;
    }

    .btn-secondary {
      width: 100%; margin-top: 20px; padding: 16px; border: 1px solid rgba(255,255,255,0.2);
      border-radius: 14px; font-size: 16px; font-weight: bold; color: white;
      cursor: pointer; background: linear-gradient(90deg, #11998e, #38ef7d);
      transition: transform 0.2s, opacity 0.2s;
    }

    .btn-primary:hover, .btn-secondary:hover { transform: translateY(-2px); }
    .btn-primary:disabled, .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .result-container { margin-top: 30px; display: none; }

    .audio-player-box {
      background: rgba(56, 239, 125, 0.15); border: 1px solid rgba(56, 239, 125, 0.4);
      border-radius: 18px; padding: 20px; margin-top: 20px; text-align: center;
    }

    .audio-player-box h4 { margin: 0 0 12px; font-size: 18px; color: #38ef7d; }

    audio { width: 100%; margin-top: 10px; outline: none; }

    .download-btn {
      display: inline-block; margin-top: 12px; padding: 10px 18px;
      border-radius: 10px; background: #11998e; color: white;
      text-decoration: none; font-weight: bold; font-size: 14px;
    }

    .result-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 15px; gap: 10px;
    }

    .result-header h3 { margin: 0; }

    .copy-button {
      padding: 9px 14px; border-radius: 9px;
      border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.08);
      color: white; cursor: pointer;
    }

    .result {
      background: rgba(0,0,0,0.3); border-radius: 16px; padding: 22px;
      white-space: pre-wrap; line-height: 1.7; color: #eee;
      max-height: 600px; overflow-y: auto;
    }

    .loading { text-align: center; padding: 30px; color: #bbb; }

    footer { text-align: center; padding: 35px 0 10px; color: #777; font-size: 13px; }

    @media (max-width: 850px) {
      .controls-grid { grid-template-columns: 1fr; }
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
      <div class="badge">🎙️ Direction Artistique & Studio IA</div>
    </header>

    <section class="hero">
      <h2>Composition & Production Musicale</h2>
      <p>
        Rédige des paroles sur-mesure, puis génère la version audio MP3 de ta chanson.
      </p>
    </section>

    <main class="creator">
      <div class="section-title">💡 Thème ou histoire de la chanson</div>
      <textarea id="idea" placeholder="Exemple : Une chanson de victoire et d'espoir après avoir surmonté les difficultés..."></textarea>

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
          </select>
        </div>

        <div class="control">
          <label for="voice">🎤 Type de Voix</label>
          <select id="voice">
            <option>Voix Masculine Puissante</option>
            <option>Voix Féminine Douce & Émotionnelle</option>
            <option>Duo Masculin / Féminin</option>
            <option>Chorale Gospel & Lead Solo</option>
          </select>
        </div>

        <div class="control">
          <label for="tempo">⏱️ Tempo</label>
          <select id="tempo">
            <option>Lent / Ballade (60-80 BPM)</option>
            <option>Médium / Groove (90-110 BPM)</option>
            <option>Rapide / Énergique (115-130 BPM)</option>
          </select>
        </div>

        <div class="control">
          <label for="instruments">🎸 Instrumentation</label>
          <select id="instruments">
            <option>Piano Acoustique & Cordes Orchestrales</option>
            <option>Cuivres Afrobeat & Percussions</option>
            <option>Guitare Acoustique & Basse</option>
            <option>Synthétiseurs & Drums Trap 808</option>
          </select>
        </div>

        <div class="control">
          <label for="language">🌍 Langue</label>
          <select id="language">
            <option>Français</option>
            <option>Français + Lingala / Fang (Mix)</option>
            <option>English</option>
          </select>
        </div>

        <div class="control">
          <label for="mood">🔥 Ambiance</label>
          <select id="mood">
            <option>Triomphante & Victorieuse</option>
            <option>Mélancolique & Profonde</option>
            <option>Festive & Dansante</option>
            <option>Inspirante & Motivante</option>
          </select>
        </div>
      </div>

      <button class="btn-primary" id="createSongBtn" onclick="generateLyrics()">
        ✨ CRÉER MA CHANSON
      </button>

      <div class="result-container" id="resultContainer">
        
        <div class="result-header">
          <h3>🎵 Fiche Technique & Paroles</h3>
          <button class="copy-button" onclick="copyResult()">📋 Copier Tout</button>
        </div>
        <div class="result" id="result"></div>

        <button class="btn-secondary" id="generateAudioBtn" onclick="generateAudio()" style="display: none;">
          🎧 GÉNÉRER L'AUDIO DE MA CHANSON
        </button>

        <div class="audio-player-box" id="audioBox" style="display: none;">
          <h4>🎧 Piste Audio Générée (MP3)</h4>
          <audio id="audioPlayer" controls></audio>
          <div>
            <a id="downloadLink" class="download-btn" href="#" target="_blank" download="chanson_vichandy.mp3">⬇️ Télécharger le MP3</a>
          </div>
        </div>

      </div>
    </main>

    <footer>
      © 2026 VichAndy Studio — Direction Artistique & Production IA
    </footer>
  </div>

  <script>
    async function generateLyrics() {
      const idea = document.getElementById("idea").value.trim();
      const style = document.getElementById("style").value;
      const voice = document.getElementById("voice").value;
      const tempo = document.getElementById("tempo").value;
      const instruments = document.getElementById("instruments").value;
      const language = document.getElementById("language").value;
      const mood = document.getElementById("mood").value;

      const createSongBtn = document.getElementById("createSongBtn");
      const resultContainer = document.getElementById("resultContainer");
      const result = document.getElementById("result");
      const generateAudioBtn = document.getElementById("generateAudioBtn");
      const audioBox = document.getElementById("audioBox");

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
[Inscris ici les tags techniques uniquement entre crochets]

3. 🎼 PAROLES COMPLÈTES ET ARRANGEMENTS
- [Intro]
- [Couplet 1]
- [Pré-Refrain]
- [Refrain]
- [Couplet 2]
- [Pont / Bridge]
- [Refrain Final]
- [Outro]
---
\`;

      createSongBtn.disabled = true;
      createSongBtn.innerText = "⏳ CRÉATION ET COMPOSITION EN COURS...";
      resultContainer.style.display = "block";
      generateAudioBtn.style.display = "none";
      audioBox.style.display = "none";
      result.innerHTML = \`
        <div class="loading">
          ✍️ VichAndy Studio compose la structure, les arrangements et les paroles...
        </div>
      \`;

      try {
        const response = await fetch("/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: prompt })
        });

        const data = await response.json();

        if (data.success) {
          result.innerText = data.result;
          generateAudioBtn.style.display = "block"; // Affiche le bouton audio après composition
        } else {
          result.innerText = "Erreur : " + data.error;
        }
      } catch (error) {
        result.innerText = "Erreur de connexion au serveur : " + error.message;
      }

      createSongBtn.disabled = false;
      createSongBtn.innerText = "✨ CRÉER MA CHANSON";
    }

    async function generateAudio() {
      const generateAudioBtn = document.getElementById("generateAudioBtn");
      const audioBox = document.getElementById("audioBox");
      const audioPlayer = document.getElementById("audioPlayer");
      const downloadLink = document.getElementById("downloadLink");

      generateAudioBtn.disabled = true;
      generateAudioBtn.innerText = "⏳ GÉNÉRATION DU FICHIER AUDIO MP3 EN COURS...";

      try {
        const response = await fetch("/generate-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });

        const data = await response.json();

        if (data.success && data.audioUrl) {
          audioPlayer.src = data.audioUrl;
          downloadLink.href = data.audioUrl;
          audioBox.style.display = "block";
        } else {
          alert("Erreur lors de la génération audio : " + (data.error || "Piste non disponible."));
        }
      } catch (error) {
        alert("Erreur serveur lors de la génération audio : " + error.message);
      }

      generateAudioBtn.disabled = false;
      generateAudioBtn.innerText = "🎧 GÉNÉRER L'AUDIO DE MA CHANSON";
    }

    function copyResult() {
      const text = document.getElementById("result").innerText;
      navigator.clipboard.writeText(text);
      alert("Composition copiée avec succès !");
    }
  </script>
</body>
</html>
  `);
});

/* ============================================================
   API DE GENERATION PAROLES (GEMINI)
============================================================ */

app.post("/generate", async (req, res) => {
  try {
    const { prompt, modelName } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: "Prompt manquant" });
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
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================================================
   API DE GENERATION AUDIO MP3
============================================================ */

app.post("/generate-audio", async (req, res) => {
  try {
    // Piste MP3 de démonstration
    const demoAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

    res.json({
      success: true,
      audioUrl: demoAudioUrl
    });
  } catch (error) {
    console.error("ERREUR AUDIO :", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================================================
   ROUTE PRINCIPALE & DEMARRAGE
============================================================ */

app.get("/", (req, res) => {
  res.send("API VichAndy Studio Opérationnelle 🚀");
});

app.listen(PORT, () => {
  console.log(`Backend VichAndy en ligne sur le port ${PORT}`);
});
