import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { Colors } from '../constants/Colors';
import { voiceToMeme, MemeVoiceData } from '../services/api';
import MemePreview from '../components/MemePreview';

const CULTURAL_OPTIONS = [
  { id: 'france', label: 'France 🇫🇷' },
  { id: 'quebec', label: 'Québec 🇨🇦' },
  { id: 'belge', label: 'Belgique 🇧🇪' },
  { id: 'afrique', label: 'Côte d\'Ivoire 🇨🇮' },
  { id: 'cameroun', label: 'Cameroun 🇨🇲' },
];

interface VoiceToMemeScreenProps {
  onBack: () => void;
}

const recordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  directory: 'document' as const,
};

export default function VoiceToMemeScreen({ onBack }: VoiceToMemeScreenProps) {
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [memeData, setMemeData] = useState<MemeVoiceData | null>(null);
  const [culturalContext, setCulturalContext] = useState<string>('france');
  const audioRecorder = useAudioRecorder(recordingOptions);
  const recorderState = useAudioRecorderState(audioRecorder);
  const isRecording = recorderState.isRecording;

  // Animation pour l'onde vocale / bouton micro
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    // Nettoyage de l'audio à la fermeture de l'écran
    return () => {
      if (isRecordingRef.current) {
        audioRecorder.stop().catch(err => console.log('Cleanup error', err));
      }
    };
  }, [audioRecorder]);

  // Démarrer l'animation de pulsation du bouton micro
  const startPulseAnimation = () => {
    pulseAnim.setValue(1);
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.current.start();
  };

  const stopPulseAnimation = () => {
    if (pulseLoop.current) {
      pulseLoop.current.stop();
    }
    Animated.spring(pulseAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  // Lancement de l'enregistrement
  const startRecording = async () => {
    try {
      // Demander l'autorisation d'accéder au micro
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission requise', 'L\'accès au microphone est nécessaire pour enregistrer un message vocaux.');
        return;
      }

      // Configurer le mode audio pour l'enregistrement
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      console.log('Starting recording...');
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      startPulseAnimation();
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement.');
    }
  };

  // Arrêt de l'enregistrement
  const stopRecording = async () => {
    if (!isRecording) return;

    try {
      console.log('Stopping recording...');
      stopPulseAnimation();

      await audioRecorder.stop();

      // Deactivate recording mode to release the microphone lock
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      const uri = audioRecorder.uri;

      if (uri) {
        setRecordingUri(uri);
        handleGenerate(uri);
      } else {
        Alert.alert('Erreur', 'Impossible de récupérer le fichier audio.');
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Erreur', 'Impossible d\'arrêter l\'enregistrement.');
    }
  };

  // Envoi au backend
  const handleGenerate = async (uri: string) => {
    try {
      setLoading(true);
      const result = await voiceToMeme(uri, culturalContext);
      setMemeData(result);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de générer le mème. Réessayez.');
      console.error('[VoiceToMemeScreen] Erreur backend:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMemeData(null);
    setRecordingUri(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Voice-to-Meme 🎙️</Text>
          <View style={{ width: 40 }} />
        </View>

        {memeData ? (
          <MemePreview
            topText={memeData.topText}
            bottomText={memeData.bottomText}
            transcription={memeData.transcription}
            emoji={memeData.emoji}
            onReset={handleReset}
          />
        ) : (
          <View style={styles.recordContainer}>
            <Text style={styles.description}>
              Appuyez longuement ou touchez pour enregistrer une note vocale (ex: "J'en ai marre du lundi matin"). L'IA transcrira l'audio et en créera un mème.
            </Text>

            {/* Sélecteur culturel */}
            {!isRecording && !loading ? (
              <View style={styles.cultureSelectorContainer}>
                <Text style={styles.cultureSelectorLabel}>🌍 Style d'humour / Région</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cultureRow}
                >
                  {CULTURAL_OPTIONS.map((opt) => {
                    const isSelected = culturalContext === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[
                          styles.cultureTab,
                          isSelected && styles.cultureTabActive,
                        ]}
                        onPress={() => setCulturalContext(opt.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.cultureTabText,
                            isSelected && styles.cultureTabTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Analyse de l'audio et génération du mème...</Text>
              </View>
            ) : (
              <View style={styles.buttonWrapper}>
                <Text style={styles.statusText}>
                  {isRecording ? "Enregistrement en cours..." : "Touchez le micro pour parler"}
                </Text>

                <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]}>
                  <TouchableOpacity
                    style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                    onPress={isRecording ? stopRecording : startRecording}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isRecording ? "stop" : "mic"}
                      size={44}
                      color="#FFF"
                    />
                  </TouchableOpacity>
                </Animated.View>

                {isRecording ? (
                  <Text style={styles.hintText}>Touchez à nouveau pour terminer</Text>
                ) : null}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  recordContainer: {
    flex: 1,
    gap: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 10,
    marginBottom: 40,
  },
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  pulseCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: Colors.error,
    shadowColor: Colors.error,
  },
  hintText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  loadingBox: {
    alignItems: 'center',
    gap: 16,
    marginVertical: 40,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  cultureSelectorContainer: {
    width: '100%',
    gap: 8,
    paddingHorizontal: 4,
  },
  cultureSelectorLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  cultureRow: {
    gap: 8,
    paddingVertical: 4,
  },
  cultureTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  cultureTabActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primary,
  },
  cultureTabText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  cultureTabTextActive: {
    color: '#FFF',
  },
});
