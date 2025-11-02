import '@/utils/shim';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { useUsername } from '@/contexts/UsernameContext';

export default function SetUsernameScreen() {
  const router = useRouter();
  const { address } = useWallet();
  const { setUsername: saveUsername } = useUsername();
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSetUsername = async () => {
    const cleanUsername = usernameInput.trim().toLowerCase();
    
    if (!cleanUsername) {
      Alert.alert('Erreur', 'Le pseudo est obligatoire');
      return;
    }

    if (cleanUsername.length < 3) {
      Alert.alert('Erreur', 'Le pseudo doit contenir au moins 3 caractères');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      Alert.alert('Erreur', 'Le pseudo ne peut contenir que des lettres, chiffres et underscores');
      return;
    }

    if (!address) {
      Alert.alert('Erreur', 'Adresse non disponible');
      return;
    }

    setIsCreating(true);
    try {
      const success = await saveUsername(cleanUsername, address);
      if (success) {
        router.replace('/wallet');
      } else {
        Alert.alert('Erreur', 'Pseudo déjà pris');
      }
    } catch (error) {
      console.error('Error setting username:', error);
      Alert.alert('Erreur', 'Échec de la définition du pseudo');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundGlow}>
        <View style={[styles.glowCircle, { top: -80, right: -80 }]} />
        <View style={[styles.glowCircle, { bottom: -80, left: -80 }]} />
      </View>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>👤</Text>
        </View>
        <Text style={styles.title}>Choisir un Pseudo</Text>
        <Text style={styles.subtitle}>
          Votre identité unique sur le réseau Bitcoin
        </Text>

        <View style={styles.usernameInputContainer}>
          <Text style={styles.atSymbol}>@</Text>
          <TextInput
            style={styles.usernameInput}
            value={usernameInput}
            onChangeText={setUsernameInput}
            placeholder="pseudo"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
            autoFocus
          />
        </View>

        <View style={styles.hintBox}>
          <Text style={styles.hintIcon}>✨</Text>
          <Text style={styles.hintText}>
            Choisissez un pseudo mémorable. Vous pourrez le modifier par la suite (2 fois gratuitement).
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, isCreating && styles.primaryButtonDisabled]}
            onPress={handleSetUsername}
            disabled={isCreating}
            activeOpacity={0.85}
            testID="confirm-username-button"
          >
            {isCreating ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.primaryButtonText}>Continuer</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    maxWidth: 500,
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
    alignSelf: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 0, 0.2)',
  },
  icon: {
    fontSize: 56,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginBottom: 48,
  },
  buttonContainer: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0.1,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 18,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 0, 0.3)',
  },
  atSymbol: {
    color: '#FF8C00',
    fontSize: 26,
    fontWeight: '800' as const,
    marginRight: 6,
  },
  usernameInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700' as const,
    padding: 0,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 140, 0, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.2)',
    gap: 12,
  },
  hintIcon: {
    fontSize: 20,
  },
  hintText: {
    flex: 1,
    color: '#999',
    fontSize: 13,
    lineHeight: 18,
  },
});
