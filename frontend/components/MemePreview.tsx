/**
 * MemePreview.tsx
 * Composant affiché après génération du mème.
 * Affiche le MemeCanvas + bouton "Partager" + bouton "Nouveau Mème".
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import MemeCanvas from './MemeCanvas';
import { Colors } from '../constants/Colors';

interface MemePreviewProps {
  topText: string;
  bottomText: string;
  templateStyle?: string;
  imageUri?: string;
  emoji?: string;
  transcription?: string;   // Pour Voice-to-Meme
  onReset: () => void;
  onFaceSwap?: (imageUri: string) => void;
}

const colorChoices = [
  { name: 'Blanc', value: '#FFFFFF' },
  { name: 'Jaune', value: '#FFEB3B' },
  { name: 'Rouge', value: '#F44336' },
  { name: 'Cyan', value: '#00E5FF' },
  { name: 'Vert', value: '#00E676' },
  { name: 'Noir', value: '#000000' },
];

export default function MemePreview({
  topText,
  bottomText,
  templateStyle,
  imageUri,
  emoji,
  transcription,
  onReset,
  onFaceSwap,
}: MemePreviewProps) {
  const viewShotRef = useRef<React.ElementRef<typeof ViewShot>>(null);
  const [sharing, setSharing] = useState(false);

  // States pour la personnalisation du style
  const [textColor, setTextColor] = useState<string>('');
  const [fontSizeTop, setFontSizeTop] = useState<number>(20);
  const [fontSizeBottom, setFontSizeBottom] = useState<number>(22);
  const [hasShadow, setHasShadow] = useState<boolean>(true);
  const [textCase, setTextCase] = useState<'uppercase' | 'none'>('uppercase');
  const [showEditor, setShowEditor] = useState<boolean>(false);

  const increaseSizeTop = () => setFontSizeTop((prev) => Math.min(prev + 2, 40));
  const decreaseSizeTop = () => setFontSizeTop((prev) => Math.max(prev - 2, 12));
  const increaseSizeBottom = () => setFontSizeBottom((prev) => Math.min(prev + 2, 40));
  const decreaseSizeBottom = () => setFontSizeBottom((prev) => Math.max(prev - 2, 12));

  /**
   * Capture le MemeCanvas en image PNG, puis ouvre le menu de partage natif Android
   */
  const handleShare = async () => {
    try {
      setSharing(true);

      // Capture de la vue en PNG
      const uri = await viewShotRef.current!.capture!();

      // Vérifie si le partage est disponible
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Partage indisponible', 'Le partage n\'est pas disponible sur cet appareil.');
        return;
      }

      // Ouvre le menu de partage natif Android
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Partager votre mème 🎭',
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager le mème. Réessayez.');
      console.error('[MemePreview] Erreur partage:', error);
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Transcription (Voice-to-Meme uniquement) */}
      {transcription ? (
        <View style={styles.transcriptionBox}>
          <Text style={styles.transcriptionLabel}>🎙️ Transcription</Text>
          <Text style={styles.transcriptionText}>"{transcription}"</Text>
        </View>
      ) : null}

      {/* Mème capturé avec ViewShot */}
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }} style={styles.viewShot}>
        <MemeCanvas
          topText={topText}
          bottomText={bottomText}
          templateStyle={templateStyle}
          imageUri={imageUri}
          emoji={emoji}
          textColor={textColor || undefined}
          fontSizeTop={fontSizeTop}
          fontSizeBottom={fontSizeBottom}
          hasShadow={hasShadow}
          textCase={textCase}
        />
      </ViewShot>

      {/* Bouton pour afficher/masquer le panneau de style */}
      <TouchableOpacity
        style={styles.editorToggleButton}
        onPress={() => setShowEditor(!showEditor)}
        activeOpacity={0.8}
      >
        <Ionicons name="color-wand-outline" size={18} color={Colors.primaryLight} style={{ marginRight: 6 }} />
        <Text style={styles.editorToggleText}>
          {showEditor ? 'Masquer les options de style' : 'Personnaliser le style du texte'}
        </Text>
        <Ionicons
          name={showEditor ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.primaryLight}
          style={{ marginLeft: 6 }}
        />
      </TouchableOpacity>

      {showEditor ? (
        <View style={styles.editorPanel}>
          {/* 1. Sélection de la couleur */}
          <View style={styles.editorSection}>
            <Text style={styles.sectionLabel}>Couleur du texte</Text>
            <View style={styles.colorRow}>
              {colorChoices.map((choice) => {
                const isSelected =
                  textColor === choice.value || (textColor === '' && choice.value === '#FFFFFF');
                return (
                  <TouchableOpacity
                    key={choice.value}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: choice.value },
                      isSelected && styles.colorCircleSelected,
                    ]}
                    onPress={() => setTextColor(choice.value)}
                    activeOpacity={0.7}
                  />
                );
              })}
            </View>
          </View>

          {/* 2. Taille du texte (Haut et Bas) */}
          <View style={styles.sizeSection}>
            <View style={styles.sizeControl}>
              <Text style={styles.sectionLabel}>Taille Haut ({fontSizeTop}px)</Text>
              <View style={styles.btnGroup}>
                <TouchableOpacity style={styles.sizeBtn} onPress={decreaseSizeTop}>
                  <Text style={styles.sizeBtnText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sizeBtn} onPress={increaseSizeTop}>
                  <Text style={styles.sizeBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sizeControl}>
              <Text style={styles.sectionLabel}>Taille Bas ({fontSizeBottom}px)</Text>
              <View style={styles.btnGroup}>
                <TouchableOpacity style={styles.sizeBtn} onPress={decreaseSizeBottom}>
                  <Text style={styles.sizeBtnText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sizeBtn} onPress={increaseSizeBottom}>
                  <Text style={styles.sizeBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 3. Autres options (Contour et Casse) */}
          <View style={styles.optionsRow}>
            {/* Ombre / Contour */}
            <TouchableOpacity
              style={[styles.toggleOptionBtn, hasShadow && styles.toggleOptionBtnActive]}
              onPress={() => setHasShadow(!hasShadow)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={hasShadow ? 'eye-outline' : 'eye-off-outline'}
                size={16}
                color={hasShadow ? '#FFF' : Colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.toggleOptionText, hasShadow && styles.toggleOptionTextActive]}>
                Contour noir
              </Text>
            </TouchableOpacity>

            {/* Casse */}
            <TouchableOpacity
              style={[styles.toggleOptionBtn, textCase === 'uppercase' && styles.toggleOptionBtnActive]}
              onPress={() => setTextCase((prev) => (prev === 'uppercase' ? 'none' : 'uppercase'))}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleOptionText,
                  textCase === 'uppercase' && styles.toggleOptionTextActive,
                  { fontWeight: 'bold', marginRight: 6 },
                ]}
              >
                aA
              </Text>
              <Text style={[styles.toggleOptionText, textCase === 'uppercase' && styles.toggleOptionTextActive]}>
                MAJUSCULES
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Boutons d'action */}
      <View style={styles.actions}>
        {/* Bouton Partager */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          disabled={sharing}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={Colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shareGradient}
          >
            {sharing ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.shareText}>📤 Partager</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Bouton Face Swap (si image présente et callback dispo) */}
        {imageUri && onFaceSwap ? (
          <TouchableOpacity
            style={styles.faceSwapButton}
            onPress={() => onFaceSwap(imageUri)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={Colors.gradients.faceswap}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.faceSwapGradient}
            >
              <Text style={styles.faceSwapText}>🎭 Échanger le visage</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}

        {/* Bouton Nouveau */}
        <TouchableOpacity style={styles.resetButton} onPress={onReset} activeOpacity={0.8}>
          <Text style={styles.resetText}>🔄 Nouveau mème</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  viewShot: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  transcriptionBox: {
    width: '100%',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  transcriptionLabel: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  transcriptionText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  shareButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  shareGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resetButton: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  faceSwapButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  faceSwapGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceSwapText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  editorToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    width: '100%',
    marginVertical: 4,
  },
  editorToggleText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  editorPanel: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    gap: 16,
  },
  editorSection: {
    gap: 8,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  colorCircleSelected: {
    borderColor: Colors.primary,
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  sizeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  sizeControl: {
    flex: 1,
    gap: 8,
  },
  btnGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  sizeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  sizeBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
  },
  toggleOptionBtnActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primary,
  },
  toggleOptionText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  toggleOptionTextActive: {
    color: '#FFF',
  },
});
