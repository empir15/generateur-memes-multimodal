/**
 * MemeCanvas.tsx
 * Composant qui affiche le mème final : image de fond (ou dégradé) + texte superposé style mème.
 * Peut être capturé en image via react-native-view-shot (ref passée depuis le parent).
 */

import React, { forwardRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ImageSourcePropType,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MemeTemplateStyles } from '../constants/Colors';

interface MemeCanvasProps {
  topText: string;
  bottomText: string;
  templateStyle?: string;       // 'dark' | 'light' | 'gradient-purple' | 'gradient-orange'
  imageUri?: string;            // URI de l'image (Status Remixer)
  emoji?: string;
  style?: ViewStyle;
  textColor?: string;
  fontSizeTop?: number;
  fontSizeBottom?: number;
  hasShadow?: boolean;
  textCase?: 'uppercase' | 'none';
}

/**
 * MemeCanvas — Composant principal de rendu du mème.
 * Utilise forwardRef pour que le parent puisse capturer la vue avec ViewShot.
 */
const MemeCanvas = forwardRef<View, MemeCanvasProps>(
  (
    {
      topText,
      bottomText,
      templateStyle = 'gradient-purple',
      imageUri,
      emoji,
      style,
      textColor,
      fontSizeTop,
      fontSizeBottom,
      hasShadow = true,
      textCase = 'uppercase',
    },
    ref
  ) => {
    const templateColors = MemeTemplateStyles[templateStyle] || MemeTemplateStyles['gradient-purple'];
    const activeTextColor = textColor || templateColors.textColor;

    const shadowStyle = hasShadow
      ? {
          textShadowColor: 'rgba(0,0,0,0.9)',
          textShadowOffset: { width: 2, height: 2 },
          textShadowRadius: 4,
        }
      : {
          textShadowColor: 'transparent',
          textShadowRadius: 0,
        };

    return (
      <View ref={ref} style={[styles.container, style]} collapsable={false}>
        {/* Fond : image si fournie, sinon dégradé */}
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.backgroundImage} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={templateColors.bg as any}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}

        {/* Overlay sombre sur l'image pour lisibilité du texte */}
        {imageUri ? <View style={styles.imageOverlay} /> : null}

        {/* Texte du haut */}
        {topText ? (
          <View style={styles.topTextContainer}>
            <Text
              style={[
                styles.memeText,
                styles.topText,
                { color: activeTextColor, fontSize: fontSizeTop || 20 },
                shadowStyle,
              ]}
            >
              {textCase === 'uppercase' ? topText.toUpperCase() : topText}
            </Text>
          </View>
        ) : null}

        {/* Emoji central (affiché uniquement si pas d'image) */}
        {!imageUri && !!emoji ? (
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>
        ) : null}

        {/* Texte du bas */}
        {bottomText ? (
          <View style={styles.bottomTextContainer}>
            <Text
              style={[
                styles.memeText,
                styles.bottomText,
                { color: activeTextColor, fontSize: fontSizeBottom || 22 },
                shadowStyle,
              ]}
            >
              {textCase === 'uppercase' ? bottomText.toUpperCase() : bottomText}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }
);

MemeCanvas.displayName = 'MemeCanvas';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  topTextContainer: {
    width: '100%',
    paddingHorizontal: 12,
    paddingTop: 16,
    alignItems: 'center',
  },
  bottomTextContainer: {
    width: '100%',
    paddingHorizontal: 12,
    paddingBottom: 16,
    alignItems: 'center',
  },
  memeText: {
    fontFamily: 'System',
    fontWeight: '900',
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 1,
    // Contour noir autour du texte (effet mème classique)
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  topText: {
    fontSize: 20,
  },
  bottomText: {
    fontSize: 22,
  },
  emojiContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 72,
  },
});

export default MemeCanvas;
