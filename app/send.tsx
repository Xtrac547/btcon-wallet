import '@/utils/shim';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, Modal, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { useUsername } from '@/contexts/UsernameContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { ArrowLeft, Send, QrCode, X } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function SendScreen() {
  const router = useRouter();
  const { balance, signAndBroadcastTransaction, esploraService } = useWallet();
  const { username, getAddressForUsername } = useUsername();
  const { notifyTransaction } = useNotifications();
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;

  useEffect(() => {
    if (!username) {
      router.replace('/set-username');
    }
  }, [username]);
  const [toAddress, setToAddress] = useState('');
  const [tokenCounts, setTokenCounts] = useState<{ [key: number]: number }>({
    1000: 0,
    5000: 0,
    50000: 0,
  });
  const [isSending, setIsSending] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();


  const tokenAmounts = [
    { value: 1000, shape: 'circle' as const },
    { value: 5000, shape: 'circle' as const },
    { value: 50000, shape: 'square' as const },
  ];

  const formatBalance = (sats: number): string => {
    const btcon = (sats / 100000000) * 100000000;
    return Math.floor(btcon).toString();
  };

  const getTotalAmount = (): number => {
    return Object.entries(tokenCounts).reduce((total, [value, count]) => {
      return total + (Number(value) * count);
    }, 0);
  };

  const handleTokenPress = (value: number) => {
    setTokenCounts(prev => ({
      ...prev,
      [value]: prev[value] + 1,
    }));
  };

  const handleTokenLongPress = (value: number) => {
    setTokenCounts(prev => ({
      ...prev,
      [value]: 0,
    }));
  };

  const resetAllTokens = () => {
    setTokenCounts({
      1000: 0,
      5000: 0,
      50000: 0,
    });
  };

  const handleSend = async () => {
    if (!toAddress.trim()) {
      Alert.alert('Error', 'Veuillez entrer une adresse ou un pseudo');
      return;
    }

    let resolvedAddress = toAddress.trim();
    
    if (resolvedAddress.startsWith('@')) {
      const username = resolvedAddress.substring(1);
      const address = await getAddressForUsername(username);
      if (!address) {
        Alert.alert('Error', 'Pseudo introuvable');
        return;
      }
      resolvedAddress = address;
    } else if (!resolvedAddress.startsWith('bc1') && !resolvedAddress.startsWith('tb1')) {
      const address = await getAddressForUsername(resolvedAddress);
      if (address) {
        resolvedAddress = address;
      }
    }

    const totalAmount = getTotalAmount();

    if (totalAmount === 0) {
      Alert.alert('Error', 'Veuillez sélectionner un montant');
      return;
    }

    const btconAmount = totalAmount;
    const satsAmount = Math.floor((btconAmount / 100000000) * 100000000);

    if (satsAmount > balance) {
      Alert.alert('Error', 'Fonds insuffisants');
      return;
    }

    if (satsAmount < 546) {
      Alert.alert('Error', 'Montant trop petit');
      return;
    }

    Alert.alert(
      'Confirmer',
      `Envoyer ${Math.floor(btconAmount)} Btcon (${(satsAmount / 100000000).toFixed(8)} BTC) à ${toAddress.startsWith('@') ? toAddress : resolvedAddress.slice(0, 10) + '...'}?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Envoyer',
          onPress: async () => {
            setIsSending(true);
            try {
              const txid = await signAndBroadcastTransaction(resolvedAddress, satsAmount);
              const explorerUrl = esploraService.getExplorerUrl(txid);
              
              await notifyTransaction('sent', btconAmount);
              
              Alert.alert(
                'Transaction envoyée',
                `Transaction ID: ${txid.slice(0, 10)}...\n\nVoir sur l'explorer: ${explorerUrl}`,
                [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]
              );

              setToAddress('');
              resetAllTokens();
            } catch (error) {
              console.error('Error sending transaction:', error);
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send transaction');
            } finally {
              setIsSending(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission refusée', 'Veuillez autoriser l\'accès à la caméra');
        return;
      }
    }
    setShowScanner(true);
  };

  const handleBarcodeScanned = (data: string) => {
    setShowScanner(false);
    let address = data;
    if (address.toLowerCase().startsWith('bitcoin:')) {
      address = address.substring(8).split('?')[0];
    }
    setToAddress(address);
  };

  const contentMaxWidth = isWideScreen ? 800 : width;
  const contentPadding = isWideScreen ? 40 : 24;

  return (
    <View style={styles.container}>
      <View style={styles.backgroundPattern}>
        {[...Array(20)].map((_, i) => (
          <View
            key={`pattern-${i}`}
            style={[
              i % 3 === 0 ? styles.patternCircle : styles.patternSquare,
              {
                width: 40 + (i % 3) * 30,
                height: 40 + (i % 3) * 30,
                left: (i * 70) % width,
                top: Math.floor(i / 4) * 180 + 50,
                transform: [{ rotate: `${i * 15}deg` }],
              },
            ]}
          />
        ))}
      </View>
      <View style={[styles.header, isWideScreen && styles.headerWide]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Envoyer</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.content, { paddingHorizontal: contentPadding, maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {getTotalAmount() === 0 && (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Solde disponible</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>{formatBalance(balance)}</Text>
              <Text style={styles.balanceUnit}>Btcon</Text>
            </View>
            <Text style={styles.balanceSats}>{(balance / 100000000).toFixed(8)} BTC</Text>
          </View>
        )}

        <View style={styles.formCard}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Destinataire</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={toAddress}
                onChangeText={setToAddress}
                placeholder="@pseudo, adresse BTC ou scanner QR"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.scanButton}
                onPress={handleOpenScanner}
                testID="scan-qr-button"
              >
                <QrCode color="#FF8C00" size={24} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Sélectionner le montant</Text>
              {getTotalAmount() > 0 && (
                <TouchableOpacity onPress={resetAllTokens} style={styles.resetButton}>
                  <Text style={styles.resetText}>Réinitialiser</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={[styles.tokensContainer, isWideScreen && styles.tokensContainerWide]}>
              <View style={styles.topTokensRow}>
                {tokenAmounts.filter(token => token.value !== 50000).map((token, index) => (
                  <View key={index} style={styles.tokenWrapper}>
                    <TouchableOpacity
                      style={[
                        token.shape === 'circle' ? styles.tokenCircle : styles.tokenSquare,
                        token.value === 1000 && styles.token1000,
                        token.value === 5000 && styles.token5000,
                        tokenCounts[token.value] > 0 && styles.tokenSelected,
                        token.value === 5000 && { transform: [{ rotate: '180deg' }] },
                      ]}
                      onPress={() => handleTokenPress(token.value)}
                      onLongPress={() => handleTokenLongPress(token.value)}
                      testID={`token-${token.value}`}
                    >
                      <Text style={styles.tokenValue}>{token.value}</Text>
                      <Text style={styles.tokenUnit}>Btcon</Text>
                      {tokenCounts[token.value] > 0 && (
                        <View style={styles.countBadge}>
                          <Text style={styles.countText}>×{tokenCounts[token.value]}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.bottomTokenRow}>
                {tokenAmounts.filter(token => token.value === 50000).map((token, index) => (
                  <View key={index} style={styles.tokenWrapper50k}>
                    <TouchableOpacity
                      style={[
                        styles.tokenSquare,
                        tokenCounts[token.value] > 0 && styles.tokenSelected,
                      ]}
                      onPress={() => handleTokenPress(token.value)}
                      onLongPress={() => handleTokenLongPress(token.value)}
                      testID={`token-${token.value}`}
                    >
                      <Text style={styles.tokenValue}>{token.value}</Text>
                      <Text style={styles.tokenUnit}>Btcon</Text>
                      {tokenCounts[token.value] > 0 && (
                        <View style={styles.countBadge}>
                          <Text style={styles.countText}>×{tokenCounts[token.value]}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
            {getTotalAmount() > 0 && (
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total:</Text>
                <View style={styles.totalRow}>
                  <Text style={styles.totalAmount}>{Math.floor(getTotalAmount())}</Text>
                  <Text style={styles.totalUnit}>Btcon</Text>
                </View>
                <Text style={styles.conversionText}>
                  ≈ {(getTotalAmount() / 100000000).toFixed(8)} BTC
                </Text>
              </View>
            )}
          </View>
        </View>

        {getTotalAmount() > 0 && (
          <TouchableOpacity
            style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={isSending}
            testID="send-transaction-button"
          >
            {isSending ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Send color="#000" size={20} />
                <Text style={styles.sendButtonText}>Envoyer</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Les frais de réseau seront automatiquement calculés et déduits de votre solde.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showScanner}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.modalContainer}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Scanner QR Code</Text>
            <TouchableOpacity
              onPress={() => setShowScanner(false)}
              style={styles.closeButton}
              testID="close-scanner-button"
            >
              <X color="#FFF" size={28} />
            </TouchableOpacity>
          </View>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={(result) => {
              if (result?.data) {
                console.log('QR Code détecté:', result.data);
                handleBarcodeScanned(result.data);
              }
            }}
          >
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerFrame} />
            </View>
          </CameraView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    position: 'relative' as const,
  },
  backgroundPattern: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.06,
  },
  patternCircle: {
    position: 'absolute' as const,
    borderRadius: 1000,
    borderWidth: 3,
    borderColor: '#FF8C00',
  },
  patternSquare: {
    position: 'absolute' as const,
    borderWidth: 3,
    borderColor: '#FFD700',
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  balanceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 28,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  balanceAmount: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '700' as const,
  },
  balanceUnit: {
    color: '#FF8C00',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  balanceSats: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  resetText: {
    color: '#FF8C00',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  tokensContainer: {
    flexDirection: 'column',
    gap: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  topTokensRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  bottomTokenRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tokenWrapper: {
    width: '35%',
    alignItems: 'center',
    gap: 8,
  },
  tokenWrapper50k: {
    width: '72%',
    alignItems: 'center',
    gap: 8,
  },
  tokenCircle: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#3a3a3a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  token1000: {
    backgroundColor: '#4A90E2',
    borderColor: '#6BA4E8',
  },
  token5000: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
  },
  tokenSquare: {
    width: '100%',
    aspectRatio: 1.3,
    backgroundColor: '#E8451A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#F5693F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  tokenSelected: {
    backgroundColor: '#FF8C00',
    borderColor: '#FFB347',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  tokenValue: {
    color: '#FFD700',
    fontSize: 32,
    fontWeight: '900' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tokenUnit: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '700' as const,
    marginTop: 2,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    opacity: 0.9,
  },
  countBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#000',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  countText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  totalContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    alignItems: 'center',
  },
  totalLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  totalAmount: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800' as const,
  },
  totalUnit: {
    color: '#FF8C00',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
  },
  scanButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversionText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  sendButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800' as const,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    color: '#666',
    fontSize: 13,
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#0a0a0a',
  },
  scannerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700' as const,
  },
  closeButton: {
    padding: 8,
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 280,
    height: 280,
    borderWidth: 3,
    borderColor: '#FF8C00',
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  headerWide: {
    paddingHorizontal: 40,
  },
  tokensContainerWide: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  showTokensButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  showTokensText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
