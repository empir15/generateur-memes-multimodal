/**
 * analyzeText.js
 * Route POST /api/analyze-text
 * Reçoit un texte, l'envoie à Gemini, retourne le contenu du mème.
 */

const express = require('express');
const router = express.Router();
const { analyzeTextForMeme } = require('../services/geminiService');

router.post('/', async (req, res) => {
  try {
    const { text, culturalContext } = req.body;

    // Validation de l'entrée
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Le champ "text" est requis et ne peut pas être vide.',
      });
    }

    if (text.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Le texte est trop court. Entrez au moins 5 caractères.',
      });
    }

    console.log(`[Context Reader] Analyse du texte (${culturalContext || 'france'}): "${text.substring(0, 50)}..."`);

    // Appel au service Gemini
    const memeData = await analyzeTextForMeme(text.trim(), culturalContext);

    console.log(`[Context Reader] Mème généré:`, memeData);

    res.json({
      success: true,
      data: memeData,
    });
  } catch (error) {
    console.error('[Context Reader] Erreur:', error.message);

    // Erreur spécifique JSON parse (réponse Gemini malformée)
    if (error instanceof SyntaxError) {
      return res.status(500).json({
        success: false,
        error: 'Erreur de parsing de la réponse IA. Réessayez.',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la génération du mème.',
    });
  }
});

module.exports = router;
