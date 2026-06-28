/**
 * FaceSwapScreen.tsx
 * Écran pour la nouvelle fonctionnalité "Face Swapper 🎭"
 * Permet d'échanger un visage cible par un visage source (ex: selfie).
 * Intègre la capture camera/galerie pour les deux images.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/Colors';
import { faceSwap } from '../services/api';
import MemePreview from '../components/MemePreview';

interface FaceSwapScreenProps {
  onBack: () => void;
  initialTargetUri?: string;
}

const LOADING_STEPS = [
  { icon: '📤', text: 'Upload des images sur le serveur...' },
  { icon: '🧠', text: 'Détection et transfert du visage par l\'IA...' },
  { icon: '📥', text: 'Récupération du mème modifié...' },
];

export default function FaceSwapScreen({ onBack, initialTargetUri }: FaceSwapScreenProps) {
  const [sourceUri, setSourceUri] = useState<string | null>(null);
  const [targetUri, setTargetUri] = useState<string | null>(initialTargetUri || null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [swappedUri, setSwappedUri] = useState<string | null>(null);

  // Mettre à jour l'image cible si le prop initialTargetUri change
  useEffect(() => {
    if (initialTargetUri) {
      setTargetUri(initialTargetUri);
    }
  }, [initialTargetUri]);

  // Choisir une image depuis la galerie
  const pickImage = async (type: 'source' | 'target') => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès aux photos est requis.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (type === 'source') {
          setSourceUri(uri);
        } else {
          setTargetUri(uri);
        }
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'image.');
    }
  };

  // Prendre une photo
  const takePhoto = async (type: 'source' | 'target') => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès à l\'appareil photo est requis.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (type === 'source') {
          setSourceUri(uri);
        } else {
          setTargetUri(uri);
        }
      }
    } catch (error) {
      console.error('Take photo error:', error);
      Alert.alert('Erreur', 'Impossible de démarrer l\'appareil photo.');
    }
  };

  // Lancement du face swap
  const handleSwap = async () => {
    if (!sourceUri || !targetUri) {
      Alert.alert('Images requises', 'Veuillez sélectionner le visage source et l\'image cible.');
      return;
    }

    try {
      setLoading(true);
      setLoadingStep(0);

      // Simuler les étapes de chargement pour un retour visuel premium
      const timer1 = setTimeout(() => setLoadingStep(1), 3000);
      const timer2 = setTimeout(() => setLoadingStep(2), 7000);

      const base64Result = await faceSwap(sourceUri, targetUri);

      clearTimeout(timer1);
      clearTimeout(timer2);

      setSwappedUri(base64Result);
    } catch (error: any) {
      Alert.alert('Échec de l\'échange', error.message || 'Une erreur est survenue durant le traitement.');
      console.error('[FaceSwapScreen] Erreur backend:', error);
    } finally {
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const handleReset = () => {
    setSwappedUri(null);
    setSourceUri(null);
    setTargetUri(null);
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
          <Text style={styles.title}>Face Swapper 🎭</Text>
          <View style={{ width: 40 }} />
        </View>

        {swappedUri ? (
          // Résultat avec édition du mème (MemePreview)
          <MemePreview
            topText=""
            bottomText=""
            imageUri={swappedUri}
            onReset={handleReset}
          />
        ) : (
          <View style={styles.content}>
            <Text style={styles.description}>
              Insérez le visage d'une personne (visage source) sur un mème existant ou une photo de fond (image cible).
            </Text>

            {loading ? (
              // Loader animé pendant le face swap
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
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
                  ⏱️ Le swap de visage prend environ 10 à 20 secondes.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.pickersContainer}>
                  {/* Picker 1 : Visage Source */}
                  <View style={styles.pickerSection}>
                    <Text style={styles.pickerLabel}>1. Visage Source (à copier) 👤</Text>
                    <View style={styles.previewBox}>
                      {sourceUri ? (
                        <Image source={{ uri: sourceUri }} style={styles.imagePreview} />
                      ) : (
                        <View style={styles.emptyPreview}>
                          <Ionicons name="person-outline" size={40} color={Colors.textMuted} />
                          <Text style={styles.emptyPreviewText}>Aucun visage</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.rowButtons}>
                      <TouchableOpacity style={styles.smallButton} onPress={() => takePhoto('source')} activeOpacity={0.7}>
                        <Ionicons name="camera" size={16} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={styles.smallButtonText}>Photo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.smallButton} onPress={() => pickImage('source')} activeOpacity={0.7}>
                        <Ionicons name="images" size={16} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={styles.smallButtonText}>Galerie</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Picker 2 : Image Cible */}
                  <View style={styles.pickerSection}>
                    <Text style={styles.pickerLabel}>2. Image Cible (à modifier) 🖼️</Text>
                    <View style={styles.previewBox}>
                      {targetUri ? (
                        <Image source={{ uri: targetUri }} style={styles.imagePreview} />
                      ) : (
                        <View style={styles.emptyPreview}>
                          <Ionicons name="image-outline" size={40} color={Colors.textMuted} />
                          <Text style={styles.emptyPreviewText}>Aucune image</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.rowButtons}>
                      <TouchableOpacity style={styles.smallButton} onPress={() => takePhoto('target')} activeOpacity={0.7}>
                        <Ionicons name="camera" size={16} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={styles.smallButtonText}>Photo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.smallButton} onPress={() => pickImage('target')} activeOpacity={0.7}>
                        <Ionicons name="images" size={16} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={styles.smallButtonText}>Galerie</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Bouton pour lancer le swap */}
                <TouchableOpacity
                  onPress={handleSwap}
                  disabled={!sourceUri || !targetUri}
                  activeOpacity={0.85}
                  style={[
                    styles.swapButtonWrapper,
                    (!sourceUri || !targetUri) && styles.disabledWrapper,
                  ]}
                >
                  <LinearGradient
                    colors={Colors.gradients.faceswap}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.swapButton}
                  >
                    <Ionicons name="sparkles" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.swapButtonText}>Échanger les Visages 🎭</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
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
    marginBottom: 20,
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
    marginBottom: 10,
  },
  pickersContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },
  pickerSection: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 12,
  },
  pickerLabel: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  previewBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  emptyPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyPreviewText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
  },
  smallButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
  },
  smallButtonText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  swapButtonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledWrapper: {
    opacity: 0.4,
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  swapButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 24,
    paddingVertical: 40,
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
    borderColor: Colors.primary,
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
