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
  const { authType, verifyPin, verifyBiometric } = useAuth();
  const [pin, setPin] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (authType === 'biometric') {
      handleBiometricAuth();
    }
  }, [authType]);

  const handleBiometricAuth = async () => {
    setIsLoading(true);
    setError('');

    try {
      const success = await verifyBiometric();
      if (success) {
        router.replace('/wallet');
      } else {
        setError('Authentification échouée');
      }
    } catch (error) {
      setError('Erreur lors de l\'authentification');
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

  if (authType === 'biometric') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Fingerprint size={64} color="#FF8C00" />
          <Text style={styles.title}>Authentification requise</Text>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.button}
            onPress={handleBiometricAuth}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Entrez votre code PIN</Text>

        <TextInput
          style={styles.pinInput}
          value={pin}
          onChangeText={handlePinChange}
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
          placeholder="••••••"
          placeholderTextColor="#666"
          autoFocus
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, pin.length !== 6 && styles.buttonDisabled]}
          onPress={handlePinSubmit}
          disabled={pin.length !== 6}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Déverrouiller</Text>
        </TouchableOpacity>
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
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 40,
    marginTop: 24,
    textAlign: 'center',
  },
  pinInput: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 16,
    padding: 20,
    fontSize: 32,
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: 12,
    width: '100%',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#FF8C00',
    padding: 18,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
});
