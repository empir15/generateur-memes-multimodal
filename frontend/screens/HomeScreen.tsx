import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface HomeScreenProps {
  onNavigate: (screen: 'home' | 'text' | 'voice' | 'image' | 'generate' | 'faceswap') => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>MemeGen AI 🎭</Text>
          <Text style={styles.appSubtitle}>
            Transformez vos idées, votre voix et vos photos en mèmes hilarants grâce à l'IA.
          </Text>
        </View>

        {/* Feature Cards */}
        <View style={styles.cardContainer}>
          {/* 1. Context Reader */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => onNavigate('text')}
          >
            <LinearGradient
              colors={Colors.gradients.text as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="chatbubble-ellipses-outline" size={32} color="#FFF" />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Context Reader ✍️</Text>
                  <Text style={styles.cardDescription}>
                    Générez un mème textuel adapté au ton de votre conversation ou message.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFF" style={styles.arrow} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* 2. Voice-to-Meme */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => onNavigate('voice')}
          >
            <LinearGradient
              colors={Colors.gradients.voice as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="mic-outline" size={32} color="#FFF" />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Voice-to-Meme 🎙️</Text>
                  <Text style={styles.cardDescription}>
                    Parlez dans le micro, l'IA transcrit vos paroles et génère le mème parfait.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFF" style={styles.arrow} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* 3. Status Remixer */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => onNavigate('image')}
          >
            <LinearGradient
              colors={Colors.gradients.image as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="image-outline" size={32} color="#FFF" />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Status Remixer 🖼️</Text>
                  <Text style={styles.cardDescription}>
                    Prenez ou choisissez une image, et laissez l'IA y ajouter une punchline drôle.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFF" style={styles.arrow} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* 4. AI Generator */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => onNavigate('generate')}
          >
            <LinearGradient
              colors={Colors.gradients.generate as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="color-wand-outline" size={32} color="#FFF" />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>AI Generator 🎨</Text>
                  <Text style={styles.cardDescription}>
                    Décrivez votre idée et l'IA génère l'image du mème à partir de zéro.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFF" style={styles.arrow} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* 5. Face Swapper */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => onNavigate('faceswap')}
          >
            <LinearGradient
              colors={Colors.gradients.faceswap as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="people-outline" size={32} color="#FFF" />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Face Swapper 🎭</Text>
                  <Text style={styles.cardDescription}>
                    Échangez le visage d'un mème généré ou d'une photo par le visage de votre choix.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFF" style={styles.arrow} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Projet Académique — ICT202 G1</Text>
        </View>
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
    paddingTop: 40,
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  cardContainer: {
    gap: 20,
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  cardGradient: {
    padding: 24,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextContainer: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 18,
  },
  arrow: {
    opacity: 0.8,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});
