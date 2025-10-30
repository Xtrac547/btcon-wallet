import '@/utils/shim';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Animated, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { ArrowUpRight, ArrowDownLeft, Settings, RefreshCw } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';

export default function WalletScreen() {
  const router = useRouter();
  const { balance, address, refreshBalance } = useWallet();
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    setIsRefreshing(false);
  };

  const formatBalance = (sats: number): string => {
    const btcon = (sats / 100000000) * 100000000;
    return Math.floor(btcon).toString();
  };

  const formatAddress = (addr: string | null): string => {
    if (!addr) return '';
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const contentMaxWidth = isWideScreen ? 800 : width;
  const contentPadding = isWideScreen ? 40 : 24;

  return (
    <View style={styles.container}>
      <View style={styles.backgroundPattern}>
        {[...Array(25)].map((_, i) => (
          <View
            key={`pattern-${i}`}
            style={[
              i % 2 === 0 ? styles.patternDot : styles.patternRing,
              {
                left: (i * 60 + 30) % width,
                top: Math.floor(i / 6) * 160 + 80,
                opacity: 0.4 + (i % 3) * 0.2,
              },
            ]}
          />
        ))}
        <View style={[styles.patternLine, { width: 120, top: 180, left: 40, transform: [{ rotate: '45deg' }] }]} />
        <View style={[styles.patternLine, { width: 100, top: 450, right: 50, transform: [{ rotate: '-35deg' }] }]} />
        <View style={[styles.patternLine, { width: 90, top: 300, left: width * 0.3, transform: [{ rotate: '15deg' }] }]} />
      </View>
      <View style={[styles.header, isWideScreen && styles.headerWide]}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>₿</Text>
          <Text style={styles.appName}>Btcon</Text>
        </View>
        <TouchableOpacity 
          onPress={() => {
            console.log('Settings button pressed');
            router.push('/settings');
          }} 
          style={styles.settingsButton}
          activeOpacity={0.7}
          testID="settings-button"
        >
          <Settings color="#FFF" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingHorizontal: contentPadding, maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FF8C00"
          />
        }
      >
        <Animated.View style={[
          styles.balanceCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}>
          <Text style={styles.balanceLabel}>Solde Total</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>{formatBalance(balance)}</Text>
            <Text style={styles.balanceUnit}>Btcon</Text>
          </View>
          <Text style={styles.balanceSats}>{(balance / 100000000).toFixed(8)} BTC</Text>

          {address && (
            <View style={styles.addressContainer}>
              <Text style={styles.addressLabel}>Adresse</Text>
              <Text style={styles.addressText}>{formatAddress(address)}</Text>
            </View>
          )}
        </Animated.View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              console.log('Receive button pressed');
              router.push('/receive');
            }}
            activeOpacity={0.7}
            testID="receive-button"
          >
            <View style={styles.actionIconContainer}>
              <ArrowDownLeft color="#FF8C00" size={24} />
            </View>
            <Text style={styles.actionText}>Recevoir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              console.log('Send button pressed');
              router.push('/send');
            }}
            activeOpacity={0.7}
            testID="send-button"
          >
            <View style={styles.actionIconContainer}>
              <ArrowUpRight color="#FF8C00" size={24} />
            </View>
            <Text style={styles.actionText}>Envoyer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <RefreshCw color="#666" size={20} />
            <Text style={styles.infoText}>Tirez pour actualiser le solde</Text>
          </View>
        </View>
      </ScrollView>
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
    opacity: 0.08,
  },
  patternDot: {
    position: 'absolute' as const,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF8C00',
  },
  patternRing: {
    position: 'absolute' as const,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  patternLine: {
    position: 'absolute' as const,
    height: 3,
    backgroundColor: '#FF8C00',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 28,
    color: '#FF8C00',
  },
  appName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  settingsButton: {
    padding: 8,
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 8,
  },
  balanceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 28,
    padding: 36,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600' as const,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  balanceAmount: {
    color: '#FFF',
    fontSize: 56,
    fontWeight: '800' as const,
    letterSpacing: -2,
  },
  balanceUnit: {
    color: '#FF8C00',
    fontSize: 28,
    fontWeight: '800' as const,
  },
  balanceSats: {
    color: '#666',
    fontSize: 16,
    marginTop: 4,
  },
  addressContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  addressLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  addressText: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 5,
  },
  actionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  actionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    color: '#666',
    fontSize: 14,
  },
  headerWide: {
    paddingHorizontal: 40,
  },
});
