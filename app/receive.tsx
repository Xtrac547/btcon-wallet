import '@/utils/shim';
import { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { useUsername } from '@/contexts/UsernameContext';
import { useQRColor } from '@/contexts/QRColorContext';
import { useBtcPrice, btconToEuro } from '@/services/btcPrice';
import { ArrowLeft, Copy, Share2 } from 'lucide-react-native';
import { useResponsive } from '@/utils/responsive';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';

import { Share, Platform } from 'react-native';
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
  const btcPrice = useBtcPrice();
  const [isCopied, setIsCopied] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);
  
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


  const qrCodeUri = useMemo(() => {
    if (!address) return '';
    if (requestedAmount > 0) {
      const btcAmount = (requestedAmount / 100000000).toFixed(8);
      return `bitcoin:${address}?amount=${btcAmount}`;
    }
    return `bitcoin:${address}`;
  }, [address, requestedAmount]);

  const handleCopyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      Alert.alert('Copié', 'Adresse copiée dans le presse-papiers');
    }
  };

  const handleShare = async () => {
    if (!address) {
      Alert.alert('Erreur', 'Adresse non disponible');
      return;
    }

    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Non supporté',
          'Le partage n\'est pas disponible sur web',
          [{ text: 'OK' }]
        );
        return;
      }

      if (!viewShotRef.current) {
        Alert.alert('Erreur', 'Référence de capture non disponible');
        return;
      }

      console.log('Début de la capture...');
      const imageUri = await viewShotRef.current.capture();
      console.log('Screenshot capturé:', imageUri);

      if (!imageUri) {
        Alert.alert('Erreur', 'Impossible de capturer l\'image');
        return;
      }

      const shareOptions: any = {
        message: `Recevoir Btcon\n\nAdresse: ${address}${requestedAmount > 0 ? `\nMontant: ${requestedAmount.toLocaleString()} Btcon (${euroAmount}€)` : ''}`,
        url: imageUri,
      };

      console.log('Partage en cours...');
      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        console.log('Partagé avec succès');
      } else if (result.action === Share.dismissedAction) {
        console.log('Partage annulé');
      }
    } catch (error: any) {
      console.error('Erreur lors du partage:', error);
      Alert.alert('Erreur', `Impossible de partager: ${error.message || 'Erreur inconnue'}`);
    }
  };

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
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }} style={styles.captureContainer}>
          <View style={styles.qrSection}>
            <View style={styles.addressInfo}>
              <Text style={styles.addressLabel}>Adresse Btcon</Text>
              <View style={styles.addressRow}>
                <Text style={styles.addressText}>{address}</Text>
                <TouchableOpacity onPress={handleCopyAddress} style={styles.copyButton}>
                  <Copy color={isCopied ? '#00FF00' : '#FF8C00'} size={18} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.qrCodeWrapper, { width: qrArtSize + padding * 2, height: qrArtSize + padding * 2, backgroundColor: currentArt.bg }]}>
              {qrCodeUri ? (
                <Image
                  source={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&bgcolor=${currentArt.bg.replace('#', '')}&color=${currentArt.fg.replace('#', '')}&data=${encodeURIComponent(qrCodeUri)}`}
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
        </ViewShot>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Share2 color="#FFF" size={24} />
          <Text style={styles.shareButtonText}>Partager</Text>
        </TouchableOpacity>
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
  qrCodeWrapper: {
    borderRadius: 28,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 16,
    borderWidth: 4,
    borderColor: 'rgba(255, 140, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrPlaceholderText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  shareButton: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 20,
    backgroundColor: '#FF8C00',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    marginTop: 24,
  },
  shareButtonText: {
    color: '#FFF',
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
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  copyButton: {
    padding: 4,
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
  captureContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000000',
  },
});
