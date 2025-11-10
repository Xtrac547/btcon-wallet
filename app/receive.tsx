import '@/utils/shim';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Linking, Alert, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { useUsername } from '@/contexts/UsernameContext';
import { useQRColor } from '@/contexts/QRColorContext';
import { ArrowLeft, Share2, ExternalLink, Copy, X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import Svg, { Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useResponsive } from '@/utils/responsive';
import ViewShot from 'react-native-view-shot';

export default function ReceiveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string }>();
  const insets = useSafeAreaInsets();
  const { address } = useWallet();
  const { username } = useUsername();
  const { getQRColors } = useQRColor();
  const { width } = useWindowDimensions();
  const responsive = useResponsive();
  const [qrMatrix, setQrMatrix] = useState<number[][]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);
  
  const requestedAmount = useMemo(() => params.amount ? parseInt(params.amount) : 0, [params.amount]);

  useEffect(() => {
    if (!username) {
      router.replace('/set-username');
    }
  }, [username, router]);

  const currentArt = useMemo(() => {
    const qrColors = getQRColors(address);
    return {
      bg: qrColors.background,
      fg: qrColors.qr,
      accent: qrColors.qr,
      borderGlow: qrColors.qr,
    };
  }, [address, getQRColors]);

  const generateQRMatrix = async (text: string): Promise<number[][]> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const QRCode = require('qrcode');
      
      const qrData = await QRCode.create(text, { errorCorrectionLevel: 'H' });
      const modules = qrData.modules;
      const size = modules.size;
      const matrix: number[][] = [];
      
      for (let row = 0; row < size; row++) {
        matrix[row] = [];
        for (let col = 0; col < size; col++) {
          matrix[row][col] = modules.get(row, col) ? 1 : 0;
        }
      }
      return matrix;
    } catch (error) {
      console.error('Erreur génération QR:', error);
      return [];
    }
  };

  useEffect(() => {
    if (address) {
      (async () => {
        try {
          let qrContent = address;
          if (requestedAmount > 0) {
            const btcAmount = requestedAmount / 100000000;
            qrContent = `bitcoin:${address}?amount=${btcAmount}`;
          }
          const matrix = await generateQRMatrix(qrContent);
          setQrMatrix(matrix);
        } catch (err) {
          console.error('Erreur génération QR:', err);
        }
      })();
    }
  }, [address, requestedAmount]);

  const padding = responsive.scale(32);
  const qrArtSize = useMemo(() => {
    const maxSize = responsive.isTablet ? 400 : 320;
    return Math.min(width - 100, maxSize);
  }, [width, responsive.isTablet]);

  const handleShare = useCallback(async () => {
    if (!address || !viewShotRef.current) return;
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Non disponible', 'Le partage n\'est pas disponible sur le web');
        return;
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Erreur', 'Le partage n\'est pas disponible sur cet appareil');
        return;
      }

      const uri = await viewShotRef.current.capture();
      console.log('QR code capturé:', uri);
      
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
      });
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Erreur partage:', error);
      Alert.alert('Erreur', 'Impossible de partager le QR code: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    }
  }, [address]);

  const handleExplorer = useCallback(() => {
    if (!address) return;
    const url = `https://mempool.space/address/${address}`;
    Linking.openURL(url).catch(err => {
      console.error('Erreur ouverture explorateur:', err);
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'explorateur');
    });
  }, [address]);

  const handleCopyAddress = useCallback(async () => {
    if (!address) return;
    try {
      await Clipboard.setStringAsync(address);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Copié', 'Adresse copiée dans le presse-papier');
    } catch (error) {
      console.error('Erreur copie:', error);
      Alert.alert('Erreur', 'Impossible de copier l\'adresse');
    }
  }, [address]);



  const handleBarcodeScanned = useCallback((data: string) => {
    if (hasScanned) return;
    setHasScanned(true);
    setShowScanner(false);
    
    let scannedAddress = data;
    let amount = 0;
    
    if (scannedAddress.toLowerCase().startsWith('bitcoin:')) {
      const uri = scannedAddress.substring(8);
      const parts = uri.split('?');
      scannedAddress = parts[0];
      
      if (parts.length > 1) {
        const params = new URLSearchParams(parts[1]);
        const amountBtc = params.get('amount');
        
        if (amountBtc) {
          amount = Math.floor(parseFloat(amountBtc) * 100000000);
        }
      }
    }
    
    if (amount > 0) {
      const tokens1000 = Math.floor(amount / 1000);
      
      router.push({
        pathname: '/send',
        params: {
          address: scannedAddress,
          token1000: tokens1000.toString(),
          token5000: '0',
          token50000: '0',
        }
      });
    } else {
      router.push({
        pathname: '/send',
        params: {
          address: scannedAddress,
        }
      });
    }
  }, [hasScanned, router]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recevoir Bitcoin</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.qrSection}>
          {qrMatrix.length > 0 ? (
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
              <View style={styles.shareContainer}>
                <View style={styles.shareAddressInfo}>
                  <Text style={styles.shareAddressLabel}>Adresse BTC</Text>
                  <Text style={styles.shareAddressText}>{address}</Text>
                </View>
                <View style={[styles.qrCodeWrapper, { width: qrArtSize + padding * 2, height: qrArtSize + padding * 2, backgroundColor: currentArt.bg }]}>
                  <Svg width={qrArtSize} height={qrArtSize} viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}>
                    {qrMatrix.map((row, y) => 
                      row.map((cell, x) => {
                        if (cell === 1) {
                          return (
                            <Rect
                              key={`${y}-${x}`}
                              x={x}
                              y={y}
                              width={1}
                              height={1}
                              fill={currentArt.fg}
                              rx={0.15}
                            />
                          );
                        }
                        return null;
                      })
                    )}
                  </Svg>
                </View>
                {requestedAmount > 0 && (
                  <View style={styles.shareAmountInfo}>
                    <Text style={styles.shareAmountLabel}>Montant demandé</Text>
                    <View style={styles.shareAmountRow}>
                      <Text style={styles.shareAmountValue}>{requestedAmount.toLocaleString()}</Text>
                      <Text style={styles.shareAmountUnit}>Btcon</Text>
                    </View>
                    <Text style={styles.shareAmountBtc}>{(requestedAmount / 100000000).toFixed(8)} BTC</Text>
                  </View>
                )}
              </View>
            </ViewShot>
          ) : (
            <View style={[styles.qrPlaceholder, { width: qrArtSize + padding * 2, height: qrArtSize + padding * 2, backgroundColor: currentArt.bg }]}>
              <Text style={[styles.qrPlaceholderText, { color: currentArt.accent }]}>Génération du QR...</Text>
            </View>
          )}
        </View>

        {address && (
          <TouchableOpacity 
            onPress={handleShare} 
            style={[styles.shareButton, { backgroundColor: currentArt.accent }]}
          >
            <Share2 color="#000" size={24} />
            <Text style={styles.shareButtonText}>Partager</Text>
          </TouchableOpacity>
        )}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  qrSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCodeWrapper: {
    borderRadius: 28,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 16,
    borderWidth: 4,
    borderColor: 'rgba(255, 140, 0, 0.4)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  qrPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 4,
    borderColor: 'rgba(255, 140, 0, 0.3)',
    padding: 32,
  },
  qrPlaceholderText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  shareButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 20,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  shareButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
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
  shareContainer: {
    alignItems: 'center',
    backgroundColor: '#000',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  shareAddressInfo: {
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 140, 0, 0.3)',
    maxWidth: 360,
  },
  shareAddressLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  shareAddressText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600' as const,
    fontFamily: 'monospace' as const,
    textAlign: 'center' as const,
    lineHeight: 16,
  },
  shareAmountInfo: {
    marginTop: 24,
    paddingVertical: 20,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(255, 140, 0, 0.15)',
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#FF8C00',
    alignItems: 'center',
  },
  shareAmountLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  shareAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 6,
  },
  shareAmountValue: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '900' as const,
    letterSpacing: -1.5,
  },
  shareAmountUnit: {
    color: '#FF8C00',
    fontSize: 18,
    fontWeight: '800' as const,
  },
  shareAmountBtc: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontWeight: '600' as const,
    fontFamily: 'monospace' as const,
  },
});
