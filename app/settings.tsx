import '@/utils/shim';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Alert, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { ArrowLeft, Eye, EyeOff, Shield, LogOut, Lock, AlertCircle } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { mnemonic, deleteWallet } = useWallet();
  const [showSeed, setShowSeed] = useState(false);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;



  const handleShowSeed = async () => {
    if (showSeed) {
      setShowSeed(false);
      return;
    }

    if (Platform.OS !== 'web') {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (hasHardware && isEnrolled) {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to view recovery phrase',
            fallbackLabel: 'Use passcode',
          });

          if (!result.success) {
            return;
          }
        }
      } catch (error) {
        console.error('Authentication error:', error);
      }
    }

    setShowSeed(true);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez utiliser votre phrase de récupération pour vous reconnecter.');
      if (confirmed) {
        deleteWallet();
        router.replace('/onboarding');
      }
    } else {
      Alert.alert(
        'Se déconnecter',
        'Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez utiliser votre phrase de récupération pour vous reconnecter.',
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Se déconnecter',
            style: 'destructive',
            onPress: () => {
              deleteWallet();
              router.replace('/onboarding');
            },
          },
        ]
      );
    }
  };



  const words = mnemonic?.split(' ') || [];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <View style={styles.backButtonCircle}>
            <ArrowLeft color="#FFF" size={20} strokeWidth={2.5} />
          </View>
        </Pressable>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40, maxWidth: isWideScreen ? 700 : width, width: '100%', alignSelf: 'center' }]}>
        <View style={styles.topGradient} />
        
        <View style={styles.settingsCard}>
          <View style={styles.securitySection}>
            <View style={styles.securityHeader}>
              <View style={styles.iconContainer}>
                <Lock color="#FF8C00" size={24} strokeWidth={2} />
              </View>
              <View style={styles.securityHeaderText}>
                <Text style={styles.securityTitle}>Phrase de Récupération</Text>
                <Text style={styles.securitySubtitle}>Accès sécurisé à votre wallet</Text>
              </View>
            </View>

            <Pressable 
              style={({ pressed }) => [
                styles.actionButton,
                styles.primaryButton,
                pressed && styles.buttonPressed
              ]} 
              onPress={handleShowSeed} 
              testID="toggle-seed-button"
            >
              <View style={styles.buttonContent}>
                {showSeed ? (
                  <EyeOff color="#FFF" size={20} strokeWidth={2.5} />
                ) : (
                  <Eye color="#FFF" size={20} strokeWidth={2.5} />
                )}
                <Text style={styles.primaryButtonText}>
                  {showSeed ? 'Masquer' : 'Afficher'}
                </Text>
              </View>
            </Pressable>
          </View>

          {showSeed && mnemonic && (
            <View style={styles.seedRevealCard}>
              <View style={styles.warningBanner}>
                <AlertCircle color="#FF8C00" size={18} strokeWidth={2.5} />
                <Text style={styles.warningText}>Ne partagez jamais cette phrase</Text>
              </View>
              
              <View style={styles.wordsGrid}>
                {words.map((word, index) => (
                  <View key={index} style={styles.wordChip}>
                    <Text style={styles.wordIndex}>{index + 1}</Text>
                    <Text style={styles.wordValue}>{word}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.dangerZone}>
          <View style={styles.dangerHeader}>
            <AlertCircle color="#FF4444" size={20} strokeWidth={2.5} />
            <Text style={styles.dangerTitle}>Zone Sensible</Text>
          </View>
          
          <Pressable 
            style={({ pressed }) => [
              styles.actionButton,
              styles.dangerButton,
              pressed && styles.dangerButtonPressed
            ]} 
            onPress={handleLogout} 
            testID="logout-button"
          >
            <View style={styles.buttonContent}>
              <LogOut color="#FF4444" size={20} strokeWidth={2.5} />
              <Text style={styles.dangerButtonText}>Se Déconnecter</Text>
            </View>
          </Pressable>
          
          <Text style={styles.dangerHint}>
            Vous devrez utiliser votre phrase de récupération pour vous reconnecter
          </Text>
        </View>

        <View style={styles.footer}>
          <Shield color="#333" size={16} />
          <Text style={styles.footerText}>Bitcoin Wallet • Sécurisé & Décentralisé</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#0A0A0A',
  },
  backButton: {
    padding: 4,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'transparent',
  },
  settingsCard: {
    backgroundColor: '#141414',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  securitySection: {
    marginBottom: 0,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 140, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.2)',
  },
  securityHeaderText: {
    flex: 1,
  },
  securityTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  securitySubtitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500' as const,
  },
  actionButton: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#FF8C00',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  seedRevealCard: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.2)',
  },
  warningText: {
    color: '#FF8C00',
    fontSize: 13,
    fontWeight: '600' as const,
    flex: 1,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  wordChip: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  wordIndex: {
    color: '#FF8C00',
    fontSize: 12,
    fontWeight: '700' as const,
    width: 18,
  },
  wordValue: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600' as const,
    flex: 1,
  },
  dangerZone: {
    backgroundColor: '#141414',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.2)',
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  dangerTitle: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  dangerButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderWidth: 1.5,
    borderColor: '#FF4444',
  },
  dangerButtonPressed: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
  },
  dangerButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  dangerHint: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 20,
    paddingBottom: 20,
  },
  footerText: {
    color: '#444',
    fontSize: 12,
    fontWeight: '500' as const,
  },
});
