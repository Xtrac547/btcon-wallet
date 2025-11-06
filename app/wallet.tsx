import '@/utils/shim';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { useState } from 'react';
import { useBtcPrice, btconToEuro } from '@/services/btcPrice';

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { balance } = useWallet();
  const btcPrice = useBtcPrice();

  const [tokenCounts, setTokenCounts] = useState<{ [key: number]: number }>({
    1000: 0,
    5000: 0,
    50000: 0,
  });

  const euroValue = balance > 0 ? btconToEuro(balance, btcPrice) : '0.00';

  const getTotalAmount = (): number => {
    return Object.entries(tokenCounts).reduce((total, [value, count]) => {
      return total + (Number(value) * count);
    }, 0);
  };

  const hasSelectedTokens = getTotalAmount() > 0;

  const handleTokenPress = (value: number) => {
    setTokenCounts(prev => ({
      ...prev,
      [value]: prev[value] + 1,
    }));
  };

  const handleTokenLongPress = (value: number) => {
    setTokenCounts(prev => ({
      ...prev,
      [value]: 0,
    }));
  };

  const resetAllTokens = () => {
    setTokenCounts({
      1000: 0,
      5000: 0,
      50000: 0,
    });
  };

  const handleReceive = () => {
    const amount = getTotalAmount();
    router.push({ pathname: '/receive', params: { amount: amount.toString() } });
  };

  const handleSend = () => {
    const amount = getTotalAmount();
    router.push({ 
      pathname: '/send', 
      params: { 
        preselectedAmount: amount.toString(),
        token1000: tokenCounts[1000].toString(),
        token5000: tokenCounts[5000].toString(),
        token50000: tokenCounts[50000].toString()
      } 
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, hasSelectedTokens && styles.scrollContentSpaced]}
      >
        <View style={[styles.selectionContent, hasSelectedTokens && styles.selectionContentSpaced]}>
          <View style={styles.topSection}>
            {!hasSelectedTokens && (
              <View style={styles.tokensSection}>
                <View style={styles.labelRow}>
                  <Text style={styles.tokensLabel}>Jetons</Text>
                  {getTotalAmount() > 0 && (
                    <TouchableOpacity onPress={resetAllTokens} style={styles.resetButton}>
                      <Text style={styles.resetText}>Réinitialiser</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.tokensContainer}>
                  <View style={styles.topTokensRow}>
                    {[1000, 5000].map((value) => (
                      <View key={value} style={styles.tokenWrapper}>
                        <Pressable
                          style={[
                            styles.tokenCircle,
                            value === 1000 && styles.token1000,
                            value === 5000 && styles.token5000,
                            tokenCounts[value] > 0 && styles.tokenSelected,
                          ]}
                          onPress={() => handleTokenPress(value)}
                          onLongPress={() => handleTokenLongPress(value)}
                        >
                          <Text style={styles.tokenValue}>{value}</Text>
                          <Text style={styles.tokenUnit}>BTCON</Text>
                          {tokenCounts[value] > 0 && (
                            <View style={styles.countBadge}>
                              <Text style={styles.countText}>{tokenCounts[value]}x</Text>
                            </View>
                          )}
                        </Pressable>
                      </View>
                    ))}
                  </View>
                  <View style={styles.bottomTokenRow}>
                    <View style={styles.tokenWrapper50k}>
                      <Pressable
                        style={[
                          styles.tokenSquare,
                          tokenCounts[50000] > 0 && styles.tokenSelected,
                        ]}
                        onPress={() => handleTokenPress(50000)}
                        onLongPress={() => handleTokenLongPress(50000)}
                      >
                        <Text style={styles.tokenValue}>50000</Text>
                        <Text style={styles.tokenUnit}>BTCON</Text>
                        {tokenCounts[50000] > 0 && (
                          <View style={styles.countBadge}>
                            <Text style={styles.countText}>{tokenCounts[50000]}x</Text>
                          </View>
                        )}
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.balanceSection}>
              <Text style={styles.balanceLabel}>SOLDE</Text>
              
              <View style={styles.balanceRow}>
                <Text style={styles.balanceAmount}>{balance.toLocaleString()}</Text>
                <Text style={styles.balanceUnit}>Btcon</Text>
              </View>

              <Text style={styles.euroAmount}>≈ {euroValue} €</Text>
            </View>

            {hasSelectedTokens && (
              <View style={styles.tokensSection}>
                <View style={styles.labelRow}>
                <Text style={styles.tokensLabel}>Jetons</Text>
                {getTotalAmount() > 0 && (
                  <TouchableOpacity onPress={resetAllTokens} style={styles.resetButton}>
                    <Text style={styles.resetText}>Réinitialiser</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.tokensContainer}>
                <View style={styles.topTokensRow}>
                  {[1000, 5000].map((value) => (
                    <View key={value} style={styles.tokenWrapper}>
                      <Pressable
                        style={[
                          styles.tokenCircle,
                          value === 1000 && styles.token1000,
                          value === 5000 && styles.token5000,
                          tokenCounts[value] > 0 && styles.tokenSelected,
                        ]}
                        onPress={() => handleTokenPress(value)}
                        onLongPress={() => handleTokenLongPress(value)}
                      >
                        <Text style={styles.tokenValue}>{value}</Text>
                        <Text style={styles.tokenUnit}>BTCON</Text>
                        {tokenCounts[value] > 0 && (
                          <View style={styles.countBadge}>
                            <Text style={styles.countText}>{tokenCounts[value]}x</Text>
                          </View>
                        )}
                      </Pressable>
                    </View>
                  ))}
                </View>
                <View style={styles.bottomTokenRow}>
                  <View style={styles.tokenWrapper50k}>
                    <Pressable
                      style={[
                        styles.tokenSquare,
                        tokenCounts[50000] > 0 && styles.tokenSelected,
                      ]}
                      onPress={() => handleTokenPress(50000)}
                      onLongPress={() => handleTokenLongPress(50000)}
                    >
                      <Text style={styles.tokenValue}>50000</Text>
                      <Text style={styles.tokenUnit}>BTCON</Text>
                      {tokenCounts[50000] > 0 && (
                        <View style={styles.countBadge}>
                          <Text style={styles.countText}>{tokenCounts[50000]}x</Text>
                        </View>
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>
              </View>
            )}
          </View>

          {hasSelectedTokens && (
            <>
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
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentSpaced: {
    justifyContent: 'space-between',
  },
  selectionContent: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  selectionContentSpaced: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    width: '100%',
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: '#0f0f0f',
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 0, 0.2)',
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
  tokensSection: {
    marginBottom: 24,
  },
  tokensLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  resetText: {
    color: '#FF8C00',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  tokensContainer: {
    gap: 16,
  },
  topTokensRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  bottomTokenRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tokenWrapper: {
    width: '35%',
    alignItems: 'center',
  },
  tokenWrapper50k: {
    width: '72%',
    alignItems: 'center',
  },
  tokenCircle: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#3a3a3a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  token1000: {
    backgroundColor: '#5B9BD5',
    borderColor: '#75ADE0',
  },
  token5000: {
    backgroundColor: '#FF9F47',
    borderColor: '#FFB366',
  },
  tokenSquare: {
    width: '100%',
    aspectRatio: 1.3,
    backgroundColor: '#E8451A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#F5693F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  tokenSelected: {
    backgroundColor: '#FF8C00',
    borderColor: '#FFB347',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  tokenValue: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tokenUnit: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700' as const,
    marginTop: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  countBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#000',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  countText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700' as const,
  },

});
