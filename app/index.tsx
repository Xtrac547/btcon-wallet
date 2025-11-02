import '@/utils/shim';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { useUsername } from '@/contexts/UsernameContext';
import { useAuth } from '@/contexts/AuthContext';

export default function IndexScreen() {
  const router = useRouter();
  const { hasWallet, isLoading: walletLoading } = useWallet();
  const { username, isLoading: usernameLoading } = useUsername();
  const { isAuthConfigured, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    console.log('Index navigation check:', {
      walletLoading,
      usernameLoading,
      authLoading,
      hasWallet,
      isAuthConfigured,
      isAuthenticated,
      username
    });

    if (!walletLoading && !usernameLoading && !authLoading) {
      if (!hasWallet) {
        console.log('Redirecting to onboarding');
        router.replace('/onboarding');
      } else if (!isAuthConfigured) {
        console.log('Redirecting to setup-auth');
        router.replace('/setup-auth');
      } else if (!isAuthenticated) {
        console.log('Redirecting to verify-auth');
        router.replace('/verify-auth');
      } else if (!username) {
        console.log('Redirecting to set-username');
        router.replace('/set-username');
      } else {
        console.log('Redirecting to wallet');
        router.replace('/wallet');
      }
    }
  }, [hasWallet, walletLoading, username, usernameLoading, isAuthConfigured, isAuthenticated, authLoading, router]);

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
