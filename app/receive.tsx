import '@/utils/shim';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert, useWindowDimensions, ScrollView, Modal, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { Copy, Share2, ExternalLink, ArrowLeft, X } from 'lucide-react-native';
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
      name: 'Paysage Doré',
      bg: '#3d2f1f',
      fg: ['#d4a373', '#f4e4c1'],
      accent: '#d4a373',
      borderGlow: 'rgba(212, 163, 115, 0.6)',
      imageUrl: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&q=80',
    },
    {
      id: 2,
      name: 'Ciel Nocturne',
      bg: '#1a2d4a',
      fg: ['#4a90e2', '#ffd93d'],
      accent: '#4a90e2',
      borderGlow: 'rgba(74, 144, 226, 0.6)',
      imageUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&q=80',
    },
    {
      id: 3,
      name: 'Art Renaissance',
      bg: '#4a392a',
      fg: ['#e8c4a0', '#d4af7a'],
      accent: '#e8c4a0',
      borderGlow: 'rgba(232, 196, 160, 0.6)',
      imageUrl: 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?w=600&q=80',
    },
    {
      id: 4,
      name: 'Portrait Mystique',
      bg: '#1f2a32',
      fg: ['#4a9fd8', '#e8d5a0'],
      accent: '#4a9fd8',
      borderGlow: 'rgba(74, 159, 216, 0.6)',
      imageUrl: 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=600&q=80',
    },
    {
      id: 5,
      name: 'Expression Moderne',
      bg: '#4a2720',
      fg: ['#ff6b35', '#ffb347'],
      accent: '#ff6b35',
      borderGlow: 'rgba(255, 107, 53, 0.6)',
      imageUrl: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=600&q=80',
    },
    {
      id: 6,
      name: 'Lumière Dorée',
      bg: '#3a3020',
      fg: ['#ffd700', '#ff8c42'],
      accent: '#ffd700',
      borderGlow: 'rgba(255, 215, 0, 0.6)',
      imageUrl: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=600&q=80',
    },
    {
      id: 7,
      name: 'Abstraction Noire',
      bg: '#2a2a2a',
      fg: ['#e0e0e0', '#a0a0a0'],
      accent: '#e0e0e0',
      borderGlow: 'rgba(224, 224, 224, 0.6)',
      imageUrl: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=600&q=80',
    },
  ];

  const getArtworkForAddress = (addr: string | null): typeof artworks[0] => {
    if (!addr) return artworks[0];
    const hash = addr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return artworks[hash % artworks.length];
  };

  const currentArt = getArtworkForAddress(address);
  const [showQR, setShowQR] = useState(false);

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
  const contentPadding = isWideScreen ? 40 : 20;
  
  const qrArtSize = Math.min(width - (contentPadding * 2), 360);
  const qrCodeSize = qrArtSize * 0.6;
  const modalQrSize = Math.min(width * 0.9, 380);

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
        <View style={styles.qrArtContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setShowQR(true)}
            style={styles.artTouchable}
          >
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
              width: qrArtSize,
              height: qrArtSize,
            }]}>
              <View style={[styles.artworkBackground, { width: qrArtSize, height: qrArtSize }]}>
                <Image
                  source={{ uri: currentArt.imageUrl }}
                  style={styles.artworkImage}
                  resizeMode="cover"
                />
                <View style={styles.artOverlay} />
              </View>
            </View>
            
            <View style={[styles.artInfoContainer, { borderColor: currentArt.accent }]}>
              <Text style={[styles.artInfoText, { color: currentArt.accent }]}>🎨 {currentArt.name}</Text>
              <Text style={[styles.artInfoSubtext, { color: currentArt.accent }]}>Touchez pour voir le QR Code</Text>
            </View>
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
      </ScrollView>

      <Modal
        visible={showQR}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowQR(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentArt.bg }]}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowQR(false)}
              testID="close-qr-modal"
            >
              <X color={currentArt.accent} size={28} />
            </TouchableOpacity>

            <View style={[styles.modalQrContainer, { borderColor: currentArt.accent }]}>
              {qrMatrix.length > 0 ? (
                <View style={[styles.modalQrCode, { width: modalQrSize, height: modalQrSize, backgroundColor: '#FFF' }]}>
                  <Svg width={modalQrSize} height={modalQrSize} viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}>
                    <Defs>
                      <LinearGradient id={`qrGradientModal-${currentArt.id}`} x1="0" y1="0" x2="1" y2="1">
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
                              key={`modal-${y}-${x}`}
                              x={x}
                              y={y}
                              width={1}
                              height={1}
                              fill={isCorner ? currentArt.accent : `url(#qrGradientModal-${currentArt.id})`}
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
                <View style={[styles.qrPlaceholder, { width: modalQrSize, height: modalQrSize }]}>
                  <Text style={[styles.qrPlaceholderText, { color: currentArt.accent }]}>Génération du QR...</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  qrArtContainer: {
    position: 'relative' as const,
    marginBottom: 28,
    alignItems: 'center',
  },
  artTouchable: {
    alignItems: 'center',
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
    width: '100%',
    height: '100%',
    position: 'relative' as const,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    position: 'absolute' as const,
  },
  artOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 34,
  },
  qrOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  qrCode: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholder: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 20,
  },
  modalCloseButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
  },
  modalQrContainer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 24,
    borderWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  modalQrCode: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalArtInfo: {
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    borderWidth: 2,
  },
  modalArtName: {
    fontSize: 20,
    fontWeight: '800' as const,
    letterSpacing: 1,
    textAlign: 'center' as const,
  },
  addressCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    marginBottom: 20,
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
    marginBottom: 20,
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
