import '@/utils/shim';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Platform, Animated, PanResponder, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { ArrowUpRight, ArrowDownLeft, Settings, X, Eye, Camera } from 'lucide-react-native';
import { useState, useRef, useMemo, useCallback } from 'react';
import { useBtcPrice, btconToEuro } from '@/services/btcPrice';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useResponsive } from '@/utils/responsive';


export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { balance } = useWallet();
  const btcPrice = useBtcPrice();
  const responsive = useResponsive();

  const [tokenCounts, setTokenCounts] = useState<{ [key: number]: number }>({
    1000: 0,
    5000: 0,
    50000: 0,
  });
  


  const translateY = useRef(new Animated.Value(0)).current;
  const panY = useRef(0);
  
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const euroValue = balance > 0 ? btconToEuro(balance, btcPrice) : '0.00';
  


  const getTotalAmount = useCallback((): number => {
    return Object.entries(tokenCounts).reduce((total, [value, count]) => {
      return total + (Number(value) * count);
    }, 0);
  }, [tokenCounts]);

  const totalAmount = useMemo(() => getTotalAmount(), [getTotalAmount]);
  const hasSelectedTokens = totalAmount > 0;
  const euroValueSelected = useMemo(() => totalAmount > 0 ? btconToEuro(totalAmount, btcPrice) : '0.00', [totalAmount, btcPrice]);

  const handleTokenPress = useCallback((value: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTokenCounts(prev => ({
      ...prev,
      [value]: prev[value] + 1,
    }));
  }, []);

  const handleTokenLongPress = useCallback((value: number) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setTokenCounts(prev => ({
      ...prev,
      [value]: 0,
    }));
  }, []);

  const resetAllTokens = useCallback(() => {
    setTokenCounts({
      1000: 0,
      5000: 0,
      50000: 0,
    });
  }, []);

  const handleReceive = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push({ pathname: '/receive', params: { amount: totalAmount.toString() } });
  }, [totalAmount, router]);

  const handleSend = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push({ 
      pathname: '/send', 
      params: { 
        preselectedAmount: totalAmount.toString(),
        token1000: tokenCounts[1000].toString(),
        token5000: tokenCounts[5000].toString(),
        token50000: tokenCounts[50000].toString()
      } 
    });
  }, [totalAmount, tokenCounts, router]);

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

  const handleBarcodeScanned = useCallback((data: string) => {
    setShowScanner(false);
    
    let address = data;
    let amount = 0;
    
    if (address.toLowerCase().startsWith('bitcoin:')) {
      const uri = address.substring(8);
      const parts = uri.split('?');
      address = parts[0];
      
      if (parts.length > 1) {
        const params = new URLSearchParams(parts[1]);
        const amountBtc = params.get('amount');
        
        if (amountBtc) {
          amount = Math.floor(parseFloat(amountBtc) * 100000000);
        }
      }
    }
    
    if (amount > 0) {
      router.push({ 
        pathname: '/send',
        params: {
          address,
          preselectedAmount: amount.toString(),
        }
      });
    } else {
      router.push({ 
        pathname: '/send',
        params: {
          address,
        }
      });
    }
  }, [router]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !hasSelectedTokens,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !hasSelectedTokens && Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (!hasSelectedTokens && gestureState.dy > 0) {
          panY.current = gestureState.dy;
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!hasSelectedTokens && gestureState.dy > 150) {
          router.push('/stories');
          Animated.timing(translateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
        panY.current = 0;
      },
    })
  ).current;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <View style={styles.leftButtons}>
          <TouchableOpacity
            style={styles.topButton}
            onPress={handleOpenScanner}
            testID="scan-qr-wallet-button"
          >
            <Camera color="#FF8C00" size={24} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => router.push('/receive')}
            testID="show-address-qr-button"
          >
            <Eye color="#FF8C00" size={24} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.topButton}
          onPress={() => router.push('/settings')}
          testID="settings-button"
        >
          <Settings color="#FF8C00" size={24} />
        </TouchableOpacity>
      </View>

      <Animated.View 
        {...panResponder.panHandlers}
        style={[
          styles.animatedContainer,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={[styles.selectionContent, hasSelectedTokens && styles.contentAtBottom]}>
          <View style={styles.balanceCompact}>
            <Text style={styles.balanceCompactText}>
              {balance.toLocaleString()} Btcon = {euroValue} €
            </Text>
          </View>
          
          <View style={styles.selectedAmountBox}>
            <Text style={[styles.selectedAmountText, { fontSize: responsive.scale(15) }]}>
              {totalAmount.toLocaleString()} Btcon sélectionné = {euroValueSelected} €
            </Text>
          </View>


          <View style={styles.tokensSection}>
            <View style={styles.labelRow}>
              <Text style={styles.tokensLabel}>Jetons</Text>
              {totalAmount > 0 && (
                <TouchableOpacity onPress={resetAllTokens} style={styles.resetButton}>
                  <Text style={styles.resetText}>Réinitialiser</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.tokensContainer}>
              <View style={styles.topTokensRow}>
                {[1000, 5000].map((value) => (
                  <View key={value} style={styles.tokenWrapper}>
                    <Pressable
                      style={[
                        styles.tokenCircle,
                        value === 1000 && styles.token1000,
                        value === 5000 && styles.token5000,
                        tokenCounts[value] > 0 && styles.tokenSelected,
                      ]}
                      onPress={() => handleTokenPress(value)}
                      onLongPress={() => handleTokenLongPress(value)}
                    >
                      <Text style={[styles.tokenValue, { fontSize: responsive.scale(28) }]}>{value}</Text>
                      <Text style={[styles.tokenUnit, { fontSize: responsive.scale(11) }]}>BTCON</Text>
                      {tokenCounts[value] > 0 && (
                        <View style={styles.countBadge}>
                          <Text style={styles.countText}>{tokenCounts[value]}x</Text>
                        </View>
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
              <View style={styles.bottomTokenRow}>
                <View style={styles.tokenWrapper50k}>
                  <Pressable
                    style={[
                      styles.tokenSquare,
                      tokenCounts[50000] > 0 && styles.tokenSelected,
                    ]}
                    onPress={() => handleTokenPress(50000)}
                    onLongPress={() => handleTokenLongPress(50000)}
                  >
                    <Text style={[styles.tokenValue, { fontSize: responsive.scale(28) }]}>50000</Text>
                    <Text style={[styles.tokenUnit, { fontSize: responsive.scale(11) }]}>BTCON</Text>
                    {tokenCounts[50000] > 0 && (
                      <View style={styles.countBadge}>
                        <Text style={styles.countText}>{tokenCounts[50000]}x</Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {hasSelectedTokens && (
        <View style={[styles.actionsContainer, { paddingBottom: insets.bottom + 24 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.receiveButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={handleReceive}
          >
            <View style={styles.iconContainer}>
              <ArrowDownLeft color="#FFFFFF" size={28} strokeWidth={2.5} />
            </View>
            <Text style={styles.actionButtonText}>Recevoir</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.sendButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={handleSend}
          >
            <View style={styles.iconContainer}>
              <ArrowUpRight color="#FFFFFF" size={28} strokeWidth={2.5} />
            </View>
            <Text style={styles.actionButtonText}>Envoyer</Text>
          </Pressable>
        </View>
      )}

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
              testID="close-scanner-wallet-button"
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
    backgroundColor: '#000000',
  },
  animatedContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  selectionContent: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  contentAtBottom: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 160,
  },
  balanceCompact: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#0f0f0f',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 0, 0.2)',
  },
  balanceCompactText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  selectedAmountBox: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 0, 0.3)',
  },
  selectedAmountText: {
    color: '#FFB347',
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },

  addressContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  addressLabelSmall: {
    color: '#666666',
    fontSize: 12,
    marginBottom: 6,
  },
  addressTextSmall: {
    color: '#999999',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' || Platform.OS === 'android' ? 'Courier' : 'monospace',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 24,
    backgroundColor: '#000',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    borderRadius: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  receiveButton: {
    backgroundColor: '#FF8C00',
  },
  sendButton: {
    backgroundColor: '#FF8C00',
  },
  actionButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  qrContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  qrTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800' as const,
    marginBottom: 48,
    letterSpacing: 0.5,
  },
  qrCodeWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: 32,
  },
  qrCode: {
    width: 300,
    height: 300,
  },
  addressBox: {
    backgroundColor: '#0f0f0f',
    padding: 20,
    borderRadius: 16,
    marginBottom: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.2)',
  },
  addressLabel: {
    color: '#888888',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  addressText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' || Platform.OS === 'android' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#FF8C00',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  tokensSection: {
    marginBottom: 24,
  },
  tokensLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    gap: 16,
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
  },
  tokenWrapper50k: {
    width: '72%',
    alignItems: 'center',
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  leftButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  topButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
});
