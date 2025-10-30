import '@/utils/shim';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert, useWindowDimensions, ImageBackground } from 'react-native';
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
      name: 'La Joconde',
      bg: '#3d2f1f',
      fg: ['#d4a373', '#f4e4c1'],
      accent: '#d4a373',
      borderGlow: 'rgba(212, 163, 115, 0.6)',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/600px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg',
    },
    {
      id: 2,
      name: 'La Nuit étoilée',
      bg: '#1a2d4a',
      fg: ['#4a90e2', '#ffd93d'],
      accent: '#4a90e2',
      borderGlow: 'rgba(74, 144, 226, 0.6)',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/600px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
    },
    {
      id: 3,
      name: 'La Création d\'Adam',
      bg: '#4a392a',
      fg: ['#e8c4a0', '#d4af7a'],
      accent: '#e8c4a0',
      borderGlow: 'rgba(232, 196, 160, 0.6)',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Creación_de_Adán_%28Miguel_Ángel%29.jpg/600px-Creación_de_Adán_%28Miguel_Ángel%29.jpg',
    },
    {
      id: 4,
      name: 'La Jeune Fille à la perle',
      bg: '#1f2a32',
      fg: ['#4a9fd8', '#e8d5a0'],
      accent: '#4a9fd8',
      borderGlow: 'rgba(74, 159, 216, 0.6)',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/600px-1665_Girl_with_a_Pearl_Earring.jpg',
    },
    {
      id: 5,
      name: 'Le Cri',
      bg: '#4a2720',
      fg: ['#ff6b35', '#ffb347'],
      accent: '#ff6b35',
      borderGlow: 'rgba(255, 107, 53, 0.6)',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg/600px-Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg',
    },
    {
      id: 6,
      name: 'Le Baiser',
      bg: '#3a3020',
      fg: ['#ffd700', '#ff8c42'],
      accent: '#ffd700',
      borderGlow: 'rgba(255, 215, 0, 0.6)',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Gustav_Klimt_016.jpg/600px-Gustav_Klimt_016.jpg',
    },
    {
      id: 7,
      name: 'Guernica',
      bg: '#2a2a2a',
      fg: ['#e0e0e0', '#a0a0a0'],
      accent: '#e0e0e0',
      borderGlow: 'rgba(224, 224, 224, 0.6)',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/74/PicassoGuernica.jpg/600px-PicassoGuernica.jpg',
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
            <View style={[styles.glowOrb, { 
              width: 100, 
              height: 100, 
              top: -40, 
              left: -40,
              backgroundColor: currentArt.borderGlow,
            }]} />
            <View style={[styles.glowOrb, { 
              width: 80, 
              height: 80, 
              bottom: -30, 
              right: -30,
              backgroundColor: currentArt.borderGlow,
            }]} />
          </View>
          
          <View style={[styles.qrFrame, { 
            shadowColor: currentArt.accent,
            borderColor: currentArt.accent,
          }]}>
            <ImageBackground
              source={{ uri: currentArt.imageUrl }}
              style={styles.artworkBackground}
              imageStyle={styles.artworkImage}
            >
              <View style={styles.qrOverlay}>
                {qrMatrix.length > 0 ? (
                  <View style={styles.qrCode}>
                    <Svg width={160} height={160} viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}>
                      <Defs>
                        <LinearGradient id={`qrGradient-${currentArt.id}`} x1="0" y1="0" x2="1" y2="1">
                          <Stop offset="0" stopColor={currentArt.fg[0]} stopOpacity="0.2" />
                          <Stop offset="1" stopColor={currentArt.fg[1]} stopOpacity="0.2" />
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
                                rx={0.2}
                                opacity={isCorner ? "0.35" : "0.2"}
                              />
                            );
                          }
                          return null;
                        })
                      )}
                      <Circle 
                        cx={qrMatrix.length / 2} 
                        cy={qrMatrix.length / 2} 
                        r="3.5" 
                        fill={currentArt.accent} 
                        opacity="0.3"
                      />
                    </Svg>
                  </View>
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <Text style={[styles.qrPlaceholderText, { color: currentArt.accent }]}>Génération du QR...</Text>
                  </View>
                )}
              </View>
            </ImageBackground>
          </View>
          
          <View style={[styles.artInfoContainer, { borderColor: currentArt.accent }]}>
            <Text style={[styles.artInfoText, { color: currentArt.accent }]}>🎨 {currentArt.name}</Text>
            <Text style={[styles.artInfoSubtext, { color: currentArt.accent }]}>Identité Artistique Unique</Text>
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
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
  },
  glowOrb: {
    position: 'absolute' as const,
    borderRadius: 1000,
    opacity: 0.3,
  },
  qrFrame: {
    borderRadius: 40,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 20,
    borderWidth: 6,
  },
  artworkBackground: {
    width: 320,
    height: 320,
  },
  artworkImage: {
    opacity: 0.95,
    borderRadius: 34,
  },
  qrOverlay: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  qrCode: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholder: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholderText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  artInfoContainer: {
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  artInfoText: {
    fontSize: 18,
    fontWeight: '800' as const,
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  artInfoSubtext: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
    opacity: 0.8,
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
