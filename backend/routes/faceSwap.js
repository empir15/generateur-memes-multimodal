/**
 * faceSwap.js
 * Route POST /api/face-swap
 * Reçoit deux images (source et target) via Multer,
 * appelle l'espace Hugging Face tonyassi/face-swap via @gradio/client
 * et renvoie l'image modifiée sous forme de data URI Base64.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const prefix = file.fieldname === 'source' ? 'src' : 'tgt';
    const uniqueName = `${prefix}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Filtre image
const imageFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format d\'image non supporté. Utilisez JPEG, PNG ou WebP.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
});

// Route POST
router.post(
  '/',
  upload.fields([
    { name: 'source', maxCount: 1 },
    { name: 'target', maxCount: 1 },
  ]),
  async (req, res) => {
    let sourcePath = null;
    let targetPath = null;

    try {
      const sourceFile = req.files && req.files['source'] && req.files['source'][0];
      const targetFile = req.files && req.files['target'] && req.files['target'][0];

      if (!sourceFile || !targetFile) {
        return res.status(400).json({
          success: false,
          error: 'Les deux images "source" (le visage) et "target" (le mème) sont requises.',
        });
      }

      sourcePath = sourceFile.path;
      targetPath = targetFile.path;

      console.log(`[Face Swap] Requête reçue.`);
      console.log(` - Source : ${sourceFile.filename} (${(sourceFile.size / 1024).toFixed(1)} KB)`);
      console.log(` - Cible  : ${targetFile.filename} (${(targetFile.size / 1024).toFixed(1)} KB)`);

      // Importation dynamique de @gradio/client (package ESM)
      console.log(`[Face Swap] Connexion à l'espace Hugging Face tonyassi/face-swap...`);
      const { Client, client, handle_file } = await import('@gradio/client');

      // Résolution du client compatible (certaines versions exportent 'client' par défaut, d'autres 'Client')
      let app;
      if (typeof client === 'function') {
        app = await client('tonyassi/face-swap');
      } else if (Client && typeof Client.connect === 'function') {
        app = await Client.connect('tonyassi/face-swap');
      } else if (typeof Client === 'function') {
        app = await Client('tonyassi/face-swap');
      } else {
        throw new Error('Impossible de charger le client Gradio.');
      }

      console.log(`[Face Swap] Envoi des images pour traitement...`);

      // Appel de la prédiction Gradio (swap_faces)
      const result = await app.predict('/swap_faces', [
        handle_file(sourcePath),
        handle_file(targetPath),
      ]);

      if (!result || !result.data || !result.data[0]) {
        throw new Error('L\'API de face swap a retourné une réponse invalide.');
      }

      const fileData = result.data[0];
      console.log(`[Face Swap] Traitement terminé. Récupération du résultat...`);

      let imageBuffer;
      // Parfois le client Gradio télécharge le fichier localement, parfois il renvoie une URL
      if (fileData.path && fs.existsSync(fileData.path)) {
        imageBuffer = fs.readFileSync(fileData.path);
        // Si le fichier temporaire gradio existe, on essaie de le supprimer
        try {
          fs.unlinkSync(fileData.path);
        } catch (e) {}
      } else if (fileData.url) {
        const fetchRes = await fetch(fileData.url);
        const arrayBuffer = await fetchRes.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else {
        throw new Error('Impossible de localiser l\'image générée dans la réponse.');
      }

      const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

      console.log(`[Face Swap] Succès. Image convertie en Base64.`);

      res.json({
        success: true,
        data: base64Image,
      });
    } catch (error) {
      console.error('[Face Swap] Erreur:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur interne du serveur lors du face swap.',
      });
    } finally {
      // Nettoyage des fichiers temporaires uploadés
      if (sourcePath && fs.existsSync(sourcePath)) {
        fs.unlinkSync(sourcePath);
        console.log(`[Face Swap] Fichier temporaire source supprimé`);
      }
      if (targetPath && fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
        console.log(`[Face Swap] Fichier temporaire cible supprimé`);
      }
    }
  }
);

module.exports = router;
