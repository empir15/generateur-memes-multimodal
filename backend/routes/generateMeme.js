/**
 * generateMeme.js
 * Route POST /api/generate-meme
 * Génère un mème complet :
 *   1. Appelle Gemini pour créer un imagePrompt (EN) + texte mème (FR)
 *   2. Appelle Pollinations AI (gratuit, sans clé) pour générer l'image
 *   3. Retourne { imageBase64, topText, bottomText, emoji }
 */

const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { generateMemePromptAndText } = require('../services/geminiService');

/**
 * Télécharge une image depuis une URL et la convertit en base64
 * Gère les redirections HTTP (Pollinations en utilise)
 * @param {string} url
 * @param {number} maxRedirects
 * @returns {Promise<{ base64: string, mimeType: string }>}
 */
function downloadImageAsBase64(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error('Trop de redirections lors du téléchargement de l\'image.'));
    }

    const client = url.startsWith('https') ? https : http;

    const request = client.get(url, (response) => {
      // Gestion des redirections (301, 302, 307, 308)
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadImageAsBase64(response.headers.location, maxRedirects - 1)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        return reject(new Error(`Erreur Pollinations AI: HTTP ${response.statusCode}`));
      }

      const mimeType = response.headers['content-type'] || 'image/jpeg';
      const chunks = [];

      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({ base64: buffer.toString('base64'), mimeType });
      });
      response.on('error', reject);
    });

    request.on('error', reject);
    // Timeout de 30s pour laisser le temps à Pollinations de générer
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Timeout : Pollinations AI a mis trop de temps à répondre.'));
    });
  });
}

router.post('/', async (req, res) => {
  try {
    const { subject, culturalContext } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Le champ "subject" est requis. Décrivez votre idée de mème.',
      });
    }

    console.log(`[AI Generator] Sujet reçu (${culturalContext || 'france'}): "${subject}"`);

    // ── Étape 1 : Gemini génère le prompt image + texte mème ──
    const memeContent = await generateMemePromptAndText(subject.trim(), culturalContext);
    console.log(`[AI Generator] Prompt image: "${memeContent.imagePrompt}"`);
    console.log(`[AI Generator] Texte mème:`, { top: memeContent.topText, bottom: memeContent.bottomText });

    // ── Étape 2 : Pollinations AI génère l'image ──
    const encodedPrompt = encodeURIComponent(memeContent.imagePrompt);
    const seed = Math.floor(Math.random() * 99999);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&model=flux&seed=${seed}`;

    console.log(`[AI Generator] Appel Pollinations AI...`);
    const { base64, mimeType } = await downloadImageAsBase64(pollinationsUrl);
    console.log(`[AI Generator] Image générée (${(base64.length * 0.75 / 1024).toFixed(1)} KB)`);

    res.json({
      success: true,
      data: {
        imageBase64: `data:${mimeType};base64,${base64}`,
        topText: memeContent.topText || '',
        bottomText: memeContent.bottomText,
        emoji: memeContent.emoji || '😂',
      },
    });
  } catch (error) {
    console.error('[AI Generator] Erreur:', error.message);

    if (error instanceof SyntaxError) {
      return res.status(500).json({
        success: false,
        error: 'Erreur de parsing de la réponse IA. Réessayez.',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur lors de la génération du mème.',
    });
  }
});

module.exports = router;
