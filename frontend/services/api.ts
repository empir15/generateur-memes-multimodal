import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = 3000;

function getBackendBaseUrl() {
  const debuggerHost =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;

  let url = `http://localhost:${API_PORT}`;

  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    url = `http://${host}:${API_PORT}`;
    
    // Détection d'un hôte de tunnel (ngrok ou expo.direct)
    if (host.includes('expo.direct') || host.includes('ngrok') || host.includes('u.expo.dev')) {
      console.warn(
        `[API Warning] Détection d'un tunnel Expo/Metro (${host}). ` +
        `Les requêtes vers ${url} risquent de renvoyer une erreur de connexion, ` +
        `car le port ${API_PORT} (Express) n'est pas tunnelisé automatiquement par Expo.`
      );
    }
  } else if (Platform.OS === 'android') {
    url = `http://10.0.2.2:${API_PORT}`;
  }

  console.log(`[API] URL Backend résolue : ${url}`);
  return url;
}

const BASE_URL = getBackendBaseUrl();

export interface MemeTextData {
  topText: string;
  bottomText: string;
  tone: string;
  templateStyle: string;
  emoji: string;
}

export interface MemeVoiceData {
  transcription: string;
  topText: string;
  bottomText: string;
  emotion: string;
  emoji: string;
}

export interface MemeImageData {
  description: string;
  topText: string;
  bottomText: string;
  style: string;
  emoji: string;
}

export interface MemeGeneratedData {
  imageBase64: string; // Data URI base64 de l'image générée par Pollinations AI
  topText: string;
  bottomText: string;
  emoji: string;
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || `Erreur serveur (${response.status})`);
  }
  return json.data as T;
}

async function uploadFile<T>(
  endpoint: string,
  fileUri: string,
  fieldName: 'audio' | 'image',
  fileName: string,
  mimeType: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    
    formData.append(fieldName, {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);

    console.log(`[API] Uploading via XHR: ${BASE_URL}${endpoint}`);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}${endpoint}`);
    
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.onload = () => {
      let responseJson: any;
      try {
        responseJson = JSON.parse(xhr.responseText);
      } catch (e) {
        reject(new Error(`Réponse serveur invalide (${xhr.status})`));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        if (responseJson && responseJson.success) {
          resolve(responseJson.data as T);
        } else {
          reject(new Error(responseJson?.error || `Erreur serveur (${xhr.status})`));
        }
      } else {
        reject(new Error(responseJson?.error || `Erreur serveur (${xhr.status})`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Erreur réseau lors de l\'envoi du fichier.'));
    };

    xhr.send(formData);
  });
}

export async function analyzeText(text: string, culturalContext?: string): Promise<MemeTextData> {
  console.log(`[API] POST Request: ${BASE_URL}/api/analyze-text`);
  const response = await fetch(`${BASE_URL}/api/analyze-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, culturalContext }),
  });

  return readJsonResponse<MemeTextData>(response);
}

export async function voiceToMeme(audioUri: string, culturalContext?: string): Promise<MemeVoiceData> {
  const extension = audioUri.split('.').pop()?.toLowerCase() || 'm4a';
  const mimeMap: Record<string, string> = {
    m4a: 'audio/mp4',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    webm: 'audio/webm',
    '3gp': 'audio/3gpp',
  };

  const endpoint = `/api/voice-to-meme?culturalContext=${encodeURIComponent(culturalContext || 'france')}`;

  return uploadFile<MemeVoiceData>(
    endpoint,
    audioUri,
    'audio',
    `recording.${extension}`,
    mimeMap[extension] || 'audio/mp4'
  );
}

export async function remixImage(imageUri: string, culturalContext?: string): Promise<MemeImageData> {
  const extension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };

  const endpoint = `/api/remix-image?culturalContext=${encodeURIComponent(culturalContext || 'france')}`;

  return uploadFile<MemeImageData>(
    endpoint,
    imageUri,
    'image',
    `image.${extension}`,
    mimeMap[extension] || 'image/jpeg'
  );
}

/**
 * Génère un mème complet (image + texte) via Pollinations AI + Gemini
 * @param subject - Le sujet ou l'idée du mème décrit par l'utilisateur
 * @param culturalContext - Le contexte culturel (france/quebec/belge/afrique/cameroun)
 */
export async function generateMeme(subject: string, culturalContext?: string): Promise<MemeGeneratedData> {
  console.log(`[API] POST Request: ${BASE_URL}/api/generate-meme`);
  const response = await fetch(`${BASE_URL}/api/generate-meme`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, culturalContext: culturalContext || 'france' }),
  });

  return readJsonResponse<MemeGeneratedData>(response);
}
