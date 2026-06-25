import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../constants/Colors';
import { analyzeText, MemeTextData } from '../services/api';
import MemePreview from '../components/MemePreview';

const CULTURAL_OPTIONS = [
  { id: 'france', label: 'France 🇫🇷' },
  { id: 'quebec', label: 'Québec 🇨🇦' },
  { id: 'belge', label: 'Belgique 🇧🇪' },
  { id: 'afrique', label: 'Côte d\'Ivoire 🇨🇮' },
  { id: 'cameroun', label: 'Cameroun 🇨🇲' },
];

interface ContextReaderScreenProps {
  onBack: () => void;
  initialText?: string; // Texte pré-rempli depuis le clipboard (Share Intent)
}

export default function ContextReaderScreen({ onBack, initialText }: ContextReaderScreenProps) {
  const [textInput, setTextInput] = useState(initialText || '');
  const [loading, setLoading] = useState(false);
  const [memeData, setMemeData] = useState<MemeTextData | null>(null);
  const [culturalContext, setCulturalContext] = useState<string>('france');

  // Si un texte initial est fourni (depuis clipboard), lancer la génération automatiquement
  useEffect(() => {
    if (initialText && initialText.trim()) {
      setTextInput(initialText);
      // Léger délai pour laisser le composant se monter
      const timer = setTimeout(() => {
        handleGenerate(initialText);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [initialText]);

  // Coller depuis le presse-papiers manuellement
  const handlePaste = async () => {
    try {
      const hasText = await Clipboard.hasStringAsync();
      if (!hasText) {
        Alert.alert('Presse-papiers vide', 'Aucun texte trouvé dans le presse-papiers.');
        return;
      }
      const text = await Clipboard.getStringAsync();
      if (text) {
        setTextInput(text);
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de lire le presse-papiers.');
    }
  };

  const handleGenerate = async (overrideText?: string) => {
    const textToAnalyze = overrideText || textInput;
    if (!textToAnalyze.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un texte à analyser.');
      return;
    }

    try {
      setLoading(true);
      const result = await analyzeText(textToAnalyze, culturalContext);
      setMemeData(result);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de générer le mème. Réessayez.');
      console.error('[ContextReaderScreen] Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMemeData(null);
    setTextInput('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Context Reader ✍️</Text>
            <View style={{ width: 40 }} />
          </View>

          {memeData ? (
            <MemePreview
              topText={memeData.topText}
              bottomText={memeData.bottomText}
              templateStyle={memeData.templateStyle}
              emoji={memeData.emoji}
              onReset={handleReset}
            />
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.description}>
                Collez un message, une citation ou décrivez une situation embarrassante. L'IA va capter le ton pour en faire un mème parfait.
              </Text>

              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Exemple : Mon collègue m'a dit 'bon courage pour ta présentation' avec un grand sourire puis est parti..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={6}
                  value={textInput}
                  onChangeText={setTextInput}
                  maxLength={500}
                />
                {/* Bouton Coller depuis presse-papiers */}
                <TouchableOpacity style={styles.pasteButton} onPress={handlePaste} activeOpacity={0.7}>
                  <Ionicons name="clipboard-outline" size={16} color={Colors.primary} />
                  <Text style={styles.pasteButtonText}>Coller</Text>
                </TouchableOpacity>
              </View>

              {/* Sélecteur culturel */}
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

              <TouchableOpacity
                style={[styles.generateButton, !textInput.trim() && styles.disabledButton]}
                onPress={() => handleGenerate()}
                disabled={loading || !textInput.trim()}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color="#FFF" style={styles.buttonIcon} />
                    <Text style={styles.generateButtonText}>Générer le Mème</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
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
  formContainer: {
    gap: 20,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
  },
  textInputContainer: {
    position: 'relative',
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    paddingBottom: 42, // espace pour le bouton Coller
    color: Colors.textPrimary,
    fontSize: 15,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  pasteButton: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.borderActive,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  pasteButtonText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  generateButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: Colors.surfaceElevated,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cultureSelectorContainer: {
    marginVertical: 10,
    gap: 8,
  },
  cultureSelectorLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
