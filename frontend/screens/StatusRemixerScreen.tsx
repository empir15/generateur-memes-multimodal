import React, { useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/Colors';
import { remixImage, MemeImageData } from '../services/api';
import MemePreview from '../components/MemePreview';

const CULTURAL_OPTIONS = [
  { id: 'france', label: 'France 🇫🇷' },
  { id: 'quebec', label: 'Québec 🇨🇦' },
  { id: 'belge', label: 'Belgique 🇧🇪' },
  { id: 'afrique', label: 'Côte d\'Ivoire 🇨🇮' },
  { id: 'cameroun', label: 'Cameroun 🇨🇲' },
];

interface StatusRemixerScreenProps {
  onBack: () => void;
}

export default function StatusRemixerScreen({ onBack }: StatusRemixerScreenProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [memeData, setMemeData] = useState<MemeImageData | null>(null);
  const [culturalContext, setCulturalContext] = useState<string>('france');

  // Demander les permissions de la galerie et ouvrir le sélecteur
  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès aux photos est nécessaire pour sélectionner une image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // Forcer le carré (1:1) car idéal pour les mèmes
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setSelectedImage(uri);
        handleGenerate(uri);
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'image de la galerie.');
    }
  };

  // Demander les permissions de l'appareil photo et prendre une photo
  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès à l\'appareil photo est nécessaire pour prendre une photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setSelectedImage(uri);
        handleGenerate(uri);
      }
    } catch (error) {
      console.error('Take photo error:', error);
      Alert.alert('Erreur', 'Impossible de démarrer l\'appareil photo.');
    }
  };

  // Envoi de l'image au backend
  const handleGenerate = async (uri: string) => {
    try {
      setLoading(true);
      const result = await remixImage(uri, culturalContext);
      setMemeData(result);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de générer le mème. Réessayez.');
      console.error('[StatusRemixerScreen] Erreur backend:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMemeData(null);
    setSelectedImage(null);
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
          <Text style={styles.title}>Status Remixer 🖼️</Text>
          <View style={{ width: 40 }} />
        </View>

        {memeData && selectedImage ? (
          <MemePreview
            topText={memeData.topText}
            bottomText={memeData.bottomText}
            imageUri={selectedImage}
            emoji={memeData.emoji}
            onReset={handleReset}
          />
        ) : (
          <View style={styles.content}>
            <Text style={styles.description}>
              Prenez une photo ou importez-en une de votre galerie. L'IA va analyser l'image et y ajouter le texte de mème parfait de façon superposée.
            </Text>

            {/* Sélecteur culturel */}
            {!loading ? (
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
                {selectedImage ? (
                  <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                ) : null}
                <Text style={styles.loadingText}>Analyse de l'image par Gemini Vision...</Text>
              </View>
            ) : (
              <View style={styles.buttonContainer}>
                {/* Bouton Appareil Photo */}
                <TouchableOpacity style={styles.pickerButton} onPress={takePhoto} activeOpacity={0.8}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 159, 67, 0.15)' }]}>
                    <Ionicons name="camera" size={32} color={Colors.tertiary} />
                  </View>
                  <View style={styles.pickerButtonText}>
                    <Text style={styles.pickerTitle}>Prendre une photo</Text>
                    <Text style={styles.pickerSubtitle}>Utilisez votre caméra en direct</Text>
                  </View>
                </TouchableOpacity>

                {/* Bouton Galerie */}
                <TouchableOpacity style={styles.pickerButton} onPress={pickImage} activeOpacity={0.8}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(124, 92, 252, 0.15)' }]}>
                    <Ionicons name="images" size={32} color={Colors.primary} />
                  </View>
                  <View style={styles.pickerButtonText}>
                    <Text style={styles.pickerTitle}>Depuis votre galerie</Text>
                    <Text style={styles.pickerSubtitle}>Choisissez une photo existante</Text>
                  </View>
                </TouchableOpacity>
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
  content: {
    flex: 1,
    gap: 24,
    justifyContent: 'center',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 10,
    marginBottom: 30,
  },
  buttonContainer: {
    gap: 16,
  },
  pickerButton: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  pickerButtonText: {
    flex: 1,
  },
  pickerTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  pickerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  loadingBox: {
    alignItems: 'center',
    gap: 20,
    marginVertical: 20,
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 14,
    opacity: 0.5,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  cultureSelectorContainer: {
    width: '100%',
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
