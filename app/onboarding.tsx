import '@/utils/shim';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { ArrowRight, Key, RefreshCw } from 'lucide-react-native';

export default function OnboardingScreen() {
  const router = useRouter();
  const { createWallet, restoreWallet, isLoading } = useWallet();
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;
  const [mode, setMode] = useState<'choose' | 'create' | 'restore'>('choose');
  const [mnemonic, setMnemonic] = useState<string>('');
  const [restorePhrase, setRestorePhrase] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateWallet = async () => {
    setIsCreating(true);
    try {
      const phrase = await createWallet();
      setMnemonic(phrase);
      setMode('create');
    } catch (error) {
      console.error('Error creating wallet:', error);
      Alert.alert('Erreur', 'Échec de la création du portefeuille. Veuillez réessayer.');
    } finally {
      setIsCreating(false);
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
      router.replace('/wallet');
    } catch (error) {
      console.error('Error restoring wallet:', error);
      Alert.alert('Erreur', 'Phrase de récupération invalide. Veuillez vérifier et réessayer.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleContinue = () => {
    router.replace('/wallet');
  };

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

  if (mode === 'create') {
    const words = mnemonic.split(' ');

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Phrase de Récupération</Text>
          <Text style={styles.warningText}>
            Notez ces 12 mots dans l'ordre et conservez-les en lieu sûr. Vous en aurez besoin pour récupérer votre portefeuille.
          </Text>

          <View style={styles.seedContainer}>
            {words.map((word, index) => (
              <View key={index} style={styles.seedWord}>
                <Text style={styles.seedNumber}>{index + 1}.</Text>
                <Text style={styles.seedText}>{word}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleContinue}
            testID="continue-button"
          >
            <Text style={styles.primaryButtonText}>J'ai Sauvegardé ma Phrase</Text>
            <ArrowRight color="#000" size={20} />
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
            <>
              <Text style={styles.primaryButtonText}>Restaurer le Portefeuille</Text>
              <ArrowRight color="#000" size={20} />
            </>
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
  warningText: {
    color: '#FF8C00',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  seedContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  seedWord: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seedNumber: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600' as const,
    width: 24,
  },
  seedText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600' as const,
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
});
