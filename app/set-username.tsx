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
      <View style={styles.content}>
        <Text style={styles.title}>Choisir un Pseudo</Text>
        <Text style={styles.subtitle}>
          Choisissez votre pseudo avec soin. Une fois créé, il ne pourra plus être modifié.
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
          />
        </View>

        <Text style={styles.hintText}>
          ⚠️ Attention : Votre pseudo est permanent et ne peut pas être changé après création.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSetUsername}
            disabled={isCreating}
            testID="confirm-username-button"
          >
            {isCreating ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.primaryButtonText}>Confirmer</Text>
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
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 20,
  },
  primaryButton: {
    backgroundColor: '#C17C3A',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C17C3A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginVertical: 24,
    borderWidth: 2,
    borderColor: '#333',
  },
  atSymbol: {
    color: '#FF8C00',
    fontSize: 24,
    fontWeight: '700' as const,
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600' as const,
    padding: 0,
  },
  hintText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
});
