import '@/utils/shim';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Share, Linking, Alert, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { useUsername } from '@/contexts/UsernameContext';
import { useQRColor } from '@/contexts/QRColorContext';
import { ArrowLeft, Share2, ExternalLink, Copy, Send, Camera, X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Svg, { Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useResponsive } from '@/utils/responsive';

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
    if (!address) return;
    try {
      let message = `Mon adresse Bitcoin: ${address}`;
      if (requestedAmount > 0) {
        const btcAmount = requestedAmount / 100000000;
        message = `Demande de paiement Bitcoin\n\nMontant: ${requestedAmount.toLocaleString()} Btcon (${btcAmount.toFixed(8)} BTC)\n\nAdresse: ${address}\n\nURI: bitcoin:${address}?amount=${btcAmount}`;
      }
      await Share.share({ message });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  }, [address, requestedAmount]);

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
        {requestedAmount > 0 && (
          <View style={styles.amountBanner}>
            <Text style={styles.amountBannerLabel}>Montant demandé</Text>
            <View style={styles.amountBannerRow}>
              <Text style={styles.amountBannerValue}>{requestedAmount.toLocaleString()}</Text>
              <Text style={styles.amountBannerUnit}>Btcon</Text>
            </View>
            <Text style={styles.amountBannerBtc}>{(requestedAmount / 100000000).toFixed(8)} BTC</Text>
            <TouchableOpacity 
              style={styles.sendPaymentButton}
              onPress={() => {
                const token1000 = Math.floor(requestedAmount / 1000);
                router.push({
                  pathname: '/send',
                  params: {
                    token1000: token1000.toString(),
                    token5000: '0',
                    token50000: '0',
                  }
                });
              }}
            >
              <Send color="#FFF" size={20} />
              <Text style={styles.sendPaymentButtonText}>Envoyer ce montant</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.qrCodeContainer}>
          {qrMatrix.length > 0 ? (
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
          ) : (
            <View style={[styles.qrPlaceholder, { width: qrArtSize + padding * 2, height: qrArtSize + padding * 2, backgroundColor: currentArt.bg }]}>
              <Text style={[styles.qrPlaceholderText, { color: currentArt.accent }]}>Génération du QR...</Text>
            </View>
          )}
        </View>

        {address && (
          <View style={styles.addressContainer}>
            <TouchableOpacity onPress={handleCopyAddress} style={styles.addressBox}>
              <Text style={styles.addressLabel}>Adresse Bitcoin</Text>
              <View style={styles.addressRow}>
                <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
                  {address}
                </Text>
                <Copy color={currentArt.accent} size={18} />
              </View>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                onPress={handleShare} 
                style={[styles.actionButton, { borderColor: currentArt.accent }]}
              >
                <Share2 color={currentArt.accent} size={20} />
                <Text style={[styles.actionButtonText, { color: currentArt.accent }]}>Partager</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleExplorer} 
                style={[styles.actionButton, { borderColor: currentArt.accent }]}
              >
                <ExternalLink color={currentArt.accent} size={20} />
                <Text style={[styles.actionButtonText, { color: currentArt.accent }]}>Explorateur</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={handleOpenScanner}
              style={[styles.scannerButton, { borderColor: currentArt.accent, backgroundColor: `${currentArt.accent}15` }]}
            >
              <Camera color={currentArt.accent} size={20} />
              <Text style={[styles.scannerButtonText, { color: currentArt.accent }]}>Scanner un QR Code</Text>
            </TouchableOpacity>
          </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  qrCodeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeWrapper: {
    borderRadius: 28,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.7,
    shadowRadius: 32,
    elevation: 16,
    borderWidth: 4,
    borderColor: 'rgba(255, 140, 0, 0.3)',
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
  addressContainer: {
    width: '100%',
    marginTop: 32,
    gap: 16,
  },
  addressBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  addressLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500' as const,
    fontFamily: 'monospace' as const,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  amountBanner: {
    width: '100%',
    backgroundColor: 'rgba(255, 140, 0, 0.15)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 0, 0.4)',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  amountBannerLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
  },
  amountBannerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 8,
  },
  amountBannerValue: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900' as const,
    letterSpacing: -2,
  },
  amountBannerUnit: {
    color: '#FF8C00',
    fontSize: 20,
    fontWeight: '800' as const,
  },
  amountBannerBtc: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '600' as const,
    fontFamily: 'monospace' as const,
  },
  sendPaymentButton: {
    marginTop: 16,
    backgroundColor: '#FF8C00',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  sendPaymentButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  scannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 12,
  },
  scannerButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
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
});
