import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Fingerprint } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function VerifyAuthScreen() {
  const router = useRouter();
  const { useBiometric, verifyPin, verifyBiometric } = useAuth();
  const [pin, setPin] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showBiometric, setShowBiometric] = useState(false);

  useEffect(() => {
    if (useBiometric) {
      setShowBiometric(true);
      handleBiometricAuth();
    }
  }, [useBiometric]);

  const handleBiometricAuth = async () => {
    setIsLoading(true);
    setError('');

    try {
      const success = await verifyBiometric();
      if (success) {
        router.replace('/wallet');
      } else {
        setError('Authentification échouée. Utilisez votre code PIN.');
        setShowBiometric(false);
      }
    } catch (error) {
      setError('Erreur. Utilisez votre code PIN.');
      setShowBiometric(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 6) {
      setError('Le code PIN doit contenir 6 chiffres');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setIsLoading(true);
    setError('');

    try {
      const success = await verifyPin(pin);
      if (success) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        router.replace('/wallet');
      } else {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setError('Code PIN incorrect');
        setPin('');
      }
    } catch (error) {
      setError('Erreur lors de la vérification');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 6) {
      setPin(numericText);
      setError('');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }



  return (
    <View style={styles.container}>
      <View style={styles.backgroundGlow}>
        <View style={[styles.glowCircle, { top: -80, right: -80 }]} />
        <View style={[styles.glowCircle, { bottom: -80, left: -80 }]} />
      </View>
      <View style={styles.content}>
        {showBiometric ? (
          <>
            <View style={styles.iconContainer}>
              <Fingerprint size={72} color="#FF8C00" strokeWidth={1.5} />
            </View>
            <Text style={styles.title}>Authentification requise</Text>
            <Text style={styles.subtitle}>Utilisez votre empreinte ou Face ID</Text>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={handleBiometricAuth}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>Réessayer la biométrie</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setShowBiometric(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>Utiliser le code PIN</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.lockIconContainer}>
              <View style={styles.lockIconCircle}>
                <Text style={styles.lockIcon}>🔒</Text>
              </View>
            </View>
            <Text style={styles.title}>Entrez votre code PIN</Text>
            <Text style={styles.subtitle}>Saisissez votre code à 6 chiffres</Text>

            <View style={styles.pinContainer}>
              {[...Array(6)].map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.pinDot,
                    pin.length > index && styles.pinDotFilled,
                  ]}
                />
              ))}
            </View>

            <TextInput
              style={styles.pinInputHidden}
              value={pin}
              onChangeText={handlePinChange}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              autoFocus
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, pin.length !== 6 && styles.buttonDisabled]}
                onPress={handlePinSubmit}
                disabled={pin.length !== 6}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>Déverrouiller</Text>
              </TouchableOpacity>

              {useBiometric && (
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => setShowBiometric(true)}
                  activeOpacity={0.85}
                >
                  <Fingerprint size={20} color="#FF8C00" strokeWidth={2} />
                  <Text style={styles.secondaryButtonText}>Utiliser la biométrie</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  backgroundGlow: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glowCircle: {
    position: 'absolute' as const,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#FF8C00',
    opacity: 0.06,
  },
  content: {
    padding: 32,
    alignItems: 'center',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 0, 0.2)',
  },
  lockIconContainer: {
    marginBottom: 32,
  },
  lockIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 0, 0.2)',
  },
  lockIcon: {
    fontSize: 56,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#999',
    marginBottom: 48,
    textAlign: 'center',
  },
  pinContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
    justifyContent: 'center',
  },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#333',
  },
  pinDotFilled: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  pinInputHidden: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    backgroundColor: '#FF8C00',
    padding: 20,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 140, 0, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 0, 0.3)',
    flexDirection: 'row' as const,
    gap: 10,
    shadowOpacity: 0,
  },
  secondaryButtonText: {
    color: '#FF8C00',
    fontSize: 17,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginBottom: 24,
    marginTop: -32,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
});
