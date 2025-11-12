import '@/utils/shim';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { useUsername } from '@/contexts/UsernameContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQRColor } from '@/contexts/QRColorContext';

export default function IndexScreen() {
  const router = useRouter();
  const { hasWallet, isLoading: walletLoading, address } = useWallet();
  const { username, isLoading: usernameLoading } = useUsername();
  const { isAuthConfigured, authType, isAuthenticated, isLoading: authLoading } = useAuth();
  const { ensureColorAssignment } = useQRColor();

  useEffect(() => {
    if (hasWallet && address) {
      ensureColorAssignment(address);
    }
  }, [hasWallet, address, ensureColorAssignment]);

  useEffect(() => {
    if (!walletLoading && !usernameLoading && !authLoading) {
      if (!hasWallet) {
        router.replace('/onboarding');
      } else if (!isAuthConfigured) {
        router.replace('/setup-auth');
      } else if (authType !== 'none' && !isAuthenticated) {
        router.replace('/verify-auth');
      } else if (!username) {
        router.replace('/set-username');
      } else {
        router.replace('/wallet');
      }
    }
  }, [hasWallet, walletLoading, username, usernameLoading, authLoading, isAuthConfigured, authType, isAuthenticated, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF8C00" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
