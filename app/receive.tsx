import '@/utils/shim';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { useUsername } from '@/contexts/UsernameContext';
import { useQRColor } from '@/contexts/QRColorContext';
import { useBtcPrice, btconToEuro } from '@/services/btcPrice';
import { ArrowLeft } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useResponsive } from '@/utils/responsive';
import { Image } from 'expo-image';


export default function ReceiveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string }>();
  const insets = useSafeAreaInsets();
  const { address } = useWallet();
  const { username } = useUsername();
  const { getQRColors } = useQRColor();
  const { width } = useWindowDimensions();
  const responsive = useResponsive();
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);
  const btcPrice = useBtcPrice();
  
  const requestedAmount = useMemo(() => params.amount ? parseInt(params.amount) : 0, [params.amount]);
  const euroAmount = useMemo(() => requestedAmount > 0 ? btconToEuro(requestedAmount, btcPrice) : '0', [requestedAmount, btcPrice]);

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



  const padding = responsive.scale(32);
  const qrArtSize = useMemo(() => {
    const maxSize = responsive.isTablet ? 400 : 320;
    return Math.min(width - 100, maxSize);
  }, [width, responsive.isTablet]);


  const handleBarcodeScanned = useCallback((data: string) => {
    if (hasScanned) return;
    setHasScanned(true);
    
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
      router.replace({
        pathname: '/send',
        params: {
          address: scannedAddress,
          preselectedAmount: amount.toString(),
        }
      });
    } else {
      router.replace({
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
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>Adresse Btcon</Text>
            <Text style={styles.addressText}>{address}</Text>
          </View>

          <View style={[styles.qrCodeWrapper, { width: qrArtSize + padding * 2, height: qrArtSize + padding * 2, backgroundColor: currentArt.bg }]}>
            {address ? (
              <Image
                source={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&bgcolor=${currentArt.bg.replace('#', '')}&color=${currentArt.fg.replace('#', '')}&data=bitcoin:${address}${requestedAmount > 0 ? `?amount=${(requestedAmount / 100000000).toFixed(8)}` : ''}`}
                style={{ width: qrArtSize, height: qrArtSize }}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            ) : (
              <Text style={[styles.qrPlaceholderText, { color: currentArt.accent }]}>Génération...</Text>
            )}
          </View>

          {requestedAmount > 0 && (
            <View style={styles.amountInfo}>
              <Text style={styles.amountLabel}>Montant demandé</Text>
              <View style={styles.amountRow}>
                <Text style={styles.amountValue}>{requestedAmount.toLocaleString()}</Text>
                <Text style={styles.amountUnit}>Btcon</Text>
              </View>
              <Text style={styles.amountEuro}>{euroAmount} €</Text>
            </View>
          )}
        </View>

      </View>
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
    gap: 20,
  },
  cameraWrapper: {
    borderRadius: 28,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 16,
    borderWidth: 4,
    borderColor: 'rgba(255, 140, 0, 0.4)',
    overflow: 'hidden',
  },
  cameraView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFrame: {
    width: '70%',
    aspectRatio: 1,
    borderWidth: 3,
    borderColor: '#FF8C00',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  permissionButton: {
    padding: 20,
  },
  qrPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 4,
    borderColor: 'rgba(255, 140, 0, 0.3)',
    padding: 32,
  },
  qrCodeWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 4,
    borderColor: 'rgba(255, 140, 0, 0.3)',
    padding: 32,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 16,
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
  addressInfo: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 140, 0, 0.3)',
    maxWidth: 360,
    alignSelf: 'center',
  },
  addressLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  addressText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600' as const,
    fontFamily: 'monospace' as const,
    textAlign: 'center' as const,
    lineHeight: 16,
  },
  amountInfo: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(255, 140, 0, 0.15)',
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#FF8C00',
    alignItems: 'center',
  },
  amountLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 6,
  },
  amountValue: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '900' as const,
    letterSpacing: -1.5,
  },
  amountUnit: {
    color: '#FF8C00',
    fontSize: 18,
    fontWeight: '800' as const,
  },
  amountEuro: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
