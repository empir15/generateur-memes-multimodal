/**
 * remixImage.js
 * Route POST /api/remix-image
 * Reçoit une image (multipart), l'analyse via Gemini Vision,
 * et génère un texte de mème adapté à son contenu.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeImageForMeme } = require('../services/geminiService');

// Configuration Multer pour les images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `image_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Filtre : accepte uniquement les images
const imageFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format image non supporté. Utilisez JPEG, PNG, WebP ou GIF.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
});

router.post('/', upload.single('image'), async (req, res) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucune image reçue. Envoyez une image dans le champ "image".',
      });
    }

    filePath = req.file.path;
    const mimeType = req.file.mimetype;
    const culturalContext = req.body.culturalContext || req.query.culturalContext;

    console.log(`[Status Remixer] Image reçue (${culturalContext || 'france'}): ${req.file.filename} (${(req.file.size / 1024).toFixed(1)} KB)`);

    // Appel au service Gemini Vision
    const memeData = await analyzeImageForMeme(filePath, mimeType, culturalContext);

    console.log(`[Status Remixer] Description: "${memeData.description}"`);
    console.log(`[Status Remixer] Mème généré:`, { topText: memeData.topText, bottomText: memeData.bottomText });

    res.json({
      success: true,
      data: memeData,
    });
  } catch (error) {
    console.error('[Status Remixer] Erreur:', error.message);

    if (error instanceof SyntaxError) {
      return res.status(500).json({
        success: false,
        error: 'Erreur de parsing de la réponse IA. Réessayez.',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur lors de l\'analyse de l\'image.',
    });
  } finally {
    // Nettoyage du fichier temporaire
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Status Remixer] Fichier temporaire supprimé: ${filePath}`);
    }
  }
});

module.exports = router;
