import '@/utils/shim';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Share, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { useUsername } from '@/contexts/UsernameContext';
import { ArrowLeft, Share2, ExternalLink, Copy } from 'lucide-react-native';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function ReceiveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string }>();
  const insets = useSafeAreaInsets();
  const { address } = useWallet();
  const { username } = useUsername();
  const { width } = useWindowDimensions();
  const [qrMatrix, setQrMatrix] = useState<number[][]>([]);
  
  const requestedAmount = params.amount ? parseInt(params.amount) : 0;

  useEffect(() => {
    if (!username) {
      router.replace('/set-username');
    }
  }, [username, router]);

  const generateColorFromAddress = (addr: string | null) => {
    if (!addr) {
      return {
        id: 0,
        name: 'Identité Unique',
        bg: '#2a2a2a',
        fg: ['#FF8C00', '#FFB347'],
        accent: '#FF8C00',
        borderGlow: 'rgba(255, 140, 0, 0.6)',
      };
    }

    let hash = 0;
    for (let i = 0; i < addr.length; i++) {
      hash = ((hash << 5) - hash) + addr.charCodeAt(i);
      hash = hash & hash;
    }

    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 60 + (hash % 120)) % 360;
    const saturation = 60 + (Math.abs(hash >> 8) % 30);
    const lightness1 = 45 + (Math.abs(hash >> 16) % 20);
    const lightness2 = 55 + (Math.abs(hash >> 24) % 20);

    const hslToHex = (h: number, s: number, l: number): string => {
      l /= 100;
      const a = s * Math.min(l, 1 - l) / 100;
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };

    const color1 = hslToHex(hue1, saturation, lightness1);
    const color2 = hslToHex(hue2, saturation, lightness2);
    const accentColor = hslToHex(hue1, saturation + 10, lightness1 + 10);

    const bgLightness = 15 + (Math.abs(hash >> 4) % 15);
    const bgColor = hslToHex(hue1, saturation - 20, bgLightness);

    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);
    const borderGlow = `rgba(${r}, ${g}, ${b}, 0.6)`;

    return {
      id: Math.abs(hash),
      name: 'Identité Unique',
      bg: bgColor,
      fg: [color1, color2],
      accent: accentColor,
      borderGlow,
    };
  };

  const currentArt = generateColorFromAddress(address);

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
            console.log('Génération QR avec montant:', qrContent);
          }
          const matrix = await generateQRMatrix(qrContent);
          console.log('QR Code généré pour:', qrContent, 'taille:', matrix.length);
          setQrMatrix(matrix);
        } catch (err) {
          console.error('Erreur génération QR:', err);
        }
      })();
    }
  }, [address, requestedAmount]);

  const padding = 32;
  const qrArtSize = Math.min(width - 100, 320);

  const handleShare = async () => {
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
  };

  const handleExplorer = () => {
    if (!address) return;
    const url = `https://mempool.space/address/${address}`;
    Linking.openURL(url).catch(err => {
      console.error('Erreur ouverture explorateur:', err);
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'explorateur');
    });
  };

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      // On web and React Native, we'll show an alert
      Alert.alert('Adresse copiée', address);
    } catch (error) {
      console.error('Erreur copie:', error);
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
        {requestedAmount > 0 && (
          <View style={styles.amountBanner}>
            <Text style={styles.amountBannerLabel}>Montant demandé</Text>
            <View style={styles.amountBannerRow}>
              <Text style={styles.amountBannerValue}>{requestedAmount.toLocaleString()}</Text>
              <Text style={styles.amountBannerUnit}>Btcon</Text>
            </View>
            <Text style={styles.amountBannerBtc}>{(requestedAmount / 100000000).toFixed(8)} BTC</Text>
          </View>
        )}

        <View style={styles.qrCodeContainer}>
          {qrMatrix.length > 0 ? (
            <View style={[styles.qrCodeWrapper, { width: qrArtSize + padding * 2, height: qrArtSize + padding * 2 }]}>
              <Svg width={qrArtSize} height={qrArtSize} viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}>
                <Defs>
                  <LinearGradient id={`qrGradient-${currentArt.id}`} x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={currentArt.fg[0]} stopOpacity="1" />
                    <Stop offset="1" stopColor={currentArt.fg[1]} stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                {qrMatrix.map((row, y) => 
                  row.map((cell, x) => {
                    if (cell === 1) {
                      const isCorner = 
                        (y < 8 && x < 8) ||
                        (y < 8 && x >= qrMatrix.length - 8) ||
                        (y >= qrMatrix.length - 8 && x < 8);
                      
                      return (
                        <Rect
                          key={`${y}-${x}`}
                          x={x}
                          y={y}
                          width={1}
                          height={1}
                          fill={isCorner ? currentArt.accent : `url(#qrGradient-${currentArt.id})`}
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
            <View style={[styles.qrPlaceholder, { width: qrArtSize + padding * 2, height: qrArtSize + padding * 2 }]}>
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
          </View>
        )}
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
    backgroundColor: '#000',
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
    backgroundColor: '#000',
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
});
