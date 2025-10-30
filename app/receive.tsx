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

  const artworks = [
    {
      id: 1,
      name: 'Mona Lisa',
      bg: '#3D2817',
      fg: ['#8B7355', '#D4AF37'],
      accent: '#D4AF37',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/800px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg',
    },
    {
      id: 2,
      name: 'La Nuit étoilée',
      bg: '#1B2845',
      fg: ['#4169E1', '#FFD700'],
      accent: '#FFD700',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1200px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
    },
    {
      id: 3,
      name: 'La Création d\'Adam',
      bg: '#E8D5C4',
      fg: ['#8B6F47', '#CD853F'],
      accent: '#CD853F',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Creación_de_Adán_%28Miguel_Ángel%29.jpg/1200px-Creación_de_Adán_%28Miguel_Ángel%29.jpg',
    },
    {
      id: 4,
      name: 'La Jeune Fille à la perle',
      bg: '#1C1C1C',
      fg: ['#FFD700', '#4682B4'],
      accent: '#FFD700',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/800px-1665_Girl_with_a_Pearl_Earring.jpg',
    },
    {
      id: 5,
      name: 'Le Cri',
      bg: '#FF6B35',
      fg: ['#FF8C42', '#004E89'],
      accent: '#FF8C42',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg/800px-Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg',
    },
    {
      id: 6,
      name: 'Le Baiser',
      bg: '#D4AF37',
      fg: ['#FFD700', '#FF6B35'],
      accent: '#FFD700',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Gustav_Klimt_016.jpg/800px-Gustav_Klimt_016.jpg',
    },
    {
      id: 7,
      name: 'Guernica',
      bg: '#2C2C2C',
      fg: ['#FFFFFF', '#808080'],
      accent: '#FFFFFF',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/74/PicassoGuernica.jpg/1200px-PicassoGuernica.jpg',
    },
  ];

  const getArtworkForAddress = (addr: string | null): typeof artworks[0] => {
    if (!addr) return artworks[0];
    const hash = addr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return artworks[hash % artworks.length];
  };

  const currentArt = getArtworkForAddress(address);

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
          <View 
            style={[styles.qrContainer, { backgroundColor: currentArt.bg, borderColor: currentArt.accent }]}
          >
            {qrMatrix.length > 0 ? (
              <View style={styles.qrCode}>
                <Svg width={280} height={280} viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}>
                  <Defs>
                    <LinearGradient id={`qrGradient-${currentArt.id}`} x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0" stopColor={currentArt.fg[0]} stopOpacity="1" />
                      <Stop offset="1" stopColor={currentArt.fg[1]} stopOpacity="1" />
                    </LinearGradient>
                  </Defs>
                  <Rect width={qrMatrix.length} height={qrMatrix.length} fill={currentArt.bg} rx={2} />
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
                  <Circle cx={qrMatrix.length / 2} cy={qrMatrix.length / 2} r="5" fill={currentArt.bg} />
                  <Circle cx={qrMatrix.length / 2} cy={qrMatrix.length / 2} r="3" fill={currentArt.accent} />
                </Svg>
              </View>
            ) : (
              <View style={styles.qrPlaceholder}>
                <Text style={[styles.qrPlaceholderText, { color: currentArt.accent }]}>Génération du QR...</Text>
              </View>
            )}
          </View>
          <View style={styles.artInfoContainer}>
            <Text style={[styles.artInfoText, { color: currentArt.accent }]}>🎨 {currentArt.name}</Text>
            <Text style={[styles.artInfoSubtext, { color: currentArt.accent, opacity: 0.7 }]}>Style unique de votre portefeuille</Text>
          </View>
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
  artInfoContainer: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  artInfoText: {
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  artInfoSubtext: {
    fontSize: 11,
    fontWeight: '500' as const,
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
