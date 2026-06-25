/**
 * App.tsx
 * Point d'entrée principal de l'application MemeGen AI.
 * Gère la navigation entre les écrans + le Share Intent via Clipboard.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, AppState, AppStateStatus, TouchableOpacity, Text, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './screens/HomeScreen';
import ContextReaderScreen from './screens/ContextReaderScreen';
import VoiceToMemeScreen from './screens/VoiceToMemeScreen';
import StatusRemixerScreen from './screens/StatusRemixerScreen';
import AiGeneratorScreen from './screens/AiGeneratorScreen';
import { Colors } from './constants/Colors';

type Screen = 'home' | 'text' | 'voice' | 'image' | 'generate';

interface ClipboardBanner {
  text: string;
  visible: boolean;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [sharedText, setSharedText] = useState<string | undefined>(undefined);

  // ── Clipboard Share Intent ──────────────────────────────────────────────────
  const [clipboardBanner, setClipboardBanner] = useState<ClipboardBanner>({ text: '', visible: false });
  const bannerAnim = useRef(new Animated.Value(-100)).current;
  const lastClipboardText = useRef<string>('');
  const appState = useRef(AppState.currentState);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Vérifie le presse-papiers et affiche un bandeau si un nouveau texte est détecté.
   * On évite de re-déclencher si le texte est identique au précédent (évite les spams).
   */
  const checkClipboard = useCallback(async () => {
    try {
      // Vérifie si le presse-papiers contient du texte
      const hasText = await Clipboard.hasStringAsync();
      if (!hasText) return;

      const text = await Clipboard.getStringAsync();

      // Filtres : ignorer si vide, trop court (<10 car.), identique au précédent, ou URL
      if (
        !text ||
        text.length < 10 ||
        text === lastClipboardText.current ||
        text.startsWith('http://') ||
        text.startsWith('https://')
      ) {
        return;
      }

      lastClipboardText.current = text;
      showClipboardBanner(text);
    } catch (e) {
      // Silencieux : l'accès au clipboard peut être refusé sur certains appareils
    }
  }, []);

  /**
   * Affiche le bandeau clipboard avec animation slide-down
   */
  const showClipboardBanner = (text: string) => {
    // Annuler le timer précédent si toujours actif
    if (bannerTimer.current) clearTimeout(bannerTimer.current);

    setClipboardBanner({ text, visible: true });

    Animated.spring(bannerAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();

    // Auto-dismiss après 6 secondes
    bannerTimer.current = setTimeout(() => {
      dismissBanner();
    }, 6000);
  };

  /**
   * Masque le bandeau avec animation slide-up
   */
  const dismissBanner = () => {
    Animated.timing(bannerAnim, {
      toValue: -120,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setClipboardBanner((prev) => ({ ...prev, visible: false }));
    });
  };

  /**
   * Utilise le texte du clipboard pour générer un mème
   */
  const useBannerText = () => {
    const text = clipboardBanner.text;
    dismissBanner();
    setSharedText(text);
    setCurrentScreen('text');
    // Effacer après usage pour éviter re-déclenchement
    lastClipboardText.current = text;
  };

  // ── Écouter les changements d'état de l'app (retour au premier plan) ────────
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      // L'app revient au premier plan (background → active)
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        checkClipboard();
      }
      appState.current = nextState;
    });

    return () => {
      subscription.remove();
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    };
  }, [checkClipboard]);

  // Réinitialiser sharedText après navigation vers l'écran texte
  const handleNavigate = (screen: Screen) => {
    if (screen !== 'text') setSharedText(undefined);
    setCurrentScreen(screen);
  };

  // ── Rendu des écrans ────────────────────────────────────────────────────────
  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} />;
      case 'text':
        return (
          <ContextReaderScreen
            onBack={() => {
              setSharedText(undefined);
              setCurrentScreen('home');
            }}
            initialText={sharedText}
          />
        );
      case 'voice':
        return <VoiceToMemeScreen onBack={() => setCurrentScreen('home')} />;
      case 'image':
        return <StatusRemixerScreen onBack={() => setCurrentScreen('home')} />;
      case 'generate':
        return <AiGeneratorScreen onBack={() => setCurrentScreen('home')} />;
      default:
        return <HomeScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        {renderScreen()}

        {/* ── Bandeau Clipboard (Share Intent) ── */}
        {clipboardBanner.visible && (
          <Animated.View style={[styles.banner, { transform: [{ translateY: bannerAnim }] }]}>
            <View style={styles.bannerContent}>
              <Ionicons name="clipboard-outline" size={20} color={Colors.primary} style={styles.bannerIcon} />
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>📋 Texte copié détecté</Text>
                <Text style={styles.bannerPreview} numberOfLines={1}>
                  "{clipboardBanner.text}"
                </Text>
              </View>
            </View>
            <View style={styles.bannerActions}>
              <TouchableOpacity style={styles.bannerBtnUse} onPress={useBannerText} activeOpacity={0.8}>
                <Text style={styles.bannerBtnUseText}>Générer un mème</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bannerBtnDismiss} onPress={dismissBanner} activeOpacity={0.8}>
                <Ionicons name="close" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Bandeau Clipboard ──
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 52,      // Compenser la status bar
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 999,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bannerIcon: {
    marginRight: 10,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerPreview: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerBtnUse: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  bannerBtnUseText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  bannerBtnDismiss: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
