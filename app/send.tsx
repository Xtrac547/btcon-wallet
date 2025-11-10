import '@/utils/shim';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, Modal, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { useUsername } from '@/contexts/UsernameContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useFollowing } from '@/contexts/FollowingContext';
import { useDeveloperHierarchy } from '@/contexts/DeveloperHierarchyContext';
import { ArrowLeft, Send, X, Users, Camera } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useResponsive } from '@/utils/responsive';

export default function SendScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    preselectedAmount?: string;
    token1000?: string;
    token5000?: string;
    token50000?: string;
    address?: string;
  }>();
  const { balance, signAndBroadcastTransaction, esploraService, address } = useWallet();
  const { username, getAddressForUsername } = useUsername();
  const { notifyTransaction } = useNotifications();
  const { following } = useFollowing();
  const { isDeveloper } = useDeveloperHierarchy();
  const { width } = useWindowDimensions();
  const responsive = useResponsive();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!username) {
      router.replace('/set-username');
    }
  }, [username, router]);
  const [toAddress, setToAddress] = useState(params.address || '');
  const [tokenCounts, setTokenCounts] = useState<{ [key: number]: number }>({
    1000: params.token1000 ? parseInt(params.token1000) : 0,
    5000: params.token5000 ? parseInt(params.token5000) : 0,
    50000: params.token50000 ? parseInt(params.token50000) : 0,
  });
  const [isSending, setIsSending] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [btcPrice, setBtcPrice] = useState(100000);
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    const fetchBtcPrice = async () => {
      try {
        const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=BTC');
        const data = await response.json();
        const eurRate = parseFloat(data.data.rates.EUR);
        setBtcPrice(eurRate);
      } catch (error) {
        console.error('Error fetching BTC price:', error);
      }
    };
    fetchBtcPrice();
    const interval = setInterval(fetchBtcPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  const btconToEuro = (btcon: number): string => {
    const btc = btcon / 100000000;
    const euro = btc * btcPrice;
    return euro.toFixed(2);
  };

  const [amountInput, setAmountInput] = useState('');

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmountInput(cleaned);
  };

  const euroAmount = useMemo(() => parseFloat(amountInput) || 0, [amountInput]);
  const totalAmount = useMemo(() => {
    if (euroAmount === 0 || btcPrice === 0) return 0;
    const btcAmount = euroAmount / btcPrice;
    return Math.floor(btcAmount * 100000000);
  }, [euroAmount, btcPrice]);





  const handleSend = async () => {
    const input = toAddress.trim();
    
    if (!input) {
      Alert.alert('Error', 'Veuillez entrer une adresse ou un pseudo');
      return;
    }

    const isDevAddress = address ? isDeveloper(address) : false;

    let resolvedAddress = input;
    
    if (resolvedAddress.startsWith('@')) {
      const username = resolvedAddress.substring(1);
      const addressResult = await getAddressForUsername(username);
      if (!addressResult) {
        Alert.alert('Error', 'Pseudo introuvable');
        return;
      }
      resolvedAddress = addressResult;
    } else if (!resolvedAddress.startsWith('bc1') && !resolvedAddress.startsWith('tb1')) {
      const addressResult = await getAddressForUsername(resolvedAddress);
      if (addressResult) {
        resolvedAddress = addressResult;
      }
    }



    if (totalAmount === 0) {
      Alert.alert('Error', 'Veuillez sélectionner un montant');
      return;
    }

    const btconAmount = totalAmount;
    const satsAmount = Math.floor(btconAmount);

    if (satsAmount > balance) {
      Alert.alert('Error', 'Fonds insuffisants');
      return;
    }

    if (satsAmount < 546) {
      Alert.alert('Error', 'Montant trop petit');
      return;
    }

    const totalFeesInSats = isDevAddress ? 0 : 500;
    const totalFeesInBtcon = isDevAddress ? 0 : 500;

    const feeMessage = isDevAddress 
      ? '\n\n✨ Mode développeur : Frais gratuits !' 
      : `\n\nFrais de réseau: ${Math.floor(totalFeesInBtcon).toLocaleString()} Btcon (${btconToEuro(totalFeesInBtcon)} €)`;
    
    Alert.alert(
      'Confirmer la transaction',
      `Montant: ${euroAmount.toFixed(2)} €\n(${Math.floor(btconAmount).toLocaleString()} Btcon)\n\nDestinataire: ${toAddress.startsWith('@') ? toAddress : resolvedAddress.slice(0, 10) + '...'}${feeMessage}\n\nTotal à déduire: ${(satsAmount + totalFeesInSats).toLocaleString()} Btcon`,
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
    setHasScanned(false);
    setShowScanner(true);
  };

  const handleBarcodeScanned = useCallback((data: string) => {
    if (hasScanned) return;
    setHasScanned(true);
    setShowScanner(false);
    
    let address = data;
    
    if (address.toLowerCase().startsWith('bitcoin:')) {
      const uri = address.substring(8);
      const parts = uri.split('?');
      address = parts[0];
      
      if (parts.length > 1) {
        const params = new URLSearchParams(parts[1]);
        const amountBtc = params.get('amount');
        
        if (amountBtc) {
          const amountSats = Math.floor(parseFloat(amountBtc) * 100000000);
          
          setToAddress(address);
          
          const euroValue = (amountSats / 100000000) * btcPrice;
          setAmountInput(euroValue.toFixed(2));
          
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 300);
          
          return;
        }
      }
    }
    
    setToAddress(address);
  }, [hasScanned, router, scrollViewRef]);

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Envoyer</Text>
        <TouchableOpacity 
          onPress={() => router.push('/search-users')} 
          style={styles.searchUsersButton}
          testID="search-users-button"
        >
          <Users color="#FF8C00" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {euroAmount > 0 && (
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Montant:</Text>
            <View style={styles.totalRow}>
              <Text style={[styles.totalAmount, { fontSize: responsive.scale(32) }]}>{euroAmount.toFixed(2)}</Text>
              <Text style={[styles.totalUnit, { fontSize: responsive.scale(14) }]}>€</Text>
            </View>
            <Text style={styles.conversionText}>
              ≈ {totalAmount.toLocaleString()} Btcon
            </Text>
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
                placeholder="@pseudo ou adresse BTC"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Montant en €</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={amountInput}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
            </View>
            {euroAmount > 0 && (
              <Text style={styles.conversionText}>
                ≈ {totalAmount.toLocaleString()} Btcon
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleOpenScanner}
            testID="scan-qr-button"
          >
            <Camera color="#FF8C00" size={24} />
            <Text style={styles.cameraButtonText}>Scanner</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.usersButton}
            onPress={() => router.push('/search-users')}
            testID="search-users-button-main"
          >
            <Users color="#FF8C00" size={24} />
            <Text style={styles.cameraButtonText}>Contacts</Text>
          </TouchableOpacity>
        </View>

        {following.length > 0 && (
          <View style={styles.followingSection}>
            <Text style={styles.followingSectionTitle}>Accès rapide</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.followingList}
            >
              {following.map((user) => (
                <TouchableOpacity
                  key={user.username}
                  style={styles.followingCard}
                  onPress={() => setToAddress(`@${user.username}`)}
                >
                  <View style={styles.followingAvatar}>
                    <Text style={styles.followingAvatarText}>
                      {user.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.followingUsername}>@{user.username}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {totalAmount > 0 && toAddress.trim() !== '' && (
          <TouchableOpacity
            style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={isSending}
            testID="send-transaction-button"
          >
            {isSending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Send color="#FFF" size={20} />
                <Text style={styles.sendButtonText}>Envoyer</Text>
              </>
            )}
          </TouchableOpacity>
        )}
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
    backgroundColor: '#000000',
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
  searchUsersButton: {
    padding: 8,
  },
  followingSection: {
    marginBottom: 24,
  },
  followingSectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 12,
    paddingLeft: 4,
  },
  followingList: {
    gap: 12,
    paddingRight: 24,
  },
  followingCard: {
    backgroundColor: '#0f0f0f',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    gap: 10,
    minWidth: 110,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.15)',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  followingAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  followingAvatarText: {
    color: '#000',
    fontSize: 28,
    fontWeight: '900' as const,
  },
  followingUsername: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
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
    backgroundColor: '#0f0f0f',
    borderRadius: 24,
    padding: 28,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 0, 0.3)',
  },
  balanceLabel: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  balanceAmount: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900' as const,
  },
  balanceUnit: {
    color: '#FF8C00',
    fontSize: 14,
    fontWeight: '900' as const,
  },
  balanceSats: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500' as const,
  },
  balanceEuro: {
    color: '#FF8C00',
    fontSize: 14,
    marginTop: 6,
    fontWeight: '700' as const,
  },
  formCard: {
    backgroundColor: '#0f0f0f',
    borderRadius: 28,
    padding: 28,
    marginBottom: 0,
    gap: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    color: '#999',
    fontSize: 12,
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
    justifyContent: 'space-between',
    gap: 16,
  },
  bottomTokenRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tokenWrapper: {
    width: '48%',
    alignItems: 'center',
    gap: 8,
  },
  tokenWrapper50k: {
    width: '100%',
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
    backgroundColor: '#5B9BD5',
    borderColor: '#75ADE0',
  },
  token5000: {
    backgroundColor: '#FF9F47',
    borderColor: '#FFB366',
  },
  token5000White: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
  },
  tokenValueWhite: {
    color: '#000000',
  },
  tokenUnitWhite: {
    color: '#000000',
  },
  tokenSquare: {
    width: '100%',
    height: 180,
    backgroundColor: '#E8451A',
    borderRadius: 28,
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
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tokenUnit: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700' as const,
    marginTop: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    opacity: 1,
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
  addressInputCard: {
    marginTop: 0,
    padding: 20,
    backgroundColor: '#0f0f0f',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  totalContainer: {
    marginTop: 0,
    padding: 20,
    backgroundColor: 'rgba(61, 40, 25, 0.8)',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 0, 0.4)',
  },
  totalLabel: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600' as const,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  totalAmount: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900' as const,
  },
  totalUnit: {
    color: '#FF8C00',
    fontSize: 14,
    fontWeight: '900' as const,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 18,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  scanButton: {
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    borderRadius: 16,
    padding: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.2)',
  },
  conversionText: {
    color: '#999',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500' as const,
  },
  conversionTextEuro: {
    color: '#FF8C00',
    fontSize: 13,
    marginTop: 6,
    fontWeight: '700' as const,
  },
  labelWithReset: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#0f0f0f',
    borderRadius: 28,
    padding: 28,
    marginBottom: 28,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  summaryLabel: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  tokensListContainer: {
    gap: 12,
  },
  tokenSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.2)',
  },
  tokenSummaryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  tokenSummaryCount: {
    color: '#FF8C00',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  cameraButton: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.15)',
  },
  usersButton: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.15)',
  },
  cameraButtonText: {
    color: '#FF8C00',
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  sendButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 20,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
    marginTop: 8,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '900' as const,
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 140, 0, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.1)',
  },
  infoText: {
    color: '#666',
    fontSize: 11,
    lineHeight: 16,
  },
  feesContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#000000',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 0, 0.3)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feesLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  feesValue: {
    color: '#FF8C00',
    fontSize: 14,
    fontWeight: '900' as const,
  },
  feesSubtext: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  feesEuroText: {
    color: '#FF8C00',
    fontSize: 12,
    fontWeight: '700' as const,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  scannerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700' as const,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 140, 0, 0.2)',
    borderRadius: 12,
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: '80%',
    aspectRatio: 1,
    maxWidth: 340,
    maxHeight: 340,
    borderWidth: 4,
    borderColor: '#FF8C00',
    borderRadius: 32,
    backgroundColor: 'transparent',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
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
