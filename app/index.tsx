import '@/utils/shim';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';

export default function IndexScreen() {
  const router = useRouter();
  const { hasWallet, isLoading } = useWallet();

  useEffect(() => {
    if (!isLoading) {
      if (hasWallet) {
        router.replace('/wallet');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [hasWallet, isLoading]);

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
