import '@/utils/shim';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { useUsername } from '@/contexts/UsernameContext';

export default function IndexScreen() {
  const router = useRouter();
  const { hasWallet, isLoading: walletLoading } = useWallet();
  const { username, isLoading: usernameLoading } = useUsername();

  useEffect(() => {
    console.log('Index navigation check:', {
      walletLoading,
      usernameLoading,
      hasWallet,
      username
    });

    if (!walletLoading && !usernameLoading) {
      if (!hasWallet) {
        console.log('Redirecting to onboarding');
        router.replace('/onboarding');
      } else if (!username) {
        console.log('Redirecting to set-username');
        router.replace('/set-username');
      } else {
        console.log('Redirecting to wallet');
        router.replace('/wallet');
      }
    }
  }, [hasWallet, walletLoading, username, usernameLoading, router]);

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
