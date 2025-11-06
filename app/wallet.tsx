import '@/utils/shim';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { useDeveloperHierarchy } from '@/contexts/DeveloperHierarchyContext';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useBtcPrice, btconToEuro } from '@/services/btcPrice';
import QRCode from 'qrcode';

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { balance, address } = useWallet();
  const { isDeveloper } = useDeveloperHierarchy();
  const btcPrice = useBtcPrice();
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const euroValue = balance > 0 ? btconToEuro(balance, btcPrice) : '0.00';
  const isDevUser = address ? isDeveloper(address) : false;

  useEffect(() => {
    if (address) {
      const generateQR = async () => {
        try {
          const options: any = {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          };

          if (Platform.OS === 'web') {
            options.type = 'image/png';
          }

          const url = await (QRCode.toDataURL as any)(address, options) as string;
          setQrDataUrl(url);
        } catch (err) {
          console.error('Error generating QR code:', err);
        }
      };

      generateQR();
    }
  }, [address]);

  const handleReceive = () => {
    setShowQR(true);
  };

  const handleSend = () => {
    router.push('/send');
  };

  if (showQR && qrDataUrl) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.qrContainer}>
          <Text style={styles.qrTitle}>Recevoir des Btcon</Text>
          
          <View style={styles.qrCodeWrapper}>
            <Image
              source={{ uri: qrDataUrl }}
              style={styles.qrCode}
              resizeMode="contain"
            />
          </View>

          <View style={styles.addressBox}>
            <Text style={styles.addressLabel}>Votre adresse</Text>
            <Text style={styles.addressText}>{address}</Text>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowQR(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Solde</Text>
          
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>{balance.toLocaleString()}</Text>
            <Text style={styles.balanceUnit}>Btcon</Text>
          </View>

          <Text style={styles.euroAmount}>≈ {euroValue} €</Text>

          {isDevUser && address && (
            <View style={styles.addressContainer}>
              <Text style={styles.addressLabelSmall}>Adresse</Text>
              <Text style={styles.addressTextSmall}>
                {address.slice(0, 12)}...{address.slice(-12)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.receiveButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={handleReceive}
          >
            <View style={styles.iconContainer}>
              <ArrowDownLeft color="#FFFFFF" size={28} strokeWidth={2.5} />
            </View>
            <Text style={styles.actionButtonText}>Recevoir</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.sendButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={handleSend}
          >
            <View style={styles.iconContainer}>
              <ArrowUpRight color="#FFFFFF" size={28} strokeWidth={2.5} />
            </View>
            <Text style={styles.actionButtonText}>Envoyer</Text>
          </Pressable>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: 64,
  },
  balanceLabel: {
    color: '#888888',
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 16,
    textTransform: 'uppercase' as const,
    letterSpacing: 2,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 12,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 56,
    fontWeight: '900' as const,
    letterSpacing: -2,
  },
  balanceUnit: {
    color: '#FF8C00',
    fontSize: 24,
    fontWeight: '800' as const,
  },
  euroAmount: {
    color: '#FF8C00',
    fontSize: 20,
    fontWeight: '700' as const,
  },
  addressContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  addressLabelSmall: {
    color: '#666666',
    fontSize: 12,
    marginBottom: 6,
  },
  addressTextSmall: {
    color: '#999999',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' || Platform.OS === 'android' ? 'Courier' : 'monospace',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 20,
    width: '100%',
    maxWidth: 500,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    borderRadius: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  receiveButton: {
    backgroundColor: '#FF8C00',
  },
  sendButton: {
    backgroundColor: '#FF8C00',
  },
  actionButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  qrContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  qrTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800' as const,
    marginBottom: 48,
    letterSpacing: 0.5,
  },
  qrCodeWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: 32,
  },
  qrCode: {
    width: 300,
    height: 300,
  },
  addressBox: {
    backgroundColor: '#0f0f0f',
    padding: 20,
    borderRadius: 16,
    marginBottom: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.2)',
  },
  addressLabel: {
    color: '#888888',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  addressText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' || Platform.OS === 'android' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#FF8C00',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
});
