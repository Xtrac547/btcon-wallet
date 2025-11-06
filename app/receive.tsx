import '@/utils/shim';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { useUsername } from '@/contexts/UsernameContext';
import { ArrowLeft } from 'lucide-react-native';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function ReceiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { address } = useWallet();
  const { username } = useUsername();
  const { width } = useWindowDimensions();
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

  const padding = 20;
  const qrArtSize = Math.min(width - 80, 340);

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
                          rx={0.18}
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
    borderRadius: 32,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.9,
    shadowRadius: 40,
    elevation: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 140, 0, 0.4)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 32,
    borderWidth: 3,
    borderColor: 'rgba(255, 140, 0, 0.4)',
  },
  qrPlaceholderText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
