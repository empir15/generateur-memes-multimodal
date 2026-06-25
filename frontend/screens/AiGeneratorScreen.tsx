/**
 * AiGeneratorScreen.tsx
 * Nouvel écran "AI Generator 🎨"
 * L'utilisateur décrit son idée de mème → Gemini crée le prompt image + texte
 * → Pollinations AI génère l'image → Mème final affiché via MemePreview
 */

import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { generateMeme, MemeGeneratedData } from '../services/api';
import MemePreview from '../components/MemePreview';

// ── Sélecteur culturel (identique aux autres écrans) ──────────────────────────
const CULTURAL_OPTIONS = [
  { id: 'france',   label: 'France 🇫🇷' },
  { id: 'quebec',   label: 'Québec 🇨🇦' },
  { id: 'belge',    label: 'Belgique 🇧🇪' },
  { id: 'afrique',  label: 'Côte d\'Ivoire 🇨🇮' },
  { id: 'cameroun', label: 'Cameroun 🇨🇲' },
];

// ── Étapes de génération affichées pendant le chargement ──────────────────────
const LOADING_STEPS = [
  { icon: '🧠', text: 'Analyse de votre idée par Gemini...' },
  { icon: '🎨', text: 'Génération de l\'image par Pollinations AI...' },
  { icon: '✍️', text: 'Assemblage du mème final...' },
];

// ── Exemples de sujets pour inspirer l'utilisateur ───────────────────────────
const EXAMPLE_SUBJECTS = [
  'Mon patron qui arrive en réunion avec 30 min de retard et un café',
  'Mon chat qui me réveille à 5h du matin en semaine',
  'Moi qui vérifie mon salaire le 1er du mois',
  'Mon Wi-Fi qui se coupe pendant un appel important',
];

interface AiGeneratorScreenProps {
  onBack: () => void;
}

export default function AiGeneratorScreen({ onBack }: AiGeneratorScreenProps) {
  const [subject, setSubject]               = useState('');
  const [loading, setLoading]               = useState(false);
  const [loadingStep, setLoadingStep]       = useState(0);
  const [memeData, setMemeData]             = useState<MemeGeneratedData | null>(null);
  const [culturalContext, setCulturalContext] = useState<string>('france');

  // ── Génération du mème ─────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!subject.trim()) {
      Alert.alert('Idée requise', 'Décrivez votre idée de mème avant de générer.');
      return;
    }

    try {
      setLoading(true);
      setLoadingStep(0);

      // Simuler la progression des étapes visuellement
      const stepTimer1 = setTimeout(() => setLoadingStep(1), 3000);
      const stepTimer2 = setTimeout(() => setLoadingStep(2), 8000);

      const result = await generateMeme(subject.trim(), culturalContext);

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      setMemeData(result);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de générer le mème. Réessayez.');
      console.error('[AiGeneratorScreen] Erreur:', error);
    } finally {
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const handleReset = () => {
    setMemeData(null);
    setSubject('');
  };

  const useExample = (example: string) => {
    setSubject(example);
  };

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>AI Generator 🎨</Text>
            <View style={{ width: 40 }} />
          </View>

          {memeData ? (
            // ── Résultat ──
            <MemePreview
              topText={memeData.topText}
              bottomText={memeData.bottomText}
              imageUri={memeData.imageBase64}
              emoji={memeData.emoji}
              onReset={handleReset}
            />
          ) : (
            <View style={styles.content}>
              <Text style={styles.description}>
                Décrivez votre idée de mème en français. L'IA va générer l'image et y ajouter le texte parfait.
              </Text>

              {/* ── Sélecteur culturel ── */}
              {!loading && (
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
                          style={[styles.cultureTab, isSelected && styles.cultureTabActive]}
                          onPress={() => setCulturalContext(opt.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.cultureTabText, isSelected && styles.cultureTabTextActive]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* ── Zone de saisie ── */}
              {!loading ? (
                <>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ex : Mon patron qui arrive en retard avec un café et un grand sourire..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    numberOfLines={4}
                    value={subject}
                    onChangeText={setSubject}
                    maxLength={300}
                  />
                  <Text style={styles.charCount}>{subject.length}/300</Text>

                  {/* ── Exemples d'inspiration ── */}
                  <View style={styles.examplesContainer}>
                    <Text style={styles.examplesLabel}>💡 Besoin d'inspiration ?</Text>
                    {EXAMPLE_SUBJECTS.map((example, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.exampleChip}
                        onPress={() => useExample(example)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="bulb-outline" size={14} color={Colors.secondary} style={{ marginRight: 8 }} />
                        <Text style={styles.exampleChipText} numberOfLines={1}>{example}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* ── Bouton générer ── */}
                  <TouchableOpacity
                    onPress={handleGenerate}
                    disabled={!subject.trim()}
                    activeOpacity={0.85}
                    style={[styles.generateButtonWrapper, !subject.trim() && styles.disabledWrapper]}
                  >
                    <LinearGradient
                      colors={Colors.gradients.generate}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.generateButton}
                    >
                      <Ionicons name="sparkles" size={20} color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.generateButtonText}>Générer le Mème ✨</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                // ── Chargement animé ──
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.secondary} />
                  <View style={styles.loadingStepsContainer}>
                    {LOADING_STEPS.map((step, index) => (
                      <View
                        key={index}
                        style={[
                          styles.loadingStep,
                          index === loadingStep && styles.loadingStepActive,
                          index < loadingStep && styles.loadingStepDone,
                        ]}
                      >
                        <Text style={styles.loadingStepIcon}>{step.icon}</Text>
                        <Text
                          style={[
                            styles.loadingStepText,
                            index === loadingStep && styles.loadingStepTextActive,
                            index < loadingStep && styles.loadingStepTextDone,
                          ]}
                        >
                          {step.text}
                        </Text>
                        {index < loadingStep && (
                          <Ionicons name="checkmark-circle" size={16} color={Colors.success} style={{ marginLeft: 6 }} />
                        )}
                      </View>
                    ))}
                  </View>
                  <Text style={styles.loadingNote}>
                    ⏱️ La génération prend environ 15-25 secondes
                  </Text>
                </View>
              )}
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

  // ── Header ──
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

  // ── Content ──
  content: {
    flex: 1,
    gap: 20,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 10,
  },

  // ── Sélecteur culturel ──
  cultureSelectorContainer: {
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

  // ── Saisie ──
  textInput: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    color: Colors.textPrimary,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: -14,
  },

  // ── Exemples ──
  examplesContainer: {
    gap: 8,
  },
  examplesLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  exampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  exampleChipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },

  // ── Bouton générer ──
  generateButtonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledWrapper: {
    opacity: 0.4,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Chargement ──
  loadingContainer: {
    alignItems: 'center',
    gap: 24,
    paddingVertical: 20,
  },
  loadingStepsContainer: {
    width: '100%',
    gap: 12,
  },
  loadingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    opacity: 0.4,
  },
  loadingStepActive: {
    opacity: 1,
    borderColor: Colors.secondary,
    backgroundColor: Colors.surfaceElevated,
  },
  loadingStepDone: {
    opacity: 0.7,
    borderColor: Colors.success,
  },
  loadingStepIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  loadingStepText: {
    color: Colors.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  loadingStepTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  loadingStepTextDone: {
    color: Colors.textMuted,
  },
  loadingNote: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
