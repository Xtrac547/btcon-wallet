import '@/utils/shim';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert, Animated, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { Copy, Share2, ExternalLink, ArrowLeft, Sparkles } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Svg, { Rect, G, Circle, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';


type ArtStyle = 'starry-night' | 'mondrian' | 'nft-wave' | 'cyberpunk' | 'abstract';

function generateQRMatrix(text: string): boolean[][] {
  const size = 29;
  const matrix: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const hash = (text.charCodeAt(i % text.length) * (i + 1) * (j + 1)) % 100;
      matrix[i][j] = hash > 40;
    }
  }
  
  return matrix;
}

function getArtStyleFromAddress(address: string): ArtStyle {
  const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const styles: ArtStyle[] = ['starry-night', 'mondrian', 'nft-wave', 'cyberpunk', 'abstract'];
  return styles[hash % styles.length];
}

function getStyleColors(style: ArtStyle): { bg: string; primary: string; secondary: string; accent: string } {
  switch (style) {
    case 'starry-night':
      return { bg: '#1e3a8a', primary: '#fbbf24', secondary: '#4338ca', accent: '#e0f2fe' };
    case 'mondrian':
      return { bg: '#ffffff', primary: '#ef4444', secondary: '#3b82f6', accent: '#fbbf24' };
    case 'nft-wave':
      return { bg: '#7c3aed', primary: '#ec4899', secondary: '#06b6d4', accent: '#f59e0b' };
    case 'cyberpunk':
      return { bg: '#0f172a', primary: '#ff00ff', secondary: '#00ffff', accent: '#facc15' };
    case 'abstract':
      return { bg: '#f97316', primary: '#84cc16', secondary: '#ec4899', accent: '#14b8a6' };
  }
}

export default function ReceiveScreen() {
  const router = useRouter();
  const { address, esploraService } = useWallet();
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;
  const [qrMatrix, setQrMatrix] = useState<boolean[][]>([]);
  const [artStyle, setArtStyle] = useState<ArtStyle>('starry-night');
  const shimmerAnim = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (address) {
      setQrMatrix(generateQRMatrix(address));
      setArtStyle(getArtStyleFromAddress(address));
    }
  }, [address]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

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
      <View style={[styles.header, isWideScreen && styles.headerWide]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recevoir Bitcoin</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={[styles.content, { paddingHorizontal: contentPadding, maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' }]}>
        <View style={styles.qrContainer}>
          {qrMatrix.length > 0 ? (
            <ArtisticQRCode matrix={qrMatrix} style={artStyle} />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrPlaceholderText}>Génération du QR...</Text>
            </View>
          )}
        </View>

        <View style={styles.styleIndicator}>
          <Sparkles color="#FF8C00" size={16} />
          <Text style={styles.styleText}>
            Style: {artStyle === 'starry-night' ? 'Nuit Étoilée' : 
                    artStyle === 'mondrian' ? 'Mondrian' :
                    artStyle === 'nft-wave' ? 'NFT Wave' :
                    artStyle === 'cyberpunk' ? 'Cyberpunk' : 'Abstrait'}
          </Text>
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
  qrContainer: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 28,
    marginBottom: 32,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  qrCode: {
    width: 300,
    height: 300,
  },
  qrPlaceholder: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholderText: {
    color: '#666',
    fontSize: 16,
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
  styleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  styleText: {
    color: '#FF8C00',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});

function ArtisticQRCode({ matrix, style }: { 
  matrix: boolean[][], 
  style: ArtStyle
}) {
  const colors = getStyleColors(style);

  const renderStarryNight = () => (
    <Svg width={300} height={300} viewBox="0 0 29 29">
      <Defs>
        <LinearGradient id="starryBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.bg} stopOpacity="1" />
          <Stop offset="100%" stopColor={colors.secondary} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={29} height={29} fill="url(#starryBg)" />
      <G>
        {matrix.map((row, i) => 
          row.map((cell, j) => {
            if (cell) {
              const isEdge = i < 3 || i > 25 || j < 3 || j > 25;
              return (
                <Circle
                  key={`${i}-${j}`}
                  cx={j + 0.5}
                  cy={i + 0.5}
                  r={isEdge ? 0.4 : 0.35}
                  fill={isEdge ? colors.accent : colors.primary}
                  opacity={isEdge ? 1 : 0.9}
                />
              );
            }
            return null;
          })
        )}
      </G>
    </Svg>
  );

  const renderMondrian = () => (
    <Svg width={300} height={300} viewBox="0 0 29 29">
      <Rect x={0} y={0} width={29} height={29} fill={colors.bg} />
      <G>
        {matrix.map((row, i) => 
          row.map((cell, j) => {
            if (cell) {
              const colorIndex = (i * j) % 3;
              const color = colorIndex === 0 ? colors.primary : 
                           colorIndex === 1 ? colors.secondary : colors.accent;
              return (
                <Rect
                  key={`${i}-${j}`}
                  x={j}
                  y={i}
                  width={1}
                  height={1}
                  fill={color}
                  stroke="#000000"
                  strokeWidth={0.05}
                />
              );
            }
            return null;
          })
        )}
      </G>
    </Svg>
  );

  const renderNFTWave = () => (
    <Svg width={300} height={300} viewBox="0 0 29 29">
      <Defs>
        <LinearGradient id="nftBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.bg} stopOpacity="1" />
          <Stop offset="50%" stopColor={colors.secondary} stopOpacity="1" />
          <Stop offset="100%" stopColor={colors.primary} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={29} height={29} fill="url(#nftBg)" />
      <G>
        {matrix.map((row, i) => 
          row.map((cell, j) => {
            if (cell) {
              const size = 0.3 + (Math.sin(i * 0.5) * 0.15);
              return (
                <Circle
                  key={`${i}-${j}`}
                  cx={j + 0.5}
                  cy={i + 0.5}
                  r={size}
                  fill={colors.accent}
                  opacity={0.95}
                />
              );
            }
            return null;
          })
        )}
      </G>
    </Svg>
  );

  const renderCyberpunk = () => (
    <Svg width={300} height={300} viewBox="0 0 29 29">
      <Rect x={0} y={0} width={29} height={29} fill={colors.bg} />
      <G>
        {matrix.map((row, i) => 
          row.map((cell, j) => {
            if (cell) {
              const isNeon = (i + j) % 2 === 0;
              return (
                <Rect
                  key={`${i}-${j}`}
                  x={j + 0.1}
                  y={i + 0.1}
                  width={0.8}
                  height={0.8}
                  fill={isNeon ? colors.primary : colors.secondary}
                  opacity={1}
                  rx={0.2}
                />
              );
            }
            return null;
          })
        )}
      </G>
    </Svg>
  );

  const renderAbstract = () => (
    <Svg width={300} height={300} viewBox="0 0 29 29">
      <Defs>
        <LinearGradient id="abstractBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.bg} stopOpacity="1" />
          <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.8" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={29} height={29} fill="url(#abstractBg)" />
      <G>
        {matrix.map((row, i) => 
          row.map((cell, j) => {
            if (cell) {
              const shapeType = (i * 7 + j * 3) % 3;
              if (shapeType === 0) {
                return (
                  <Circle
                    key={`${i}-${j}`}
                    cx={j + 0.5}
                    cy={i + 0.5}
                    r={0.4}
                    fill={colors.secondary}
                  />
                );
              } else if (shapeType === 1) {
                return (
                  <Polygon
                    key={`${i}-${j}`}
                    points={`${j+0.5},${i} ${j+1},${i+0.5} ${j+0.5},${i+1} ${j},${i+0.5}`}
                    fill={colors.accent}
                  />
                );
              } else {
                return (
                  <Rect
                    key={`${i}-${j}`}
                    x={j + 0.15}
                    y={i + 0.15}
                    width={0.7}
                    height={0.7}
                    fill={colors.primary}
                    rx={0.1}
                  />
                );
              }
            }
            return null;
          })
        )}
      </G>
    </Svg>
  );

  switch (style) {
    case 'starry-night':
      return renderStarryNight();
    case 'mondrian':
      return renderMondrian();
    case 'nft-wave':
      return renderNFTWave();
    case 'cyberpunk':
      return renderCyberpunk();
    case 'abstract':
      return renderAbstract();
  }
}
