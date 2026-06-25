/**
 * server.js
 * Point d'entrée principal du backend.
 * Générateur de Mèmes Multimodal — ICT202 G2
 *
 * Stack: Node.js + Express.js + Multer + Google Gemini AI
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import des routes
const analyzeTextRoute = require('./routes/analyzeText');
const voiceToMemeRoute = require('./routes/voiceToMeme');
const remixImageRoute = require('./routes/remixImage');
const generateMemeRoute = require('./routes/generateMeme');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares ──────────────────────────────────────────────────────────────

// CORS : permet au frontend React Native d'accéder au backend
app.use(cors({
  origin: '*', // En production, limiter aux domaines autorisés
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parser JSON pour les requêtes body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Dossier uploads (créé automatiquement s'il n'existe pas)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('[Server] Dossier uploads créé.');
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Route de santé (health check)
app.get('/', (req, res) => {
  res.json({
    status: '✅ Backend opérationnel',
    project: 'Générateur de Mèmes Multimodal',
    course: 'ICT202 G2',
    version: '1.0.0',
    endpoints: {
      analyzeText: 'POST /api/analyze-text',
      voiceToMeme: 'POST /api/voice-to-meme',
      remixImage:  'POST /api/remix-image',
      generateMeme: 'POST /api/generate-meme',
    },
  });
});

// Routes API
app.use('/api/analyze-text', analyzeTextRoute);   // Texte → Mème
app.use('/api/voice-to-meme', voiceToMemeRoute);  // Audio → Mème
app.use('/api/remix-image', remixImageRoute);      // Image → Mème
app.use('/api/generate-meme', generateMemeRoute); // IA → Mème complet (Pollinations AI)

// ─── Gestion des erreurs globales ─────────────────────────────────────────────

// Middleware pour les routes non trouvées (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route non trouvée: ${req.method} ${req.url}`,
  });
});

// Middleware de gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('[Server] Erreur globale:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Erreur interne du serveur.',
  });
});

// ─── Démarrage du serveur ─────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('\n🎭 ========================================');
  console.log('   Générateur de Mèmes Multimodal');
  console.log('   ICT202 G2 — Backend API');
  console.log('========================================');
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`🔑 Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Configurée' : '❌ Manquante!'}`);
  console.log('========================================\n');
  console.log('📡 Endpoints disponibles:');
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   POST http://localhost:${PORT}/api/analyze-text`);
  console.log(`   POST http://localhost:${PORT}/api/voice-to-meme`);
  console.log(`   POST http://localhost:${PORT}/api/remix-image`);
  console.log(`   POST http://localhost:${PORT}/api/generate-meme`);
  console.log('\n⏳ En attente de requêtes...\n');
});

module.exports = app;
