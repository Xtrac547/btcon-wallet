import '@/utils/shim';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert, useWindowDimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { useUsername } from '@/contexts/UsernameContext';
import { Copy, Share2, ExternalLink, ArrowLeft } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Svg, { Rect, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

export default function ReceiveScreen() {
  const router = useRouter();
  const { address, esploraService } = useWallet();
  const { username } = useUsername();
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;
  const [qrMatrix, setQrMatrix] = useState<number[][]>([]);

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
          const matrix = await generateQRMatrix(address);
          console.log('QR Code généré pour:', address, 'taille:', matrix.length);
          setQrMatrix(matrix);
        } catch (err) {
          console.error('Erreur génération QR:', err);
        }
      })();
    }
  }, [address]);



  const handleCopy = async () => {
    if (address) {
      await Clipboard.setStringAsync(address);
      Alert.alert('Copié', 'Adresse copiée dans le presse-papiers');
    }
  };

  const handleShare = async () => {
    if (address) {
      try {
        await Share.share({
          message: address,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleOpenExplorer = () => {
    if (address) {
      const url = esploraService.getAddressExplorerUrl(address);
      Alert.alert('Explorateur', `Ouvrir ${url} dans le navigateur ?`);
    }
  };

  const contentMaxWidth = isWideScreen ? 600 : width;
  const contentPadding = isWideScreen ? 40 : 20;
  
  const qrArtSize = Math.min(width - (contentPadding * 2), 360);

  return (
    <View style={styles.container}>
      <View style={styles.backgroundPattern}>
        <View style={[styles.patternCircle, { width: 300, height: 300, top: -100, right: -100 }]} />
        <View style={[styles.patternCircle, { width: 200, height: 200, bottom: 100, left: -50 }]} />
        <View style={[styles.patternCircle, { width: 150, height: 150, top: 200, left: 50 }]} />
        <View style={[styles.patternRing, { width: 120, height: 120, top: 350, right: 60 }]} />
        <View style={[styles.patternRing, { width: 80, height: 80, top: 150, left: 100 }]} />
      </View>
      <View style={[styles.header, isWideScreen && styles.headerWide]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recevoir Bitcoin</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingHorizontal: contentPadding, maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.qrCodeContainer}>
          {qrMatrix.length > 0 ? (
            <View style={[styles.qrCodeWrapper, { width: qrArtSize, height: qrArtSize }]}>
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
                          rx={0.12}
                        />
                      );
                    }
                    return null;
                  })
                )}
                <Circle 
                  cx={qrMatrix.length / 2} 
                  cy={qrMatrix.length / 2} 
                  r="4" 
                  fill={currentArt.accent}
                />
              </Svg>
            </View>
          ) : (
            <View style={[styles.qrPlaceholder, { width: qrArtSize, height: qrArtSize }]}>
              <Text style={[styles.qrPlaceholderText, { color: currentArt.accent }]}>Génération du QR...</Text>
            </View>
          )}
        </View>



        <View style={styles.addressCard}>
          <Text style={styles.addressLabel}>Votre Adresse</Text>
          <Text style={styles.addressText} numberOfLines={2}>
            {address}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCopy} testID="copy-button">
            <Copy color="#FF8C00" size={20} />
            <Text style={styles.actionButtonText}>Copier</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare} testID="share-button">
            <Share2 color="#FF8C00" size={20} />
            <Text style={styles.actionButtonText}>Partager</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleOpenExplorer} testID="explorer-button">
            <ExternalLink color="#FF8C00" size={20} />
            <Text style={styles.actionButtonText}>Explorateur</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Comment recevoir Bitcoin:</Text>
          <Text style={styles.infoText}>1. Partagez votre adresse ou code QR</Text>
          <Text style={styles.infoText}>2. L&apos;expéditeur envoie Bitcoin à cette adresse</Text>
          <Text style={styles.infoText}>3. Attendez les confirmations du réseau</Text>
          <Text style={styles.infoText}>4. Les fonds apparaîtront dans votre portefeuille</Text>
        </View>
      </ScrollView>
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
    opacity: 0.05,
  },
  patternCircle: {
    position: 'absolute' as const,
    borderRadius: 1000,
    borderWidth: 3,
    borderColor: '#FF8C00',
  },
  patternRing: {
    position: 'absolute' as const,
    borderRadius: 1000,
    borderWidth: 4,
    borderColor: '#FFD700',
    opacity: 0.3,
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
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  qrCodeContainer: {
    marginBottom: 28,
    alignItems: 'center',
  },
  qrCodeWrapper: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  qrPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 24,
  },
  qrPlaceholderText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  addressCard: {
    backgroundColor: '#0f0f0f',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.1)',
  },
  addressLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600' as const,
  },
  addressText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  actionButton: {
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
  actionButtonText: {
    color: '#FF8C00',
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 140, 0, 0.05)',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.1)',
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800' as const,
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  infoText: {
    color: '#999',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  headerWide: {
    paddingHorizontal: 40,
  },
});
