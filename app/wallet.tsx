import '@/utils/shim';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Platform, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { Camera, Settings, X } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { useBtcPrice, btconToEuro } from '@/services/btcPrice';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';


export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { balance } = useWallet();
  const btcPrice = useBtcPrice();

  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const euroValue = balance > 0 ? btconToEuro(balance, btcPrice) : '0.00';
  const euroValueSelected = selectedAmount > 0 ? btconToEuro(selectedAmount, btcPrice) : '0.00';

  const handleTokenPress = useCallback((value: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedAmount(value);
  }, []);

  const handleReset = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedAmount(0);
  }, []);

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
    
    router.push({ 
      pathname: '/send',
      params: {
        address,
        preselectedAmount: amount > 0 ? amount.toString() : selectedAmount.toString(),
      }
    });
  }, [router, selectedAmount]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/settings')}
          testID="settings-button"
        >
          <Settings color="#FF8C00" size={28} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.balanceBox}>
          <Text style={styles.balanceText}>
            {balance.toLocaleString()} Btcon = {euroValue} €
          </Text>
        </View>

        {selectedAmount > 0 && (
          <View style={styles.selectedBox}>
            <Text style={styles.selectedText}>
              {selectedAmount.toLocaleString()} Btcon sélectionné = {euroValueSelected} €
            </Text>
          </View>
        )}

        <View style={styles.labelRow}>
          <Text style={styles.tokensLabel}>Jetons</Text>
          {selectedAmount > 0 && (
            <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
              <Text style={styles.resetText}>Réinitialiser</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tokensContainer}>
          <View style={styles.topRow}>
            <Pressable
              style={[styles.token1000, selectedAmount === 1000 && styles.tokenSelected]}
              onPress={() => handleTokenPress(1000)}
            >
              <Text style={styles.tokenValue}>1000</Text>
              <Text style={styles.tokenUnit}>BTCON</Text>
            </Pressable>

            <Pressable
              style={[styles.token5000, selectedAmount === 5000 && styles.tokenSelected]}
              onPress={() => handleTokenPress(5000)}
            >
              <Text style={[styles.tokenValue, styles.tokenValueDark]}>5000</Text>
              <Text style={[styles.tokenUnit, styles.tokenUnitDark]}>BTCON</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.token50000, selectedAmount === 50000 && styles.tokenSelected]}
            onPress={() => handleTokenPress(50000)}
          >
            <Text style={styles.tokenValue}>50000</Text>
            <Text style={styles.tokenUnit}>BTCON</Text>
          </Pressable>
        </View>

        <TouchableOpacity
          style={styles.cameraButton}
          onPress={handleOpenScanner}
          testID="scan-camera-button"
        >
          <Camera color="#FFF" size={40} />
        </TouchableOpacity>
      </View>

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
    backgroundColor: '#000',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  iconButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    justifyContent: 'space-between',
  },
  balanceBox: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF8C00',
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  balanceText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  selectedBox: {
    backgroundColor: 'rgba(255, 140, 0, 0.25)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF8C00',
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  selectedText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  tokensLabel: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FF8C00',
    borderRadius: 12,
  },
  resetText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  tokensContainer: {
    gap: 16,
    marginBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  token1000: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#5B9BD5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'transparent',
  },
  token5000: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'transparent',
  },
  token50000: {
    width: '100%',
    height: 180,
    borderRadius: 24,
    backgroundColor: '#E8451A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'transparent',
  },
  tokenSelected: {
    borderColor: '#FF8C00',
    backgroundColor: '#FF8C00',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 12,
  },
  cameraButton: {
    width: '100%',
    height: 100,
    borderRadius: 24,
    backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 24,
  },
  tokenValue: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900' as const,
  },
  tokenValueDark: {
    color: '#000',
  },
  tokenUnit: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700' as const,
    marginTop: 4,
  },
  tokenUnitDark: {
    color: '#000',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 280,
    height: 280,
    borderWidth: 4,
    borderColor: '#FF8C00',
    borderRadius: 24,
  },
});
