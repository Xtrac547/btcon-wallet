import { useState } from 'react';
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

export default function SetupAuthScreen() {
  const router = useRouter();
  const { setupPinAuth, isBiometricAvailable } = useAuth();
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [step, setStep] = useState<'enter-pin' | 'confirm-pin' | 'choose-biometric'>('enter-pin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');



  const handlePinSubmit = () => {
    if (pin.length !== 6) {
      setError('Le code PIN doit contenir 6 chiffres');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setStep('confirm-pin');
    setError('');
  };

  const handleConfirmPinSubmit = () => {
    if (confirmPin !== pin) {
      setError('Les codes PIN ne correspondent pas');
      setConfirmPin('');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    if (isBiometricAvailable) {
      setStep('choose-biometric');
    } else {
      handleSetupComplete(false);
    }
  };

  const handleSetupComplete = async (enableBiometric: boolean) => {
    setIsLoading(true);
    setError('');

    try {
      await setupPinAuth(pin, enableBiometric);
      router.replace('/set-username');
    } catch (error) {
      setError('Erreur lors de la configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (text: string, isConfirm: boolean = false) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 6) {
      if (isConfirm) {
        setConfirmPin(numericText);
      } else {
        setPin(numericText);
      }
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

  if (step === 'choose-biometric') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Fingerprint size={64} color="#FF8C00" />
          <Text style={styles.title}>Activer la biométrie ?</Text>
          <Text style={styles.subtitle}>
            Vous pourrez utiliser votre empreinte digitale ou Face ID en plus du code PIN
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync();
                }
                handleSetupComplete(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.optionButtonText}>Activer la biométrie</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, styles.secondaryButton]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync();
                }
                handleSetupComplete(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Code PIN uniquement</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </View>
    );
  }

  if (step === 'enter-pin') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Créer un code PIN</Text>
          <Text style={styles.subtitle}>Entrez un code à 6 chiffres</Text>

          <TextInput
            style={styles.pinInput}
            value={pin}
            onChangeText={(text) => handlePinChange(text, false)}
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
            <Text style={styles.buttonText}>Continuer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Confirmer le code PIN</Text>
        <Text style={styles.subtitle}>Entrez à nouveau votre code</Text>

        <TextInput
          style={styles.pinInput}
          value={confirmPin}
          onChangeText={(text) => handlePinChange(text, true)}
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
          placeholder="••••••"
          placeholderTextColor="#666"
          autoFocus
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, confirmPin.length !== 6 && styles.buttonDisabled]}
          onPress={handleConfirmPinSubmit}
          disabled={confirmPin.length !== 6}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Confirmer</Text>
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
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  optionButton: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  optionButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF8C00',
  },
  secondaryButtonText: {
    color: '#FF8C00',
    fontSize: 18,
    fontWeight: '600',
  },
  icon: {
    marginRight: 8,
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
