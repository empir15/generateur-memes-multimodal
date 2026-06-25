/**
 * geminiService.js
 * Service centralisé pour toutes les interactions avec l'API Google Gemini.
 * Gère : analyse de texte, transcription audio, et analyse d'images.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

// Initialisation du client Gemini avec la clé API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Retry automatique avec backoff exponentiel pour les erreurs de quota (429)
 * @param {Function} fn - Fonction async à réessayer
 * @param {number} maxRetries - Nombre max de tentatives
 */
async function withRetry(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const is429 = error.message && error.message.includes('429');
      if (is429 && attempt < maxRetries) {
        const waitMs = attempt * 15000; // 15s, 30s, 45s
        console.log(`[Gemini] Quota atteint. Tentative ${attempt}/${maxRetries}. Attente ${waitMs / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
      } else {
        throw error;
      }
    }
  }
}

/**
 * Convertit un fichier en partie inline pour Gemini
 * @param {string} filePath - Chemin vers le fichier
 * @param {string} mimeType - Type MIME du fichier
 */
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: fs.readFileSync(filePath).toString('base64'),
      mimeType,
    },
  };
}

/**
 * Retourne les instructions d'humour et de références selon la culture choisie
 * @param {string} culturalContext 
 */
function getCulturalPrompt(culturalContext) {
  const contexts = {
    france: `Privilégie les références de la culture internet française (ex: situations de la vie quotidienne en France, SNCF, RATP, expressions populaires ou argot internet comme "du coup", "j'ai pas les termes", "c'est réel", "sah", "masterclass", etc.), de manière naturelle et drôle.`,
    quebec: `Privilégie les références et expressions typiquement québécoises (ex: le joual, expressions populaires comme "c'est le fun", "mon char", "mon chum/ma blonde", "il fait frette", "magasiner", "pis", "pantoute", "tiguidou", "ché pas", etc.), avec l'humour chaleureux et décalé du Québec.`,
    belge: `Privilégie l'autodérision et les expressions typiques de Belgique (ex: "une fois", "savoir" au lieu de "pouvoir", "septante", "nonante", "drache", "chicon", "kot", "baraki", "aubergine", etc.), de manière amusante et authentique.`,
    afrique: `Privilégie l'humour et les expressions populaires d'Afrique de l'Ouest/Côte d'Ivoire (ex: le nouchi, expressions comme "y a pas drap", "c'est gâté", "dja le champagne", "enjaillement", "boucan", "taper pote", "chicotter", "propre", etc.), de manière joyeuse et percutante.`,
    cameroun: `Privilégie l'humour, les situations de la vie quotidienne et les expressions populaires du Cameroun (ex: expressions comme "le mbeng", "cadeauter", "mola", "le ndem", "les ways", "tchop", "ndolo", "c'est comment", "on dit quoi", "calé", "gérer", "banga", "la bière est fraîche", etc.), de manière naturelle, drôle et typique du Cameroun.`
  };
  return contexts[culturalContext] || contexts.france;
}

/**
 * Appelle la génération de contenu avec une stratégie de repli (fallback)
 * sur différents modèles si le principal est indisponible ou surchargé (503, 404, etc.)
 * @param {string|Array} promptOrParts 
 */
async function generateContentWithFallback(promptOrParts) {
  const models = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  let lastError = null;

  for (const modelName of models) {
    try {
      console.log(`[Gemini] Tentative avec le modèle : ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // Utilise withRetry pour gérer les quotas 429
      const result = await withRetry(async () => {
        return await model.generateContent(promptOrParts);
      }, 2); // 2 tentatives par modèle
      
      console.log(`[Gemini] Succès avec le modèle : ${modelName}`);
      return result;
    } catch (error) {
      console.warn(`[Gemini] Échec avec le modèle ${modelName} (${error.message}). Passage au modèle suivant...`);
      lastError = error;
    }
  }

  throw lastError || new Error('Tous les modèles Gemini ont échoué.');
}

/**
 * Analyse un texte et génère le contenu d'un mème humoristique
 * @param {string} text - Le texte à analyser
 * @param {string} culturalContext - Le contexte culturel (france/quebec/belge/afrique/cameroun)
 * @returns {Object} { topText, bottomText, tone, templateStyle }
 */
async function analyzeTextForMeme(text, culturalContext = 'france') {
  const prompt = `Tu es un expert en humour internet et en mèmes. Analyse ce texte en français et génère un mème hilarant et pertinent.
${getCulturalPrompt(culturalContext)}

Texte à analyser: "${text}"

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans explications), dans ce format exact:
{
  "topText": "TEXTE DU HAUT DU MÈME EN MAJUSCULES (max 8 mots, percutant)",
  "bottomText": "TEXTE DU BAS EN MAJUSCULES (max 8 mots, punch final)",
  "tone": "ton dominant (sarcastique/absurde/relatable/ironique)",
  "templateStyle": "couleur de fond suggérée (dark/light/gradient-purple/gradient-orange)",
  "emoji": "1-2 emojis qui correspondent au mème"
}`;

  const result = await generateContentWithFallback(prompt);
  const responseText = result.response.text();
  const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleanJson);
}

/**
 * Transcrit un fichier audio et génère un mème basé sur son contenu
 * @param {string} audioPath - Chemin vers le fichier audio
 * @param {string} mimeType - Type MIME (audio/wav, audio/mp4, audio/mpeg...)
 * @param {string} culturalContext - Le contexte culturel (france/quebec/belge/afrique/cameroun)
 * @returns {Object} { transcription, topText, bottomText, emotion }
 */
async function audioToMeme(audioPath, mimeType, culturalContext = 'france') {
  const audioPart = fileToGenerativePart(audioPath, mimeType || 'audio/wav');

  const prompt = `Transcris cet enregistrement audio en français, analyse l'émotion ou le contexte, puis génère un mème humoristique basé sur ce contenu.
${getCulturalPrompt(culturalContext)}

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans explications):
{
  "transcription": "transcription complète et fidèle de l'audio",
  "topText": "TEXTE DU HAUT DU MÈME EN MAJUSCULES (max 8 mots)",
  "bottomText": "TEXTE DU BAS EN MAJUSCULES (max 8 mots, chute humoristique)",
  "emotion": "émotion principale détectée dans la voix/le contenu",
  "emoji": "1-2 emojis adaptés"
}`;

  const result = await generateContentWithFallback([prompt, audioPart]);
  const responseText = result.response.text();
  const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleanJson);
}

/**
 * Analyse une image et génère un texte de mème adapté à son contenu
 * @param {string} imagePath - Chemin vers le fichier image
 * @param {string} mimeType - Type MIME (image/jpeg, image/png...)
 * @param {string} culturalContext - Le contexte culturel (france/quebec/belge/afrique/cameroun)
 * @returns {Object} { description, topText, bottomText, style }
 */
async function analyzeImageForMeme(imagePath, mimeType, culturalContext = 'france') {
  const imagePart = fileToGenerativePart(imagePath, mimeType || 'image/jpeg');

  const prompt = `Regarde cette image avec un regard humoristique et génère un texte de mème percutant et drôle en français.
${getCulturalPrompt(culturalContext)}

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans explications):
{
  "description": "description courte et amusante de ce que tu vois",
  "topText": "TEXTE DU HAUT (peut être vide si pas nécessaire, max 6 mots)",
  "bottomText": "TEXTE PRINCIPAL DU MÈME EN MAJUSCULES (max 10 mots, le plus drôle possible)",
  "style": "style humoristique (absurde/ironique/relatable/sarcastique/épique)",
  "emoji": "1-2 emojis adaptés"
}`;

  const result = await generateContentWithFallback([prompt, imagePart]);
  const responseText = result.response.text();
  const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleanJson);
}

/**
 * Génère un prompt d'image Pollinations AI + texte de mème à partir d'un sujet
 * @param {string} subject - L'idée ou le sujet du mème décrit par l'utilisateur
 * @param {string} culturalContext - Le contexte culturel (france/quebec/belge/afrique/cameroun)
 * @returns {Object} { imagePrompt, topText, bottomText, emoji }
 */
async function generateMemePromptAndText(subject, culturalContext = 'france') {
  const prompt = `Tu es un expert en humour internet et en création de mèmes. L'utilisateur veut créer un mème sur ce sujet : "${subject}".
${getCulturalPrompt(culturalContext)}

Ta tâche est double :
1. Créer un prompt d'image en ANGLAIS simple et descriptif pour un générateur d'images IA (style mème internet, cartoon ou illustration drôle, fond simple, personnages expressifs).
2. Créer le texte du mème en FRANÇAIS, court et percutant, adapté au contexte culturel.

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans explications) :
{
  "imagePrompt": "short english image description for AI image generator, meme style, funny cartoon, simple background, expressive characters, no text (max 20 words)",
  "topText": "TEXTE DU HAUT EN MAJUSCULES (max 7 mots, peut être vide)",
  "bottomText": "TEXTE PRINCIPAL EN MAJUSCULES (max 8 mots, la punchline drôle)",
  "emoji": "1-2 emojis adaptés au mème"
}`;

  const result = await generateContentWithFallback(prompt);
  const responseText = result.response.text();
  const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleanJson);
}

module.exports = {
  analyzeTextForMeme,
  audioToMeme,
  analyzeImageForMeme,
  generateMemePromptAndText,
};
