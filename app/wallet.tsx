import '@/utils/shim';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Animated, useWindowDimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { useUsername } from '@/contexts/UsernameContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useUserImage } from '@/contexts/UserImageContext';
import { ArrowUpRight, ArrowDownLeft, Settings, RefreshCw, TrendingUp, TrendingDown, Clock, Plus } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { useBtcPrice, btconToEuro } from '@/services/btcPrice';

export default function WalletScreen() {
  const router = useRouter();
  const { balance, address, refreshBalance, transactions } = useWallet();
  const { username, getUsernameForAddress, isLoading: usernameLoading } = useUsername();
  const { setDeveloperStatus, isDeveloper } = useNotifications();
  const { getImageForUser } = useUserImage();
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [addressUsernameMap, setAddressUsernameMap] = useState<Record<string, string>>({});
  const btcPrice = useBtcPrice();



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

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
    
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const getTransactionType = (tx: any): 'sent' | 'received' | 'pending' => {
    if (!tx.status.confirmed) return 'pending';
    
    const isSent = tx.vin.some((vin: any) => vin.prevout?.scriptpubkey_address === address);
    const isReceived = tx.vout.some((vout: any) => vout.scriptpubkey_address === address);
    
    if (isSent) return 'sent';
    if (isReceived) return 'received';
    return 'received';
  };

  const getTransactionAmount = (tx: any): number => {
    const type = getTransactionType(tx);
    
    if (type === 'sent') {
      const sentAmount = tx.vout
        .filter((vout: any) => vout.scriptpubkey_address !== address)
        .reduce((sum: number, vout: any) => sum + vout.value, 0);
      return -sentAmount;
    }
    
    const receivedAmount = tx.vout
      .filter((vout: any) => vout.scriptpubkey_address === address)
      .reduce((sum: number, vout: any) => sum + vout.value, 0);
    return receivedAmount;
  };

  const getTransactionAddress = (tx: any): string | null => {
    const type = getTransactionType(tx);
    
    if (type === 'sent') {
      const outputAddr = tx.vout.find((vout: any) => vout.scriptpubkey_address !== address);
      return outputAddr?.scriptpubkey_address || null;
    }
    
    if (type === 'received') {
      const inputAddr = tx.vin.find((vin: any) => vin.prevout?.scriptpubkey_address !== address);
      return inputAddr?.prevout?.scriptpubkey_address || null;
    }
    
    return null;
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

  useEffect(() => {
    if (!usernameLoading && !username) {
      router.replace('/set-username');
    }
  }, [username, usernameLoading]);

  useEffect(() => {
    if (address) {
      setDeveloperStatus(address);
    }
  }, [address, setDeveloperStatus]);

  useEffect(() => {
    const loadUsernames = async () => {
      const addressMap: Record<string, string> = {};
      
      for (const tx of transactions) {
        const txAddress = getTransactionAddress(tx);
        if (txAddress && !addressMap[txAddress]) {
          const username = await getUsernameForAddress(txAddress);
          if (username) {
            addressMap[txAddress] = username;
          }
        }
      }
      
      setAddressUsernameMap(addressMap);
    };
    
    if (transactions.length > 0) {
      loadUsernames();
    }
  }, [transactions, getUsernameForAddress]);

  const getCustomImageForAddress = (addr: string | null): string | null => {
    if (!addr) return null;
    const imageData = getImageForUser(addr);
    return imageData.profileImage;
  };

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
        <View style={styles.logoHeaderContainer}>
          <Image
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/fycv5rxyn7iqfp2lwp4zb' }}
            style={styles.logoHeaderImage1}
            resizeMode="contain"
          />
          <Image
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ig8yh1pui959enuvw0p3d' }}
            style={styles.logoHeaderImage2}
            resizeMode="contain"
          />
        </View>
        <View style={styles.headerActions}>
          {isDeveloper && (
            <TouchableOpacity 
              onPress={() => {
                console.log('Developer button pressed');
                router.push('/developer');
              }} 
              style={styles.settingsButton}
              activeOpacity={0.7}
              testID="developer-button"
            >
              <View style={styles.developerBadge}>
                <Text style={styles.developerBadgeText}>DEV</Text>
              </View>
            </TouchableOpacity>
          )}
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
          {getCustomImageForAddress(address) && (
            <Image
              source={{ uri: getCustomImageForAddress(address)! }}
              style={styles.customAddressImage}
              resizeMode="cover"
            />
          )}
          <Text style={styles.balanceLabel}>Solde Total</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>{formatBalance(balance)}</Text>
            <Text style={styles.balanceUnit}>Btcon</Text>
          </View>
          <Text style={styles.balanceSats}>{(balance / 100000000).toFixed(8)} BTC</Text>
          <Text style={styles.balanceEuro}>≈ {btconToEuro(Number(formatBalance(balance)), btcPrice)} €</Text>

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

        {transactions.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Historique</Text>
            {transactions.slice(0, 20).map((tx) => {
              const type = getTransactionType(tx);
              const amount = getTransactionAmount(tx);
              const isPositive = amount > 0;
              
              return (
                <View key={tx.txid} style={styles.transactionItem}>
                  <View style={[
                    styles.transactionIcon,
                    type === 'sent' && styles.transactionIconSent,
                    type === 'received' && styles.transactionIconReceived,
                    type === 'pending' && styles.transactionIconPending,
                  ]}>
                    {type === 'sent' && <TrendingDown color="#FF4444" size={20} />}
                    {type === 'received' && <TrendingUp color="#00CC66" size={20} />}
                    {type === 'pending' && <Clock color="#FF8C00" size={20} />}
                  </View>
                  
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionType}>
                      {(() => {
                        const txAddress = getTransactionAddress(tx);
                        const username = txAddress ? addressUsernameMap[txAddress] : null;
                        
                        if (type === 'sent') {
                          return username ? `@${username}` : 'Envoyé';
                        } else if (type === 'received') {
                          return username ? `@${username}` : 'Reçu';
                        }
                        return 'En cours';
                      })()}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {tx.status.block_time ? formatDate(tx.status.block_time) : 'Non confirmé'}
                    </Text>
                  </View>
                  
                  <View style={styles.transactionAmountContainer}>
                    <Text style={[
                      styles.transactionAmount,
                      type === 'sent' && styles.transactionAmountSent,
                      type === 'received' && styles.transactionAmountReceived,
                      type === 'pending' && styles.transactionAmountPending,
                    ]}>
                      {isPositive ? '+' : '-'}{Math.abs(amount).toLocaleString()} Btcon
                    </Text>
                    <Text style={styles.transactionAmountBtc}>
                      {(Math.abs(amount) / 100000000).toFixed(8)} BTC · ≈ {btconToEuro(Math.abs(amount), btcPrice)} €
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <RefreshCw color="#666" size={20} />
            <Text style={styles.infoText}>Tirez pour actualiser</Text>
          </View>
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
    opacity: 0.04,
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
  logoHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoHeaderImage1: {
    width: 60,
    height: 60,
  },
  logoHeaderImage2: {
    width: 240,
    height: 70,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  developerBadge: {
    backgroundColor: '#FF8C00',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  developerBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900' as const,
    letterSpacing: 1,
  },
  btconText: {
    fontSize: 52,
    fontWeight: '900' as const,
    color: '#FF8C00',
    letterSpacing: 4,
    marginLeft: 8,
    textShadowColor: 'rgba(255, 140, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  bitcoinSymbol: {
    fontSize: 52,
    fontWeight: '900' as const,
    color: '#FFD700',
    letterSpacing: 0,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
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
    backgroundColor: '#0f0f0f',
    borderRadius: 32,
    padding: 40,
    marginBottom: 28,
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.1)',
  },
  customAddressImage: {
    width: 180,
    height: 180,
    borderRadius: 24,
    marginBottom: 28,
    borderWidth: 4,
    borderColor: '#FF8C00',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 12,
    fontWeight: '500' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900' as const,
    letterSpacing: -3,
  },
  balanceUnit: {
    color: '#FF8C00',
    fontSize: 24,
    fontWeight: '900' as const,
  },
  balanceSats: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
  },
  balanceEuro: {
    color: '#FF8C00',
    fontSize: 15,
    marginTop: 6,
    fontWeight: '700' as const,
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
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.15)',
  },
  actionIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 0, 0.2)',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 140, 0, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.1)',
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
  historyContainer: {
    marginBottom: 28,
  },
  historyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800' as const,
    marginBottom: 20,
    paddingLeft: 4,
    letterSpacing: 0.5,
  },
  transactionItem: {
    backgroundColor: '#0f0f0f',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  transactionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionIconSent: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
  },
  transactionIconReceived: {
    backgroundColor: 'rgba(0, 204, 102, 0.15)',
  },
  transactionIconPending: {
    backgroundColor: 'rgba(255, 140, 0, 0.15)',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  transactionDate: {
    color: '#666',
    fontSize: 11,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '800' as const,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  transactionAmountSent: {
    color: '#FF4444',
  },
  transactionAmountReceived: {
    color: '#00CC66',
  },
  transactionAmountPending: {
    color: '#FF8C00',
  },
  transactionAmountBtc: {
    color: '#666',
    fontSize: 10,
  },
});
