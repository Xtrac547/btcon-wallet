import '@/utils/shim';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { Copy, Share2, ExternalLink, ArrowLeft } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'qrcode';


export default function ReceiveScreen() {
  const router = useRouter();
  const { address, esploraService } = useWallet();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (address) {
      QRCode.toDataURL(address, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }).then(setQrDataUrl).catch(console.error);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recevoir Bitcoin</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.qrContainer}>
          {qrDataUrl ? (
            <Image source={{ uri: qrDataUrl }} style={styles.qrCode} />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrPlaceholderText}>Génération du QR...</Text>
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
          <Text style={styles.infoText}>2. L'expéditeur envoie Bitcoin à cette adresse</Text>
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
});
