import '@/utils/shim';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { Copy, Share2, ExternalLink, ArrowLeft } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Svg, { Rect, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

export default function ReceiveScreen() {
  const router = useRouter();
  const { address, esploraService } = useWallet();
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;
  const [qrMatrix, setQrMatrix] = useState<number[][]>([]);

  const futuristicColors = [
    { id: 1, bg: '#0D0221', fg: ['#7209B7', '#F72585'], accent: '#F72585', glow: 'rgba(247, 37, 133, 0.6)' },
    { id: 2, bg: '#001219', fg: ['#00B4D8', '#90E0EF'], accent: '#00B4D8', glow: 'rgba(0, 180, 216, 0.6)' },
    { id: 3, bg: '#1A0B2E', fg: ['#16FF00', '#7EFF00'], accent: '#16FF00', glow: 'rgba(22, 255, 0, 0.6)' },
    { id: 4, bg: '#1F0318', fg: ['#FF006E', '#FFBE0B'], accent: '#FF006E', glow: 'rgba(255, 0, 110, 0.6)' },
    { id: 5, bg: '#03071E', fg: ['#FFB703', '#FB5607'], accent: '#FFB703', glow: 'rgba(255, 183, 3, 0.6)' },
  ];

  const [currentColorIndex, setCurrentColorIndex] = useState(0);

  const currentColors = futuristicColors[currentColorIndex];

  const generateQRMatrix = (text: string): number[][] => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const QRCode = require('qrcode');
      const qr = QRCode.create(text, { errorCorrectionLevel: 'H' });
      const modules = qr.modules;
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
      try {
        const matrix = generateQRMatrix(address);
        console.log('QR Code généré pour:', address, 'taille:', matrix.length);
        setQrMatrix(matrix);
      } catch (err) {
        console.error('Erreur génération QR:', err);
      }
    }
  }, [address]);

  const handleColorChange = () => {
    setCurrentColorIndex((prev) => (prev + 1) % futuristicColors.length);
  };

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
  const contentPadding = isWideScreen ? 40 : 24;

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

      <View style={[styles.content, { paddingHorizontal: contentPadding, maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' }]}>
        <View style={styles.qrArtContainer}>
          <View style={styles.qrBackdrop}>
            <View style={[styles.decorativeCircle, { width: 60, height: 60, top: -20, left: -20 }]} />
            <View style={[styles.decorativeCircle, { width: 45, height: 45, bottom: 10, right: -10 }]} />
            <View style={[styles.decorativeRing, { width: 70, height: 70, top: 280, right: -25 }]} />
            <View style={[styles.decorativeRing, { width: 50, height: 50, bottom: -15, left: 15 }]} />
          </View>
          <TouchableOpacity 
            style={[styles.qrContainer, { backgroundColor: currentColors.bg, borderColor: currentColors.accent }]}
            onPress={handleColorChange}
            activeOpacity={0.8}
          >
            {qrMatrix.length > 0 ? (
              <View style={styles.qrCode}>
                <Svg width={280} height={280} viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}>
                  <Defs>
                    <LinearGradient id={`qrGradient-${currentColors.id}`} x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0" stopColor={currentColors.fg[0]} stopOpacity="1" />
                      <Stop offset="1" stopColor={currentColors.fg[1]} stopOpacity="1" />
                    </LinearGradient>
                  </Defs>
                  <Rect width={qrMatrix.length} height={qrMatrix.length} fill={currentColors.bg} rx={2} />
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
                            fill={isCorner ? currentColors.accent : `url(#qrGradient-${currentColors.id})`}
                            rx={0.15}
                          />
                        );
                      }
                      return null;
                    })
                  )}
                  <Circle cx={qrMatrix.length / 2} cy={qrMatrix.length / 2} r="4" fill={currentColors.bg} />
                  <Circle cx={qrMatrix.length / 2} cy={qrMatrix.length / 2} r="2.5" fill={currentColors.accent} />
                </Svg>
              </View>
            ) : (
              <View style={styles.qrPlaceholder}>
                <Text style={[styles.qrPlaceholderText, { color: currentColors.accent }]}>Génération du QR...</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleColorChange} style={styles.colorChangeButton}>
            <Text style={[styles.colorChangeText, { color: currentColors.accent }]}>Appuyer pour changer la couleur</Text>
          </TouchableOpacity>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  qrArtContainer: {
    position: 'relative' as const,
    marginBottom: 32,
  },
  qrBackdrop: {
    position: 'absolute' as const,
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
  },
  decorativeCircle: {
    position: 'absolute' as const,
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 140, 0, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 0, 0.3)',
  },
  decorativeRing: {
    position: 'absolute' as const,
    borderRadius: 1000,
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  qrContainer: {
    padding: 32,
    borderRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 5,
  },
  qrCode: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholder: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholderText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  colorChangeButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    alignItems: 'center',
  },
  colorChangeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  addressCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: '#FF8C00',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  infoTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 12,
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
