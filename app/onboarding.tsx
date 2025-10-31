import '@/utils/shim';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { useUsername } from '@/contexts/UsernameContext';
import { Key, RefreshCw } from 'lucide-react-native';
import * as ScreenCapture from 'expo-screen-capture';


export default function OnboardingScreen() {
  const router = useRouter();
  const { createWallet, restoreWallet, isLoading, address } = useWallet();
  const { setUsername: saveUsername } = useUsername();

  const [mode, setMode] = useState<'choose' | 'restore' | 'show-seed' | 'set-username'>('choose');
  const [restorePhrase, setRestorePhrase] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [seedWords, setSeedWords] = useState<string[]>([]);

  const [seedConfirmed, setSeedConfirmed] = useState<boolean>(false);
  const [usernameInput, setUsernameInput] = useState<string>('');

  const handleCreateWallet = async () => {
    setIsCreating(true);
    try {
      const mnemonic = await createWallet();
      const words = mnemonic.split(' ');
      setSeedWords(words);
      setMode('show-seed');
      
      if (Platform.OS !== 'web') {
        await ScreenCapture.preventScreenCaptureAsync().catch((error) => {
          console.warn('Failed to prevent screen capture:', error);
        });
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      Alert.alert('Erreur', 'Échec de la création du portefeuille. Veuillez réessayer.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmSeed = () => {
    if (!seedConfirmed) {
      Alert.alert(
        'Confirmation',
        'Avez-vous bien noté vos 12 mots de récupération ? Ils sont nécessaires pour restaurer votre portefeuille.',
        [
          {
            text: 'Non, je veux les revoir',
            style: 'cancel',
          },
          {
            text: 'Oui, j\'ai noté',
            onPress: () => {
              setSeedConfirmed(true);
              setMode('set-username');
            },
          },
        ]
      );
    } else {
      setMode('set-username');
    }
  };



  const handleRestoreWallet = async () => {
    if (!restorePhrase.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre phrase de récupération');
      return;
    }

    const words = restorePhrase.trim().split(/\s+/);
    if (words.length !== 12) {
      Alert.alert('Erreur', 'La phrase de récupération doit contenir 12 mots');
      return;
    }

    setIsCreating(true);
    try {
      await restoreWallet(restorePhrase.trim());
      setMode('set-username');
    } catch (error) {
      console.error('Error restoring wallet:', error);
      Alert.alert('Erreur', 'Phrase de récupération invalide. Veuillez vérifier et réessayer.');
    } finally {
      setIsCreating(false);
    }
  };

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



  useEffect(() => {
    return () => {
      if (Platform.OS !== 'web') {
        ScreenCapture.allowScreenCaptureAsync().catch((error) => {
          console.warn('Failed to allow screen capture:', error);
        });
      }
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  if (mode === 'choose') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoSection}>
            <Image
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/fycv5rxyn7iqfp2lwp4zb' }}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.btcoinSection}>
              <Image
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/rnfr5rxgzfuiivrs9yra2' }}
                style={styles.btcoinLogoImage}
                resizeMode="contain"
              />
              <Text style={styles.btcoinText}>Btcon</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                console.log('Create wallet button pressed');
                handleCreateWallet();
              }}
              disabled={isCreating}
              activeOpacity={0.7}
              testID="create-wallet-button"
            >
              {isCreating ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Nouveau</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                console.log('Restore wallet button pressed');
                setMode('restore');
              }}
              disabled={isCreating}
              activeOpacity={0.7}
              testID="restore-wallet-button"
            >
              <Text style={styles.secondaryButtonText}>Ancien</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (mode === 'set-username') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Choisir un Pseudo</Text>
          <Text style={styles.subtitle}>Créez un pseudo unique commençant par @ (obligatoire)</Text>

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
            Votre pseudo permettra aux autres utilisateurs de vous envoyer des Btcon plus facilement.
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

  if (mode === 'show-seed') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>🔐 Phrase de Récupération</Text>
          <Text style={styles.subtitle}>
            Notez ces 12 mots dans l'ordre. Ils sont la seule façon de récupérer votre portefeuille.
          </Text>

          {Platform.OS === 'web' && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>⚠️ Attention : les captures d'écran ne sont pas bloquées sur le web</Text>
            </View>
          )}

          <View style={styles.seedContainer}>
            <View style={styles.wordsGrid}>
              {seedWords.map((word, index) => (
                <View
                  key={index}
                  style={styles.wordItem}
                >
                  <Text style={styles.wordNumber}>{index + 1}</Text>
                  <Text style={styles.wordText}>{word}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleConfirmSeed}
          >
            <Text style={styles.primaryButtonText}>J'ai noté mes 12 mots</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        <Text style={styles.title}>Restaurer le Portefeuille</Text>
        <Text style={styles.subtitle}>Entrez votre phrase de récupération de 12 mots</Text>

        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          value={restorePhrase}
          onChangeText={setRestorePhrase}
          placeholder="mot1 mot2 mot3 ..."
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleRestoreWallet}
          disabled={isCreating}
          testID="restore-submit-button"
        >
          {isCreating ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.primaryButtonText}>Restaurer le Portefeuille</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => setMode('choose')}
        >
          <Text style={styles.linkText}>Retour</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoImage: {
    width: 180,
    height: 180,
    marginBottom: 30,
  },
  btcoinSection: {
    alignItems: 'center',
  },
  btcoinLogoImage: {
    width: 300,
    height: 120,
    marginBottom: 8,
  },
  btcoinText: {
    color: '#FF8C00',
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 80,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 48,
  },
  buttonContainer: {
    gap: 20,
  },
  primaryButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8C00',
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
  secondaryButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#FF8C00',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#FF8C00',
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  textArea: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
    minHeight: 120,
    marginBottom: 24,
    textAlignVertical: 'top',
  },
  linkButton: {
    padding: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  seedContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    marginVertical: 24,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },

  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  wordItem: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '47%',
    borderWidth: 1,
    borderColor: '#333',
  },
  wordNumber: {
    color: '#666',
    fontSize: 12,
    fontWeight: '700' as const,
    minWidth: 20,
  },
  wordText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600' as const,
    flex: 1,
  },

  warningBox: {
    backgroundColor: '#4A3000',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FF8C00',
  },
  warningText: {
    color: '#FFB84D',
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center',
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
