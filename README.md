# 🎭 MemeGen AI — Générateur de Mèmes Multimodal

> Projet Académique — ICT202 G2 | React Native (Expo) + Node.js / Express + Google Gemini AI

Une application mobile qui génère automatiquement des mèmes humoristiques à partir de **texte**, **voix**, **images** ou d'une **idée décrite en langage naturel**. L'IA s'appuie sur **Google Gemini** pour capturer l'humour et **Pollinations AI** (gratuit) pour la génération d'images à partir de zéro.

---

## 📋 Table des matières

- [Architecture du projet](#-architecture-du-projet)
- [Prérequis](#-prérequis)
- [Configuration des clés API](#-configuration-des-clés-api)
- [Installation & Lancement — Backend](#-installation--lancement--backend)
- [Installation & Lancement — Frontend](#-installation--lancement--frontend)
- [Fonctionnalités](#-fonctionnalités)
- [Endpoints API](#-endpoints-api)
- [Équipe](#-équipe)

---

## 🏗️ Architecture du projet

```
generateur-memes-multimodal/
├── backend/                  # Serveur Node.js / Express
│   ├── routes/
│   │   ├── analyzeText.js    # POST /api/analyze-text   → Texte → Mème
│   │   ├── voiceToMeme.js    # POST /api/voice-to-meme  → Audio → Mème
│   │   ├── remixImage.js     # POST /api/remix-image    → Image → Mème
│   │   └── generateMeme.js   # POST /api/generate-meme  → IA → Mème complet
│   ├── services/
│   │   └── geminiService.js  # Logique Gemini AI centralisée
│   ├── uploads/              # Fichiers temporaires (auto-nettoyés)
│   ├── server.js             # Point d'entrée Express
│   └── .env                  # ⚠️ Clés API (à créer manuellement)
│
└── frontend/                 # Application React Native / Expo
    ├── screens/
    │   ├── HomeScreen.tsx
    │   ├── ContextReaderScreen.tsx
    │   ├── VoiceToMemeScreen.tsx
    │   ├── StatusRemixerScreen.tsx
    │   └── AiGeneratorScreen.tsx  # 🆕 Génération d'image par IA
    ├── components/
    │   ├── MemeCanvas.tsx
    │   └── MemePreview.tsx
    ├── services/
    │   └── api.ts            # Appels HTTP vers le backend
    ├── constants/
    │   └── Colors.ts         # Système de couleurs
    └── App.tsx               # Navigation + Share Intent (Clipboard)
```

---

## ✅ Prérequis

Assurez-vous d'avoir les outils suivants installés sur votre machine :

| Outil | Version recommandée | Lien |
|---|---|---|
| **Node.js** | v18 ou supérieur | [nodejs.org](https://nodejs.org/) |
| **npm** | v9+ (inclus avec Node.js) | — |
| **Expo Go** (app mobile) | Dernière version | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779) |
| **Git** | Toute version récente | [git-scm.com](https://git-scm.com/) |

---

## 🔑 Configuration des clés API

### Google Gemini API (obligatoire)

L'application utilise **Google Gemini** pour analyser le texte, l'audio et les images.

1. Rendez-vous sur [Google AI Studio](https://aistudio.google.com/)
2. Connectez-vous avec un compte Google
3. Cliquez sur **"Get API Key"** → **"Create API key"**
4. Copiez la clé générée

> [!NOTE]
> La clé Gemini est **gratuite** avec un quota généreux (1 500 requêtes/jour sur le plan Free).

### Pollinations AI (aucune configuration requise)

La fonctionnalité **AI Generator** utilise [Pollinations AI](https://pollinations.ai/) pour générer des images. Ce service est **100% gratuit**, sans inscription ni clé API. Aucune configuration n'est nécessaire.

---

## 🖥️ Installation & Lancement — Backend

### Étape 1 — Cloner le projet

```bash
git clone <url-du-repo>
cd generateur-memes-multimodal
```

### Étape 2 — Installer les dépendances backend

```bash
cd backend
npm install
```

### Étape 3 — Créer le fichier `.env`

Créez un fichier `.env` à la racine du dossier `backend/` :

```bash
# backend/.env

GEMINI_API_KEY=VOTRE_CLE_API_GEMINI_ICI
PORT=3000
```

> [!IMPORTANT]
> Remplacez `VOTRE_CLE_API_GEMINI_ICI` par votre clé obtenue sur [Google AI Studio](https://aistudio.google.com/).
> Ne committez jamais ce fichier (il est déjà dans `.gitignore`).

### Étape 4 — Lancer le serveur

```bash
# Mode développement (avec rechargement automatique)
npm run dev

# OU mode production simple
npm start
```

✅ Le serveur démarre sur **`http://localhost:3000`**

Vous devriez voir :
```
🎭 ========================================
   Générateur de Mèmes Multimodal
   ICT202 G2 — Backend API
========================================
🚀 Serveur démarré sur http://localhost:3000
🔑 Gemini API: ✅ Configurée
========================================

📡 Endpoints disponibles:
   GET  http://localhost:3000/
   POST http://localhost:3000/api/analyze-text
   POST http://localhost:3000/api/voice-to-meme
   POST http://localhost:3000/api/remix-image
   POST http://localhost:3000/api/generate-meme
```

---

## 📱 Installation & Lancement — Frontend

### Étape 1 — Installer les dépendances frontend

Ouvrez un **nouveau terminal** (gardez le backend actif) :

```bash
cd frontend
npm install --legacy-peer-deps
```

### Étape 2 — Configurer l'adresse du backend

L'URL du backend est détectée **automatiquement** via Expo. Cependant, selon votre environnement :

| Environnement | Configuration requise |
|---|---|
| **Émulateur Android** (Android Studio) | ✅ Rien à faire — `http://10.0.2.2:3000` est déjà configuré |
| **Téléphone physique** (Expo Go, même réseau Wi-Fi) | ✅ Rien à faire — l'IP est détectée automatiquement par Expo |
| **Téléphone physique** (réseau différent) | Modifier l'IP dans `frontend/services/api.ts` ligne 12 : `http://<VOTRE_IP_LOCALE>:3000` |

Pour trouver votre IP locale sur Windows :
```bash
ipconfig
# Cherchez "Adresse IPv4" sous votre carte réseau Wi-Fi
```

### Étape 3 — Lancer l'application

```bash
npx expo start
```

Ou directement sur Android :
```bash
npx expo start --android
```

### Étape 4 — Ouvrir sur votre téléphone

1. Installez **Expo Go** sur votre smartphone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
2. Assurez-vous que le téléphone et votre PC sont sur le **même réseau Wi-Fi**
3. Scannez le **QR Code** affiché dans le terminal avec l'appareil photo (iOS) ou Expo Go (Android)

> [!TIP]
> Si le QR Code ne fonctionne pas, essayez `npx expo start --tunnel` pour utiliser un tunnel ngrok.

---

## 🚀 Fonctionnalités

### 1. Context Reader ✍️
Collez un message, une citation ou décrivez une situation. Gemini analyse le ton et génère un mème textuel avec une punchline percutante.

**Bonus** : Bouton 📋 **Coller depuis le presse-papiers** — copiez un message dans WhatsApp, revenez dans l'app, un bandeau détecte automatiquement le texte.

### 2. Voice-to-Meme 🎙️
Enregistrez votre voix. L'audio est transcrit par Gemini et converti en mème. La transcription originale est affichée sous le mème.

### 3. Status Remixer 🖼️
Prenez une photo ou choisissez-en une depuis la galerie. Gemini Vision analyse l'image et y superpose un texte de mème parfaitement adapté au contexte visuel.

### 4. AI Generator 🎨 *(Nouveau)*
Décrivez votre idée en langage naturel. L'IA :
1. Génère un prompt d'image optimisé (via Gemini)
2. Crée l'image via **Pollinations AI** (gratuit, sans clé)
3. Superpose le texte du mème en français

### 5. Share Intent via Clipboard 📋 *(Nouveau)*
Copiez du texte depuis n'importe quelle app → revenez dans MemeGen AI → bandeau automatique → générez un mème en un clic.

### 6. Localisation culturelle 🌍
Disponible sur toutes les fonctionnalités : **France 🇫🇷, Québec 🇨🇦, Belgique 🇧🇪, Côte d'Ivoire 🇨🇮, Cameroun 🇨🇲**

### 7. Personnalisation & Partage 📤
Après génération : ajustez la couleur et la taille du texte, activez/désactivez les majuscules et le contour, puis partagez via le menu de partage natif Android/iOS.

---

## 📡 Endpoints API

| Méthode | Endpoint | Description | Body |
|---|---|---|---|
| `GET` | `/` | Health check du serveur | — |
| `POST` | `/api/analyze-text` | Texte → Mème | `{ text, culturalContext }` |
| `POST` | `/api/voice-to-meme` | Audio → Mème | `multipart/form-data` (champ `audio`) |
| `POST` | `/api/remix-image` | Image → Mème | `multipart/form-data` (champ `image`) |
| `POST` | `/api/generate-meme` | Idée → Image IA + Mème | `{ subject, culturalContext }` |

**Valeurs `culturalContext`** : `france` \| `quebec` \| `belge` \| `afrique` \| `cameroun`

---

## 👥 Équipe

**ICT202 G2** — Projet de Développement Mobile Android

---

## 📄 Licence

Ce projet est développé dans le cadre académique du cours ICT202.
