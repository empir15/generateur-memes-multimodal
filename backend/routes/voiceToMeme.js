/**
 * voiceToMeme.js
 * Route POST /api/voice-to-meme
 * Reçoit un fichier audio (multipart), le transcrit via Gemini Speech-to-Text,
 * puis génère un mème basé sur le contenu audio.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { audioToMeme } = require('../services/geminiService');

// Configuration Multer pour les fichiers audio
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    // Créer le dossier uploads s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Nom unique basé sur le timestamp
    const uniqueName = `audio_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Filtre : accepte uniquement les fichiers audio
const audioFilter = (req, file, cb) => {
  const allowedMimes = ['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/3gpp', 'audio/aac'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format audio non supporté. Utilisez WAV, MP3, MP4, WebM, OGG ou AAC.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter: audioFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

router.post('/', upload.single('audio'), async (req, res) => {
  let filePath = null;

  try {
    // Vérification que le fichier a bien été uploadé
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier audio reçu. Envoyez un fichier dans le champ "audio".',
      });
    }

    filePath = req.file.path;
    const mimeType = req.file.mimetype;
    const culturalContext = req.body.culturalContext || req.query.culturalContext;

    console.log(`[Voice-to-Meme] Fichier reçu (${culturalContext || 'france'}): ${req.file.filename} (${(req.file.size / 1024).toFixed(1)} KB)`);

    // Appel au service Gemini (transcription + génération mème)
    const memeData = await audioToMeme(filePath, mimeType, culturalContext);

    console.log(`[Voice-to-Meme] Transcription: "${memeData.transcription?.substring(0, 60)}..."`);
    console.log(`[Voice-to-Meme] Mème généré:`, { topText: memeData.topText, bottomText: memeData.bottomText });

    res.json({
      success: true,
      data: memeData,
    });
  } catch (error) {
    console.error('[Voice-to-Meme] Erreur:', error.message);

    if (error instanceof SyntaxError) {
      return res.status(500).json({
        success: false,
        error: 'Erreur de parsing de la réponse IA. Réessayez.',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur lors du traitement audio.',
    });
  } finally {
    // Nettoyage : supprimer le fichier temporaire après traitement
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Voice-to-Meme] Fichier temporaire supprimé: ${filePath}`);
    }
  }
});

module.exports = router;
