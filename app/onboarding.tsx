import '@/utils/shim';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { Key, RefreshCw, Copy, Check } from 'lucide-react-native';
import * as ScreenCapture from 'expo-screen-capture';
import * as Clipboard from 'expo-clipboard';

export default function OnboardingScreen() {
  const router = useRouter();
  const { createWallet, restoreWallet, isLoading } = useWallet();

  const [mode, setMode] = useState<'choose' | 'restore' | 'show-seed'>('choose');
  const [restorePhrase, setRestorePhrase] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [seedWords, setSeedWords] = useState<string[]>([]);

  const [seedConfirmed, setSeedConfirmed] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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
              router.replace('/wallet');
            },
          },
        ]
      );
    } else {
      router.replace('/wallet');
    }
  };

  const copyWord = async (word: string, index: number) => {
    await Clipboard.setStringAsync(word);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
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
      router.replace('/wallet');
    } catch (error) {
      console.error('Error restoring wallet:', error);
      Alert.alert('Erreur', 'Phrase de récupération invalide. Veuillez vérifier et réessayer.');
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
          <Text style={styles.logo}>₿</Text>
          <Text style={styles.title}>Portefeuille Btcon</Text>
          <Text style={styles.subtitle}>Votre compagnon Bitcoin</Text>

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
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Key color="#000" size={20} />
                  <Text style={styles.primaryButtonText}>Créer un Portefeuille</Text>
                </>
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
              <RefreshCw color="#FF8C00" size={20} />
                  <Text style={styles.secondaryButtonText}>Restaurer un Portefeuille</Text>
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
                <TouchableOpacity
                  key={index}
                  style={styles.wordItem}
                  onPress={() => copyWord(word, index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.wordNumber}>{index + 1}</Text>
                  <Text style={styles.wordText}>{word}</Text>
                  {copiedIndex === index ? (
                    <Check color="#4CAF50" size={16} />
                  ) : (
                    <Copy color="#666" size={14} />
                  )}
                </TouchableOpacity>
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
  logo: {
    fontSize: 88,
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 48,
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800' as const,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF8C00',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#FF8C00',
    fontSize: 18,
    fontWeight: '800' as const,
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
});
